import { useState, type RefObject } from "react";
import { AlertCircle, CalendarCheck, Send } from "lucide-react";
import type { PostResult } from "@/lib/generate.server";

export function ScheduleCard({ result, canvasRef }: { result: PostResult; canvasRef: RefObject<HTMLCanvasElement | null> }) {
  const [pick, setPick] = useState(0);
  const [caption, setCaption] = useState(result.captions[0]?.text ?? "");
  const [mode, setMode] = useState<"now" | "later">("now");
  const [when, setWhen] = useState("");
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function choose(i: number) {
    setPick(i);
    setCaption(result.captions[i]?.text ?? "");
  }

  async function submit() {
    setErr(null);
    setDone(null);
    const c = canvasRef.current;
    if (!c) return setErr("The post image isn't ready yet.");
    if (!caption.trim()) return setErr("Please write a caption.");
    let postTime: string | null = null;
    if (mode === "later") {
      if (!when) return setErr("Please pick a date and time.");
      const d = new Date(when);
      if (d.getTime() < Date.now()) return setErr("Please pick a time in the future.");
      postTime = d.toISOString();
    }
    setBusy(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode,
          image: c.toDataURL("image/jpeg", 0.92),
          caption: `${caption.trim()}\n\n${result.hashtags.join(" ")}`,
          postTime,
        }),
      });
      const data = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone(new Date(data.post_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="flex items-center gap-2 font-display text-xl"><Send className="h-5 w-5 text-primary" /> Schedule to Instagram</h2>
      <div>
        <label className="label">Pick a caption</label>
        <div className="seg">
          {result.captions.map((c, i) => (
            <button key={c.tone} data-active={pick === i} onClick={() => choose(i)}>{c.tone}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Caption (edit freely — hashtags are added automatically)</label>
        <textarea className="input min-h-32" maxLength={2000} value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <div>
        <label className="label">When</label>
        <div className="seg">
          <button data-active={mode === "now"} onClick={() => setMode("now")}>Post now</button>
          <button data-active={mode === "later"} onClick={() => setMode("later")}>Pick date & time</button>
        </div>
        {mode === "later" && (
          <input type="datetime-local" className="input mt-3" value={when} onChange={(e) => setWhen(e.target.value)} />
        )}
      </div>
      <div>
        <label className="label">Passcode</label>
        <input type="password" className="input" autoComplete="off" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      </div>
      {err && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
        </div>
      )}
      {done && (
        <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-sm font-semibold text-primary" role="status">
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" /> Scheduled for {done}
        </div>
      )}
      <button className="btn-primary w-full" onClick={submit} disabled={busy}>
        {busy ? "Sending…" : <><Send className="h-5 w-5" /> {mode === "now" ? "Post now" : "Schedule post"}</>}
      </button>
    </div>
  );
}
