import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// The site's own words and photos: menus, footer, headings, page intros,
// hero cards, songs, shops, events. Each is named in the code with its usual
// wording (<T k="nav.news">News</T>, src/components/site-text.tsx); an admin
// can change any of them on the page itself, and the changes are kept in
// Sanity's "Site texts" document (siteContent), loaded with the stories for
// every page. Each save is also kept as a version ("Site history" in the
// studio) for 30 days, to go back to.
// A story's label, headline and summary on the fronts (<S story f="title"/>)
// can be changed the same way; those changes go to the story itself.

export type SiteImage = { src: string; alt?: string; assetId?: string };
export type SiteContent = { texts: Record<string, string>; images: Record<string, SiteImage> };
export const EMPTY_SITE: SiteContent = { texts: {}, images: {} };

export type StoryField = "title" | "deck" | "kicker";
export type EditKind = "text" | "image" | "story";
export type Pending = { key: string; kind: EditKind; value: string | SiteImage | null };

/** A story change's key: "<slug>|<field>" */
export const storyKey = (slug: string, field: StoryField) => `${slug}|${field}`;

type Editor = {
  /** What's live, merged with this admin's unsaved changes */
  text: (key: string) => string | undefined;
  image: (key: string) => SiteImage | undefined;
  story: (slug: string, field: StoryField) => string | undefined;
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
  change: (key: string, kind: EditKind, value: string | SiteImage | null) => void;
  undo: () => void;
  discard: () => void;
  /** After a save: the saved changes stay on screen until the site's copy catches up */
  settle: (saved: SiteContent, stories: Map<string, string>) => void;
};

const SiteTextContext = createContext<Editor>({
  text: () => undefined,
  image: () => undefined,
  story: () => undefined,
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

  const latest = useMemo(() => {
    const maps: Record<EditKind, Map<string, string | SiteImage | null>> = { text: new Map(), image: new Map(), story: new Map() };
    for (const item of pending) maps[item.kind].set(item.key, item.value);
    return maps;
  }, [pending]);

  const text = useCallback((key: string) => {
    if (latest.text.has(key)) return (latest.text.get(key) as string | null) ?? undefined;
    return live.texts[key];
  }, [latest, live]);
  const image = useCallback((key: string) => {
    if (latest.image.has(key)) return (latest.image.get(key) as SiteImage | null) ?? undefined;
    return live.images[key];
  }, [latest, live]);
  const story = useCallback((slug: string, field: StoryField) => {
    const key = storyKey(slug, field);
    if (latest.story.has(key)) return (latest.story.get(key) as string | null) ?? undefined;
    return saved?.stories.get(key);
  }, [latest, saved]);

  const change = useCallback((key: string, kind: EditKind, value: string | SiteImage | null) => {
    setPending((list) => [...list, { key, kind, value }]);
  }, []);
  const undo = useCallback(() => setPending((list) => list.slice(0, -1)), []);
  const discard = useCallback(() => setPending([]), []);
  const settle = useCallback((next: SiteContent, stories: Map<string, string>) => {
    setSaved({ content: next, stories, over: content });
    setPending([]);
  }, [content]);

  const value = useMemo<Editor>(
    () => ({ text, image, story, live, editing, setEditing, busy, setBusy, pending, change, undo, discard, settle }),
    [text, image, story, live, editing, busy, pending, change, undo, discard, settle],
  );
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}

/** Sanity array items need a key of letters, digits, - and _ */
export const itemKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
