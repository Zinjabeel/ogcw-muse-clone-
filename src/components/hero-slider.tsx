import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";
import centralCeePhoto from "../assets/central-cee.jpg";
import drakePhoto from "../assets/drake.jpg.asset.json";
import { storyIndex as s, type Story } from "./nav-drawer";

// Hero, built on "hero section model 2" and styled like complex.com's
// cover: a full-bleed photo that sits back like a background (darkened,
// slowly settling from a slight zoom) with a huge word and the headline on
// the left, and a floating frosted panel (about 40% wide, pulled in from the
// right edge) whose content changes with each slide and fades in with it.
//   1. Welcome to One Great Culture World: the OGCW logo and featured news
//   2. Drake: the concert, with Buy now
//   3. Central Cee: his feature
// Slides change every 3 seconds, holding while the reader hovers or focuses.

type Slide = {
  word: string;
  kicker: string;
  title: string;
  sub: string;
  image: string;
  pos: string; // photo focal point
  tall?: boolean; // draw the photo taller than the hero so its bottom strip (e.g. a watermark) is cut off
  panel: ReactNode;
};

// TODO: fill in the real date, venue and ticket link once the concert is confirmed.
const DRAKE_TICKETS = "https://www.ticketmaster.com/search?q=drake";

const featured: Story[] = [s.cee, s.labels, s.bars];

const slides: Slide[] = [
  {
    word: "OGCW",
    kicker: "Welcome",
    title: "Welcome to One Great Culture World",
    sub: "Music, fashion, film & TV, sport and pop culture from everywhere, in one place.",
    image: editorialGrid,
    pos: "50% 50%",
    panel: (
      <>
        <div className="hero-brand">
          <span className="hero-brand-mark">OGCW</span>
          <span className="hero-brand-name">One Great Culture World</span>
        </div>
        <p className="hero-panel-label">Featured now</p>
        <ol className="hero-featured">
          {featured.map((story, index) => {
            const [section, read] = story.sub.split(" / ");
            const crop = story.crop ?? { pos: "50% 50%", zoom: 1 };
            return (
              <li key={story.title}>
                <Link to="/news" className="hero-featured-item">
                  <span className="hero-featured-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="hero-featured-thumb"><img src={story.image} alt="" style={{ objectPosition: crop.pos }} /></span>
                  <span>
                    <span className="hero-featured-section">{section}</span>
                    <span className="hero-featured-title">{story.title}</span>
                    <span className="hero-featured-read">{read}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </>
    ),
  },
  {
    word: "Live",
    kicker: "Live",
    title: "Drake, live in concert",
    sub: "Date TBA · Venue TBA",
    image: drakePhoto.url,
    pos: "50% 0%",
    tall: true,
    panel: (
      <>
        <div className="hero-panel-photo">
          <img src={drakePhoto.url} alt="Drake on stage, pointing to the crowd with a microphone in hand" />
        </div>
        <p className="hero-panel-label">Live · Tickets</p>
        <h3 className="hero-panel-title">Drake, live in concert</h3>
        <p className="hero-panel-copy">The full show: two decades of hits, the new era and a crowd that knows every word. Tickets are limited, so don't sleep on this one.</p>
        <p className="hero-panel-meta">Date TBA · Venue TBA</p>
        <a className="hero-panel-button" href={DRAKE_TICKETS} target="_blank" rel="noopener noreferrer">
          Buy now <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
        </a>
      </>
    ),
  },
  {
    word: "Music",
    kicker: "Music",
    title: "Central Cee and the global rise of UK rap",
    sub: "7 min read",
    image: centralCeePhoto,
    pos: "50% 16%",
    panel: (
      <>
        <p className="hero-panel-label">Music · Feature</p>
        <h3 className="hero-panel-title">How Central Cee took UK drill global</h3>
        <p className="hero-panel-copy">From “Sprinter” to “Band4Band”, how the West London rapper carried British drill from the estate to the world stage.</p>
        <p className="hero-panel-meta">7 min read</p>
        <Link to="/news" className="hero-panel-button">
          Read the story <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
        <p className="hero-panel-label hero-panel-more">More on UK rap</p>
        <ul className="hero-panel-links">
          <li><Link to="/news">{s.vedan.title}</Link></li>
          <li><Link to="/news">{s.bars.title}</Link></li>
        </ul>
      </>
    ),
  },
];

const SLIDE_MS = 3000;
const pad = (n: number) => String(n + 1).padStart(2, "0");

// Advances every SLIDE_MS. Holds still while the reader hovers or focuses the
// hero, while the tab is hidden, and for reduced-motion users.
function useSlides(count: number) {
  const [active, setActive] = useState(0);
  const [round, setRound] = useState(0); // bumps to re-arm the timer while the tab is hidden
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
  return { active, setActive, hold };
}

export function HeroSlider() {
  const { active, setActive, hold } = useSlides(slides.length);
  const prev = (active - 1 + slides.length) % slides.length;
  const next = (active + 1) % slides.length;
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
          <img className="hero-photo" src={slide.image} alt="" loading={index === 0 ? "eager" : "lazy"} style={{ objectPosition: slide.pos }} data-tall={slide.tall ? "" : undefined} />
          <span className="hero-word" aria-hidden="true">{slide.word}</span>
          <div className="hero-name">
            <p className="hero-kicker">{slide.kicker}</p>
            <h2 className="hero-title">{slide.title}</h2>
            <p className="hero-date">{slide.sub}</p>
          </div>
          {/* Floating frosted panel; its content belongs to this slide and fades in with it */}
          <div className="hero-panel">
            <div className="hero-panel-inner">{slide.panel}</div>
          </div>
        </div>
      ))}

      {/* Previous / next story */}
      <div className="hero-nav">
        <button type="button" className="hero-pill" onClick={() => setActive(prev)} aria-label={`Previous: ${prevSlide.title}`}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {pad(prev)} {prevSlide.kicker}
        </button>
        <button type="button" className="hero-pill" onClick={() => setActive(next)} aria-label={`Next: ${nextSlide.title}`}>
          {pad(next)} {nextSlide.kicker}
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
