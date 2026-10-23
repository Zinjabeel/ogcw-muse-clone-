import { useRouterState } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

// The site's own words and photos: menus, footer, headings, page intros,
// hero cards, songs, shops, events. Each is named in the code with its usual
// wording (<T k="nav.news">News</T>, src/components/site-text.tsx); an admin
// can change any of them on the page itself. Each change is kept in Sanity
// as a "Site edit" filed under the part of the site it's in (Hero, OGCW
// News, Explore…, src/lib/site-sections.ts), loaded with the stories for
// every page. Each save is also kept as a version ("Site history" in the
// studio) for 30 days, to go back to.
// A story's label, headline and summary on the fronts (<S story f="title"/>)
// can be changed the same way; those changes go to the story itself.
// Texts and photos can also be dragged to another place on their page and
// resized ("layouts"): each move is kept for that page, separately for
// computers (1024 px wide and up, "d") and phones and tablets ("m").

/** A crop by hand: the point kept in the middle (in %) and how far it's zoomed in (1 = not at all) */
export type SiteCrop = { x: number; y: number; zoom: number };
/**
 * fit: "contain" shows the whole picture instead of filling its frame; clear:
 * no dimming or dark overlay on it; video: a video plays in the photo's place
 * (muted, looping); crop: cropped by hand (without it, the site crops
 * automatically around the middle); videoStart and videoEnd: the part of
 * the video that plays (seconds); videoOnce: it plays once and stops on its
 * last frame instead of looping; videoRate: its speed (1 = usual)
 */
export type SiteImage = { src: string; alt?: string; assetId?: string; fit?: "cover" | "contain"; clear?: boolean; video?: string; videoAssetId?: string; crop?: SiteCrop; videoStart?: number; videoEnd?: number; videoOnce?: boolean; videoRate?: number; tone?: SiteTone };
/** A photo's finish, in %: brightness, contrast and colour (100 = as it is), black and white (0 = none) */
export type SiteTone = { b?: number; c?: number; s?: number; g?: number };
/** The CSS filter for a finish ("" when it's as it is) */
export const toneFilter = (tone: SiteTone | undefined) => {
  if (!tone) return "";
  const parts = [tone.b !== undefined && tone.b !== 100 ? `brightness(${tone.b}%)` : "", tone.c !== undefined && tone.c !== 100 ? `contrast(${tone.c}%)` : "", tone.s !== undefined && tone.s !== 100 ? `saturate(${tone.s}%)` : "", tone.g ? `grayscale(${tone.g}%)` : ""];
  return parts.filter(Boolean).join(" ");
};
/** What an admin can add as a new section: words, a picture, both, a band of colour, or story cards chosen by hand */
export type SectionKind = "text" | "image" | "textimage" | "band" | "stories";
/**
 * A move: x and y in page pixels from where it usually sits, s its size (1 = usual).
 * A whole section ("sec:" things) keeps x 0, y 0, s 1 and is styled instead:
 *  - its content: cw its width in % of the section (centred), pt and pb the
 *    space above and below it in page pixels; the background is untouched
 *  - its colour: bg (and bg2 for a split: "x" side by side, "y" top and
 *    bottom, at % from the start), and how much of the section the colour
 *    covers, bw and bh in % (centred)
 *  - hide: hidden for visitors; order: its place among the parts beside it
 * A section an admin added ("blk:" things) also has kind, after (the
 * section it follows), cols (1 to 3; 1 to 4 for stories), for a colour band,
 * band (its height), and for story cards, stories (their web addresses, in order).
 */
export type LayoutPos = {
  x: number; y: number; s: number;
  cw?: number; pt?: number; pb?: number;
  bg?: string; bg2?: string; split?: "x" | "y"; at?: number; bw?: number; bh?: number;
  hide?: boolean; order?: number;
  kind?: SectionKind; after?: string; cols?: number; band?: number; stories?: string[];
  /** A whole card ("card:" things): its width and height, and its picture's height, in page pixels */
  w?: number; h?: number; ih?: number;
  /** A collage ("grp:" things): only this one of its pictures shows, filling it */
  one?: number;
};
export type SiteLayout = { d?: LayoutPos; m?: LayoutPos };
/** Where an edit is from: the part of the site, the page and the usual wording */
export type EditMeta = { section?: string; page?: string; usual?: string; /** still in the old single "Site texts" document */ legacy?: boolean };
/** layouts: "<page>|<thing>", the thing being "t:<text>", "s:<story field>", "i:<photo>", "src:<picture>#<n>", "sec:<section>", "card:<picture>" (the card around it) or "grp:<picture>" (the collage it's in) */
export type SiteContent = { texts: Record<string, string>; images: Record<string, SiteImage>; layouts: Record<string, SiteLayout>; meta: Record<string, EditMeta> };
export const EMPTY_SITE: SiteContent = { texts: {}, images: {}, layouts: {}, meta: {} };

export type StoryField = "title" | "deck" | "kicker";
export type EditKind = "text" | "image" | "story" | "layout";
export type Pending = { key: string; kind: EditKind; value: string | SiteImage | SiteLayout | null; meta?: EditMeta };

/** A layout's key: the page and the thing on it */
export const layoutKey = (page: string, thing: string) => `${page}|${thing}`;
/** The CSS variables that put a moved thing in its new place (styles.css, .site-lay) */
export function layoutStyle(layout: SiteLayout | undefined): CSSProperties | undefined {
  if (!layout || (!layout.d && !layout.m)) return undefined;
  const vars: Record<string, string> = {};
  for (const bp of ["d", "m"] as const) {
    const pos = layout[bp];
    if (!pos) continue;
    vars[`--lay-${bp}x`] = `${pos.x}px`;
    vars[`--lay-${bp}y`] = `${pos.y}px`;
    vars[`--lay-${bp}s`] = String(pos.s);
  }
  return vars as CSSProperties;
}

/** A story change's key: "<slug>|<field>" */
export const storyKey = (slug: string, field: StoryField) => `${slug}|${field}`;

type Editor = {
  /** What's live, merged with this admin's unsaved changes */
  text: (key: string) => string | undefined;
  image: (key: string) => SiteImage | undefined;
  /** Pictures replaced anywhere on the site ("pic." edits), by their usual address */
  pictures: Record<string, SiteImage>;
  story: (slug: string, field: StoryField) => string | undefined;
  /** Where a thing on this page was moved to, with unsaved moves */
  layout: (thing: string) => SiteLayout | undefined;
  /** Every move on this page, with unsaved moves: thing → layout */
  pageLayouts: Record<string, SiteLayout>;
  /** The live content, without unsaved changes */
  live: SiteContent;
  /** The edit buttons are on (admins only) */
  editing: boolean;
  setEditing: (on: boolean) => void;
  /** An admin is pointing at or typing in something: moving parts hold still */
  busy: boolean;
  setBusy: (on: boolean) => void;
  /** Unsaved changes, in the order they were made (null = back to the usual wording) */
  pending: Pending[];
  change: (key: string, kind: EditKind, value: Pending["value"], meta?: EditMeta) => void;
  undo: () => void;
  /** Takes back every unsaved change to one thing (not only the last change) */
  revert: (key: string) => void;
  discard: () => void;
  /** Unsaved changes kept on this browser from before a reload or a closed tab, to bring back */
  stored: number;
  restore: () => void;
  forget: () => void;
  /** After a save: the saved changes stay on screen until the site's copy catches up */
  settle: (saved: SiteContent, stories: Map<string, string>) => void;
};

const DRAFT_KEY = "ogcw-site-draft";
const TAB_KEY = "ogcw-tab";

const SiteTextContext = createContext<Editor>({
  text: () => undefined,
  image: () => undefined,
  pictures: {},
  story: () => undefined,
  layout: () => undefined,
  pageLayouts: {},
  live: EMPTY_SITE,
  editing: false,
  setEditing: () => {},
  busy: false,
  setBusy: () => {},
  pending: [],
  change: () => {},
  undo: () => {},
  revert: () => {},
  discard: () => {},
  stored: 0,
  restore: () => {},
  forget: () => {},
  settle: () => {},
});

export const useSiteText = () => useContext(SiteTextContext);

export function SiteTextProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [saved, setSaved] = useState<{ content: SiteContent; stories: Map<string, string>; over: SiteContent } | null>(null);
  // Once the site's own copy has been reloaded after a save, it has the change: use it
  useEffect(() => {
    if (saved && saved.over !== content) setSaved(null);
  }, [content, saved]);

  // The live copy, with a just-saved version on top until the loader has it
  const live = saved ? saved.content : content;

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const latest = useMemo(() => {
    const maps: Record<EditKind, Map<string, Pending["value"]>> = { text: new Map(), image: new Map(), story: new Map(), layout: new Map() };
    for (const item of pending) maps[item.kind].set(item.key, item.value);
    return maps;
  }, [pending]);
  // This page's moves, live ones with unsaved ones on top
  const pageLayouts = useMemo(() => {
    const prefix = `${pathname}|`;
    const out: Record<string, SiteLayout> = {};
    for (const [key, value] of Object.entries(live.layouts ?? {})) if (key.startsWith(prefix)) out[key.slice(prefix.length)] = value;
    for (const [key, value] of latest.layout) {
      if (!key.startsWith(prefix)) continue;
      if (value) out[key.slice(prefix.length)] = value as SiteLayout;
      else delete out[key.slice(prefix.length)];
    }
    return out;
  }, [live, latest, pathname]);
  const layout = useCallback((thing: string) => pageLayouts[thing], [pageLayouts]);

  const text = useCallback((key: string) => {
    if (latest.text.has(key)) return (latest.text.get(key) as string | null) ?? undefined;
    return live.texts[key];
  }, [latest, live]);
  const image = useCallback((key: string) => {
    if (latest.image.has(key)) return (latest.image.get(key) as SiteImage | null) ?? undefined;
    return live.images[key];
  }, [latest, live]);
  // Any picture on the site can be replaced: its edit ("pic.<n>") keeps the
  // picture's usual address as its "usual", which is how the page finds it
  const pictures = useMemo(() => {
    const out: Record<string, SiteImage> = {};
    for (const [key, picture] of Object.entries(live.images)) {
      const usual = live.meta[key]?.usual;
      if (key.startsWith("pic.") && usual) out[usual] = picture;
    }
    for (const item of pending) {
      if (item.kind !== "image" || !item.key.startsWith("pic.")) continue;
      const usual = item.meta?.usual ?? live.meta[item.key]?.usual;
      if (!usual) continue;
      if (item.value) out[usual] = item.value as SiteImage;
      else delete out[usual];
    }
    return out;
  }, [live, pending]);
  const story = useCallback((slug: string, field: StoryField) => {
    const key = storyKey(slug, field);
    if (latest.story.has(key)) return (latest.story.get(key) as string | null) ?? undefined;
    return saved?.stories.get(key);
  }, [latest, saved]);

  const change = useCallback((key: string, kind: EditKind, value: Pending["value"], meta?: EditMeta) => {
    setPending((list) => [...list, meta ? { key, kind, value, meta } : { key, kind, value }]);
  }, []);
  const undo = useCallback(() => setPending((list) => list.slice(0, -1)), []);
  const revert = useCallback((key: string) => setPending((list) => list.filter((item) => item.key !== key)), []);
  const discard = useCallback(() => setPending([]), []);

  // Unsaved changes are kept on this browser as they're made, so a reload,
  // a crash or a closed tab doesn't lose them. Each tab keeps its own copy
  // (and touches it every 30 seconds while it's open), so tabs open side by
  // side never take each other's; what's offered back is this tab's own copy
  // after a reload, or the copy of a tab that's been closed.
  const [draft, setDraft] = useState<{ keys: string[]; pending: Pending[] } | null>(null);
  const tab = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      let id = sessionStorage.getItem(TAB_KEY);
      if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(TAB_KEY, id); }
      return id;
    } catch { return Math.random().toString(36).slice(2, 10); }
  }, []);
  useEffect(() => {
    try {
      const own = `${DRAFT_KEY}:${tab}`;
      const found: { keys: string[]; pending: Pending[] } = { keys: [], pending: [] };
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(DRAFT_KEY)) continue;
        const kept = JSON.parse(localStorage.getItem(key) ?? "null") as { at?: string; pending?: Pending[] } | null;
        if (!Array.isArray(kept?.pending) || !kept.pending.length) continue;
        // Another tab's copy only once that tab has stopped touching it (closed)
        const stale = Date.now() - Date.parse(kept.at ?? "") > 90_000;
        if (key === own || stale) { found.keys.push(key); found.pending.push(...kept.pending); }
      }
      if (found.pending.length) setDraft(found);
    } catch { /* nothing kept */ }
  }, [tab]);
  useEffect(() => {
    if (!tab) return;
    const own = `${DRAFT_KEY}:${tab}`;
    const write = () => {
      try {
        if (pending.length) localStorage.setItem(own, JSON.stringify({ at: new Date().toISOString(), pending }));
        else if (!draft?.keys.includes(own)) localStorage.removeItem(own);
      } catch { /* private window */ }
    };
    write();
    if (!pending.length) return;
    const beat = window.setInterval(write, 30_000);
    return () => window.clearInterval(beat);
  }, [pending, draft, tab]);
  const clearDraft = (keys: string[]) => { try { for (const key of keys) if (key !== `${DRAFT_KEY}:${tab}`) localStorage.removeItem(key); } catch { /* private window */ } };
  const restore = useCallback(() => {
    if (draft) { setPending((list) => [...draft.pending, ...list]); clearDraft(draft.keys); }
    setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  const forget = useCallback(() => {
    if (draft) { clearDraft(draft.keys); try { if (!pending.length) localStorage.removeItem(`${DRAFT_KEY}:${tab}`); } catch { /* private window */ } }
    setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, pending.length, tab]);
  const settle = useCallback((next: SiteContent, stories: Map<string, string>) => {
    setSaved({ content: next, stories, over: content });
    setPending([]);
  }, [content]);

  const value = useMemo<Editor>(
    () => ({ text, image, pictures, story, layout, pageLayouts, live, editing, setEditing, busy, setBusy, pending, change, undo, revert, discard, stored: draft?.pending.length ?? 0, restore, forget, settle }),
    [text, image, pictures, story, layout, pageLayouts, live, editing, busy, pending, change, undo, revert, discard, draft, restore, forget, settle],
  );
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}

/** Sanity array items need a key of letters, digits, - and _ */
export const itemKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
