import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generatePost } from "@/lib/generate.server";

const MAX_BYTES = 5 * 1024 * 1024;
const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

const Body = z.object({
  image: z.string().regex(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/, "Only PNG, JPG or WEBP images are allowed."),
  offer: z.string().trim().min(3, "Please describe the offer.").max(160),
  businessName: z.string().trim().min(1, "Please enter your business name.").max(60),
  businessType: z.enum(["Salon", "Gym", "Cafe", "Clothing shop", "Other"]),
  city: z.string().trim().max(60).optional().default(""),
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        const now = Date.now();
        const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
        if (recent.length >= LIMIT) {
          const mins = Math.ceil((WINDOW_MS - (now - recent[0])) / 60000);
          return json({ error: `You've reached 10 posts this hour. Try again in ${mins} min.` }, 429);
        }

        let parsed;
        try {
          parsed = Body.safeParse(await request.json());
        } catch {
          return json({ error: "Invalid request." }, 400);
        }
        if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, 400);
        const b64 = parsed.data.image.split(",")[1] ?? "";
        if (Math.floor((b64.length * 3) / 4) > MAX_BYTES) return json({ error: "Image must be 5MB or smaller." }, 413);

        recent.push(now);
        hits.set(ip, recent);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: "AI is not configured." }, 500);
        try {
          const result = await generatePost(parsed.data, apiKey, request.signal);
          return json(result);
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          console.error("generate failed", e);
          if (status === 429) return json({ error: "The AI is busy right now. Please try again in a minute." }, 429);
          if (status === 402) return json({ error: "AI credits have run out. Please add credits to continue." }, 402);
          return json({ error: "We couldn't create your post. Please try again." }, 502);
        }
      },
    },
  },
});
