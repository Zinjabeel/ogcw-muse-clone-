import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

// Gallery hero (the default in the hero switcher): five equal cards, one for
// each door into OGCW (About, News, Shop, Blog, Subscribe), in a row that
// slides so the current card sits in the middle. The whole hero takes on the
// colour of the current card's photo and eases to the next one as the row
// moves on every few seconds. Cards lift under the pointer. Autoplay pauses
// on hover or focus, off screen, on the pause button, and never runs for
// reduced motion. The bottom of the hero melts into OGCW News as you scroll.

type Card = {
  id: string;
  label: string;
  title: string;
  copy: string;
  cta: string;
  dest: { to: "/about" | "/news" | "/shop" | "/blog" } | { hash: string };
  photo: string;
  alt: string;
  tone: string; // the photo's own average colour, measured from the image
};

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=80`;

const CARDS: Card[] = [
  { id: "about", label: "About OGCW", title: "One Great Culture World", copy: "Who we are, what we cover and the people behind the stories.", cta: "Meet OGCW", dest: { to: "/about" }, photo: photo("photo-1470229722913-7c0e2dbbafd3"), alt: "A crowd with hands raised in front of a stage glowing orange", tone: "#8c5e4a" },
  { id: "news", label: "News", title: "Today’s news", copy: "Music, games, streaming and culture, reported every day with the sources linked.", cta: "Read the news", dest: { to: "/news" }, photo: photo("photo-1504711434969-e33886168f5c"), alt: "A stack of folded newspapers", tone: "#6f8499" },
  { id: "shop", label: "Shop", title: "The OGCW Shop", copy: "Our picks from Nike, Adidas, StockX and Uniqlo, bought straight from the retailer.", cta: "Visit the shop", dest: { to: "/shop" }, photo: photo("photo-1542291026-7eec264c27ff"), alt: "A red Nike running shoe against a red background", tone: "#a91728" },
  { id: "blog", label: "Blog", title: "Check out our blog", copy: "Long reads and deep dives from the OGCW desk, for when a headline isn’t enough.", cta: "Read the blog", dest: { to: "/blog" }, photo: photo("photo-1455390582262-044cdead277a"), alt: "A fountain pen writing on a sheet of paper", tone: "#7b6f5a" },
  { id: "subscribe", label: "Newsletter", title: "Subscribe for daily news", copy: "The day’s biggest stories in your inbox every morning. Free, and one tap to leave.", cta: "Subscribe", dest: { hash: "newsletter-title" }, photo: photo("photo-1511707171634-5f897ff02aa9"), alt: "A smartphone lying on a white desk", tone: "#4f8aa3" },
];

const DURATION = 6000; // ms per card
const pad = (n: number) => String(n).padStart(2, "0");

function CardLink({ dest, className, onClick, children }: { dest: Card["dest"]; className: string; onClick: (event: MouseEvent) => void; children: ReactNode }) {
  if ("to" in dest) return <Link to={dest.to} className={className} onClick={onClick}>{children}</Link>;
  return <Link to="/" hash={dest.hash} className={className} onClick={onClick}>{children}</Link>;
}

export function HeroGallery() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0); // the latest card, for clicks that land before a re-render
  activeRef.current = active;
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

  // Only run while the hero is on screen (it is display: none when the cover hero is chosen)
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The current card is the one closest to the middle of the row
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      let best = 0, bestDistance = Infinity;
      Array.from(el.children).forEach((card, index) => {
        const r = card.getBoundingClientRect();
        const distance = Math.abs(r.left + r.width / 2 - middle);
        if (distance < bestDistance) { best = index; bestDistance = distance; }
      });
      setActive(best);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  // Wide screens show all five cards at once; narrower ones scroll the row
  const scrollable = () => { const el = track.current; return !!el && el.scrollWidth > el.clientWidth + 2; };

  const goTo = useCallback((index: number) => {
    activeRef.current = index;
    setActive(index);
    const el = track.current;
    const card = el?.children[index] as HTMLElement | undefined;
    if (!el || !card || el.scrollWidth <= el.clientWidth + 2) return;
    el.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  const next = () => goTo((activeRef.current + 1) % CARDS.length);
  const previous = () => goTo((activeRef.current - 1 + CARDS.length) % CARDS.length);
  const running = !paused && !hold && inView && !reduce;
  const current = CARDS[active]!;

  return (
    <section
      ref={section}
      className="gallery"
      style={{ "--tone": current.tone } as CSSProperties}
      aria-roledescription="carousel"
      aria-labelledby="gallery-title"
    >
      <h1 id="gallery-title" className="sr-only">OGCW, One Great Culture World</h1>

      {/* The ambient light: the current photo, blurred, over a wash of its colour */}
      <div className="gallery-bg" aria-hidden="true">
        {CARDS.map((card, index) => (
          <img key={card.id} src={card.photo} alt="" className={index === active ? "is-on" : undefined} />
        ))}
      </div>

      <div className="gallery-stage">
        <ol
          className="gallery-track"
          ref={track}
          onPointerEnter={() => setHold(true)}
          onPointerLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
        >
          {CARDS.map((card, index) => (
            <li
              key={card.id}
              className="gallery-card"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${CARDS.length}: ${card.label}`}
              aria-current={index === active ? "true" : undefined}
              // With all five on screen, the hero takes the colour of the card under the pointer
              onPointerEnter={() => { if (!scrollable()) setActive(index); }}
            >
              <CardLink
                dest={card.dest}
                className="gallery-card-link"
                // In the sliding row, a card that isn't in the middle yet slides there first
                onClick={(event) => { if (index !== active && scrollable()) { event.preventDefault(); goTo(index); } }}
              >
                <img src={card.photo} alt={card.alt} loading={index < 3 ? "eager" : "lazy"} />
                <span className="gallery-card-body">
                  <span className="gallery-card-label">{card.label}</span>
                  <span className="gallery-card-title">{card.title}</span>
                  <span className="gallery-card-copy">{card.copy}</span>
                  <span className="gallery-card-cta">{card.cta} <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></span>
                </span>
              </CardLink>
            </li>
          ))}
        </ol>

        <div className="gallery-foot">
          <p className="gallery-now" aria-live={running ? "off" : "polite"}>{current.label}</p>
          <p className="gallery-count">
            <span className="sr-only">Card </span>
            <span>{pad(active + 1)}</span>
            <span className="gallery-line" aria-hidden="true">
              {!reduce && (
                <i key={active} style={{ "--dur": `${DURATION}ms` } as CSSProperties} data-run={running} onAnimationEnd={next} />
              )}
            </span>
            <span className="sr-only"> of </span>
            <span>{pad(CARDS.length)}</span>
          </p>
          <div className="gallery-controls">
            <button type="button" aria-label="Previous card" onClick={previous}><ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" /></button>
            {!reduce && (
              <button type="button" aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((value) => !value)}>
                {paused ? <Play size={15} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={15} strokeWidth={1.75} aria-hidden="true" />}
              </button>
            )}
            <button type="button" aria-label="Next card" onClick={next}><ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
