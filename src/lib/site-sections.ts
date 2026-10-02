// The parts of the site an admin's edits are filed under in the studio
// ("Site edits" → Hero, OGCW News, Explore…). Each part of a page says which
// it is with <EditSection name="…"> (src/components/site-text.tsx); anything
// outside one is filed under its page.

export const SITE_SECTIONS = [
  // On every page
  "Navigation bar",
  "Menu",
  "Footer",
  "Cookie panel",
  "Search",
  // The home page, top to bottom
  "Hero",
  "OGCW News",
  "Upcoming events",
  "This week",
  "Content of the month",
  "Shop on the home page",
  "Explore",
  "Keep exploring",
  "Rap desk",
  "More to explore",
  "About & newsletter",
  // The other pages
  "News page",
  "Section pages",
  "Explore page",
  "Shop pages",
  "Originals",
  "Blog",
  "Trends",
  "About page",
  "Tour page",
  "Article pages",
  "Error page",
  "Other",
] as const;

export type SiteSection = (typeof SITE_SECTIONS)[number];

/** The page a text sits on, for one that isn't inside a named part */
export function pageSection(pathname: string): SiteSection {
  const first = pathname.split("/")[1] ?? "";
  if (first === "") return "Other";
  if (first === "news") return pathname.split("/")[2] ? "Article pages" : "News page";
  if (["music", "games", "streaming", "culture"].includes(first)) return "Section pages";
  const pages: Record<string, SiteSection> = { explore: "Explore page", shop: "Shop pages", originals: "Originals", blog: "Blog", trends: "Trends", about: "About page", tour: "Tour page" };
  return pages[first] ?? "Other";
}

/** Older edits (saved before edits were filed by part): their part, from their name */
export function sectionOfKey(key: string): SiteSection {
  const prefix = key.split(".")[0] ?? "";
  const known: Record<string, SiteSection> = {
    nav: "Navigation bar", more: "Navigation bar", ix: "Menu", footer: "Footer", hero: "Hero",
    home: "OGCW News", events: "Upcoming events", cotm: "Content of the month", "shop-promo": "Shop on the home page",
    explore: "Explore", kx: "Keep exploring", connect: "About & newsletter", "404": "Error page", story: "Article pages",
    section: "Section pages", originals: "Originals", blog: "Blog", trends: "Trends", about: "About page", shop: "Shop pages", news: "News page",
  };
  if (key.startsWith("home.week")) return "This week";
  return known[prefix] ?? "Other";
}
