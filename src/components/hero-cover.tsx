import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { LIVE, SECTIONS, type Article } from "@/data/content";
import { useStories } from "@/lib/stories";
import { StoryDate } from "./story-meta";
import { S, T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// Cover story hero, rebuilt 21 Oct 2026 after i-D's front page (a portrait
// filling most of the screen, a plain column beside it with the masthead
// big at the top and a single cover line at the bottom) and Highsnobiety's
// (a tiny category line over a big headline).
//  - The cover photo runs edge to edge on the left.
//  - Beside it, a column in the OGCW yellow (the theme's accent) is set like
//    a magazine cover: the cover's number big at the top, its words in black
//    at the bottom, and a numbered line per cover under them.
//  - "Also on OGCW" runs along the bottom on black.
// The cover stories take turns every 3 seconds: the photo cross-fades with
// a slow push-in and the headline rises line by line. The row underneath
// changes one of its three places every second, never showing the cover on
// show. Both stop under the pointer, on keyboard focus, off screen and while
// an admin edits, and hold still for reduced motion. Nothing moves on scroll.
// Which stories take turns is chosen in the studio (src/data/placements.ts).

const TURN_MS = 3000;
const RAIL_STEP_MS = 1000;
const pad = (n: number) => String(n).padStart(2, "0");

// The usual cover keeps its hand-set lines; any other headline wraps on its
// own in the column, evened out, and rises as one
const USUAL_COVER = "taylor-swift-the-life-of-a-showgirl-the-encore";

type RailItem = { id: string; kicker: string; title: string; meta: string; image: string; pos: string; live?: boolean; slug?: string; story?: Article };

const railStory = (story: Article): RailItem => ({ id: story.slug, kicker: story.kicker, title: story.title, meta: SECTIONS[story.section].label, image: story.photo.src, pos: story.photo.crop?.pos ?? "50% 50%", slug: story.slug, story });
const LIVE_ITEM: RailItem = { id: "live", kicker: "Live", title: LIVE.title, meta: LIVE.next ? `${LIVE.next} · Tour dates` : "Tour dates", image: LIVE.photo.src, pos: LIVE.photo.crop.pos, live: true };

function RailEntry({ item, index }: { item: RailItem; index: number }) {
  const inner = (
    <>
      <span className="cvx-rail-thumb"><img src={item.image} alt="" loading="lazy" style={{ objectPosition: item.pos }} /></span>
      <span className="cvx-rail-text">
        <span className="cvx-rail-kicker" data-live={item.live ? "" : undefined}>{pad(index + 1)} · {item.story ? <S story={item.story} f="kicker" /> : <T>{item.kicker}</T>}</span>
        <span className="cvx-rail-title">{item.story ? <S story={item.story} f="title" /> : <T>{item.title}</T>}</span>
        <span className="cvx-rail-meta">
          <T>{item.meta}</T>
          {item.live && <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />}
        </span>
      </span>
    </>
  );
  return item.live ? (
    <a className="cvx-rail-item" href={LIVE.url} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className="cvx-rail-item" to="/news/$slug" params={{ slug: item.slug ?? "" }}>{inner}</Link>
  );
}

/** The cover line: section, headline, summary and the link, rising in each time it takes its turn */
function CoverCopy({ cover, first, leaving }: { cover: Article; first: boolean; leaving?: boolean }) {
  const site = useSiteText();
  const title = site.story(cover.slug, "title") ?? cover.title;
  // The usual cover's hand-set lines, until an admin changes its headline
  const usual = cover.slug === USUAL_COVER && title === cover.title;
  const long = !usual && title.length > 52;
  const linesOf = (words: string) => (usual ? ["Taylor Swift’s Showgirl", "gets an encore"] : [words]);
  return (
    <div className={`cvx-slide ${first ? "" : "is-turn"} ${leaving ? "is-leaving" : ""}`} aria-hidden={leaving || undefined}>
      <p className="cvx-kicker"><T>{SECTIONS[cover.section].label}</T></p>
      <h1 id={leaving ? undefined : "cover-title"} className={`cvx-title${long ? " is-long" : ""}`}>
        <S story={cover} f="title">{(words) => linesOf(words).map((line) => <span key={line} className="cvx-line"><span>{line}</span></span>)}</S>
      </h1>
      <p className="cvx-deck"><S story={cover} f="deck" /></p>
      <Link to="/news/$slug" params={{ slug: cover.slug }} className="cvx-link" tabIndex={leaving ? -1 : undefined}>
        <T k="hero.cover.cta">Read the cover story</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function HeroCover() {
  const stories = useStories();
  const pool = stories.slot("hero-cover");
  const covers = pool.length ? pool : [stories.pick(USUAL_COVER)];
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [turned, setTurned] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Only turn while the hero is on screen (it is display: none unless chosen)
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { busy } = useSiteText();
  const running = !paused && !hold && inView && !reduce && !busy;
  const current = Math.min(active, covers.length - 1);
  const cover = covers[current]!;

  const go = (next: number) => {
    if (next === current) return;
    setLeaving(current);
    setActive(next);
    setTurned(true);
  };
  // The leaving words fade out under the new ones, then go
  useEffect(() => {
    if (leaving === null) return;
    const timer = window.setTimeout(() => setLeaving(null), 700);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // Also on OGCW: three places from the row's stories, never the cover on show
  const railPool = useMemo(() => [LIVE_ITEM, ...stories.slot("hero-cover-rail").map(railStory)], [stories]);
  const [rail, setRail] = useState<string[]>(() => railPool.slice(0, 3).map((item) => item.id));
  const step = useRef(0);
  useEffect(() => {
    if (!running || railPool.length <= 3) return;
    const timer = window.setInterval(() => {
      setRail((shown) => {
        const place = step.current % 3;
        step.current += 1;
        const start = railPool.findIndex((item) => item.id === shown[place]);
        for (let k = 1; k < railPool.length; k += 1) {
          const candidate = railPool[(start + k) % railPool.length]!;
          if (!shown.includes(candidate.id) && candidate.id !== cover.slug) return shown.map((id, i) => (i === place ? candidate.id : id));
        }
        return shown;
      });
    }, RAIL_STEP_MS);
    return () => window.clearInterval(timer);
  }, [running, railPool, cover.slug]);
  const railItems = rail.map((id) => railPool.find((item) => item.id === id) ?? railPool[0]!).filter(Boolean);

  return (
    <section
      ref={section}
      className="cover cvx"
      aria-labelledby="cover-title"
      aria-roledescription="carousel"
      // Keeps playing under the mouse (owner, 23 Oct 2026); only keyboard focus holds it still
      onFocus={(event) => { if (event.target.matches(":focus-visible")) setHold(true); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
    >
      <div className="cvx-main">
        {/* The cover photo, edge to edge */}
        <figure className="cvx-photo">
          {covers.map((story, index) => (
            <img
              key={story.slug}
              src={story.photo.src}
              alt={index === current ? story.photo.alt : ""}
              className={index === current ? "is-on" : undefined}
              // Lazy: hidden while another hero is chosen, so its photos aren't fetched then (shown, they load at once)
              loading="lazy"
              style={{ objectPosition: story.slug === USUAL_COVER ? "50% 45%" : story.photo.crop?.pos ?? "50% 30%" }}
            />
          ))}
          {cover.photo.credit && <figcaption className="cvx-credit">{cover.slug === USUAL_COVER && "Taylor Swift, The Eras Tour · "}Photo: {cover.photo.credit}</figcaption>}
        </figure>

        {/* The cover column: its number at the top, the cover line at the bottom */}
        <div className="cvx-band">
          <div className="cvx-band-top">
            <p className="cvx-num" aria-hidden="true">
              <span key={current} className="cvx-num-now">{pad(current + 1)}</span>
              <span className="cvx-num-of">/{pad(covers.length)}</span>
            </p>
            <div className="cvx-masthead">
              <p className="cvx-tag"><T k="hero.cover.kicker">Cover story</T></p>
              <p className="cvx-date"><StoryDate story={cover} /></p>
            </div>
          </div>

          <div className="cvx-slides">
            {leaving !== null && covers[leaving] && <CoverCopy key={`out-${covers[leaving]!.slug}`} cover={covers[leaving]!} first={false} leaving />}
            <CoverCopy key={cover.slug} cover={cover} first={!turned} />
          </div>

          {/* Which cover is on, and how long it has left */}
          {covers.length > 1 && (
            <div className="cvx-turns" role="group" aria-label="Cover stories">
              {covers.map((story, index) => (
                <button key={story.slug} type="button" className="cvx-turn" aria-label={`Cover story ${index + 1}: ${story.title}`} aria-pressed={index === current} onClick={() => go(index)}>
                  <span className="cvx-turn-line">
                    {index === current && !reduce && (
                      <i key={current} style={{ "--dur": `${TURN_MS}ms` } as CSSProperties} data-run={running} onAnimationEnd={() => go((current + 1) % covers.length)} />
                    )}
                  </span>
                  <span className="cvx-turn-num" aria-hidden="true">{pad(index + 1)}</span>
                </button>
              ))}
              {!reduce && (
                <button type="button" className="cvx-pause" aria-label={paused ? "Play the cover stories" : "Pause the cover stories"} onClick={() => setPaused((value) => !value)}>
                  {paused ? <Play size={13} strokeWidth={2} aria-hidden="true" /> : <Pause size={13} strokeWidth={2} aria-hidden="true" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Also on OGCW, along the bottom */}
      <nav className="cvx-rail" aria-label="Also on OGCW">
        <p className="cvx-rail-label"><T k="hero.cover.rail">Also on OGCW</T></p>
        <ol>
          {railItems.map((item, index) => (
            <li key={index}><div key={item.id} className="cvx-rail-swap"><RailEntry item={item} index={index} /></div></li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
