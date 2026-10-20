import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { BsPhoto, Meta } from "../components/broadsheet";
import { WeekLayout } from "../components/news-week";
import { SECTION_IDS, SECTIONS, type Article, type SectionId } from "../data/content";
import { useStories } from "../lib/stories";
import { S, T } from "@/components/site-text";

type Filter = "all" | SectionId;

export const Route = createFileRoute("/news/")({
  // ?desk=music shows one section (a link anyone can share)
  validateSearch: (search: Record<string, unknown>): { desk?: SectionId } => {
    const desk = search["desk"];
    return typeof desk === "string" && (SECTION_IDS as string[]).includes(desk) ? { desk: desk as SectionId } : {};
  },
  head: () => ({
    meta: [
      { title: "News — OGCW" },
      { name: "description", content: "Every story from One Great Culture World: music, games, streaming, entertainment and sports, newest first." },
      { property: "og:title", content: "News — OGCW" },
      { property: "og:description", content: "Every story from One Great Culture World, newest first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: News,
});

// The News page ("News for you", owner 20 Oct 2026): a hero with the OGCW
// News masthead and the sections to pick from (All stories, Music, Gaming…);
// under it the front page's first section, This week, filled with the
// newest nineteen stories of the section picked; then the rest of them,
// the next row showing faded and blurred, with Load more. No story counts.

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All stories" },
  ...SECTION_IDS.map((id) => ({ id, label: SECTIONS[id].label })),
];
const IN_WEEK = 19;
const STEP = 12;
const PEEK = 4;

/** A story as a card in the ruled grid */
function Card({ story, eager = false }: { story: Article; eager?: boolean }) {
  return (
    <li className="bs-all-item">
      <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
        <BsPhoto photo={story.photo} className="bs-photo-more" eager={eager} />
        <p className="bs-eyebrow"><S story={story} f="kicker" /></p>
        <h3 className="bs-title"><S story={story} f="title" /></h3>
        <p className="bs-deck bs-deck-sm"><S story={story} f="deck" /></p>
        <p className="bs-all-meta">
          <span>{SECTIONS[story.section].label}</span>
          <Meta story={story} />
        </p>
      </Link>
    </li>
  );
}

/** The rest of the stories: shown a few rows at a time, the next row half-faded under a blur */
function MoreStories({ stories }: { stories: Article[] }) {
  const [shown, setShown] = useState(0);
  if (!stories.length) return null;
  const visible = stories.slice(0, shown);
  const peek = stories.slice(shown, shown + PEEK);
  return (
    <section className="nx-more" aria-labelledby="nx-more-title">
      <div className="bs-section-head">
        <h2 id="nx-more-title" className="bs-eyebrow"><T k="news.more.title">More stories</T></h2>
      </div>
      {visible.length > 0 && (
        <div className="bs-all-clip">
          <ol className="bs-all">{visible.map((story) => <Card key={story.slug} story={story} />)}</ol>
        </div>
      )}
      {peek.length > 0 && (
        <>
          <div className={`nx-peek${visible.length ? " has-above" : ""}`} aria-hidden="true" inert>
            <div className="bs-all-clip">
              <ol className="bs-all">{peek.map((story) => <Card key={story.slug} story={story} />)}</ol>
            </div>
          </div>
          <div className="nx-more-foot">
            <button type="button" className="fx-btn fx-btn-ghost nx-load" onClick={() => setShown((n) => n + STEP)}>
              <T k="news.more.load">Load more</T>
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function News() {
  const { desk } = Route.useSearch();
  const { all } = useStories();
  const filter: Filter = desk ?? "all";
  const stories = useMemo(() => (filter === "all" ? all : all.filter((a) => a.section === filter)), [all, filter]);
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const label = filter === "all" ? "All stories" : SECTIONS[filter].label;
  const lead = stories[0];

  return (
    <SiteShell>
      <main className="front nx">
        {/* The hero: the masthead and the sections */}
        <section className="broadsheet nx-hero" data-band="grey" aria-labelledby="news-title">
          <div className="bs-wrap">
            <header className="bs-masthead">
              <p className="bs-flag">
                <span suppressHydrationWarning>{today}</span>
                <span><T k="news.daily">Updated daily</T></span>
              </p>
              <h1 id="news-title" className="bs-wordmark"><T k="news.wordmark">OGCW News</T></h1>
              <p className="bs-flag bs-flag-right">
                <span><T k="news.newest">Newest first</T></span>
                <span><T k="news.sources">Every source linked</T></span>
              </p>
            </header>
            <nav className="bs-nav nx-tabs" aria-label="Pick a section">
              <ul>
                {FILTERS.map((f) => (
                  <li key={f.id}>
                    {/* exact: "All stories" isn't marked as the page on a section's tab */}
                    <Link to="/news" search={f.id === "all" ? {} : { desk: f.id }} activeOptions={{ exact: true }} resetScroll={false} aria-current={filter === f.id ? "page" : undefined}>
                      <T>{f.label}</T>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="nx-intro">{filter === "all" ? <T k="news.intro.all">Music, games, streaming and culture, reported in full, with every source linked.</T> : <T>{SECTIONS[filter].intro}</T>}</p>
          </div>
        </section>

        {/* The front page's first section, with this section's newest stories, then the rest */}
        <section className="broadsheet fx-news nx-body" data-band="light" aria-label={label}>
          <div className="bs-wrap">
            {lead && (
              <WeekLayout
                key={`week-${filter}`}
                id="nx-week"
                stories={{ lead, thread: stories.slice(1, 4), middle: stories[4], connected: stories[5], second: stories[6], brief: stories.slice(7, 13), big: stories.slice(13, IN_WEEK) }}
                labels={{
                  head: <h2 id="nx-week-title" className="bs-eyebrow">{filter === "all" ? <T k="news.week.all">The latest</T> : <><T k="news.week.in">The latest in</T> <T>{label}</T></>}</h2>,
                  thread: <T k="news.week.thread">Also new</T>,
                  connected: <T k="news.week.next">Read next</T>,
                  brief: <T k="home.week.brief">In brief</T>,
                  bigTag: <T k="news.week.big.tag">More news</T>,
                  bigTitle: <T k="news.week.big.title">Keep reading</T>,
                }}
              />
            )}
            <MoreStories key={`more-${filter}`} stories={stories.slice(IN_WEEK)} />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
