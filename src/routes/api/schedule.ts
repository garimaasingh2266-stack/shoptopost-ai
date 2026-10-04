import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

const MAX_BYTES = 8 * 1024 * 1024;
const LINK_SECONDS = 60 * 60 * 24 * 30; // image link stays valid for 30 days

const Body = z.object({
  passcode: z.string().max(200),
  image: z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "Invalid image."),
  caption: z.string().trim().min(1, "Caption can't be empty.").max(2200, "Caption is too long for Instagram."),
  postTime: z.string().datetime().nullable(),
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const Route = createFileRoute("/api/schedule")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Body.safeParse(await request.json());
        } catch {
          return json({ error: "Invalid request." }, 400);
        }
        if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, 400);
        const { passcode, image, caption, postTime } = parsed.data;

        const secret = process.env["SCHEDULE_PASSCODE"];
        if (!secret || !passcode || !same(passcode, secret)) {
          return json({ error: "Scheduling is disabled in demo mode." }, 403);
        }
        const webhook = process.env["MAKE_WEBHOOK_URL"];
        if (!webhook) return json({ error: "Scheduling isn't set up yet." }, 500);

        const when = postTime ? new Date(postTime) : new Date();
        if (postTime && when.getTime() < Date.now() - 60_000) return json({ error: "Please pick a time in the future." }, 400);

        const bytes = Buffer.from(image.split(",")[1] ?? "", "base64");
        if (bytes.length > MAX_BYTES) return json({ error: "Image is too large." }, 413);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
        const up = await supabaseAdmin.storage.from("posts").upload(path, bytes, { contentType: "image/jpeg" });
        if (up.error) {
          console.error("upload failed", up.error);
          return json({ error: "Couldn't save the image. Please try again." }, 502);
        }
        const signed = await supabaseAdmin.storage.from("posts").createSignedUrl(path, LINK_SECONDS);
        if (signed.error || !signed.data) {
          console.error("sign failed", signed.error);
          return json({ error: "Couldn't create the image link. Please try again." }, 502);
        }

        const post_time = when.toISOString();
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: signed.data.signedUrl, caption, post_time }),
          });
          if (!res.ok) {
            console.error("webhook failed", res.status, await res.text().catch(() => ""));
            return json({ error: "The scheduler didn't accept the post. Please try again." }, 502);
          }
        } catch (e) {
          console.error("webhook error", e);
          return json({ error: "Couldn't reach the scheduler. Please try again." }, 502);
        }
        return json({ ok: true, post_time });
      },
    },
  },
});
