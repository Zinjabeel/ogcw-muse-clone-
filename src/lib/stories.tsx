import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ARTICLES, getArticle, READING_LIST_SLUGS, type Article, type ReadingList, type SectionId } from "@/data/content";
import { EMPTY_LAYOUT, resolveSlots, SLOTS, type FrontLayout, type SlotId } from "@/data/placements";

// The stories every page shows, live from the Sanity studio (/admin). The
// root route loads them on the server (src/routes/__root.tsx) and hands
// them down here; components read them with useStories(). Which story goes
// in which spot on the front page is chosen in the studio too ("Where it
// appears", src/data/placements.ts). When Sanity can't be reached, the
// stories written in the code stand in.

export type Stories = {
  /** Every story, newest first */
  all: Article[];
  /** A story by web address, or undefined if there is none */
  get: (slug: string) => Article | undefined;
  /** A story for a fixed spot on a page: the live one, else the one in the code, else the newest */
  pick: (slug: string) => Article;
  /** The stories in a spot on the front page (or a list used around the site) */
  slot: (id: SlotId) => Article[];
  /** Stories in a spot somewhere on the front page */
  onFront: Set<string>;
  /** Stories kept off the front page ("News page only" in the studio) */
  hidden: Set<string>;
  /** Stories in a section, newest first */
  inSection: (section: SectionId) => Article[];
  latest: Article[];
  trending: Article[];
  mostRead: Article[];
  editorsPicks: Article[];
  readingLists: ReadingList[];
};

export function makeStories(all: Article[], layout: FrontLayout = EMPTY_LAYOUT): Stories {
  const bySlug = new Map(all.map((story) => [story.slug, story]));
  const get = (slug: string) => bySlug.get(slug);
  const pick = (slug: string) => bySlug.get(slug) ?? getArticle(slug) ?? all[0] ?? ARTICLES[0]!;
  const list = (slugs: string[]) => slugs.flatMap((slug) => bySlug.get(slug) ?? []);
  const slots = resolveSlots(all, layout);
  const onFront = new Set(SLOTS.flatMap((slot) => ("list" in slot ? [] : slots[slot.id].map((story) => story.slug))));
  return {
    all,
    get,
    pick,
    slot: (id) => slots[id],
    onFront,
    hidden: new Set(layout.hidden),
    inSection: (section) => all.filter((story) => story.section === section),
    latest: all.slice(0, 6),
    trending: slots.trending,
    mostRead: slots["most-read"],
    editorsPicks: slots["editors-picks"],
    readingLists: READING_LIST_SLUGS.map((reading) => ({ ...reading, items: list(reading.items) })),
  };
}

const FALLBACK = makeStories(ARTICLES);
const StoriesContext = createContext<Stories>(FALLBACK);

export function StoriesProvider({ stories, layout, children }: { stories: Article[]; layout: FrontLayout; children: ReactNode }) {
  const value = useMemo(() => (stories.length ? makeStories(stories, layout) : FALLBACK), [stories, layout]);
  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export const useStories = () => useContext(StoriesContext);
