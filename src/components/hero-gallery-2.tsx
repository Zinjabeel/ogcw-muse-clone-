import { Link } from "@tanstack/react-router";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { article } from "@/data/content";
import { CARDS, CardLink } from "./hero-gallery";

// Gallery 2 (the second option in the hero switcher): the top news takes the
// middle of the hero, and the five doors into OGCW run in a smaller strip
// beneath it. The news is three stories (games, fashion, music), each with
// its headline, a line and a button on the left and its picture on the
// right, moving on every 7 seconds; the tabs under it show which is on and
// how long it has left. The strip glides one card along every 2 seconds.
// Both pause under the pointer, on focus and off screen, and hold still for
// reduced motion. The hero takes the colour of the story on show.

const FEATURES = [
  { story: article("gta-vi-countdown"), tab: "GTA VI", tone: "#4f7f96", cta: "Read the countdown" },
  { story: article("paris-fashion-week-ss27"), tab: "Paris Fashion Week", tone: "#6b3a3a", cta: "See the shows to watch" },
  { story: article("taylor-swift-the-life-of-a-showgirl-the-encore"), tab: "Taylor Swift", tone: "#6e3320", cta: "Read the story" },
];

const FEATURE_MS = 7000;
const STRIP_MS = 2000;

// The strip's positions: 0 in the middle, then two either side, smaller and dimmer
const offsetOf = (index: number, active: number) => {
  const n = CARDS.length;
  const d = (((index - active) % n) + n) % n;
  return d > n / 2 ? d - n : d;
};
const GAP = 0.08;
const SCALE = [1, 0.86, 0.74];
const X = [0, 0.5 + GAP + SCALE[1]! / 2, 0.5 + GAP + SCALE[1]! + GAP + SCALE[2]! / 2];

export function HeroGallery2() {
  const section = useRef<HTMLElement>(null);
  const [feature, setFeature] = useState(0);
  const [card, setCard] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holdFeature, setHoldFeature] = useState(false);
  const [holdStrip, setHoldStrip] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const lastOffsets = useRef<number[]>(CARDS.map((_, index) => offsetOf(index, 0)));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Only run while the hero is on screen (it is display: none unless chosen)
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The strip moves on every 2 seconds
  const stripRunning = !paused && !holdStrip && inView && !reduce;
  useEffect(() => {
    if (!stripRunning) return;
    const timer = window.setInterval(() => setCard((value) => (value + 1) % CARDS.length), STRIP_MS);
    return () => window.clearInterval(timer);
  }, [stripRunning]);

  const offsets = CARDS.map((_, index) => offsetOf(index, card));
  useEffect(() => { lastOffsets.current = offsets; });

  const featureRunning = !paused && !holdFeature && inView && !reduce;
  const current = FEATURES[feature]!;

  return (
    <section ref={section} className="gallery2" style={{ "--tone": current.tone } as CSSProperties} aria-labelledby="g2-title">
      <h1 id="g2-title" className="sr-only">OGCW, One Great Culture World</h1>

      <div className="gallery-bg" aria-hidden="true">
        {FEATURES.map((item, index) => (
          <img key={item.story.slug} src={item.story.photo.src} alt="" className={index === feature ? "is-on" : undefined} />
        ))}
      </div>

      <div className="g2-inner">
        {/* The top news: headline and button on the left, picture on the right */}
        <div
          className="g2-feature"
          aria-roledescription="carousel"
          aria-label="Top stories"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHoldFeature(true); }}
          onPointerLeave={() => setHoldFeature(false)}
          onFocus={() => setHoldFeature(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHoldFeature(false); }}
        >
          <div className="g2-stage">
            {FEATURES.map((item, index) => (
              <article
                key={item.story.slug}
                className="g2-slide"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${FEATURES.length}`}
                aria-hidden={index === feature ? undefined : true}
                data-on={index === feature}
              >
                <div className="g2-text">
                  <p className="g2-kicker">Top story · {item.story.kicker}</p>
                  <h2 className="g2-title">
                    <Link to="/news/$slug" params={{ slug: item.story.slug }} tabIndex={index === feature ? undefined : -1}>{item.story.title}</Link>
                  </h2>
                  <p className="g2-deck">{item.story.deck}</p>
                  <div className="g2-actions">
                    <Link to="/news/$slug" params={{ slug: item.story.slug }} className="g2-cta" tabIndex={index === feature ? undefined : -1}>
                      {item.cta} <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                    </Link>
                    <span className="g2-meta">{item.story.read} · By {item.story.author}</span>
                  </div>
                </div>
                <Link to="/news/$slug" params={{ slug: item.story.slug }} className="g2-picture" tabIndex={-1} aria-hidden="true">
                  <img src={item.story.photo.src} alt="" style={{ objectPosition: item.story.photo.crop?.pos ?? "50% 50%" }} loading={index === 0 ? "eager" : "lazy"} />
                </Link>
              </article>
            ))}
          </div>

          {/* One tab per story; the line fills while it is on show */}
          <div className="g2-tabs" role="group" aria-label="Choose a top story">
            {FEATURES.map((item, index) => (
              <button key={item.story.slug} type="button" className="g2-tab" aria-pressed={index === feature} onClick={() => setFeature(index)}>
                <span className="g2-tab-line" aria-hidden="true">
                  {index === feature && !reduce && (
                    <i key={feature} style={{ "--dur": `${FEATURE_MS}ms` } as CSSProperties} data-run={featureRunning} onAnimationEnd={() => setFeature((value) => (value + 1) % FEATURES.length)} />
                  )}
                </span>
                <span className="g2-tab-kicker">{item.story.kicker}</span>
                <span className="g2-tab-name">{item.tab}</span>
              </button>
            ))}
            {!reduce && (
              <button type="button" className="g2-pause" aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((value) => !value)}>
                {paused ? <Play size={15} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={15} strokeWidth={1.75} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        {/* The five doors into OGCW, smaller, gliding along underneath */}
        <ol
          className="g2-strip"
          aria-label="Explore OGCW"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHoldStrip(true); }}
          onPointerLeave={() => setHoldStrip(false)}
          onFocus={() => setHoldStrip(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHoldStrip(false); }}
        >
          {CARDS.map((item, index) => {
            const offset = offsets[index]!;
            const distance = Math.abs(offset);
            const wraps = Math.abs(offset - (lastOffsets.current[index] ?? offset)) > 2;
            return (
              <li
                key={item.id}
                className={`g2-card${wraps ? " is-wrapping" : ""}`}
                data-pos={distance}
                style={{ "--x": Math.sign(offset) * X[distance]!, "--s": SCALE[distance], zIndex: 10 - distance } as CSSProperties}
              >
                <CardLink dest={item.dest} className="g2-card-link" tabIndex={undefined} onClick={() => {}}>
                  <img src={item.photo} alt="" loading="lazy" draggable={false} />
                  <span className="g2-card-body">
                    <span className="g2-card-label">{item.label}</span>
                    <span className="g2-card-title">{item.title}</span>
                    <span className="g2-card-cta">{item.cta} <ArrowRight size={13} strokeWidth={2} aria-hidden="true" /></span>
                  </span>
                </CardLink>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
