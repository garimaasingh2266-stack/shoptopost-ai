import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScheduleCard } from "@/components/ScheduleCard";
import { Check, Copy, Download, ImagePlus, Sparkles, Clock, Wand2, AlertCircle } from "lucide-react";
import { renderPost, type Template } from "@/lib/render-post";
import type { PostResult } from "@/lib/generate.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop to Post — Instagram posts for local businesses" },
      { name: "description", content: "Turn a product photo into a ready-to-share Instagram post with captions, hashtags and the best time to post." },
      { property: "og:title", content: "Shop to Post" },
      { property: "og:description", content: "Product photo in, finished Instagram post out — for salons, gyms, cafes and shops." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TYPES = ["Salon", "Gym", "Cafe", "Clothing shop", "Other"] as const;
const TEMPLATES: Template[] = ["Bold", "Minimal", "Festive"];
const MAX = 5 * 1024 * 1024;

function readFile(f: Blob) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Index() {
  const [image, setImage] = useState<string | null>(null);
  const [offer, setOffer] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("Clothing shop");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostResult | null>(null);
  const [tpl, setTpl] = useState<Template>("Bold");
  const [view, setView] = useState<"after" | "before">("after");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  async function onFile(f?: File) {
    setError(null);
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return setError("Please upload a JPG, PNG or WEBP image.");
    if (f.size > MAX) return setError("That image is over 5MB. Please pick a smaller one.");
    setImage(await readFile(f));
  }

  async function loadExample() {
    setError(null);
    const blob = await (await fetch("/images/example-kurti.jpg")).blob();
    setImage(await readFile(blob));
    setOffer("New summer kurtis, 20% off this week");
    setName("Saanvi Boutique");
    setType("Clothing shop");
    setCity("Jaipur");
  }

  async function create() {
    setError(null);
    if (!image) return setError("Please upload a product photo first.");
    if (!name.trim() || !offer.trim()) return setError("Please fill in your business name and offer.");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, offer, businessName: name, businessType: type, city }),
      });
      const data = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      setView("after");
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!result || !image || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => renderPost(canvasRef.current!, img, tpl, { name, headline: result.headline, subline: result.subline });
    img.src = image;
  }, [result, tpl, image, name]);

  function download() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `${name.replace(/\W+/g, "-").toLowerCase() || "post"}-${tpl.toLowerCase()}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2 font-display text-xl">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          Shop to Post
        </div>
        <button className="btn-ghost" onClick={loadExample}>
          <Wand2 className="h-4 w-4" /> Try an example
        </button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-6 pb-10">
        <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl">
          One photo in.<br />
          <span className="text-primary">A ready Instagram post</span> out.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          For salons, gyms, cafes and shops. Get a styled image, three captions, hashtags and the best time to post.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="card space-y-5">
          <label className="upload">
            {image ? (
              <img src={image} alt="Your product" className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="h-10 w-10 text-primary" />
                <span className="font-semibold text-foreground">Upload a product photo</span>
                <span className="text-sm">JPG, PNG or WEBP · up to 5MB</span>
              </div>
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>

          <div>
            <label className="label">What's the offer?</label>
            <input className="input" maxLength={160} placeholder="e.g. new summer kurtis, 20% off" value={offer} onChange={(e) => setOffer(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Business name</label>
              <input className="input" maxLength={60} placeholder="e.g. Glow Studio" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Business type</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">City (optional, for local hashtags)</label>
            <input className="input" maxLength={60} placeholder="e.g. Pune" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button className="btn-primary w-full" onClick={create} disabled={loading}>
            {loading ? "Creating your post…" : <><Sparkles className="h-5 w-5" /> Create post</>}
          </button>
        </div>

        <div ref={outRef} className="space-y-6">
          {loading && (
            <div className="card flex min-h-[420px] flex-col items-center justify-center gap-5 text-center">
              <div className="loader"><span /><span /><span /></div>
              <p className="font-display text-xl">Designing your post…</p>
              <p className="text-sm text-muted-foreground">Writing captions, picking hashtags and finding the best time.</p>
            </div>
          )}

          {!loading && !result && (
            <div className="card flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <ImagePlus className="h-10 w-10" />
              <p>Your finished post will show up here.</p>
              <button className="btn-ghost" onClick={loadExample}><Wand2 className="h-4 w-4" /> Try an example</button>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="seg">
                    {(["before", "after"] as const).map((v) => (
                      <button key={v} data-active={view === v} onClick={() => setView(v)}>{v === "before" ? "Before" : "After"}</button>
                    ))}
                  </div>
                  <div className="seg">
                    {TEMPLATES.map((t) => (
                      <button key={t} data-active={tpl === t} onClick={() => { setTpl(t); setView("after"); }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-muted">
                  <canvas ref={canvasRef} className={`h-full w-full ${view === "after" ? "" : "hidden"}`} />
                  {view === "before" && image && <img src={image} alt="Original photo" className="h-full w-full object-cover" />}
                </div>
                <button className="btn-primary w-full" onClick={download}><Download className="h-5 w-5" /> Download image</button>
              </div>

              <div className="card space-y-4">
                <h2 className="font-display text-xl">Captions</h2>
                {result.captions.map((c) => (
                  <div key={c.tone} className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="chip">{c.tone}</span>
                      <CopyBtn text={c.text} />
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl">Hashtags</h2>
                    <CopyBtn text={result.hashtags.join(" ")} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((h) => <span key={h} className="chip">{h}</span>)}
                  </div>
                </div>
                <div className="card space-y-2">
                  <h2 className="flex items-center gap-2 font-display text-xl"><Clock className="h-5 w-5 text-primary" /> Best time</h2>
                  <p className="font-display text-3xl text-primary">{result.bestTime.day}</p>
                  <p className="text-lg font-semibold">{result.bestTime.time}</p>
                  <p className="text-sm text-muted-foreground">{result.bestTime.reason}</p>
                </div>
              </div>

              <ScheduleCard result={result} canvasRef={canvasRef} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
