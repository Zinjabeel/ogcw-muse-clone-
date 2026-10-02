import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// The site's own words and photos (not the stories): menus, footer,
// headings, page intros, hero cards. Each is named in the code with its
// usual wording (<T k="nav.news">News</T>, src/components/site-text.tsx);
// an admin can change any of them on the page itself, and the changes are
// kept in Sanity's "Site texts" document (siteContent), loaded with the
// stories for every page. Each save is also kept as a version ("Site
// history" in the studio) for 30 days, to go back to.

export type SiteImage = { src: string; alt?: string; assetId?: string };
export type SiteContent = { texts: Record<string, string>; images: Record<string, SiteImage> };
export const EMPTY_SITE: SiteContent = { texts: {}, images: {} };

type Editor = {
  /** What's live, merged with this admin's unsaved changes */
  text: (key: string) => string | undefined;
  image: (key: string) => SiteImage | undefined;
  /** The live content, without unsaved changes */
  live: SiteContent;
  editing: boolean;
  setEditing: (on: boolean) => void;
  /** Unsaved changes, in the order they were made (null = back to the usual wording) */
  pending: { key: string; kind: "text" | "image"; value: string | SiteImage | null }[];
  change: (key: string, kind: "text" | "image", value: string | SiteImage | null) => void;
  undo: () => void;
  discard: () => void;
  /** After a save: the saved changes stay on screen until the site's copy catches up */
  settle: (saved: SiteContent) => void;
};

const SiteTextContext = createContext<Editor>({
  text: () => undefined,
  image: () => undefined,
  live: EMPTY_SITE,
  editing: false,
  setEditing: () => {},
  pending: [],
  change: () => {},
  undo: () => {},
  discard: () => {},
  settle: () => {},
});

export const useSiteText = () => useContext(SiteTextContext);

export function SiteTextProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Editor["pending"]>([]);
  const [saved, setSaved] = useState<{ content: SiteContent; over: SiteContent } | null>(null);
  // Once the site's own copy has been reloaded after a save, it has the change: use it
  useEffect(() => {
    if (saved && saved.over !== content) setSaved(null);
  }, [content, saved]);

  // The live copy, with a just-saved version on top until the loader has it
  const live = useMemo<SiteContent>(() => {
    if (!saved) return content;
    return saved.content;
  }, [content, saved]);

  const latest = useMemo(() => {
    const texts = new Map<string, string | null>();
    const images = new Map<string, SiteImage | null>();
    for (const item of pending) {
      if (item.kind === "text") texts.set(item.key, item.value as string | null);
      else images.set(item.key, item.value as SiteImage | null);
    }
    return { texts, images };
  }, [pending]);

  const text = useCallback((key: string) => {
    if (latest.texts.has(key)) return latest.texts.get(key) ?? undefined;
    return live.texts[key];
  }, [latest, live]);
  const image = useCallback((key: string) => {
    if (latest.images.has(key)) return latest.images.get(key) ?? undefined;
    return live.images[key];
  }, [latest, live]);

  const change = useCallback((key: string, kind: "text" | "image", value: string | SiteImage | null) => {
    setPending((list) => [...list, { key, kind, value }]);
  }, []);
  const undo = useCallback(() => setPending((list) => list.slice(0, -1)), []);
  const discard = useCallback(() => setPending([]), []);
  const settle = useCallback((next: SiteContent) => {
    setSaved({ content: next, over: content });
    setPending([]);
  }, [content]);

  const value = useMemo<Editor>(() => ({ text, image, live, editing, setEditing, pending, change, undo, discard, settle }), [text, image, live, editing, pending, change, undo, discard, settle]);
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}

/** Sanity array items need a key of letters, digits, - and _ */
export const itemKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
