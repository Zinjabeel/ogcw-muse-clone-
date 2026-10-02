import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { LIVE, SECTIONS, type Article } from "@/data/content";
import { useStories } from "@/lib/stories";
import { T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// Home hero, "Cover story" in the hero switcher: set like a magazine cover.
// The cover stories take turns every 3 seconds: the photo cross-fades into
// the next with a slow push-in, and the new headline rises line by line. A
// row of numbered lines under the copy shows which is on and how long it
// has left (click one to jump; pause beside it). The "Also on OGCW" row
// under it keeps its three places but changes one every second, so each
// place moves on every 3 seconds, never showing the cover on show. Both
// stop under the pointer, on keyboard focus and off screen, and hold still
// for reduced motion. On scroll the photo drifts slower than the text.
// Which stories take turns is chosen in the studio (src/data/placements.ts).

const TURN_MS = 3000;
const RAIL_STEP_MS = 1000;

// The usual cover keeps its hand-set headline; a short headline is split in
// two lines for the reveal, a long one wraps on its own, evened out
const USUAL_COVER = "taylor-swift-the-life-of-a-showgirl-the-encore";

function coverLines(title: string): string[] {
  const words = title.split(" ");
  if (words.length < 4) return [title];
  let best = 1;
  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(" ").length;
    const bestLeft = words.slice(0, best).join(" ").length;
    if (Math.abs(left - title.length / 2) < Math.abs(bestLeft - title.length / 2)) best = i;
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

type RailItem = { id: string; kicker: string; title: string; meta: string; image: string; pos: string; live?: boolean; slug?: string };

const railStory = (story: Article): RailItem => ({ id: story.slug, kicker: story.kicker, title: story.title, meta: SECTIONS[story.section].label, image: story.photo.src, pos: story.photo.crop?.pos ?? "50% 50%", slug: story.slug });
const LIVE_ITEM: RailItem = { id: "live", kicker: "Live", title: LIVE.title, meta: "Bogotá, 2–3 October · Tour dates", image: LIVE.photo.src, pos: LIVE.photo.crop.pos, live: true };

function RailEntry({ item, index }: { item: RailItem; index: number }) {
  const inner = (
    <>
      <span className="cover-rail-thumb"><img src={item.image} alt="" loading="lazy" style={{ objectPosition: item.pos }} /></span>
      <span className="cover-rail-text">
        <span className="cover-rail-kicker" data-live={item.live ? "" : undefined}>{String(index + 1).padStart(2, "0")} · {item.kicker}</span>
        <span className="cover-rail-title">{item.title}</span>
        <span className="cover-rail-meta">
          {item.meta}
          {item.live && <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />}
        </span>
      </span>
    </>
  );
  return item.live ? (
    <a className="cover-rail-item" href={LIVE.url} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className="cover-rail-item" to="/news/$slug" params={{ slug: item.slug ?? "" }}>{inner}</Link>
  );
}

/** The cover's words: kicker, headline, summary and the link, rising in each time it takes its turn */
function CoverCopy({ cover, first, leaving }: { cover: Article; first: boolean; leaving?: boolean }) {
  const usual = cover.slug === USUAL_COVER;
  const long = !usual && cover.title.length > 48;
  const lines = usual ? ["Taylor Swift’s Showgirl", "gets an encore"] : long ? [cover.title] : coverLines(cover.title);
  return (
    <div className={`cover-slide ${first ? "" : "is-turn"} ${leaving ? "is-leaving" : ""}`} aria-hidden={leaving || undefined}>
      <p className="cover-kicker"><T k="hero.cover.kicker">Cover story</T> · {SECTIONS[cover.section].label}</p>
      <h1 id={leaving ? undefined : "cover-title"} className={`cover-title ${long ? "cover-title-long" : ""}`}>
        {lines.map((line) => <span key={line} className="cover-line"><span>{line}</span></span>)}
      </h1>
      <p className="cover-deck">{cover.deck}</p>
      <div className="cover-cta">
        <Link to="/news/$slug" params={{ slug: cover.slug }} className="cover-link" tabIndex={leaving ? -1 : undefined}>
          <T k="hero.cover.cta">Read the cover story</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
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

  const { editing } = useSiteText();
  const running = !paused && !hold && inView && !reduce && !editing;
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
      className="cover"
      aria-labelledby="cover-title"
      aria-roledescription="carousel"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHold(true); }}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
    >
      <div className="cover-glow" aria-hidden="true" />

      <figure className="cover-photo">
        {covers.map((story, index) => (
          <img
            key={story.slug}
            src={story.photo.src}
            alt={index === current ? story.photo.alt : ""}
            className={index === current ? "is-on" : undefined}
            loading={index === 0 ? "eager" : "lazy"}
            style={{ objectPosition: story.slug === USUAL_COVER ? "50% 45%" : story.photo.crop?.pos ?? "50% 30%" }}
          />
        ))}
      </figure>
      {cover.photo.credit && <p className="cover-credit">{cover.slug === USUAL_COVER && "Taylor Swift, The Eras Tour · "}Photo: {cover.photo.credit}</p>}

      <div className="cover-inner">
        <div className="cover-copy">
          <div className="cover-slides">
            {leaving !== null && covers[leaving] && <CoverCopy key={`out-${covers[leaving]!.slug}`} cover={covers[leaving]!} first={false} leaving />}
            <CoverCopy key={cover.slug} cover={cover} first={!turned} />
          </div>

          {/* Which cover is on, and how long it has left */}
          {covers.length > 1 && (
            <div className="cover-turns" role="group" aria-label="Cover stories">
              <span className="cover-count" aria-hidden="true">{String(current + 1).padStart(2, "0")} / {String(covers.length).padStart(2, "0")}</span>
              {covers.map((story, index) => (
                <button key={story.slug} type="button" className="cover-turn" aria-label={`Cover story ${index + 1}: ${story.title}`} aria-pressed={index === current} onClick={() => go(index)}>
                  <span>
                    {index === current && !reduce && (
                      <i key={current} style={{ "--dur": `${TURN_MS}ms` } as CSSProperties} data-run={running} onAnimationEnd={() => go((current + 1) % covers.length)} />
                    )}
                  </span>
                </button>
              ))}
              {!reduce && (
                <button type="button" className="cover-pause" aria-label={paused ? "Play the cover stories" : "Pause the cover stories"} onClick={() => setPaused((value) => !value)}>
                  {paused ? <Play size={13} strokeWidth={2} aria-hidden="true" /> : <Pause size={13} strokeWidth={2} aria-hidden="true" />}
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="cover-rail" aria-label="Also on OGCW">
          <p className="cover-rail-label"><T k="hero.cover.rail">Also on OGCW</T></p>
          <ol>
            {railItems.map((item, index) => (
              <li key={index}><div key={item.id} className="cover-rail-swap"><RailEntry item={item} index={index} /></div></li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
