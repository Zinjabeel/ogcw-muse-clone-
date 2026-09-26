import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import styleHero from "../assets/ogcw-hero-style.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import drakePhoto from "../assets/drake.jpg.asset.json";

// Hero, built on "hero section model 2": one full-bleed photo per story
// (crossfading every 5 seconds) with a huge section word and the headline on
// the left 60%, and a frosted right-hand 40% that carries a featured event:
// photo, a few lines about it, and a Buy now button.

type Slide = {
  word: string;
  kicker: string;
  title: string;
  date: string;
  datetime: string;
  image: string;
  pos: string;
  flip?: boolean; // mirror the photo so the subject sits on the sharp (left) side
};

// Cover stories. Will come from the admin panel later.
const slides: Slide[] = [
  { word: "Style", kicker: "Style", title: "Independent labels reclaim the runway", date: "25 September 2026", datetime: "2026-09-25", image: styleHero, pos: "62% 40%", flip: true },
  { word: "Music", kicker: "Music", title: "Small rooms, big sound: the live nights to know", date: "24 September 2026", datetime: "2026-09-24", image: musicHero, pos: "35% 45%" },
  { word: "Design", kicker: "Design", title: "Streetwear's new object makers", date: "23 September 2026", datetime: "2026-09-23", image: designHero, pos: "45% 55%", flip: true },
];

// Featured event on the frosted side.
// TODO: fill in the real date, venue and ticket link once the concert is confirmed.
const event = {
  label: "Live · Tickets",
  title: "Drake, live in concert",
  copy: "The full show: two decades of hits, the new era and a crowd that knows every word. Tickets are limited, so don't sleep on this one.",
  when: "Date TBA",
  where: "Venue TBA",
  ticketUrl: "https://www.ticketmaster.com/search?q=drake",
  image: drakePhoto.url,
  imageAlt: "Drake on stage, pointing to the crowd with a microphone in hand",
};

const SLIDE_MS = 5000;
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
          <img className="hero-photo" src={slide.image} alt="" loading={index === 0 ? "eager" : "lazy"} style={{ objectPosition: slide.pos }} data-flip={slide.flip ? "" : undefined} />
          <span className="hero-word" aria-hidden="true">{slide.word}</span>
          <div className="hero-name">
            <p className="hero-kicker">{slide.kicker}</p>
            <h2 className="hero-title">{slide.title}</h2>
            <time className="hero-date" dateTime={slide.datetime}>{slide.date}</time>
          </div>
          {/* The frosted glass; the event sits on top of it and stays put between slides */}
          <div className="hero-panel" aria-hidden="true" />
        </div>
      ))}

      <aside className="hero-event" aria-labelledby="hero-event-title">
        <div className="hero-event-inner">
          <div className="hero-event-photo">
            <img src={event.image} alt={event.imageAlt} />
          </div>
          <div className="hero-event-body">
            <p className="hero-event-label">{event.label}</p>
            <h2 id="hero-event-title" className="hero-event-title">{event.title}</h2>
            <p className="hero-event-copy">{event.copy}</p>
            <p className="hero-event-meta">{event.when} · {event.where}</p>
            <a className="hero-event-buy" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
              Buy now
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </div>
      </aside>

      {/* Previous / next story */}
      <div className="hero-nav">
        <button type="button" className="hero-pill" onClick={() => setActive(prev)} aria-label={`Previous story: ${prevSlide.title}`}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {pad(prev)} {prevSlide.kicker}
        </button>
        <button type="button" className="hero-pill" onClick={() => setActive(next)} aria-label={`Next story: ${nextSlide.title}`}>
          {pad(next)} {nextSlide.kicker}
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
