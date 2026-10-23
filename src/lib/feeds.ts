import { ARTICLES, SECTIONS, type Article } from "@/data/content";
import { getStorySummaries } from "./sanity-stories";

// What search engines and feed readers get (from the site review, owner,
// 18 Oct 2026; nothing on the pages changes): a sitemap of every page and
// story, an RSS feed of the newest stories, and the article details Google
// reads on each story page. Addresses are built from the address the
// request came in on, so they are right on any domain the site runs on.

/** Every published story, newest first: the studio's, or the code's if Sanity can't be reached */
export async function allStories(): Promise<Article[]> {
  const live = await getStorySummaries().catch(() => null);
  return live?.stories.length ? live.stories : ARTICLES;
}

export const originOf = (request: Request) => new URL(request.url).origin;

const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const absolute = (origin: string, src: string) => (/^https?:\/\//.test(src) ? src : `${origin}${src.startsWith("/") ? "" : "/"}${src}`);
const day = (iso: string) => iso.slice(0, 10);

// The pages that are always there (the shop is admin-only for now, so it's left out)
const PAGES = ["/", "/news", "/music", "/games", "/streaming", "/culture", "/sports", "/originals", "/explore", "/trends", "/forum", "/about"];

export function sitemapXml(origin: string, stories: Article[]) {
  const newest = stories[0]?.updated ?? stories[0]?.date;
  const urls = [
    ...PAGES.map((path) => `<url><loc>${escapeXml(origin + path)}</loc>${path === "/" && newest ? `<lastmod>${day(newest)}</lastmod>` : ""}</url>`),
    ...stories.map((story) => `<url><loc>${escapeXml(`${origin}/news/${story.slug}`)}</loc><lastmod>${day(story.updated ?? story.date)}</lastmod></url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function rssXml(origin: string, stories: Article[]) {
  const items = stories.slice(0, 50).map((story) => {
    const link = `${origin}/news/${story.slug}`;
    return [
      "<item>",
      `<title>${escapeXml(story.title)}</title>`,
      `<link>${escapeXml(link)}</link>`,
      `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `<pubDate>${new Date(`${day(story.date)}T12:00:00Z`).toUTCString()}</pubDate>`,
      `<category>${escapeXml(SECTIONS[story.section]?.label ?? story.section)}</category>`,
      `<description>${escapeXml(story.deck)}</description>`,
      story.photo?.src ? `<media:content url="${escapeXml(absolute(origin, story.photo.src))}" medium="image" />` : "",
      "</item>",
    ].join("");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>OGCW: One Great Culture World</title>
<link>${escapeXml(origin)}/</link>
<atom:link href="${escapeXml(origin)}/rss.xml" rel="self" type="application/rss+xml" />
<description>Independent news and stories from the people shaping culture now.</description>
<language>en-gb</language>
${items.join("\n")}
</channel>
</rss>
`;
}

export function robotsTxt(origin: string) {
  return ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /work", "Disallow: /shop/checkout", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
}

/** The NewsArticle details Google reads on a story page (safe to put in a script tag) */
export function articleJsonLd(story: Article) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.deck,
    datePublished: day(story.date),
    dateModified: day(story.updated ?? story.date),
    articleSection: SECTIONS[story.section]?.label ?? story.section,
    ...(story.photo?.src && /^https?:\/\//.test(story.photo.src) ? { image: [story.photo.src] } : {}),
    author: { "@type": "Organization", name: "OGCW" },
    publisher: { "@type": "Organization", name: "OGCW, One Great Culture World" },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
