import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { BsPhoto, ReadTime, shortDate } from "../components/broadsheet";
import { SECTION_IDS, SECTIONS, type Article, type SectionId } from "../data/content";
import { useStories } from "../lib/stories";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News — OGCW" },
      { name: "description", content: "Every story from One Great Culture World: music, games, streaming and culture, newest first." },
      { property: "og:title", content: "News — OGCW" },
      { property: "og:description", content: "Every story from One Great Culture World, newest first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: News,
});

// The News page in the broadsheet look of the OGCW News front on the home
// page: the same masthead and section bar, then every story, newest first,
// as the same cards in one ruled grid (four across on wide screens, split
// by hairlines). The section bar filters the grid.

type Filter = "all" | SectionId;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All stories" },
  ...SECTION_IDS.map((id) => ({ id, label: SECTIONS[id].label })),
];
const countFor = (all: Article[], filter: Filter) => (filter === "all" ? all.length : all.filter((a) => a.section === filter).length);

function News() {
  const { all } = useStories();
  const [filter, setFilter] = useState<Filter>("all");
  const stories = filter === "all" ? all : all.filter((a) => a.section === filter);
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <SiteShell>
      <main className="broadsheet bs-newspage">
        <div className="bs-wrap">
          <header className="bs-masthead">
            <p className="bs-flag">
              <span suppressHydrationWarning>{today}</span>
              <span>Updated daily</span>
            </p>
            <h1 className="bs-wordmark">OGCW News</h1>
            <p className="bs-flag bs-flag-right">
              <span>{all.length} stories</span>
              <span>Every source linked</span>
            </p>
          </header>

          <nav className="bs-nav bs-filter" aria-label="Filter stories by section">
            <ul>
              {FILTERS.map((f) => (
                <li key={f.id}>
                  <button type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                    {f.label}
                    <span className="bs-filter-count">{countFor(all, f.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="bs-all-head">
            <p className="bs-all-intro">{filter === "all" ? "Music, games, streaming and culture, reported in full, with every source linked." : SECTIONS[filter].intro}</p>
            <p className="bs-all-count" aria-live="polite">{stories.length} {stories.length === 1 ? "story" : "stories"}, newest first</p>
          </div>

          {/* The clip trims the hairlines that run past the outer columns */}
          <div className="bs-all-clip">
            <ol key={filter} className="bs-all">
              {stories.map((story, index) => (
                <li key={story.slug} className="bs-all-item">
                  <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                    <BsPhoto photo={story.photo} className="bs-photo-more" eager={index < 4} />
                    <p className="bs-eyebrow">{story.kicker}</p>
                    <h2 className="bs-title">{story.title}</h2>
                    <p className="bs-deck bs-deck-sm">{story.deck}</p>
                    <p className="bs-all-meta">
                      <span>{SECTIONS[story.section].label}</span>
                      <time dateTime={story.date}>{shortDate(story.date)}</time>
                      <ReadTime>{story.read}</ReadTime>
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
