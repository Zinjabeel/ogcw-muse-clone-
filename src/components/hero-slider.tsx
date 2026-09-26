import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import styleHero from "../assets/ogcw-hero-style.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";

// Hero, built on "hero section model 2": one full-bleed photo per story with
// the right-hand part frosted, a huge section word behind the headline, the
// story details on the frosted side, and a timeline along the bottom. Where
// the frosted edge meets the timeline sits the story's call to action (e.g.
// "Buy tickets"). Stories crossfade every 5 seconds.

type Slide = {
  word: string;
  kicker: string;
  title: string;
  date: string;
  datetime: string;
  heading: string;
  deck: string;
  facts: [string, string][];
  cta: string;
  image: string;
  pos: string;
  flip?: boolean; // mirror the photo so the subject sits on the sharp (left) side
};

// Cover stories. Will come from the admin panel later; the CTA links are
// placeholders until story and ticket pages exist.
const slides: Slide[] = [
  {
    word: "Style",
    kicker: "Style",
    title: "Independent labels reclaim the runway",
    date: "25 September 2026",
    datetime: "2026-09-25",
    heading: "Made small. Shown big.",
    deck: "A wave of independent labels is skipping the big houses and showing on its own terms, in car parks, basements and under bridges.",
    facts: [["06 min", "Read time"], ["Style", "Section"], ["25.09", "Published"]],
    cta: "Read story",
    image: styleHero,
    pos: "62% 40%",
    flip: true,
  },
  {
    word: "Music",
    kicker: "Music",
    title: "Small rooms, big sound: the live nights to know",
    date: "24 September 2026",
    datetime: "2026-09-24",
    heading: "The nights worth leaving the house for.",
    deck: "Two hundred people, one PA and no phones in the air. Our pick of the small-venue nights where the next wave is playing first.",
    facts: [["05 min", "Read time"], ["Music", "Section"], ["24.09", "Published"]],
    cta: "Buy tickets",
    image: musicHero,
    pos: "35% 45%",
  },
  {
    word: "Design",
    kicker: "Design",
    title: "Streetwear's new object makers",
    date: "23 September 2026",
    datetime: "2026-09-23",
    heading: "Built to outlast the feed.",
    deck: "The designers treating sneakers, headphones and homeware as objects to keep, not drops to flip.",
    facts: [["04 min", "Read time"], ["Design", "Section"], ["23.09", "Published"]],
    cta: "Read story",
    image: designHero,
    pos: "45% 55%",
    flip: true,
  },
];

const SLIDE_MS = 5000;
const pad = (n: number) => String(n + 1).padStart(2, "0");

// Advances every SLIDE_MS. Holds still while the reader hovers or focuses the
// hero, while the tab is hidden, and for reduced-motion users.
function useSlides(count: number) {
  const [active, setActive] = useState(0);
  const [round, setRound] = useState(0); // bumps to re-arm the timer (and restart the progress bar)
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setTimeout(() => {
      if (document.hidden) setRound((r) => r + 1);
      else setActive((i) => (i + 1) % count);
    }, SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [active, round, paused, reduced, count]);

  const hold = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };
  return { active, setActive, round, paused: paused || reduced, hold };
}

export function HeroSlider() {
  const { active, setActive, round, paused, hold } = useSlides(slides.length);
  const prev = (active - 1 + slides.length) % slides.length;
  const next = (active + 1) % slides.length;
  const current = slides[active]!;
  const prevSlide = slides[prev]!;
  const nextSlide = slides[next]!;

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Cover stories" {...hold}>
      <h1 className="sr-only">OGCW: One Great Culture World</h1>

      {slides.map((slide, index) => (
        <div
          key={slide.title}
          className="hero-slide"
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
          data-state={index === active ? "active" : index === prev ? "prev" : undefined}
          aria-hidden={index === active ? undefined : true}
          inert={index !== active}
        >
          <img className="hero-photo" src={slide.image} alt="" loading={index === 0 ? "eager" : "lazy"} style={{ objectPosition: slide.pos }} data-flip={slide.flip ? "" : undefined} />
          <span className="hero-word" aria-hidden="true">{slide.word}</span>

          <div className="hero-name">
            <p className="hero-kicker">{slide.kicker}</p>
            <h2 className="hero-title">{slide.title}</h2>
            <time className="hero-date" dateTime={slide.datetime}>{slide.date}</time>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-inner">
              <p className="hero-eyebrow">In this story</p>
              <p className="hero-heading">{slide.heading}</p>
              <p className="hero-deck">{slide.deck}</p>
              <dl className="hero-facts">
                {slide.facts.map(([value, label]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ))}

      {/* Thin frame with corner nodes, as in the reference */}
      <span className="hero-frame" aria-hidden="true"><i /><i /><i /><i /></span>

      {/* Timeline: previous story, the current story's call to action on the divider, next story */}
      <div className="hero-rail">
        <span className="hero-line" aria-hidden="true">
          <span key={`${active}-${round}`} className="hero-progress" data-paused={paused ? "" : undefined} />
        </span>
        <button type="button" className="hero-pill hero-pill-prev" onClick={() => setActive(prev)} aria-label={`Previous story: ${prevSlide.title}`}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {pad(prev)} {prevSlide.kicker}
        </button>
        <Link to="/news" className="hero-cta">
          {current.cta}
          <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
        <button type="button" className="hero-pill hero-pill-next" onClick={() => setActive(next)} aria-label={`Next story: ${nextSlide.title}`}>
          {pad(next)} {nextSlide.kicker}
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
