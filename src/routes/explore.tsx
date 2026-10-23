import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { HitLink, hitLabel, hitSub, hitTitle } from "../components/cards";
import { SlideControls, SlideDots, useSlides } from "../components/slide-controls";
import { EVENTS, searchSite, type Article, type UpcomingEvent } from "../data/content";
import { useStories } from "../lib/stories";
import { S, T } from "@/components/site-text";

// Explore hub, redesigned 23 Oct 2026 (owner: "redesign it, make it have a
// countdown in the hero for an event, take inspiration from WIRED"): WIRED's
// printed-magazine language in OGCW's colours: a thin masthead band, a
// cover with a live countdown to the next big event (Grand Theft Auto VI
// first, then the next events that have a story), turning like the home
// hero; a square search box; a magazine story grid (one big story, two
// beside it, a numbered most-read rail); the events calendar as hairline
// rows; the reading lists; and the directory of every section. Square
// corners, hairlines instead of shadows, serif for the stories and sans for
// the labels. Events and stories are the site's own (src/data/content.ts,
// Sanity); nothing moves on scroll.

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — OGCW" },
      { name: "description", content: "Search OGCW, count down to the next big release, browse what’s trending and follow curated reading lists across music, culture, Originals and the shop." },
      { property: "og:title", content: "Explore — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ExplorePage,
});

const DIRECTORY = [
  { label: "News", note: "Every story, newest first", el: (c: string, children: ReactNode) => <Link to="/news" className={c}>{children}</Link> },
  { label: "Music", note: "Releases, tours and awards", el: (c: string, children: ReactNode) => <Link to="/music" className={c}>{children}</Link> },
  { label: "Games", note: "Launches and showcases", el: (c: string, children: ReactNode) => <Link to="/games" className={c}>{children}</Link> },
  { label: "Streaming", note: "Creators and records", el: (c: string, children: ReactNode) => <Link to="/streaming" className={c}>{children}</Link> },
  { label: "Culture", note: "Fashion, TV and sneakers", el: (c: string, children: ReactNode) => <Link to="/culture" className={c}>{children}</Link> },
  { label: "Originals", note: "Interviews and podcasts", el: (c: string, children: ReactNode) => <Link to="/originals" className={c}>{children}</Link> },
  { label: "Shop", note: "The OGCW edit", el: (c: string, children: ReactNode) => <Link to="/shop" className={c}>{children}</Link> },
  { label: "Trends", note: "The culture index", el: (c: string, children: ReactNode) => <Link to="/trends" className={c}>{children}</Link> },
];

/** The event the cover leads with while it's still to come */
const HEADLINER = "gta-vi-countdown";
const pad = (n: number) => String(n).padStart(2, "0");
const longDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
const dayNo = (iso: string) => new Date(iso).getUTCDate();
const monthShort = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(iso));
/** Midnight at the start of the event's day, in the reader's own time */
const startsAt = (event: UpcomingEvent) => { const [y, m, d] = event.date.split("-").map(Number); return new Date(y!, m! - 1, d!).getTime(); };

/** The time left, ticking every second once the page is open (nothing on the server, so it never shows a stale number) */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function Countdown({ event, now }: { event: UpcomingEvent; now: number | null }) {
  const left = now === null ? null : Math.max(0, startsAt(event) - now);
  const parts = left === null
    ? [["--", "Days"], ["--", "Hours"], ["--", "Minutes"], ["--", "Seconds"]]
    : [[String(Math.floor(left / 86_400_000)), "Days"], [pad(Math.floor(left / 3_600_000) % 24), "Hours"], [pad(Math.floor(left / 60_000) % 60), "Minutes"], [pad(Math.floor(left / 1000) % 60), "Seconds"]];
  const on = left === 0;
  return (
    <div className="wx-count" role="timer" aria-label={on ? `${event.title} is out now` : `Time left until ${event.title}`}>
      {on ? (
        <p className="wx-count-now"><T k="explore.countdown.now">It’s here</T></p>
      ) : parts.map(([value, label]) => (
        <span key={label} className="wx-count-cell">
          <span className="wx-count-no" aria-hidden={label === "Seconds"}>{value}</span>
          <span className="wx-count-label"><T k={`explore.countdown.${label!.toLowerCase()}`}>{label!}</T></span>
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ The cover: counting down to the next big events

function Cover() {
  const stories = useStories();
  const now = useNow();
  // Today, from the browser once it's open (the server's day may differ)
  const today = now === null ? new Date().toISOString().slice(0, 10) : new Date(now).toISOString().slice(0, 10);
  const events = useMemo(() => {
    const ahead = EVENTS.filter((event) => event.date > today && event.slug && stories.get(event.slug));
    const head = ahead.find((event) => event.slug === HEADLINER);
    return [...(head ? [head] : []), ...ahead.filter((event) => event !== head)].slice(0, 4);
  }, [today, stories]);
  const slides = useSlides(events.length, { ms: 8000 });
  if (!events.length) return null;
  return (
    <section {...slides.box} className="wx-cover" aria-labelledby="wx-cover-title" aria-roledescription="carousel">
      {events.map((event, index) => {
        const story = stories.get(event.slug!) as Article;
        const on = index === slides.index;
        return (
          <article key={event.title} className="wx-cover-slide" data-on={on} aria-hidden={!on}>
            <div className="wx-cover-text">
              <p className="wx-eyebrow"><T k="explore.countdown.kicker">Countdown</T> · <T>{event.category}</T></p>
              <h1 id={on ? "wx-cover-title" : undefined} className="wx-cover-title">
                <Link to="/news/$slug" params={{ slug: story.slug }} tabIndex={on ? undefined : -1}><T>{event.title}</T></Link>
              </h1>
              <p className="wx-cover-deck"><T>{event.detail}</T></p>
              <p className="wx-cover-date">{longDate(event.date)}</p>
              <Countdown event={event} now={now} />
              <div className="wx-cover-actions">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="wx-btn" tabIndex={on ? undefined : -1}><T k="explore.countdown.read">Read the story</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
                <a href="#wx-calendar" className="wx-btn is-outline" tabIndex={on ? undefined : -1}><T k="explore.countdown.all">Every date</T></a>
              </div>
            </div>
            <div className="wx-cover-media">
              <Link to="/news/$slug" params={{ slug: story.slug }} className="wx-cover-photo" tabIndex={-1} aria-hidden="true">
                <img src={story.photo.src} alt="" loading={index === 0 ? "eager" : "lazy"} style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} />
              </Link>
              <SlideDots slides={slides} label="Countdowns" className="wx-dots" />
            </div>
          </article>
        );
      })}
      <SlideControls slides={slides} className="wx-controls" />
    </section>
  );
}

// ------------------------------------------------------------ The magazine grid

function StoryLink({ story, className, children }: { story: Article; className: string; children: ReactNode }) {
  return <Link to="/news/$slug" params={{ slug: story.slug }} className={className}>{children}</Link>;
}

function Grid() {
  const stories = useStories();
  // The events' stories are on the cover already, so they're left out here (no photo twice in a row)
  const onCover = new Set(EVENTS.flatMap((event) => event.slug ?? []));
  const pool = [...stories.trending, ...stories.latest].filter((story) => !onCover.has(story.slug));
  const lead = pool[0] ?? stories.latest[0];
  const seen = new Set(lead ? [lead.slug] : []);
  const two = pool.filter((story) => !seen.has(story.slug) && (seen.add(story.slug), true)).slice(0, 2);
  const read = stories.mostRead.filter((story) => !seen.has(story.slug) && !onCover.has(story.slug)).slice(0, 5);
  if (!lead) return null;
  return (
    <section className="wx-band" aria-labelledby="wx-now">
      <header className="wx-head"><h2 id="wx-now" className="wx-h2"><T k="explore.now">Right now</T></h2></header>
      <div className="wx-grid">
        <StoryLink story={lead} className="wx-lead">
          <span className="wx-photo is-wide"><img src={lead.photo.src} alt="" loading="lazy" style={{ objectPosition: lead.photo.crop?.pos ?? "50% 50%" }} /></span>
          <span className="wx-eyebrow"><S story={lead} f="kicker" /></span>
          <span className="wx-lead-title"><S story={lead} f="title" /></span>
          <span className="wx-deck"><S story={lead} f="deck" /></span>
        </StoryLink>
        <div className="wx-two">
          {two.map((story) => (
            <StoryLink key={story.slug} story={story} className="wx-card">
              <span className="wx-photo"><img src={story.photo.src} alt="" loading="lazy" style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} /></span>
              <span className="wx-eyebrow"><S story={story} f="kicker" /></span>
              <span className="wx-card-title"><S story={story} f="title" /></span>
            </StoryLink>
          ))}
        </div>
        <aside className="wx-rail" aria-labelledby="wx-most">
          <h3 id="wx-most" className="wx-rail-head"><T k="explore.most-read">Most read</T></h3>
          <ol>
            {read.map((story, index) => (
              <li key={story.slug}>
                <StoryLink story={story} className="wx-row">
                  <span className="wx-row-no" aria-hidden="true">{index + 1}</span>
                  <span><span className="wx-eyebrow"><S story={story} f="kicker" /></span><span className="wx-row-title"><S story={story} f="title" /></span></span>
                </StoryLink>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ Every date: the calendar as hairline rows

function Calendar() {
  const now = useNow();
  const today = now === null ? new Date().toISOString().slice(0, 10) : new Date(now).toISOString().slice(0, 10);
  const upcoming = EVENTS.filter((event) => (event.end ?? event.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
  const daysTo = (event: UpcomingEvent) => Math.round((Date.parse(event.date) - Date.parse(today)) / 86_400_000);
  const when = (event: UpcomingEvent) => { const days = daysTo(event); return days <= 0 ? (event.end && event.end >= today ? "On now" : "Today") : days === 1 ? "Tomorrow" : `In ${days} days`; };
  if (!upcoming.length) return null;
  return (
    <section className="wx-band" id="wx-calendar" aria-labelledby="wx-calendar-title">
      <header className="wx-head">
        <h2 id="wx-calendar-title" className="wx-h2"><T k="events.title">Upcoming events</T></h2>
        <p className="wx-head-copy"><T k="events.intro">Releases, shows and big nights across music, games, film, fashion and streaming.</T></p>
      </header>
      <ol className="wx-cal">
        {upcoming.map((event) => {
          const inner = (
            <>
              <span className="wx-cal-date"><span className="wx-cal-day">{dayNo(event.date)}{event.end && `–${dayNo(event.end)}`}</span><span className="wx-cal-mon">{monthShort(event.date)}</span></span>
              <span className="wx-cal-text">
                <span className="wx-eyebrow"><T>{event.category}</T></span>
                <span className="wx-cal-title"><T>{event.title}</T></span>
                <span className="wx-cal-detail"><T>{event.detail}</T></span>
              </span>
              <span className="wx-cal-when">{now === null ? "" : when(event)}{event.slug && <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />}</span>
            </>
          );
          return <li key={event.date + event.title}>{event.slug ? <Link to="/news/$slug" params={{ slug: event.slug }} className="wx-cal-row is-link">{inner}</Link> : <div className="wx-cal-row">{inner}</div>}</li>;
        })}
      </ol>
    </section>
  );
}

function ExplorePage() {
  const [query, setQuery] = useState("");
  const stories = useStories();
  const hits = searchSite(query, stories.all);
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <SiteShell>
      <main className="wx">
        {/* The masthead band */}
        <div className="wx-mast">
          <p className="wx-mast-name"><T k="intro.explore.title">Explore</T></p>
          <p className="wx-mast-copy"><T k="intro.explore.copy">Search everything, see what people are reading right now, or follow one of our reading lists.</T></p>
          <p className="wx-mast-date" suppressHydrationWarning>{today}</p>
        </div>

        <Cover />

        <section className="wx-band wx-search-band" aria-label="Search OGCW">
          <form className="wx-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <Search size={20} strokeWidth={1.75} aria-hidden="true" />
            <label htmlFor="explore-q" className="sr-only"><T>Search OGCW</T></label>
            <input id="explore-q" type="search" placeholder="Search stories, Originals and shops" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
            <button type="submit" className="wx-btn"><T k="explore.search">Search</T></button>
          </form>
          {query.trim() && (
            <div className="wx-hits" aria-live="polite">
              <p className="wx-eyebrow">{hits.length ? `${hits.length} ${hits.length === 1 ? "result" : "results"}` : `Nothing matches “${query.trim()}” yet`}</p>
              <ul>
                {hits.map((hit) => (
                  <li key={hit.kind + hit.item.slug} className="wx-hit">
                    <span className="wx-eyebrow">{hitLabel(hit)}</span>
                    <HitLink hit={hit} className="wx-hit-link">{hitTitle(hit)}</HitLink>
                    <span className="wx-hit-sub">{hitSub(hit)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <Grid />
        <Calendar />

        <section className="wx-band" aria-labelledby="reading-lists">
          <header className="wx-head"><h2 id="reading-lists" className="wx-h2"><T k="explore.lists">Reading lists</T></h2></header>
          <div className="wx-lists">
            {stories.readingLists.map((list, index) => {
              const cover = list.cover ?? list.items[0]!.photo;
              return (
                <article key={list.id} className="wx-list">
                  <span className="wx-photo"><img src={cover.src} alt="" loading="lazy" style={{ objectPosition: cover.crop?.pos ?? "50% 50%" }} /></span>
                  <p className="wx-eyebrow"><T>Reading list</T> {pad(index + 1)} · {list.items.length} stories</p>
                  <h3 className="wx-list-title"><T>{list.title}</T></h3>
                  <p className="wx-deck"><T>{list.note}</T></p>
                  <ol className="wx-list-items">
                    {list.items.map((story, i) => (
                      <li key={story.slug}><StoryLink story={story} className="wx-row is-small"><span className="wx-row-no" aria-hidden="true">{i + 1}</span><span className="wx-row-title"><S story={story} f="title" /></span></StoryLink></li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </section>

        <section className="wx-band" aria-labelledby="directory">
          <header className="wx-head"><h2 id="directory" className="wx-h2"><T k="explore.directory">Everything on OGCW</T></h2></header>
          <ul className="wx-dir">
            {DIRECTORY.map((d) => (
              <li key={d.label}>
                {d.el("wx-dir-link", <><span className="wx-dir-name"><T>{d.label}</T></span><span className="wx-dir-note"><T>{d.note}</T></span><ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" /></>)}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
