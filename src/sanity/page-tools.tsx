import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { set, unset, type FormPatch } from "sanity";
import { ACCENTS, LOOKS, STARTING_POINTS, starterBody, type LookId, type StoryDesign } from "@/data/designs";
import type { SanityBlock } from "@/lib/sanity-mapping";
import type { Change } from "./page-editor";

// The tools in the story editor's bar (src/sanity/page-editor.tsx):
//  - Undo and Redo: back to before your last change, and forward again
//    (typing in one go counts as one change)
//  - Copy design and Paste design: the look of one story onto another, its
//    words and photos untouched (the look, the colour, the headline and text
//    size, and each photo's size and caption look, photo by photo in order)
//  - Design: the chooser, with a small drawing of each look; a new, empty
//    story opens it by itself, with the starting points
//  - the list of what's missing before Publish works, each a link to its box

type Doc = Record<string, unknown>;
/** Everything Undo puts back */
const FIELDS = ["title", "slug", "section", "kicker", "deck", "credit", "date", "updated", "certified", "photo", "ask", "body", "sources", "design"] as const;
const pick = (value: Doc | undefined): Doc => Object.fromEntries(FIELDS.map((field) => [field, value?.[field]]));
const same = (a: Doc, b: Doc) => JSON.stringify(a) === JSON.stringify(b);
/** Changes closer together than this are one change (typing a word) */
const ONE_CHANGE_MS = 1200;

// ---------------------------------------------------------------- Undo and Redo

export function useUndo(value: Doc | undefined, onChange: (change: Change) => void) {
  const [past, setPast] = useState<Doc[]>([]);
  const [future, setFuture] = useState<Doc[]>([]);
  const last = useRef<Doc | null>(null);
  const lastAt = useRef(0);
  const restoring = useRef(false);

  useEffect(() => {
    const now = pick(value);
    const before = last.current;
    last.current = now;
    if (!before || same(before, now)) return;
    if (restoring.current) {
      restoring.current = false;
      return;
    }
    const at = Date.now();
    if (at - lastAt.current > ONE_CHANGE_MS) setPast((list) => [...list.slice(-59), before]);
    lastAt.current = at;
    setFuture([]);
  }, [value]);

  const putBack = useCallback((doc: Doc) => {
    restoring.current = true;
    lastAt.current = 0;
    const patches: FormPatch[] = FIELDS.map((field) => (doc[field] === undefined ? unset([field]) : set(doc[field], [field])));
    onChange(patches);
  }, [onChange]);

  const undo = useCallback(() => {
    const previous = past[past.length - 1];
    if (!previous) return;
    setPast((list) => list.slice(0, -1));
    setFuture((list) => [pick(value), ...list]);
    putBack(previous);
  }, [past, value, putBack]);
  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setFuture((list) => list.slice(1));
    setPast((list) => [...list, pick(value)]);
    putBack(next);
  }, [future, value, putBack]);

  return { undo: past.length ? undo : undefined, redo: future.length ? redo : undefined, steps: past.length };
}

// ---------------------------------------------------------------- Copy and paste a design

const CLIPBOARD_KEY = "ogcw-copied-design";
const PHOTO_LOOK = ["size", "captionSize", "captionAlign", "captionStyle"] as const;
const GALLERY_LOOK = ["layout", "columns", "captionSize", "captionAlign", "captionStyle"] as const;
type Copied = { from: string; design?: StoryDesign; photos: Doc[]; galleries: Doc[] };

const readClipboard = (): Copied | null => {
  try {
    const copied = JSON.parse(localStorage.getItem(CLIPBOARD_KEY) ?? "null") as Copied | null;
    return copied && Array.isArray(copied.photos) && Array.isArray(copied.galleries) ? copied : null;
  } catch {
    return null;
  }
};
const lookOf = (block: Doc, fields: readonly string[]) => Object.fromEntries(fields.flatMap((field) => (block[field] === undefined ? [] : [[field, block[field]]])));

export function useDesignClipboard(story: { title?: string; design?: StoryDesign; body?: SanityBlock[] }, onChange: (change: Change) => void) {
  const [copied, setCopied] = useState<Copied | null>(null);
  const [flash, setFlash] = useState("");
  // Copied in another story (or another tab): ready to paste here
  useEffect(() => {
    setCopied(readClipboard());
    const onStorage = (event: StorageEvent) => { if (event.key === CLIPBOARD_KEY) setCopied(readClipboard()); };
    const onFocus = () => setCopied(readClipboard());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("focus", onFocus); };
  }, []);
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(""), 3200);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const body = (story.body ?? []) as Doc[];
  const copy = () => {
    const next: Copied = {
      from: story.title || "this story",
      ...(story.design ? { design: story.design } : {}),
      photos: body.filter((block) => block["_type"] === "storyImage").map((block) => lookOf(block, PHOTO_LOOK)),
      galleries: body.filter((block) => block["_type"] === "storyImagePair").map((block) => lookOf(block, GALLERY_LOOK)),
    };
    try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(next)); } catch { /* not kept: nothing to paste later */ }
    setCopied(next);
    setFlash("Design copied. Open another story and press Paste design.");
  };
  const paste = () => {
    const from = readClipboard() ?? copied;
    if (!from) return;
    const patches: FormPatch[] = [from.design ? set(from.design, ["design"]) : unset(["design"])];
    // Photo by photo, in order (a story with more photos than the copied one repeats its last look)
    const restyle = (type: string, looks: Doc[], fields: readonly string[]) => {
      if (!looks.length) return;
      body.filter((block) => block["_type"] === type).forEach((block, index) => {
        const look = looks[Math.min(index, looks.length - 1)]!;
        for (const field of fields) {
          const path = ["body", { _key: String(block["_key"]) }, field];
          patches.push(look[field] === undefined ? unset(path) : set(look[field], path));
        }
      });
    };
    restyle("storyImage", from.photos, PHOTO_LOOK);
    restyle("storyImagePair", from.galleries, GALLERY_LOOK);
    onChange(patches);
    setFlash(`Now designed like “${from.from}”. Undo puts it back.`);
  };
  return { copy, paste: copied ? paste : undefined, copiedFrom: copied?.from, flash };
}

// ---------------------------------------------------------------- The design chooser

/** A tiny drawing of a look: bars for words, a block for the photo */
export function Wire({ look }: { look: LookId }) {
  const words = (lines: number) => [<i key="k" className="k" />, <i key="h" className="h" />, <i key="h2" className="h2" />, ...Array.from({ length: lines }, (_, n) => <i key={`t${n}`} className="t" />)];
  const parts: Record<LookId, ReactNode> = {
    classic: <><div>{words(2)}</div><b /></>,
    spotlight: <><b />{words(1)}</>,
    cover: <><b />{words(0)}</>,
    magazine: <>{words(0)}<b /><i className="t" /></>,
    split: <><b />{words(2)}</>,
    night: <>{words(0)}<b /><i className="t" /></>,
    breaking: <>{words(0)}<b /></>,
    minimal: <>{words(2)}<b /></>,
  };
  return <span className={`se-wire se-wire-${look}`} aria-hidden="true">{parts[look]}</span>;
}

export function DesignPanel({ design, fresh, onChange, onClose, readOnly }: { design: StoryDesign | undefined; fresh: boolean; onChange: (change: Change) => void; onClose: () => void; readOnly: boolean }) {
  const current = design ?? {};
  const choose = <K extends keyof StoryDesign>(field: K, value: StoryDesign[K] | undefined) =>
    onChange(value === undefined ? unset(["design", field]) : [set({ ...current, [field]: value }, ["design"])]);

  if (fresh) {
    // A new story: pick a starting point (a look, and a few empty blocks to fill in)
    return (
      <section className="se-design" aria-labelledby="se-design-title">
        <div className="se-design-head">
          <div>
            <h2 id="se-design-title">How should this story look?</h2>
            <p>Pick a starting point. You can change the design whenever you like; the words and photos stay.</p>
          </div>
          <button type="button" className="se-secondary" onClick={onClose}><X size={14} aria-hidden="true" /> Start blank</button>
        </div>
        <div className="se-looks">
          {STARTING_POINTS.map((point) => (
            <button
              key={point.id}
              type="button"
              className="se-look"
              disabled={readOnly}
              onClick={() => { onChange([set(point.design, ["design"]), set(starterBody(point), ["body"])]); onClose(); }}
            >
              <Wire look={point.design.look ?? "classic"} />
              <strong>{point.name}</strong>
              <small>{point.note}</small>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const option = <K extends keyof StoryDesign>(field: K, value: StoryDesign[K], label: string, usual?: boolean) => {
    const on = current[field] === value || (usual && current[field] === undefined);
    return <button key={String(value)} type="button" className="se-swatch" aria-pressed={on} disabled={readOnly} onClick={() => choose(field, usual ? undefined : value)}>{label}</button>;
  };
  return (
    <section className="se-design" aria-labelledby="se-design-title">
      <div className="se-design-head">
        <div>
          <h2 id="se-design-title">Design</h2>
          <p>Every change shows on the page below straight away. The words and photos stay the same.</p>
        </div>
        <button type="button" className="se-primary" onClick={onClose}>Done</button>
      </div>
      <p className="se-design-label">Look</p>
      <div className="se-looks">
        {LOOKS.map((look) => (
          <button key={look.id} type="button" className="se-look" aria-pressed={(current.look ?? "classic") === look.id} disabled={readOnly} onClick={() => choose("look", look.id === "classic" ? undefined : look.id)}>
            <Wire look={look.id} />
            <strong>{look.name}</strong>
            <small>{look.note}</small>
          </button>
        ))}
      </div>
      <p className="se-design-label">Colour</p>
      <div className="se-swatches">
        {ACCENTS.map((accent) => (
          <button key={accent.id} type="button" className="se-swatch" aria-pressed={(current.accent ?? "yellow") === accent.id} disabled={readOnly} onClick={() => choose("accent", accent.id === "yellow" ? undefined : accent.id)}>
            <span style={{ background: accent.colour }} /> {accent.name}
          </button>
        ))}
      </div>
      <div className="se-design-row">
        <div>
          <p className="se-design-label">Headline</p>
          <div className="se-swatches">{option("headline", "display", "Display", true)}{option("headline", "bold", "Bold")}</div>
        </div>
        <div>
          <p className="se-design-label">Text size</p>
          <div className="se-swatches">{option("text", "normal", "Usual", true)}{option("text", "large", "Larger")}</div>
        </div>
        <div>
          <p className="se-design-label">Captions</p>
          <div className="se-swatches">{option("captions", "s", "Small", true)}{option("captions", "m", "Medium")}{option("captions", "l", "Large")}</div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Before you publish

type Check = { level: string; path: unknown[]; message: string };
const NAMES: Record<string, string> = {
  title: "Headline", slug: "Web address", section: "Section", credit: "Source", date: "Date", photo: "Lead photo",
  kicker: "Label", deck: "Summary", body: "Story text", sources: "Sources", design: "Design", updated: "Latest update",
};

export function PublishList({ checks, local, hasDraft, canvas }: { checks: Check[]; local: Record<string, string[]>; hasDraft: boolean; canvas: RefObject<HTMLDivElement | null> }) {
  // One line per box: the page's own wording, else Sanity's
  const problems = new Map<string, string>();
  for (const [key, messages] of Object.entries(local)) if (messages[0]) problems.set(key.split(".")[0]!, messages[0]);
  for (const check of checks) {
    if (check.level !== "error") continue;
    const field = String(check.path[0] ?? "");
    if (!problems.has(field)) problems.set(field, check.message);
  }
  const show = (field: string) => {
    const box = canvas.current?.querySelector<HTMLElement>(`[data-field="${field}"]`) ?? (field === "body" ? canvas.current?.querySelector<HTMLElement>(".se-body") : null);
    if (!box) return;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    box.querySelector<HTMLElement>("textarea, input, select, button")?.focus({ preventScroll: true });
  };

  if (!problems.size) {
    if (!hasDraft) return null;
    return (
      <div className="se-publish is-ok" role="status">
        <p className="se-publish-title"><CheckCircle2 size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Ready to publish</p>
        <p>Press Publish at the bottom right to put your changes on the site.</p>
      </div>
    );
  }
  return (
    <div className="se-publish" role="alert">
      <p className="se-publish-title"><AlertCircle size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Before you can publish, {problems.size === 1 ? "one thing" : `${problems.size} things`} to fix</p>
      <ul>
        {[...problems].map(([field, message]) => (
          <li key={field}>
            <button type="button" onClick={() => show(field)}><strong>{NAMES[field] ?? field}:</strong> {message === "Required" ? "add it" : message}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
