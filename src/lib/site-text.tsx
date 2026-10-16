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

/** fit: "contain" shows the whole picture instead of filling its frame; clear: no dimming or dark overlay on it */
export type SiteImage = { src: string; alt?: string; assetId?: string; fit?: "cover" | "contain"; clear?: boolean };
/**
 * A move: x and y in page pixels from where it usually sits, s its size (1 = usual).
 * A whole section is sized instead: w its width in % of the space it sits in
 * (centred), h its height in page pixels, clip when that is less than its
 * contents need (the rest is cut off).
 */
export type LayoutPos = { x: number; y: number; s: number; w?: number; h?: number; clip?: boolean };
export type SiteLayout = { d?: LayoutPos; m?: LayoutPos };
/** Where an edit is from: the part of the site, the page and the usual wording */
export type EditMeta = { section?: string; page?: string; usual?: string; /** still in the old single "Site texts" document */ legacy?: boolean };
/** layouts: "<page>|<thing>", the thing being "t:<text>", "s:<story field>", "i:<photo>", "src:<picture>#<n>" or "sec:<section>" */
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
  discard: () => void;
  /** After a save: the saved changes stay on screen until the site's copy catches up */
  settle: (saved: SiteContent, stories: Map<string, string>) => void;
};

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
  discard: () => {},
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
  const discard = useCallback(() => setPending([]), []);
  const settle = useCallback((next: SiteContent, stories: Map<string, string>) => {
    setSaved({ content: next, stories, over: content });
    setPending([]);
  }, [content]);

  const value = useMemo<Editor>(
    () => ({ text, image, pictures, story, layout, pageLayouts, live, editing, setEditing, busy, setBusy, pending, change, undo, discard, settle }),
    [text, image, pictures, story, layout, pageLayouts, live, editing, busy, pending, change, undo, discard, settle],
  );
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}

/** Sanity array items need a key of letters, digits, - and _ */
export const itemKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
