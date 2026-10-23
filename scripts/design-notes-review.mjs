// node scripts/design-notes-review.mjs <notes.json> <outdir>   (dev server running on :5174)
// Export the notes first: npx sanity documents query '*[_type == "designNote"]' --dataset staging > notes.json
// Claude's side of the design notes: for each page's notes (exported with
// `npx sanity documents query '*[_type == "designNote"]' --dataset staging`),
// open the page headless at the window width the notes were drawn at, draw
// the marks on top exactly as the admin saw them, and save a screenshot of
// each area with notes, plus a text summary of every mark.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [file, outdir] = process.argv.slice(2);
mkdirSync(outdir, { recursive: true });
const docs = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
const edge = join(process.env["ProgramFiles(x86)"], "Microsoft/Edge/Application/msedge.exe");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const summary = [];
for (const doc of docs) {
  const marks = doc.marks ?? [];
  if (!marks.length) continue;
  const widths = marks.map((m) => m.vw);
  const vw = widths.sort((a, b) => widths.filter((w) => w === b).length - widths.filter((w) => w === a).length)[0];
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(edge, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "edge-nr-"))}`, "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.result?.value;
  await send("Emulation.setDeviceMetricsOverride", { width: vw, height: 1000, deviceScaleFactor: 1, mobile: vw < 768 });
  await send("Page.enable");
  await send("Page.navigate", { url: "http://localhost:5174/about" }); await sleep(2500);
  await ev("localStorage.setItem('ogcw-consent', JSON.stringify({version:1,preferences:true,date:'x'})); localStorage.setItem('ogcw-theme','gold')");
  await send("Page.navigate", { url: "http://localhost:5174" + doc.page }); await sleep(9000);
  await ev("(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}scrollTo(0,0);})()");
  await sleep(1500);
  // Draw the marks the way the notes layer does
  await ev(`(() => {
    const marks = ${JSON.stringify(marks)};
    const ns = "http://www.w3.org/2000/svg";
    const W = document.documentElement.scrollWidth, H = document.documentElement.scrollHeight;
    const layer = document.createElement("div"); layer.style.cssText = "position:absolute;top:0;left:0;z-index:2147483000;pointer-events:none;width:" + W + "px;height:" + H + "px";
    const svg = document.createElementNS(ns, "svg"); svg.setAttribute("width", W); svg.setAttribute("height", H); svg.style.overflow = "visible"; layer.append(svg);
    const pairs = (p) => { const o = []; for (let i = 0; i + 1 < p.length; i += 2) o.push(p[i] + "," + p[i + 1]); return o.join(" "); };
    for (const m of marks) {
      if (m.kind === "pen" || m.kind === "marker") { const el = document.createElementNS(ns, "polyline"); el.setAttribute("points", pairs(m.points)); el.setAttribute("fill", "none"); el.setAttribute("stroke", m.color); el.setAttribute("stroke-width", m.size); el.setAttribute("stroke-linecap", "round"); el.setAttribute("stroke-linejoin", "round"); if (m.kind === "marker") el.setAttribute("opacity", ".38"); svg.append(el); }
      if (m.kind === "arrow") { const [x1, y1, x2, y2] = m.points; const l = document.createElementNS(ns, "line"); Object.entries({ x1, y1, x2, y2, stroke: m.color, "stroke-width": m.size, "stroke-linecap": "round" }).forEach(([k, v]) => l.setAttribute(k, v)); svg.append(l); const a = Math.atan2(y2 - y1, x2 - x1), len = 10 + m.size * 2.5, p = (s) => (x2 - len * Math.cos(a - s)) + "," + (y2 - len * Math.sin(a - s)); const h = document.createElementNS(ns, "polygon"); h.setAttribute("points", x2 + "," + y2 + " " + p(.45) + " " + p(-.45)); h.setAttribute("fill", m.color); svg.append(h); }
      if (m.kind === "box") { const r = document.createElementNS(ns, "rect"); Object.entries({ x: m.x, y: m.y, width: m.w, height: m.h, rx: 4, fill: m.color, "fill-opacity": .08, stroke: m.color, "stroke-width": m.size }).forEach(([k, v]) => r.setAttribute(k, v)); svg.append(r); const t = document.createElement("span"); t.textContent = m.w + " × " + m.h + " px"; t.style.cssText = "position:absolute;left:" + m.x + "px;top:" + Math.max(0, m.y - 24) + "px;padding:3px 8px;border-radius:6px;font:800 11.5px/1.4 Inter,sans-serif;background:" + m.color + ";color:" + (m.color === "#ffffff" || m.color === "#ffe600" ? "#000" : "#fff"); layer.append(t); }
      if (m.kind === "text") { const t = document.createElement("div"); t.textContent = m.text; t.style.cssText = "position:absolute;left:" + m.x + "px;top:" + m.y + "px;max-width:340px;padding:6px 10px;border-radius:8px;font-family:Inter,sans-serif;line-height:1.3;white-space:pre-wrap;color:" + m.color + ";font-size:" + m.size + "px;font-weight:" + (m.bold ? 800 : 600) + ";background:" + (m.color === "#111111" ? "rgb(255 255 255 / .9)" : "rgb(10 10 10 / .82)"); layer.append(t); }
    }
    document.body.append(layer);
    return [W, H];
  })()`);
  // One screenshot per cluster of marks (marks within 600 px vertically share one)
  const box = (m) => {
    if (m.points) { const xs = m.points.filter((_, i) => i % 2 === 0), ys = m.points.filter((_, i) => i % 2 === 1); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
    return [m.x, m.y - 26, m.x + (m.w ?? 340), m.y + (m.h ?? 80)];
  };
  const boxes = marks.map(box).sort((a, b) => a[1] - b[1]);
  const clusters = [];
  for (const b of boxes) { const c = clusters.at(-1); if (c && b[1] - c[3] < 600) { c[0] = Math.min(c[0], b[0]); c[1] = Math.min(c[1], b[1]); c[2] = Math.max(c[2], b[2]); c[3] = Math.max(c[3], b[3]); } else clusters.push([...b]); }
  const name = doc.page === "/" ? "home" : doc.page.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  for (const [i, [x0, y0, x1, y1]] of clusters.entries()) {
    const top = Math.max(0, y0 - 160), height = Math.min(2400, y1 - y0 + 320);
    const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 80, captureBeyondViewport: true, clip: { x: 0, y: top, width: vw, height, scale: 1 } });
    const out = join(outdir, `${name}-${i}.jpg`);
    writeFileSync(out, Buffer.from(s.result.data, "base64"));
    summary.push(`${doc.page} [${vw}px] screenshot ${out} (page y ${top}–${top + height})`);
  }
  for (const m of marks) {
    const where = m.kind === "box" ? ` ${m.w}×${m.h}px at ${m.x},${m.y}` : m.kind === "text" ? ` “${m.text}” at ${m.x},${m.y}` : "";
    summary.push(`  - ${m.kind} ${m.color}${where}${m.near ? ` | over ${m.near.path} (${m.near.w}×${m.near.h}) in ${m.near.section ?? "?"}${m.near.text ? ` “${m.near.text.slice(0, 50)}”` : ""}` : ""} | drawn at ${m.vw}px`);
  }
  proc.kill();
}
writeFileSync(join(outdir, "summary.txt"), summary.join("\n"));
console.log(summary.join("\n") || "no notes");
process.exit(0);
