import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@sanity/client";
import { type Article } from "@/data/content";
import { EMPTY_LAYOUT, isSlotId, type FrontLayout } from "@/data/placements";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { byDate, toArticle, type SanityStory } from "./sanity-mapping";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";
import { EMPTY_SITE, type SiteContent } from "./site-text";

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

// Links to other stories come back as their web addresses
const STORY_FIELDS = `"slug": slug.current, section, kicker, title, deck, credit, date, updated, certified, ask, photo, sources,
  "body": body[] { ..., _type == "related" => { "slugs": stories[]->slug.current } }`;

// The site keeps the list for a few seconds so busy pages don't ask Sanity
// on every request; an edit in the studio shows up within that time.
const LIST_TTL_MS = 10_000;
export type Rating = { average: number; count: number };
export type SiteStories = { stories: Article[]; layout: FrontLayout; ratings: Record<string, Rating>; site: SiteContent };

type SiteItem = { key?: string; kind?: string; value?: string; section?: string; usual?: string; alt?: string; src?: string | null; assetId?: string | null };
// Each edit is its own "Site edit" document; edits saved before that are
// still in the old single "Site texts" document until the next save moves them
type SiteDoc = { edits?: SiteItem[] | null; legacy?: { texts?: SiteItem[] | null; images?: SiteItem[] | null } | null } | null;
const toSite = (doc: SiteDoc): SiteContent => {
  const site: SiteContent = { texts: {}, images: {}, meta: {} };
  const add = (item: SiteItem, kind: string | undefined, legacy: boolean) => {
    if (!item.key) return;
    if (kind === "image") {
      if (!item.src) return;
      site.images[item.key] = { src: item.src, ...(item.alt ? { alt: item.alt } : {}), ...(item.assetId ? { assetId: item.assetId } : {}) };
    } else {
      if (typeof item.value !== "string" || !item.value.trim()) return;
      site.texts[item.key] = item.value;
    }
    site.meta[item.key] = { ...(item.section ? { section: item.section } : {}), ...(item.usual ? { usual: item.usual } : {}), ...(legacy ? { legacy: true } : {}) };
  };
  for (const item of doc?.legacy?.texts ?? []) add(item, "text", true);
  for (const item of doc?.legacy?.images ?? []) add(item, "image", true);
  for (const item of doc?.edits ?? []) add(item, item.kind, false);
  return site;
};

/** Forget the cached copy, so a change saved a moment ago shows on the next load */
export const refreshSiteCache = createServerFn({ method: "POST" }).handler(async () => {
  cached = null;
  return true;
});

// Readers' star ratings, per story (Supabase, src/lib/ratings.ts); none if they can't be reached
async function ratingTotals(): Promise<Record<string, Rating>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/story_rating_totals`, {
      method: "POST",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) return {};
    const rows = (await response.json()) as { slug: string; average: number | string; ratings: number | string }[];
    return Object.fromEntries(rows.map((row) => [row.slug, { average: Number(row.average), count: Number(row.ratings) }]));
  } catch {
    return {};
  }
}
let cached: { at: number; data: SiteStories } | null = null;

type LayoutDoc = { slots?: { id?: string; slugs?: (string | null)[] }[]; hidden?: (string | null)[] } | null;
const toLayout = (doc: LayoutDoc): FrontLayout => ({
  slots: Object.fromEntries((doc?.slots ?? []).flatMap((slot) => (slot.id && isSlotId(slot.id) ? [[slot.id, (slot.slugs ?? []).filter((slug): slug is string => !!slug)]] : []))),
  hidden: (doc?.hidden ?? []).filter((slug): slug is string => !!slug),
});

/**
 * Every published story in Sanity, newest first, without the full text (pages
 * only need the headline, photo and so on; a story page loads its own text),
 * and the front page: which stories the studio put in which spot
 * (src/data/placements.ts). No stories if Sanity can't be reached, so the
 * site falls back to the stories in the code.
 */
export const getStorySummaries = createServerFn({ method: "GET" }).handler(async (): Promise<SiteStories> => {
  if (cached && Date.now() - cached.at < LIST_TTL_MS) return cached.data;
  try {
    const ratings = ratingTotals();
    const { docs, front, site } = await client.fetch<{ docs: SanityStory[]; front: LayoutDoc; site: SiteDoc }>(`{
      "site": {
        "edits": *[_type == "siteEdit" && !(_id in path("drafts.**"))] { key, kind, value, section, usual, alt, "assetId": image.asset._ref, "src": coalesce(image.asset->url + "?auto=format&w=2000", url) },
        "legacy": *[_id == "siteContent"][0] { "texts": texts[] { key, value }, "images": images[] { key, alt, "assetId": image.asset._ref, "src": coalesce(image.asset->url + "?auto=format&w=2000", url) } }
      },
      "docs": *[_type == "story" && defined(slug.current)] { ${STORY_FIELDS} },
      "front": *[_id == "frontPage"][0] { "slots": slots[] { "id": slot, "slugs": stories[]->slug.current }, "hidden": hidden[]->slug.current }
    }`);
    const stories = docs
      .map(toArticle)
      .filter((story): story is Article => story !== null)
      .sort(byDate)
      .map((story) => ({ ...story, body: [] }));
    cached = { at: Date.now(), data: { stories, layout: toLayout(front), ratings: await ratings, site: toSite(site) } };
    return cached.data;
  } catch (error) {
    console.error("Sanity stories didn't load", error);
    return cached?.data ?? { stories: [], layout: EMPTY_LAYOUT, ratings: await ratingTotals(), site: EMPTY_SITE };
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
