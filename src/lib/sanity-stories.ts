import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@sanity/client";
import { ARTICLES, SECTIONS, wordCount, type Article, type Block, type Photo, type SectionId } from "@/data/content";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";

// Stories from the Sanity studio (/admin), turned into the same shape as
// the stories in src/data/content.ts so every page shows them the same way.
// Published stories only, read from Sanity's CDN on the server. If Sanity
// can't be reached, the site carries on with the stories in the code.

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
  perspective: "published",
});

const STORY_FIELDS = `"slug": slug.current, section, kicker, title, deck, author, date, ask, photo, body, sources`;

type SanityImage = { asset?: { _ref?: string }; hotspot?: { x?: number; y?: number } };
type SanityPhoto = { image?: SanityImage; url?: string; alt?: string; credit?: string };
type SanitySpan = { _type: string; text?: string };
type SanityBlock = { _type: string; style?: string; listItem?: string; children?: SanitySpan[]; [key: string]: unknown };
type SanityStory = {
  slug?: string; section?: string; kicker?: string; title?: string; deck?: string; author?: string; date?: string; ask?: string;
  photo?: SanityPhoto; body?: SanityBlock[]; sources?: { name?: string; url?: string }[];
};

const SECTION_IDS: SectionId[] = ["music", "games", "streaming", "culture"];

// "image-abc123-1600x900-jpg" → the image on Sanity's CDN
function imageUrl(image: SanityImage | undefined, width: number) {
  const ref = image?.asset?._ref;
  const match = ref?.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!match) return undefined;
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${match[1]}-${match[2]}.${match[3]}?w=${width}&auto=format&fit=max`;
}

function toPhoto(photo: SanityPhoto | undefined, width = 1600): Photo | undefined {
  const src = imageUrl(photo?.image, width) ?? photo?.url;
  if (!src) return undefined;
  const hotspot = photo?.image?.hotspot;
  return {
    src,
    alt: photo?.alt ?? "",
    ...(photo?.credit ? { credit: photo.credit } : {}),
    ...(hotspot?.x !== undefined && hotspot.y !== undefined ? { crop: { pos: `${Math.round(hotspot.x * 100)}% ${Math.round(hotspot.y * 100)}%` } } : {}),
  };
}

const text = (block: SanityBlock) => (block.children ?? []).map((span) => span.text ?? "").join("").trim();

// Sanity's text blocks and OGCW blocks → the site's story blocks. Bullet
// points in a row become one list.
function toBlocks(body: SanityBlock[] = []): Block[] {
  const blocks: Block[] = [];
  for (const block of body) {
    switch (block._type) {
      case "block": {
        const value = text(block);
        if (!value) break;
        if (block.listItem) {
          const last = blocks[blocks.length - 1];
          if (last?.type === "list") last.items.push(value);
          else blocks.push({ type: "list", items: [value] });
        } else if (block.style === "h2") blocks.push({ type: "h2", text: value });
        else if (block.style === "blockquote") blocks.push({ type: "quote", text: value });
        else blocks.push({ type: "p", text: value });
        break;
      }
      case "storyImage": {
        const photo = toPhoto(block["photo"] as SanityPhoto, 1400);
        if (photo) blocks.push({ type: "image", photo, caption: String(block["caption"] ?? "") });
        break;
      }
      case "storyImagePair": {
        const first = toPhoto(block["first"] as SanityPhoto, 900);
        const second = toPhoto(block["second"] as SanityPhoto, 900);
        if (first && second) blocks.push({ type: "images", photos: [first, second], caption: String(block["caption"] ?? "") });
        break;
      }
      case "facts": {
        const items = ((block["items"] as { label?: string; value?: string }[] | undefined) ?? []).filter((item) => item.label && item.value).map((item): [string, string] => [item.label!, item.value!]);
        if (items.length) blocks.push({ type: "facts", title: String(block["title"] ?? "Key facts"), items });
        break;
      }
      case "checklist": {
        const items = ((block["items"] as string[] | undefined) ?? []).filter(Boolean);
        if (items.length) blocks.push({ type: "checklist", title: String(block["title"] ?? "What to prepare"), items });
        break;
      }
      case "faq": {
        const items = ((block["items"] as { question?: string; answer?: string }[] | undefined) ?? []).filter((item) => item.question && item.answer).map((item): [string, string] => [item.question!, item.answer!]);
        if (items.length) blocks.push({ type: "faq", items });
        break;
      }
      case "linkButton": {
        if (block["label"] && block["href"]) blocks.push({ type: "link", label: String(block["label"]), href: String(block["href"]) });
        break;
      }
    }
  }
  return blocks;
}

function toArticle(doc: SanityStory): Article | null {
  const section = SECTION_IDS.find((id) => id === doc.section);
  const photo = toPhoto(doc.photo);
  if (!doc.slug || !doc.title || !section || !photo) return null;
  const body = toBlocks(doc.body);
  return {
    slug: doc.slug,
    section,
    kicker: doc.kicker ?? SECTIONS[section].label,
    title: doc.title,
    deck: doc.deck ?? "",
    author: doc.author ?? "OGCW",
    date: doc.date ?? new Date().toISOString().slice(0, 10),
    read: `${Math.max(2, Math.round(wordCount(body) / 230))} min read`,
    photo,
    body,
    sources: (doc.sources ?? []).filter((source) => source.name && source.url).map((source) => ({ name: source.name!, url: source.url! })),
    ...(doc.ask ? { ask: doc.ask } : {}),
  };
}

/** Every published story in Sanity, newest first ([] if Sanity can't be reached) */
export const getSanityStories = createServerFn({ method: "GET" }).handler(async (): Promise<Article[]> => {
  try {
    const docs = await client.fetch<SanityStory[]>(`*[_type == "story" && defined(slug.current)] | order(date desc) { ${STORY_FIELDS} }`);
    return docs.map(toArticle).filter((story): story is Article => story !== null);
  } catch (error) {
    console.error("Sanity stories didn't load", error);
    return [];
  }
});

/** One published story from Sanity by its web address, or null */
export const getSanityStory = createServerFn({ method: "GET" })
  .validator((slug: unknown) => {
    if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug)) throw new Error("Not a story address");
    return slug;
  })
  .handler(async ({ data }): Promise<Article | null> => {
    try {
      const doc = await client.fetch<SanityStory | null>(`*[_type == "story" && slug.current == $slug][0] { ${STORY_FIELDS} }`, { slug: data });
      return doc ? toArticle(doc) : null;
    } catch (error) {
      console.error("Sanity story didn't load", error);
      return null;
    }
  });

/** The site's stories with Sanity's merged in (Sanity wins on a shared web address), newest first */
export function mergeStories(fromSanity: Article[]): Article[] {
  if (!fromSanity.length) return ARTICLES;
  const bySlug = new Map(ARTICLES.map((story) => [story.slug, story]));
  for (const story of fromSanity) bySlug.set(story.slug, story);
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}
