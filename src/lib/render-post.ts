export type Template = "Bold" | "Minimal" | "Festive";
const W = 1080;
const H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, start: number, max: number, maxLines: number) {
  let size = start;
  while (size > 30) {
    ctx.font = `${size}px ${family}`;
    if (wrap(ctx, text, max).length <= maxLines) break;
    size -= 4;
  }
  return size;
}

export async function renderPost(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  t: Template,
  d: { name: string; headline: string; subline: string },
) {
  await Promise.all([
    document.fonts.load('80px "Archivo Black"'),
    document.fonts.load('40px "DM Sans"'),
    document.fonts.load('80px "DM Serif Display"'),
  ]).catch(() => {});
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const iw = img.naturalWidth * s;
  const ih = img.naturalHeight * s;
  ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
  ctx.textBaseline = "alphabetic";
  const accent = "#ff4f2e";

  if (t === "Bold") {
    const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
    g.addColorStop(0, "rgba(10,10,20,0)");
    g.addColorStop(1, "rgba(10,10,20,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // name pill
    ctx.font = '700 34px "DM Sans"';
    const nw = ctx.measureText(d.name.toUpperCase()).width + 56;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(60, 60, nw, 72, 36);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(d.name.toUpperCase(), 88, 108);
    const head = d.headline.toUpperCase();
    const size = fitFont(ctx, head, '"Archivo Black"', 120, W - 120, 3);
    ctx.font = `${size}px "Archivo Black"`;
    const lines = wrap(ctx, head, W - 120);
    let y = H - 170 - (lines.length - 1) * size * 1.02;
    ctx.fillStyle = "#fff";
    for (const l of lines) {
      ctx.fillText(l, 60, y);
      y += size * 1.02;
    }
    ctx.font = '700 44px "DM Sans"';
    const sw = ctx.measureText(d.subline).width + 48;
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(60, H - 140, sw, 72);
    ctx.fillStyle = "#14141f";
    ctx.fillText(d.subline, 84, H - 90);
  } else if (t === "Minimal") {
    const pad = 60;
    const boxH = 300;
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.fillRect(pad, H - boxH - pad, W - pad * 2, boxH);
    ctx.fillStyle = "#14141f";
    ctx.textAlign = "center";
    ctx.font = '600 28px "DM Sans"';
    ctx.letterSpacing = "8px";
    ctx.fillText(d.name.toUpperCase(), W / 2, H - boxH - pad + 70);
    ctx.letterSpacing = "0px";
    const size = fitFont(ctx, d.headline, '"DM Serif Display"', 84, W - 220, 2);
    ctx.font = `${size}px "DM Serif Display"`;
    const lines = wrap(ctx, d.headline, W - 220);
    let y = H - boxH - pad + 70 + size * 1.1;
    for (const l of lines) {
      ctx.fillText(l, W / 2, y);
      y += size * 1.05;
    }
    ctx.fillStyle = accent;
    ctx.font = '500 34px "DM Sans"';
    ctx.fillText(d.subline, W / 2, H - pad - 40);
    ctx.textAlign = "left";
  } else {
    // Festive
    ctx.fillStyle = "rgba(120,20,40,0.25)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.lineWidth = 3;
    ctx.strokeRect(62, 62, W - 124, H - 124);
    const colors = ["#ffd23f", accent, "#ff9bd2", "#7ce0c3"];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = colors[i % 4]!;
      const x = (i * 157) % W;
      const yy = (i * 89) % 380;
      ctx.beginPath();
      ctx.arc(x, i % 2 ? yy : H - yy * 0.4, 6 + (i % 4) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(W / 2, H - 330, 440, 210, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = '700 34px "DM Sans"';
    ctx.fillText(`✦ ${d.name} ✦`, W / 2, H - 450);
    const size = fitFont(ctx, d.headline.toUpperCase(), '"Archivo Black"', 92, 760, 2);
    ctx.font = `${size}px "Archivo Black"`;
    const lines = wrap(ctx, d.headline.toUpperCase(), 760);
    let y = H - 330 - ((lines.length - 1) * size) / 2 + size * 0.3;
    for (const l of lines) {
      ctx.fillText(l, W / 2, y);
      y += size;
    }
    ctx.fillStyle = "#ffd23f";
    ctx.font = '700 38px "DM Sans"';
    ctx.fillText(d.subline, W / 2, H - 190);
    ctx.textAlign = "left";
  }
}
