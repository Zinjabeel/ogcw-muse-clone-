import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@sanity/client";
import { ARTICLES, type Article } from "@/data/content";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { toArticle, type SanityStory } from "./sanity-mapping";

// Stories from the Sanity studio (/admin), turned into the same shape as
// the stories in src/data/content.ts so every page shows them the same way.
// Published stories only, read on the server straight from Sanity's API
// (not its cache), so a publish in the studio is on the site at once. If
// Sanity can't be reached, the site carries on with the stories in the code.

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: false,
  perspective: "published",
});

const STORY_FIELDS = `"slug": slug.current, section, kicker, title, deck, author, date, ask, photo, body, sources`;

// The site keeps the list for a few seconds so busy pages don't ask Sanity
// on every request; an edit in the studio shows up within that time.
const LIST_TTL_MS = 10_000;
let cached: { at: number; stories: Article[] } | null = null;

// Same date: keep the order the stories have in the code, new ones first
const CODE_ORDER = new Map(ARTICLES.map((story, index) => [story.slug, index]));
const byDate = (a: Article, b: Article) => b.date.localeCompare(a.date) || (CODE_ORDER.get(a.slug) ?? -1) - (CODE_ORDER.get(b.slug) ?? -1);

/**
 * Every published story in Sanity, newest first, without the full text (pages
 * only need the headline, photo and so on; a story page loads its own text).
 * [] if Sanity can't be reached, so the site falls back to the stories in the code.
 */
export const getStorySummaries = createServerFn({ method: "GET" }).handler(async (): Promise<Article[]> => {
  if (cached && Date.now() - cached.at < LIST_TTL_MS) return cached.stories;
  try {
    const docs = await client.fetch<SanityStory[]>(`*[_type == "story" && defined(slug.current)] { ${STORY_FIELDS} }`);
    const stories = docs
      .map(toArticle)
      .filter((story): story is Article => story !== null)
      .sort(byDate)
      .map((story) => ({ ...story, body: [] }));
    cached = { at: Date.now(), stories };
    return stories;
  } catch (error) {
    console.error("Sanity stories didn't load", error);
    return cached?.stories ?? [];
  }
});

/**
 * One published story from Sanity by its web address. `reachable: false`
 * means Sanity couldn't be asked (fall back to the code); reachable with no
 * story means it doesn't exist (or was removed in the studio).
 */
export const getSanityStory = createServerFn({ method: "GET" })
  .validator((slug: unknown) => {
    if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug)) throw new Error("Not a story address");
    return slug;
  })
  .handler(async ({ data }): Promise<{ reachable: boolean; story: Article | null }> => {
    try {
      const doc = await client.fetch<SanityStory | null>(`*[_type == "story" && slug.current == $slug][0] { ${STORY_FIELDS} }`, { slug: data });
      return { reachable: true, story: doc ? toArticle(doc) : null };
    } catch (error) {
      console.error("Sanity story didn't load", error);
      return { reachable: false, story: null };
    }
  });
