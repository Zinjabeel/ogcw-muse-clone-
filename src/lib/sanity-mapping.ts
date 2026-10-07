import { ARTICLES, SECTIONS, wordCount, type Article, type Block, type Photo, type SectionId } from "@/data/content";
import { SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";

// Sanity's stories → the site's stories (src/data/content.ts), so every page
// shows them the same way. Used by the site (src/lib/sanity-stories.ts) and
// by the page editor in the studio (src/sanity/page-editor.tsx).

export type SanityImage = { asset?: { _ref?: string }; hotspot?: { x?: number; y?: number } };
export type SanityPhoto = { image?: SanityImage; url?: string; alt?: string; credit?: string; position?: string; zoom?: number };
export type SanitySpan = { _type: string; text?: string };
export type SanityBlock = { _type: string; style?: string; listItem?: string; children?: SanitySpan[]; [key: string]: unknown };
export type SanityStory = {
  slug?: string; section?: string; kicker?: string; title?: string; deck?: string; credit?: string; date?: string; updated?: string; certified?: boolean; ask?: string;
  photo?: SanityPhoto; body?: SanityBlock[]; sources?: { name?: string; url?: string }[];
};

export const SECTION_IDS: SectionId[] = ["music", "games", "streaming", "culture", "sports"];

// "image-abc123-1600x900-jpg" → the image on Sanity's CDN
export function imageUrl(image: SanityImage | undefined, width: number) {
  const ref = image?.asset?._ref;
  const match = ref?.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!match) return undefined;
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${match[1]}-${match[2]}.${match[3]}?w=${width}&auto=format&fit=max`;
}

export function toPhoto(photo: SanityPhoto | undefined, width = 1600): Photo | undefined {
  const src = imageUrl(photo?.image, width) ?? photo?.url;
  if (!src) return undefined;
  // The focus point: the one typed in, else the hotspot of an uploaded photo
  const hotspot = photo?.image?.hotspot;
  const pos = photo?.position && /^\d{1,3}% \d{1,3}%$/.test(photo.position)
    ? photo.position
    : hotspot?.x !== undefined && hotspot.y !== undefined ? `${Math.round(hotspot.x * 100)}% ${Math.round(hotspot.y * 100)}%` : undefined;
  const zoom = typeof photo?.zoom === "number" && photo.zoom > 1 ? photo.zoom : undefined;
  return {
    src,
    alt: photo?.alt ?? "",
    ...(photo?.credit ? { credit: photo.credit } : {}),
    ...(pos ? { crop: zoom ? { pos, zoom } : { pos } } : {}),
  };
}

const text = (block: SanityBlock) => (block.children ?? []).map((span) => span.text ?? "").join("").trim();

// Sanity's text blocks and OGCW blocks → the site's story blocks. Bullet
// points in a row become one list.
export function toBlocks(body: SanityBlock[] = []): Block[] {
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
        const size = (["wide", "full", "side"] as const).find((value) => value === block["size"]);
        const photo = toPhoto(block["photo"] as SanityPhoto, size === "side" ? 900 : size ? 2000 : 1400);
        if (photo) blocks.push({ type: "image", photo, caption: String(block["caption"] ?? ""), ...(size ? { size } : {}) });
        break;
      }
      case "questions":
      case "summary": {
        const items = ((block["items"] as string[] | undefined) ?? []).filter(Boolean);
        const title = String(block["title"] ?? (block._type === "questions" ? "What this story answers" : "The short version"));
        if (items.length) blocks.push({ type: block._type, title, items });
        break;
      }
      case "timeline": {
        const items = ((block["items"] as { when?: string; what?: string }[] | undefined) ?? []).filter((item) => item.when && item.what).map((item): [string, string] => [item.when!, item.what!]);
        if (items.length) blocks.push({ type: "timeline", title: String(block["title"] ?? "How it happened"), items });
        break;
      }
      case "related": {
        // The query turns the linked stories into their web addresses (src/lib/sanity-stories.ts)
        const slugs = ((block["slugs"] as (string | null)[] | undefined) ?? []).filter((slug): slug is string => !!slug);
        if (slugs.length) blocks.push({ type: "related", title: String(block["title"] ?? "Don’t forget to check out these"), slugs });
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

export function toArticle(doc: SanityStory): Article | null {
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
    credit: doc.credit?.trim() || "OGCW",
    date: doc.date ?? new Date().toISOString().slice(0, 10),
    ...(doc.updated && doc.updated > (doc.date ?? "") ? { updated: doc.updated } : {}),
    ...(doc.certified ? { certified: true } : {}),
    words: wordCount(body),
    photo,
    body,
    sources: (doc.sources ?? []).filter((source) => source.name && source.url).map((source) => ({ name: source.name!, url: source.url! })),
    ...(doc.ask ? { ask: doc.ask } : {}),
  };
}

// Newest first; on the same date, the order the stories have in the code, new ones first
const CODE_ORDER = new Map(ARTICLES.map((story, index) => [story.slug, index]));
export const byDate = (a: { slug: string; date: string }, b: { slug: string; date: string }) =>
  b.date.localeCompare(a.date) || (CODE_ORDER.get(a.slug) ?? -1) - (CODE_ORDER.get(b.slug) ?? -1);
