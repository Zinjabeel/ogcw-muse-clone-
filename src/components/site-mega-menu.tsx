import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { EPISODES, SECTIONS, type Article, type SectionId } from "@/data/content";
import { TREND_TOPICS } from "@/data/trends";
import { ROOMS } from "@/lib/forum";
import { useStories, type Stories } from "@/lib/stories";
import { T } from "./site-text";

// The site's menu panels, the same as the shop's (src/components/shop-mega-menu.tsx):
// point at a section in the header and a panel drops under it, full width:
// a tall picture on the left, columns of links in the middle, two picture
// cards on the right, and a strip of stories under it all. The page behind
// dims. Built from the live stories, so it's always the latest.

type Target = { to: string; params?: Record<string, string>; search?: Record<string, string> };
type MenuLink = Target & { label: string };
type Column = { title: string; links: MenuLink[] };
type Card = Target & { image: string; pos?: string | undefined; caption: string; white?: boolean };
type Strip = Target & { key: string; image: string; pos?: string | undefined; title: string; meta?: string; white?: boolean };
type Panel = { side: Card; columns: Column[]; cards: Card[]; strip: Strip[]; stripLink: MenuLink };

export type SiteMenuKey = SectionId | "news" | "originals" | "shop" | "trends" | "forum" | "about" | "more";

const story = (item: Article): Target => ({ to: "/news/$slug", params: { slug: item.slug } });
const storyLink = (item: Article): MenuLink => ({ ...story(item), label: item.title });
const storyCard = (item: Article): Card => ({ ...story(item), image: item.photo.src, pos: item.photo.crop?.pos, caption: item.title });
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
const storyStrip = (item: Article): Strip => ({ ...story(item), key: item.slug, image: item.photo.src, pos: item.photo.crop?.pos, title: item.title, meta: `${SECTIONS[item.section].label} · ${shortDate(item.date)}` });
/** The first stories not used yet in this panel */
const takeFrom = (used: Set<string>) => (list: Article[], n: number) => {
  const out: Article[] = [];
  for (const item of list) { if (out.length >= n) break; if (!used.has(item.slug)) { used.add(item.slug); out.push(item); } }
  return out;
};
const SECTION_ROOM: Record<SectionId, string> = { music: "rap", games: "games", streaming: "streaming", culture: "fashion", sports: "sports" };
const sectionLinks: MenuLink[] = (Object.keys(SECTIONS) as SectionId[]).map((id) => ({ label: SECTIONS[id].label, to: `/${id}` }));

function sectionPanel(stories: Stories, id: SectionId): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const mine = stories.inSection(id);
  const pool = mine.length >= 12 ? mine : [...mine, ...stories.all.filter((item) => item.section !== id)];
  const [lead] = take(pool, 1);
  const cards = take(pool, 2);
  const latest = take(pool, 5);
  const read = take(stories.mostRead.filter((item) => item.section === id).concat(mine), 4);
  const strip = take(pool, 7);
  const label = SECTIONS[id].label;
  return {
    side: lead ? { ...storyCard(lead), caption: `${label}: the lead story` } : { to: `/${id}`, image: "", caption: label },
    columns: [
      { title: `Latest in ${label}`, links: latest.map(storyLink) },
      { title: "Most read", links: read.map(storyLink) },
      { title: "More", links: [{ label: `All ${label.toLowerCase()} news`, to: `/${id}` }, { label: `The ${label.toLowerCase()} room in the forum`, to: "/forum/$room", params: { room: SECTION_ROOM[id] } }, { label: "Trends", to: "/trends" }, { label: "Explore", to: "/explore" }] },
    ],
    cards: cards.map(storyCard),
    strip: strip.map(storyStrip),
    stripLink: { label: `Every ${label.toLowerCase()} story`, to: `/${id}` },
  };
}

function newsPanel(stories: Stories): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const [lead] = take(stories.all, 1);
  const cards = take(stories.editorsPicks.length ? stories.editorsPicks : stories.all, 2);
  const latest = take(stories.all, 5);
  const trending = take(stories.trending.length ? stories.trending : stories.all, 5);
  return {
    side: lead ? { ...storyCard(lead), caption: "The latest story" } : { to: "/news", image: "", caption: "News" },
    columns: [
      { title: "Latest", links: latest.map(storyLink) },
      { title: "Trending", links: trending.map(storyLink) },
      { title: "Sections", links: [...sectionLinks, { label: "All the news", to: "/news" }] },
    ],
    cards: cards.map(storyCard),
    strip: take(stories.all, 7).map(storyStrip),
    stripLink: { label: "All the news", to: "/news" },
  };
}

// The shop (Brand deals): its own pictures, and a few of its pieces (it opens in a new tab)
const SHOP_PIECES: Strip[] = [
  { key: "aj1", to: "/shop/p/$id", params: { id: "aj1-royal-2026" }, image: "/shop/products/aj1-royal-2026-1.jpg", title: "Air Jordan 1 Retro High OG ‘Royal’ 2026", white: true },
  { key: "af1", to: "/shop/p/$id", params: { id: "travis-scott-af1-ice-blue" }, image: "/shop/products/travis-scott-af1-ice-blue-1.jpg", title: "Travis Scott x Nike Air Force 1 ‘Ice Blue’", white: true },
  { key: "pnk", to: "/shop/p/$id", params: { id: "sp5der-pnk-hoodie" }, image: "/shop/picks/sp5der-pnk-hoodie-front.jpg", title: "Sp5der P*nk Hoodie", white: true },
  { key: "rolex", to: "/shop/p/$id", params: { id: "rolex-land-dweller-36" }, image: "/shop/products/rolex-land-dweller-36-1.jpg", title: "Rolex Land-Dweller 36", white: true },
  { key: "rodeo", to: "/shop/p/$id", params: { id: "days-before-rodeo-hoodie" }, image: "/shop/picks/days-before-rodeo-hoodie-front.jpg", title: "Days Before Rodeo Hoodie", white: true },
  { key: "jeans", to: "/shop/p/$id", params: { id: "levis-denim-tears-logo-japan-jeans" }, image: "/shop/products/levis-denim-tears-logo-japan-jeans-1.jpg", title: "Levi’s x Denim Tears jeans", white: true },
  { key: "9060", to: "/shop/p/$id", params: { id: "nb-9060-black-cat" }, image: "/shop/products/nb-9060-black-cat-1.jpg", title: "New Balance 9060 ‘Black Cat’", white: true },
];
const SHOP_PANEL: Panel = {
  side: { to: "/shop", image: "/shop/looks/hero-store.webp", caption: "The whole shop" },
  columns: [
    { title: "Sneakers", links: [{ label: "Jordan", to: "/shop/all", search: { cat: "sneakers", brand: "jordan" } }, { label: "Nike", to: "/shop/all", search: { cat: "sneakers", brand: "nike" } }, { label: "New Balance", to: "/shop/all", search: { cat: "sneakers", brand: "new-balance" } }, { label: "Upcoming releases", to: "/shop/drops" }] },
    { title: "Shop by", links: [{ label: "Men", to: "/shop/men" }, { label: "Women", to: "/shop/women" }, { label: "Watches", to: "/shop/all", search: { kind: "Watches" } }, { label: "Brands A to Z", to: "/shop/brands" }] },
    { title: "Picks", links: [{ label: "Trendiest", to: "/shop/trendiest" }, { label: "Featured drops", to: "/shop/featured-drops" }, { label: "Latest", to: "/shop/latest" }, { label: "Check this out", to: "/shop/check-this-out" }] },
  ],
  cards: [
    { to: "/shop/men", image: "/shop/looks/fw-men.webp", caption: "Men: fall/winter" },
    { to: "/shop/women", image: "/shop/looks/fw-women.webp", caption: "Women: fall/winter" },
  ],
  strip: SHOP_PIECES,
  stripLink: { label: "Into the shop", to: "/shop" },
};

function originalsPanel(): Panel {
  const [lead, ...rest] = EPISODES;
  const series = [...new Set(EPISODES.map((episode) => `${episode.series} · ${episode.channel}`))].slice(0, 5);
  const episode = (item: (typeof EPISODES)[number]): Target => ({ to: "/originals/$slug", params: { slug: item.slug } });
  return {
    side: lead ? { ...episode(lead), image: lead.still.src, pos: lead.still.crop?.pos, caption: "The newest episode" } : { to: "/originals", image: "", caption: "Originals" },
    columns: [
      { title: "New episodes", links: rest.slice(2, 7).map((item) => ({ ...episode(item), label: item.title })) },
      { title: "The series", links: [...series.map((label) => ({ label, to: "/originals" })), { label: "Every episode", to: "/originals" }] },
    ],
    cards: rest.slice(0, 2).map((item) => ({ ...episode(item), image: item.still.src, pos: item.still.crop?.pos, caption: item.title })),
    strip: rest.slice(7, 14).map((item) => ({ ...episode(item), key: item.slug, image: item.still.src, pos: item.still.crop?.pos, title: item.title, meta: `${item.kind} · ${item.length}` })),
    stripLink: { label: "All the Originals", to: "/originals" },
  };
}

function trendsPanel(stories: Stories): Panel {
  const topics = TREND_TOPICS.map((topic) => ({ topic, item: stories.get(topic.slug) })).filter((row): row is { topic: (typeof TREND_TOPICS)[number]; item: Article } => !!row.item);
  const [lead, ...rest] = topics;
  return {
    side: lead ? { ...storyCard(lead.item), caption: lead.topic.title } : { to: "/trends", image: "", caption: "Trends" },
    columns: [
      { title: "This season’s trends", links: [...topics.slice(0, 6).map(({ topic }) => ({ label: topic.title, to: "/trends" })), { label: "All the trends", to: "/trends" }] },
      { title: "The stories behind them", links: rest.slice(2, 7).map(({ item }) => storyLink(item)) },
    ],
    cards: rest.slice(0, 2).map(({ topic, item }) => ({ ...storyCard(item), caption: topic.title })),
    strip: [...stories.trending, ...stories.all.filter((item) => !stories.trending.includes(item))].slice(0, 7).map(storyStrip),
    stripLink: { label: "Trends", to: "/trends" },
  };
}

function forumPanel(stories: Stories): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const [lead] = take(stories.mostRead.length ? stories.mostRead : stories.all, 1);
  const half = Math.ceil(ROOMS.length / 2);
  const room = (item: (typeof ROOMS)[number]): MenuLink => ({ label: item.name, to: "/forum/$room", params: { room: item.id } });
  return {
    side: lead ? { ...storyCard(lead), caption: "Talk about it in the forum" } : { to: "/forum", image: "", caption: "The forum" },
    columns: [
      { title: "Rooms", links: ROOMS.slice(0, half).map(room) },
      { title: "More rooms", links: [...ROOMS.slice(half).map(room), { label: "The forum’s front page", to: "/forum" }] },
    ],
    cards: take(stories.trending.length ? stories.trending : stories.all, 2).map(storyCard),
    strip: take(stories.all, 7).map(storyStrip),
    stripLink: { label: "Open the forum", to: "/forum" },
  };
}

function aboutPanel(stories: Stories, more: boolean): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const [lead] = take(stories.editorsPicks.length ? stories.editorsPicks : stories.all, 1);
  const info = (label: string, slug: string): MenuLink => ({ label, to: "/info/$slug", params: { slug } });
  return {
    side: lead ? { ...storyCard(lead), caption: more ? "Explore OGCW" : "One Great Culture World" } : { to: "/about", image: "", caption: "About" },
    columns: more
      ? [
          { title: "More of OGCW", links: [{ label: "Originals", to: "/originals" }, { label: "Brand deals", to: "/shop" }, { label: "Trends", to: "/trends" }, { label: "Forum", to: "/forum" }, { label: "About", to: "/about" }] },
          { title: "Explore and help", links: [{ label: "Explore", to: "/explore" }, info("Press", "press"), info("Brand", "brand"), info("FAQ", "faq"), info("Help", "help")] },
        ]
      : [
          { title: "OGCW", links: [{ label: "About OGCW", to: "/about" }, { label: "Work with OGCW", to: "/work" }, info("Press", "press"), info("Brand", "brand")] },
          { title: "Help", links: [info("FAQ", "faq"), info("Help", "help"), { label: "Explore", to: "/explore" }] },
        ],
    cards: take(stories.trending.length ? stories.trending : stories.all, 2).map(storyCard),
    strip: take([...stories.mostRead, ...stories.all], 7).map(storyStrip),
    stripLink: { label: "Explore", to: "/explore" },
  };
}

function panelFor(key: SiteMenuKey, stories: Stories): Panel | null {
  if (key === "news") return newsPanel(stories);
  if (key in SECTIONS) return sectionPanel(stories, key as SectionId);
  if (key === "shop") return SHOP_PANEL;
  if (key === "originals") return originalsPanel();
  if (key === "trends") return trendsPanel(stories);
  if (key === "forum") return forumPanel(stories);
  if (key === "about") return aboutPanel(stories, false);
  if (key === "more") return aboutPanel(stories, true);
  return null;
}

export function SiteMegaPanel({ section, onClose }: { section: SiteMenuKey; onClose: () => void }) {
  const stories = useStories();
  const panel = panelFor(section, stories);
  if (!panel) return null;
  const go = (target: Target, children: ReactNode, className: string) => (
    <Link to={target.to as "/"} params={target.params as never} search={target.search as never} className={className} onClick={onClose}>{children}</Link>
  );
  return (
    <div className="mm-panel smm" role="region" aria-label="Menu">
      <div className="mm-inner">
        {panel.side.image && (
          <figure className="mm-side">
            {go(panel.side, (
              <>
                <span className="mm-side-photo"><img src={panel.side.image} alt="" loading="lazy" style={{ objectPosition: panel.side.pos }} /></span>
                <figcaption><span className="smm-clamp">{panel.side.caption}</span> <ArrowRight size={13} aria-hidden="true" /></figcaption>
              </>
            ), "mm-side-link")}
          </figure>
        )}
        <div className="mm-cols" style={{ gridTemplateColumns: `repeat(${panel.columns.length}, minmax(0, 1fr))` }}>
          {panel.columns.map((column) => (
            <div key={column.title} className="mm-col">
              <p className="mm-col-title">{column.title}</p>
              <ul>
                {column.links.map((link) => <li key={`${link.label}-${link.to}`}>{go(link, <span className="smm-clamp">{link.label}</span>, "mm-link")}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {panel.cards.length > 0 && (
          <div className="mm-cards" data-n={panel.cards.length}>
            {panel.cards.map((card) => (
              <figure key={card.image + card.caption} className="mm-card">
                {go(card, (
                  <>
                    <span className="mm-card-photo" data-white={card.white || undefined}><img src={card.image} alt="" loading="lazy" style={{ objectPosition: card.pos }} /></span>
                    <figcaption><span className="smm-clamp">{card.caption}</span></figcaption>
                  </>
                ), "mm-card-link")}
              </figure>
            ))}
          </div>
        )}
      </div>
      {panel.strip.length > 0 && (
        <div className="mm-strip">
          <ul className="mm-strip-list">
            {panel.strip.map((item) => (
              <li key={item.key}>
                {go(item, (
                  <>
                    <span className={`mm-strip-photo${item.white ? "" : " is-cover"}`} data-white={item.white || undefined}><img src={item.image} alt="" loading="lazy" style={{ objectPosition: item.pos }} /></span>
                    <span className="mm-strip-name">{item.title}</span>
                    {item.meta && <span className="mm-strip-price">{item.meta}</span>}
                  </>
                ), "mm-strip-item")}
              </li>
            ))}
          </ul>
          {go(panel.stripLink, <><T k={`menu.strip.${section}`}>{panel.stripLink.label}</T> <ArrowRight size={13} aria-hidden="true" /></>, "mm-strip-all")}
        </div>
      )}
    </div>
  );
}
