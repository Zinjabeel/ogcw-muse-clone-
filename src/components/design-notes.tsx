import { useRouterState } from "@tanstack/react-router";
import { ArrowUpDown, Bold, Check, Eraser, Hand, Highlighter, Loader2, MoveUpRight, Pen, Square, StickyNote, Trash2, Type, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { adminClient } from "./site-text";

// Design notes, for admins: draw and write on any page to show Claude how a
// part of it should look (how big a card should be, what to move, how a text
// should read). Visitors never see them: each page's notes are one Sanity
// document under the private "designnotes." path, which the public API can't
// read; the admin's studio login reads and writes them. Every mark keeps the
// window width it was drawn at and what was under it (the element, its part
// of the page and its size), so the notes still make sense if the layout
// moves. Claude reads them, makes the change and deletes the notes.

type Tool = "move" | "pen" | "marker" | "box" | "arrow" | "text" | "eraser";
type Near = { path: string; section?: string; w: number; h: number; text?: string };
type Mark = {
  _key: string;
  _type: "noteMark";
  kind: Exclude<Tool, "move" | "eraser">;
  color: string;
  size: number;
  /** The window width when it was drawn */
  vw: number;
  at: string;
  /** pen, marker, arrow: x, y pairs in page pixels */
  points?: number[];
  /** box and text: where, in page pixels */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  text?: string;
  bold?: boolean;
  near?: Near;
};

const COLORS = [
  { name: "Red", value: "#ff3b30" },
  { name: "Yellow", value: "#ffe600" },
  { name: "Blue", value: "#2f8cff" },
  { name: "Green", value: "#30d158" },
  { name: "Pink", value: "#ff2d92" },
  { name: "Black", value: "#111111" },
  { name: "White", value: "#ffffff" },
];
const SIZES = [
  { name: "Thin", pen: 2, marker: 14, text: 14 },
  { name: "Medium", pen: 4, marker: 24, text: 18 },
  { name: "Thick", pen: 8, marker: 36, text: 26 },
];
const TOOLS: { id: Tool; label: string; icon: typeof Pen }[] = [
  { id: "move", label: "Move: scroll and click the page", icon: Hand },
  { id: "pen", label: "Pen", icon: Pen },
  { id: "marker", label: "Highlighter", icon: Highlighter },
  { id: "box", label: "Box: drag to show a size", icon: Square },
  { id: "arrow", label: "Arrow", icon: MoveUpRight },
  { id: "text", label: "Text: click where the note goes", icon: Type },
  { id: "eraser", label: "Eraser: click a mark to remove it", icon: Eraser },
];

const key = () => Math.random().toString(36).slice(2, 10);
const pageKey = (path: string) => (path === "/" ? "home" : path.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-")).slice(0, 100);
const docId = (path: string) => `designnotes.${pageKey(path)}`;

/** What is on the page under a point (not the notes themselves): its element, part of the page and size */
function describeAt(clientX: number, clientY: number): Near | undefined {
  const el = document.elementsFromPoint(clientX, clientY).find((item) => !item.closest(".dn-layer, .dn-bar, .site-edit")) as HTMLElement | undefined;
  if (!el) return undefined;
  const part = (item: Element) => item.tagName.toLowerCase() + (item.id ? `#${item.id}` : "") + [...item.classList].filter((c) => !c.startsWith("is-")).slice(0, 2).map((c) => `.${c}`).join("");
  const chain: string[] = [];
  for (let item: Element | null = el; item && item !== document.body && chain.length < 4; item = item.parentElement) chain.unshift(part(item));
  const section = el.closest("section, header, footer, main, [data-band], [aria-label]");
  const label = section?.getAttribute("aria-label") ?? section?.getAttribute("aria-labelledby");
  const rect = el.getBoundingClientRect();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return { path: chain.join(" > "), ...(section ? { section: part(section) + (label ? ` [${label}]` : "") } : {}), w: Math.round(rect.width), h: Math.round(rect.height), ...(text ? { text } : {}) };
}

/** The arrowhead at the end of a line */
function head(x1: number, y1: number, x2: number, y2: number, size: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 10 + size * 2.5;
  const spread = 0.45;
  const p = (a: number) => `${x2 - len * Math.cos(angle - a)},${y2 - len * Math.sin(angle - a)}`;
  return `${x2},${y2} ${p(spread)} ${p(-spread)}`;
}

const pairs = (points: number[]) => {
  const out: string[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) out.push(`${points[i]},${points[i + 1]}`);
  return out.join(" ");
};

function useDocumentSize(on: boolean) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!on) return;
    const measure = () => setSize({ w: document.documentElement.scrollWidth, h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    const timer = window.setInterval(measure, 2000); // lazy content that grows the page
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); window.clearInterval(timer); };
  }, [on]);
  return size;
}

export function DesignNotes() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]!.value);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [bold, setBold] = useState(false);
  const [drawing, setDrawing] = useState<Mark | null>(null);
  const [typing, setTyping] = useState<{ x: number; y: number; near?: Near } | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "nologin">("idle");
  const [dirty, setDirty] = useState(false);
  const [barTop, setBarTop] = useState(false);
  const size = useDocumentSize(open);
  const saveTimer = useRef<number | undefined>(undefined);
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const pathRef = useRef(pathname);
  const dirtyRef = useRef(false);
  const textBox = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(async (path: string, list: Mark[]) => {
    const client = adminClient();
    if (!client) { setStatus("nologin"); return; }
    setStatus("saving");
    try {
      if (!list.length) await client.delete(docId(path)).catch(() => {});
      else {
        const me = await client.request<{ name?: string; email?: string }>({ uri: "/users/me" }).catch(() => null);
        await client.createOrReplace({ _id: docId(path), _type: "designNote", page: path, title: document.title, marks: list, updatedAt: new Date().toISOString(), updatedBy: me?.name || me?.email || "OGCW admin" });
      }
      if (pathRef.current === path) { dirtyRef.current = false; setDirty(false); setStatus("saved"); }
    } catch {
      setStatus("error");
    }
  }, []);

  // Each page's notes load when you arrive on it; unsaved ones save as you leave
  useEffect(() => {
    pathRef.current = pathname;
    setMarks([]);
    setDirty(false);
    setTyping(null);
    setStatus("idle");
    const client = adminClient();
    let gone = false;
    client?.fetch<{ marks?: Mark[] } | null>(`*[_id == $id][0]{marks}`, { id: docId(pathname) })
      .then((doc) => { if (!gone) setMarks(doc?.marks ?? []); })
      .catch(() => {});
    return () => {
      gone = true;
      if (dirtyRef.current) {
        window.clearTimeout(saveTimer.current);
        dirtyRef.current = false;
        void save(pathname, marksRef.current);
      }
    };
  }, [pathname, save]);

  // Saved a moment after each change
  useEffect(() => {
    if (!dirty) return;
    const path = pathname;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void save(path, marksRef.current), 900);
    return () => window.clearTimeout(saveTimer.current);
  }, [marks, dirty, pathname, save]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (next: Mark[]) => { setMarks(next); dirtyRef.current = true; setDirty(true); };
  const add = (mark: Mark) => update([...marksRef.current, mark]);
  const undo = () => update(marksRef.current.slice(0, -1));
  const clear = () => { if (window.confirm("Remove every note on this page?")) update([]); };
  const remove = (k: string) => update(marksRef.current.filter((mark) => mark._key !== k));

  // Ctrl/Cmd+Z undoes the last mark
  useEffect(() => {
    if (!open || typing) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); update(marksRef.current.slice(0, -1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, typing]);
  useEffect(() => { if (typing) window.setTimeout(() => textBox.current?.focus(), 0); }, [typing]);
  useEffect(() => {
    document.documentElement.classList.toggle("dn-open", open);
    return () => document.documentElement.classList.remove("dn-open");
  }, [open]);

  const sz = SIZES[sizeIndex]!;
  const base = () => ({ _key: key(), _type: "noteMark" as const, color, vw: window.innerWidth, at: new Date().toISOString() });

  const down = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (tool === "move" || tool === "eraser" || event.button > 0) return;
    const x = Math.round(event.pageX), y = Math.round(event.pageY);
    const near = describeAt(event.clientX, event.clientY);
    if (tool === "text") {
      event.preventDefault();
      setTyping(near ? { x, y, near } : { x, y });
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const mark: Mark = { ...base(), kind: tool, size: tool === "marker" ? sz.marker : sz.pen, ...(near ? { near } : {}) };
    if (tool === "box") Object.assign(mark, { x, y, w: 0, h: 0 });
    else mark.points = tool === "arrow" ? [x, y, x, y] : [x, y];
    setDrawing(mark);
  };
  const move = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const x = Math.round(event.pageX), y = Math.round(event.pageY);
    if (drawing.kind === "box") return setDrawing({ ...drawing, w: x - drawing.x!, h: y - drawing.y! });
    const points = drawing.points!;
    if (drawing.kind === "arrow") return setDrawing({ ...drawing, points: [points[0]!, points[1]!, x, y] });
    const lx = points[points.length - 2]!, ly = points[points.length - 1]!;
    if (Math.hypot(x - lx, y - ly) >= 2) setDrawing({ ...drawing, points: [...points, x, y] });
  };
  const up = () => {
    if (!drawing) return;
    let mark = drawing;
    if (mark.kind === "box") {
      // A box keeps its top-left corner and a positive size
      const x = Math.min(mark.x!, mark.x! + mark.w!), y = Math.min(mark.y!, mark.y! + mark.h!);
      mark = { ...mark, x, y, w: Math.abs(mark.w!), h: Math.abs(mark.h!) };
      if (mark.w! < 6 || mark.h! < 6) return setDrawing(null);
    }
    if (mark.kind === "arrow" && Math.hypot(mark.points![2]! - mark.points![0]!, mark.points![3]! - mark.points![1]!) < 8) return setDrawing(null);
    setDrawing(null);
    add(mark);
  };
  const placeText = () => {
    const value = textBox.current?.value.trim();
    if (typing && value) add({ ...base(), kind: "text", size: sz.text, x: typing.x, y: typing.y, text: value, ...(bold ? { bold: true } : {}), ...(typing.near ? { near: typing.near } : {}) });
    setTyping(null);
  };

  const otherWidth = marks.some((mark) => Math.abs(mark.vw - window.innerWidth) > 60);
  const erasing = tool === "eraser";
  const shown = drawing ? [...marks, drawing] : marks;
  const textStyle = (mark: Pick<Mark, "color" | "size" | "bold">): CSSProperties => ({
    color: mark.color,
    fontSize: mark.size,
    fontWeight: mark.bold ? 800 : 600,
    background: mark.color === "#111111" ? "rgb(255 255 255 / .9)" : "rgb(10 10 10 / .82)",
  });

  return (
    <>
      <button type="button" className={`site-edit-toggle dn-toggle${open ? " is-on" : ""}`} aria-pressed={open} onClick={() => { setOpen(!open); setTyping(null); }} title="Draw and write notes on this page for Claude">
        <StickyNote size={15} aria-hidden="true" /> {open ? "Close notes" : "Notes"}
        {marks.length > 0 && <span className="dn-count">{marks.length}</span>}
      </button>

      {open && createPortal(
        <>
          <div className={`dn-layer dn-tool-${tool}`} style={{ width: size.w, height: size.h }}>
            <svg width={size.w} height={size.h} className="dn-svg" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              {shown.map((mark) => {
                const props = { className: "dn-mark", onPointerDown: erasing ? (event: ReactPointerEvent) => { event.stopPropagation(); remove(mark._key); } : undefined };
                if (mark.kind === "pen" || mark.kind === "marker") {
                  return <polyline key={mark._key} {...props} points={pairs(mark.points ?? [])} fill="none" stroke={mark.color} strokeWidth={mark.size} strokeLinecap="round" strokeLinejoin="round" opacity={mark.kind === "marker" ? 0.38 : 1} />;
                }
                if (mark.kind === "arrow") {
                  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = mark.points ?? [];
                  return (
                    <g key={mark._key} {...props}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={mark.color} strokeWidth={mark.size} strokeLinecap="round" />
                      <polygon points={head(x1, y1, x2, y2, mark.size)} fill={mark.color} />
                    </g>
                  );
                }
                if (mark.kind === "box") {
                  const x = Math.min(mark.x!, mark.x! + mark.w!), y = Math.min(mark.y!, mark.y! + mark.h!);
                  return <rect key={mark._key} {...props} x={x} y={y} width={Math.abs(mark.w!)} height={Math.abs(mark.h!)} rx={4} fill={mark.color} fillOpacity={0.08} stroke={mark.color} strokeWidth={mark.size} strokeDasharray={mark === drawing ? "8 6" : undefined} />;
                }
                return null;
              })}
            </svg>
            {shown.map((mark) => {
              if (mark.kind === "box") {
                const x = Math.min(mark.x!, mark.x! + mark.w!), y = Math.min(mark.y!, mark.y! + mark.h!);
                return <span key={`${mark._key}-size`} className="dn-size" style={{ left: x, top: Math.max(0, y - 24), background: mark.color, color: mark.color === "#ffffff" || mark.color === "#ffe600" ? "#000" : "#fff" }}>{Math.abs(mark.w!)} × {Math.abs(mark.h!)} px</span>;
              }
              if (mark.kind !== "text") return null;
              return (
                <div key={mark._key} className={`dn-text${erasing ? " is-erasable" : ""}`} style={{ left: mark.x, top: mark.y, ...textStyle(mark) }} onPointerDown={erasing ? (event) => { event.stopPropagation(); remove(mark._key); } : undefined}>
                  {mark.text}
                </div>
              );
            })}
            {typing && (
              <textarea
                ref={textBox}
                className="dn-typing"
                style={{ left: typing.x, top: typing.y, ...textStyle({ color, size: sz.text, bold }) }}
                placeholder="Type your note… (Enter to place, Shift+Enter for a new line)"
                rows={2}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); placeText(); }
                  if (event.key === "Escape") setTyping(null);
                }}
                onBlur={placeText}
              />
            )}
          </div>

          <div className={`dn-bar${barTop ? " is-top" : ""}`} role="toolbar" aria-label="Design notes">
            <div className="dn-group">
              {TOOLS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className="dn-btn" aria-pressed={tool === id} title={label} aria-label={label} onClick={() => { setTool(id); setTyping(null); }}>
                  <Icon size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="dn-group" aria-label="Colour">
              {COLORS.map((item) => (
                <button key={item.value} type="button" className="dn-swatch" aria-pressed={color === item.value} title={item.name} aria-label={item.name} style={{ background: item.value }} onClick={() => setColor(item.value)} />
              ))}
            </div>
            <div className="dn-group" aria-label="Size">
              {SIZES.map((item, index) => (
                <button key={item.name} type="button" className="dn-btn" aria-pressed={sizeIndex === index} title={item.name} aria-label={item.name} onClick={() => setSizeIndex(index)}>
                  <span className="dn-dot" style={{ width: 4 + index * 4, height: 4 + index * 4 }} />
                </button>
              ))}
              <button type="button" className="dn-btn" aria-pressed={bold} title="Bold text" aria-label="Bold text" onClick={() => setBold(!bold)}>
                <Bold size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="dn-group">
              <button type="button" className="dn-btn" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!marks.length} onClick={undo}><Undo2 size={16} aria-hidden="true" /></button>
              <button type="button" className="dn-btn" title="Remove every note on this page" aria-label="Clear this page" disabled={!marks.length} onClick={clear}><Trash2 size={16} aria-hidden="true" /></button>
              <button type="button" className="dn-btn" title={barTop ? "Move this bar to the bottom" : "Move this bar to the top"} aria-label="Move the toolbar" onClick={() => setBarTop(!barTop)}><ArrowUpDown size={16} aria-hidden="true" /></button>
              <button type="button" className="dn-btn" title="Close notes" aria-label="Close notes" onClick={() => setOpen(false)}><X size={16} aria-hidden="true" /></button>
            </div>
            <p className="dn-status" role="status">
              {status === "saving" && <><Loader2 size={13} className="site-spin" aria-hidden="true" /> Saving…</>}
              {status === "saved" && !dirty && <><Check size={13} aria-hidden="true" /> Saved for Claude</>}
              {status === "error" && "Didn’t save. Check your connection."}
              {status === "nologin" && "Log in with GitHub at For Work to save notes."}
              {status === "idle" && (marks.length ? `${marks.length} ${marks.length === 1 ? "note" : "notes"} on this page` : "Only you and Claude see these")}
              {otherWidth && <span className="dn-warn"> · some were drawn at another window width</span>}
            </p>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
