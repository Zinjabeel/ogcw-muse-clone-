import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { Img, StoryCard, StoryRow, WatchNext } from "../components/cards";
import { ARTICLES, EPISODES, formatDate, LISTS, SECTIONS, type SectionId } from "../data/content";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News — OGCW" },
      { name: "description", content: "The latest stories from One Great Culture World: music, style, design, nightlife and the scenes between." },
      { property: "og:title", content: "News — OGCW" },
      { property: "og:description", content: "The latest stories from One Great Culture World." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: News,
});

type Filter = "all" | SectionId;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All stories" },
  { id: "music", label: SECTIONS.music.label },
  { id: "culture", label: SECTIONS.culture.label },
];

function News() {
  const [filter, setFilter] = useState<Filter>("all");
  const stories = filter === "all" ? ARTICLES : ARTICLES.filter((a) => a.section === filter);
  const [lead, ...rest] = stories;

  return (
    <SiteShell>
      <PageIntro kicker="Latest dispatches" title="NEWS" copy="Culture, reported from the inside: the artists, rooms, objects and ideas moving things forward, updated daily." />
      <main className="page-wrap pb-24">
        <div className="og-filters" role="group" aria-label="Filter stories">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="og-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="og-chip-count">{f.id === "all" ? ARTICLES.length : ARTICLES.filter((a) => a.section === f.id).length}</span>
            </button>
          ))}
        </div>

        {lead && (
          <div key={filter} className="og-news-top">
            <Link to="/news/$slug" params={{ slug: lead.slug }} className="og-lead">
              <Img photo={lead.photo} className="og-lead-photo" eager />
              <span className="og-lead-text">
                <span className="og-kicker">{lead.kicker}</span>
                <span className="og-lead-title">{lead.title}</span>
                <span className="og-lead-deck">{lead.deck}</span>
                <span className="og-meta">By {lead.author} · {formatDate(lead.date)} · {lead.read}</span>
              </span>
            </Link>
            <aside className="og-news-aside" aria-labelledby="news-most-read">
              <p id="news-most-read" className="og-aside-title">Most read</p>
              <ol className="og-aside-list">
                {LISTS.mostRead.slice(0, 4).map((item, index) => <li key={item.slug}><StoryRow story={item} index={index} /></li>)}
              </ol>
              <WatchNext episode={EPISODES[0]!} />
            </aside>
          </div>
        )}

        <div key={`${filter}-grid`} className="og-grid-3 og-news-grid">
          {rest.map((story) => <StoryCard key={story.slug} story={story} showDeck />)}
        </div>
      </main>
    </SiteShell>
  );
}
