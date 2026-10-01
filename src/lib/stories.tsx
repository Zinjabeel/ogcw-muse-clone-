import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ARTICLES, getArticle, LIST_SLUGS, READING_LIST_SLUGS, type Article, type ReadingList, type SectionId } from "@/data/content";

// The stories every page shows, live from the Sanity studio (/admin). The
// root route loads them on the server (src/routes/__root.tsx) and hands
// them down here; components read them with useStories(). When Sanity
// can't be reached, the stories written in the code stand in.

export type Stories = {
  /** Every story, newest first */
  all: Article[];
  /** A story by web address, or undefined if there is none */
  get: (slug: string) => Article | undefined;
  /** A story for a fixed spot on a page: the live one, else the one in the code, else the newest */
  pick: (slug: string) => Article;
  /** Stories in a section, newest first */
  inSection: (section: SectionId) => Article[];
  latest: Article[];
  trending: Article[];
  mostRead: Article[];
  editorsPicks: Article[];
  featured: Article[];
  readingLists: ReadingList[];
};

export function makeStories(all: Article[]): Stories {
  const bySlug = new Map(all.map((story) => [story.slug, story]));
  const get = (slug: string) => bySlug.get(slug);
  const pick = (slug: string) => bySlug.get(slug) ?? getArticle(slug) ?? all[0] ?? ARTICLES[0]!;
  const list = (slugs: string[]) => slugs.flatMap((slug) => bySlug.get(slug) ?? []);
  return {
    all,
    get,
    pick,
    inSection: (section) => all.filter((story) => story.section === section),
    latest: all.slice(0, 6),
    trending: list(LIST_SLUGS.trending),
    mostRead: list(LIST_SLUGS.mostRead),
    editorsPicks: list(LIST_SLUGS.editorsPicks),
    featured: list(LIST_SLUGS.featured),
    readingLists: READING_LIST_SLUGS.map((reading) => ({ ...reading, items: list(reading.items) })),
  };
}

const FALLBACK = makeStories(ARTICLES);
const StoriesContext = createContext<Stories>(FALLBACK);

export function StoriesProvider({ stories, children }: { stories: Article[]; children: ReactNode }) {
  const value = useMemo(() => (stories.length ? makeStories(stories) : FALLBACK), [stories]);
  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export const useStories = () => useContext(StoriesContext);
