import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EPISODES, SECTIONS, type Article, type SectionId } from "@/data/content";
import { TREND_TOPICS } from "@/data/trends";
import { ROOMS } from "@/lib/forum";
import { useStories, type Stories } from "@/lib/stories";
import { T } from "./site-text";

// The site's menu panels, the same as the shop's (src/components/shop-mega-menu.tsx):
// point at a section in the header and a panel drops under it, full width:
// columns of links, one under the other, with up to two picture cards on the
// right (owner, 15 Oct 2026: fewer pictures, more professional). The page
// behind dims. Built from the live stories, so it's always the latest.

type Target = { to: string; params?: Record<string, string>; search?: Record<string, string> };
type MenuLink = Target & { label: string };
type Column = { title: string; links: MenuLink[] };
type Card = Target & { image: string; pos?: string | undefined; caption: string; white?: boolean };
type Panel = { columns: Column[]; cards: Card[] };

export type SiteMenuKey = SectionId | "news" | "originals" | "shop" | "trends" | "forum" | "about" | "more";

const story = (item: Article): Target => ({ to: "/news/$slug", params: { slug: item.slug } });
const storyLink = (item: Article): MenuLink => ({ ...story(item), label: item.title });
const storyCard = (item: Article): Card => ({ ...story(item), image: item.photo.src, pos: item.photo.crop?.pos, caption: item.title });
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
  // Gaming covers the games desk and the streamers
  const desks: SectionId[] = id === "games" ? ["games", "streaming"] : [id];
  const mine = stories.all.filter((item) => desks.includes(item.section));
  const pool = mine.length >= 12 ? mine : [...mine, ...stories.all.filter((item) => !desks.includes(item.section))];
  const cards = take(pool, 2);
  const latest = take(pool, 5);
  const read = take(stories.mostRead.filter((item) => desks.includes(item.section)).concat(mine), 4);
  const label = SECTIONS[id].label;
  const more: MenuLink[] = id === "games"
    ? [{ label: "All gaming news", to: "/games" }, { label: "Streaming", to: "/streaming" }, { label: "The games room in the forum", to: "/forum/$room", params: { room: "games" } }, { label: "The streaming room in the forum", to: "/forum/$room", params: { room: "streaming" } }]
    : [{ label: `All ${label.toLowerCase()} news`, to: `/${id}` }, { label: `The ${label.toLowerCase()} room in the forum`, to: "/forum/$room", params: { room: SECTION_ROOM[id] } }, { label: "Trends", to: "/trends" }, { label: "Explore", to: "/explore" }];
  return {
    columns: [
      { title: `Latest in ${label}`, links: latest.map(storyLink) },
      { title: "Most read", links: read.map(storyLink) },
      { title: "More", links: more },
    ],
    cards: cards.map(storyCard),
  };
}

function newsPanel(stories: Stories): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const cards = take(stories.editorsPicks.length ? stories.editorsPicks : stories.all, 2);
  const latest = take(stories.all, 5);
  const trending = take(stories.trending.length ? stories.trending : stories.all, 5);
  return {
    columns: [
      { title: "Latest", links: latest.map(storyLink) },
      { title: "Trending", links: trending.map(storyLink) },
      { title: "Sections", links: [...sectionLinks, { label: "All the news", to: "/news" }] },
    ],
    cards: cards.map(storyCard),
  };
}

// The shop (Brand deals): its own pictures, and a few of its pieces (it opens in a new tab)
const SHOP_PANEL: Panel = {
  columns: [
    { title: "Sneakers", links: [{ label: "Jordan", to: "/shop/all", search: { cat: "sneakers", brand: "jordan" } }, { label: "Nike", to: "/shop/all", search: { cat: "sneakers", brand: "nike" } }, { label: "New Balance", to: "/shop/all", search: { cat: "sneakers", brand: "new-balance" } }, { label: "Upcoming releases", to: "/shop/drops" }] },
    { title: "Shop by", links: [{ label: "Men", to: "/shop/men" }, { label: "Women", to: "/shop/women" }, { label: "Watches", to: "/shop/all", search: { kind: "Watches" } }, { label: "Brands A to Z", to: "/shop/brands" }] },
    { title: "Picks", links: [{ label: "Trendiest", to: "/shop/trendiest" }, { label: "Featured drops", to: "/shop/featured-drops" }, { label: "Latest", to: "/shop/latest" }, { label: "Check this out", to: "/shop/check-this-out" }] },
  ],
  cards: [
    { to: "/shop/men", image: "/shop/looks/fw-men.webp", caption: "Men: fall/winter" },
    { to: "/shop/women", image: "/shop/looks/fw-women.webp", caption: "Women: fall/winter" },
  ],
};

function originalsPanel(): Panel {
  const rest = EPISODES;
  const series = [...new Set(EPISODES.map((episode) => `${episode.series} · ${episode.channel}`))].slice(0, 5);
  const episode = (item: (typeof EPISODES)[number]): Target => ({ to: "/originals/$slug", params: { slug: item.slug } });
  return {
    columns: [
      { title: "New episodes", links: rest.slice(2, 7).map((item) => ({ ...episode(item), label: item.title })) },
      { title: "The series", links: [...series.map((label) => ({ label, to: "/originals" })), { label: "Every episode", to: "/originals" }] },
    ],
    cards: rest.slice(0, 2).map((item) => ({ ...episode(item), image: item.still.src, pos: item.still.crop?.pos, caption: item.title })),
  };
}

function trendsPanel(stories: Stories): Panel {
  const topics = TREND_TOPICS.map((topic) => ({ topic, item: stories.get(topic.slug) })).filter((row): row is { topic: (typeof TREND_TOPICS)[number]; item: Article } => !!row.item);
  const rest = topics;
  return {
    columns: [
      { title: "This season’s trends", links: [...topics.slice(0, 6).map(({ topic }) => ({ label: topic.title, to: "/trends" })), { label: "All the trends", to: "/trends" }] },
      { title: "The stories behind them", links: rest.slice(2, 7).map(({ item }) => storyLink(item)) },
    ],
    cards: rest.slice(0, 2).map(({ topic, item }) => ({ ...storyCard(item), caption: topic.title })),
  };
}

function forumPanel(stories: Stories): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const half = Math.ceil(ROOMS.length / 2);
  const room = (item: (typeof ROOMS)[number]): MenuLink => ({ label: item.name, to: "/forum/$room", params: { room: item.id } });
  return {
    columns: [
      { title: "Rooms", links: ROOMS.slice(0, half).map(room) },
      { title: "More rooms", links: [...ROOMS.slice(half).map(room), { label: "The forum’s front page", to: "/forum" }] },
    ],
    cards: take(stories.trending.length ? stories.trending : stories.all, 2).map(storyCard),
  };
}

function aboutPanel(stories: Stories, more: boolean): Panel {
  const used = new Set<string>();
  const take = takeFrom(used);
  const info = (label: string, slug: string): MenuLink => ({ label, to: "/info/$slug", params: { slug } });
  return {
    columns: more
      ? [
          { title: "Discover", links: [{ label: "The trend report", to: "/trends" }, { label: "Explore", to: "/explore" }, { label: "Streaming", to: "/streaming" }, { label: "BTS on tour", to: "/tour/bts-arirang" }] },
          { title: "OGCW", links: [{ label: "About", to: "/about" }, { label: "Work with OGCW", to: "/work" }, info("Press", "press"), info("FAQ", "faq"), info("Help", "help")] },
        ]
      : [
          { title: "OGCW", links: [{ label: "About OGCW", to: "/about" }, { label: "Work with OGCW", to: "/work" }, info("Press", "press"), info("Brand", "brand")] },
          { title: "Help", links: [info("FAQ", "faq"), info("Help", "help"), { label: "Explore", to: "/explore" }] },
        ],
    cards: take(stories.trending.length ? stories.trending : stories.all, 2).map(storyCard),
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
    </div>
  );
}
