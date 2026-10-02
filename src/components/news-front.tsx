import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { SONGS, spotifyTrack, type Article, type Song } from "@/data/content";
import { useStories } from "@/lib/stories";
import { SpotifyIcon } from "./spotify";
import { ExploreMix } from "./explore-mix";
import { KeepExploring } from "./keep-exploring";
import { UpcomingEvents } from "./upcoming-events";
import { ContentOfTheMonth } from "./content-of-the-month";
import { BsPhoto as Photo, ReadTime, StoryCard } from "./broadsheet";
import { NewsWeek } from "./news-week";
import { ShopPromo } from "./shop-promo";

// The news front page: the broadsheet grid from the Monocle reference (design
// md monocle), with hairline rules building the grid, dressed in the OGCW brand
// system (Source Serif 4 headlines and text, Inter labels, accent colour).
// Six headline stories (three down the left side, the lead, two on the
// right) beside the Upcoming events rail, then This week (fifteen more of
// the latest stories: a lead, connected stories and In brief), the More
// news carousel, Content of the month, the shop as one card into /shop,
// and the Explore mix running on into Keep exploring (more stories and the
// rap desk vote).

const sections = [
  { label: "All news", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Games", to: "/games" },
  { label: "Streaming", to: "/streaming" },
  { label: "Culture", to: "/culture" },
  { label: "Originals", to: "/originals" },
  { label: "Shop", to: "/shop" },
  { label: "Explore", to: "/explore" },
] as const;

const [song, ...nextSongs] = SONGS as [Song, ...Song[]];
// More news drifts on by itself, this fast, and waits this long after the reader takes over
const GLIDE_PX_PER_S = 24;
const GLIDE_REST_MS = 6000;

// More news: the cards run on past both edges of the page column, so a
// slice of the next and the previous card shows on each side, with arrows
// that move a page of stories at a time. The row loops: the stories are
// laid out three times, the row starts on the middle set and, once a scroll
// settles in an outer set, jumps back to the same card in the middle one.
// The outer sets are hidden from screen readers and the Tab key.
function MoreNewsCarousel({ stories }: { stories: Article[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section.current;
    const row = track.current;
    if (!el || !row) return;

    const items = () => Array.from(row.children) as HTMLElement[];
    const setWidth = () => {
      const all = items();
      return (all[stories.length]?.offsetLeft ?? 0) - (all[0]?.offsetLeft ?? 0);
    };
    const bleedLeft = () => parseFloat(getComputedStyle(row).paddingLeft) || 0;

    // How far the row runs past the column: up to the screen edge, at most 160px
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      el.style.setProperty("--bleed-l", `${Math.round(Math.max(0, Math.min(rect.left, 160)))}px`);
      el.style.setProperty("--bleed-r", `${Math.round(Math.max(0, Math.min(viewport - rect.right, 160)))}px`);
      const card = items()[0];
      if (card) el.style.setProperty("--photo-h", `${Math.round((card.offsetWidth * 2) / 3)}px`);
    };

    // Keep the scroll position inside the middle set
    const recentre = () => {
      const width = setWidth();
      if (!width) return;
      if (row.scrollLeft < width * 0.5) row.scrollTo({ left: row.scrollLeft + width, behavior: "instant" });
      else if (row.scrollLeft > width * 1.5) row.scrollTo({ left: row.scrollLeft - width, behavior: "instant" });
    };

    measure();
    const start = requestAnimationFrame(() => {
      measure();
      const first = items()[stories.length];
      if (first) row.scrollTo({ left: first.offsetLeft - bleedLeft(), behavior: "instant" });
    });

    let settle = 0;
    const onScroll = () => {
      if (row.classList.contains("is-gliding")) return; // the glide keeps itself in the middle set
      window.clearTimeout(settle);
      settle = window.setTimeout(recentre, 160);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);

    // The slow glide: the row drifts on by itself, a little each frame, while
    // it's on screen. Pointing at it holds it; scrolling, swiping, the arrows
    // or the keyboard hand it back to the reader for a few seconds (and turn
    // card snapping back on). Never for reduced motion.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let at = 0;
    let holding = false;
    let onScreen = false;
    let restUntil = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (onScreen && !holding && now > restUntil) {
        if (!row.classList.contains("is-gliding")) {
          row.classList.add("is-gliding");
          at = row.scrollLeft;
        }
        at += (GLIDE_PX_PER_S * dt) / 1000;
        const width = setWidth();
        if (width && at > width * 1.5) at -= width;
        row.scrollLeft = at;
      }
      raf = requestAnimationFrame(frame);
    };
    const handBack = () => {
      row.classList.remove("is-gliding");
      restUntil = performance.now() + GLIDE_REST_MS;
    };
    const hold = () => { holding = true; };
    const release = () => { holding = false; };
    const seen = new IntersectionObserver(([entry]) => { onScreen = !!entry?.isIntersecting; }, { threshold: 0.2 });
    if (!reduce) {
      seen.observe(el);
      raf = requestAnimationFrame(frame);
      row.addEventListener("pointerdown", handBack);
      row.addEventListener("wheel", handBack, { passive: true });
      row.addEventListener("touchstart", handBack, { passive: true });
      el.addEventListener("keydown", handBack);
      el.addEventListener("pointerenter", hold);
      el.addEventListener("pointerleave", release);
      el.addEventListener("focusin", hold);
      el.addEventListener("focusout", release);
      el.addEventListener("ogcw-carousel-page", handBack);
    }

    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(raf);
      seen.disconnect();
      window.clearTimeout(settle);
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("pointerdown", handBack);
      row.removeEventListener("wheel", handBack);
      row.removeEventListener("touchstart", handBack);
      el.removeEventListener("keydown", handBack);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("ogcw-carousel-page", handBack);
      window.removeEventListener("resize", measure);
    };
  }, [stories.length]);

  // Move a page: as many whole cards as fit in the column
  const page = (direction: 1 | -1) => {
    const el = section.current;
    const row = track.current;
    const card = row?.children[0] as HTMLElement | undefined;
    if (!el || !row || !card) return;
    el.dispatchEvent(new Event("ogcw-carousel-page")); // the reader takes over from the glide
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * perPage * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section ref={section} className="bs-carousel" aria-labelledby="more-news-title" aria-roledescription="carousel">
      <div className="bs-section-head">
        <h3 id="more-news-title" className="bs-eyebrow">More news</h3>
        <Link to="/news" className="bs-more">All stories</Link>
      </div>
      <div className="bs-carousel-stage">
        <div className="bs-carousel-track" ref={track}>
          {[0, 1, 2].flatMap((copy) =>
            stories.map((story) => (
              <article key={`${copy}-${story.slug}`} className="bs-carousel-item" aria-hidden={copy === 1 ? undefined : true}>
                <StoryCard story={story} photoClass="bs-photo-more" hidden={copy !== 1} />
              </article>
            )),
          )}
        </div>
        <button type="button" className="bs-carousel-arrow bs-carousel-prev" aria-label="Previous stories" onClick={() => page(-1)}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button type="button" className="bs-carousel-arrow bs-carousel-next" aria-label="More stories" onClick={() => page(1)}>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export function NewsFront() {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const stories = useStories();
  // The headline stories: the spots chosen in the studio (src/data/placements.ts)
  const [lead = stories.pick("vmas-2026-winners")] = stories.slot("front-lead");
  const secondary = stories.slot("front-secondary");
  const side = stories.slot("front-side");
  // Every other story, newest first, runs in the More news carousel: the ones
  // in another spot on the front page, and the ones kept to the News page,
  // are left out
  const moreNews = stories.all.filter((a) => !stories.onFront.has(a.slug) && !stories.hidden.has(a.slug));

  return (
    <section className="broadsheet" aria-labelledby="news-front-title">
      <div className="bs-wrap">
        {/* Sections sit in bands of different widths on wide screens: the
            front runs wider than the page column, More news and Explore fill
            the column, the streamers and the shop take 90% of it (see
            .bs-band in styles.css) */}
        <div className="bs-band bs-band-front">
        <header className="bs-masthead">
          <p className="bs-flag">
            <span suppressHydrationWarning>{today}</span>
            <span>Updated daily</span>
          </p>
          <h2 id="news-front-title" className="bs-wordmark">OGCW News</h2>
          <p className="bs-flag bs-flag-right">
            <span>{stories.all.length} stories</span>
            <span>Every source linked</span>
          </p>
        </header>

        <nav className="bs-nav" aria-label="News sections">
          <ul>
            {sections.map((section) => (
              <li key={section.label}>
                <Link to={section.to}>{section.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bs-front">
          <article className="bs-col bs-col-lead bs-reveal">
            <Link to="/news/$slug" params={{ slug: lead.slug }} className="bs-card">
              <p className="bs-eyebrow">{lead.kicker}</p>
              <h3 className="bs-title bs-title-lead">{lead.title}</h3>
              <p className="bs-deck">{lead.deck}</p>
              <ReadTime>{lead.read}</ReadTime>
              <Photo photo={lead.photo} className="bs-photo-lead" />
            </Link>

            {/* The song to check out, then the rest of the playlist as a short
                list. Every song opens on Spotify, shown with its album cover. */}
            <div className="bs-song bs-song-wide">
              <p className="bs-song-head">Check out this song</p>
              <a className="bs-song-main" href={spotifyTrack(song.spotify)} target="_blank" rel="noopener noreferrer" aria-label={`${song.title} by ${song.artist}, on Spotify`}>
                <span className="bs-song-media">
                  <img src={song.cover} alt="" loading="lazy" />
                  <span className="bs-song-play" aria-hidden="true"><Play size={16} fill="currentColor" strokeWidth={0} /></span>
                </span>
                <span className="bs-song-info">
                  <span className="bs-song-title">{song.title}</span>
                  <span className="bs-song-artist">{song.artist}</span>
                  <span className="bs-song-album">{song.album} · {song.year}</span>
                  <span className="bs-song-note">{song.note}</span>
                  <span className="bs-spotify"><SpotifyIcon size={15} /> Play on Spotify <ArrowUpRight size={13} aria-hidden="true" /></span>
                </span>
              </a>
              <p className="bs-song-sub">Up next on the playlist</p>
              <ol className="bs-song-next">
                {nextSongs.map((item, index) => (
                  <li key={item.spotify}>
                    <a href={spotifyTrack(item.spotify)} target="_blank" rel="noopener noreferrer" aria-label={`${item.title} by ${item.artist}, on Spotify`}>
                      <span className="bs-song-num" aria-hidden="true">{index + 2}</span>
                      <span className="bs-song-thumb"><img src={item.cover} alt="" loading="lazy" /></span>
                      <span className="bs-song-next-text">
                        <span className="bs-song-next-title">{item.title}</span>
                        <span className="bs-song-next-artist">{item.artist}</span>
                      </span>
                      <span className="bs-song-next-play"><SpotifyIcon size={16} /></span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </article>

          <div className="bs-col bs-col-secondary">
            {secondary.map((story) => (
              <article key={story.slug} className="bs-reveal">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                  <Photo photo={story.photo} className="bs-photo-secondary" />
                  <p className="bs-eyebrow">{story.kicker}</p>
                  <h3 className="bs-title">{story.title}</h3>
                  <p className="bs-deck bs-deck-sm">{story.deck}</p>
                  <ReadTime>{story.read}</ReadTime>
                </Link>
              </article>
            ))}
          </div>

          {/* Three more headline stories: a column down the left on wide
              screens, a row under the lead on smaller ones */}
          <div className="bs-col bs-col-side">
            {side.map((story) => (
              <article key={story.slug} className="bs-reveal">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                  <Photo photo={story.photo} className="bs-photo-secondary" />
                  <p className="bs-eyebrow">{story.kicker}</p>
                  <h3 className="bs-title">{story.title}</h3>
                  <ReadTime>{story.read}</ReadTime>
                </Link>
              </article>
            ))}
          </div>

          <aside className="bs-col bs-col-rail bs-reveal" aria-labelledby="events-title">
            <UpcomingEvents />
          </aside>
        </div>
        </div>

        <hr className="bs-rule" />

        <NewsWeek />

        <hr className="bs-rule" />

        <MoreNewsCarousel stories={moreNews} />

        <hr className="bs-rule bs-band bs-band-90" />

        <div className="bs-band bs-band-90">
          <ContentOfTheMonth />
        </div>

        <hr className="bs-rule bs-band bs-band-90" />

        {/* The shop as one card: the full shop is on /shop */}
        <div className="bs-band bs-band-90">
          <ShopPromo />
        </div>

        <hr className="bs-rule" />

        {/* Explore runs straight on into Keep exploring: same tiles, no rule between */}
        <ExploreMix />
        <KeepExploring />
      </div>
    </section>
  );
}
