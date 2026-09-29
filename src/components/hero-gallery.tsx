import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";

// Gallery hero (the default in the hero switcher): the five doors into OGCW
// (About, News, Shop, Blog, Subscribe) as cards on a stage. The current card
// stands in the middle of the screen, larger than the rest, with two smaller
// cards on each side. Every few seconds the row glides one place and the
// next card takes the middle; the row loops, so there are always cards on
// both sides. The whole hero takes the colour of the middle card's photo.
// Arrows, the arrow keys, a swipe or a click on a side card move it by hand.
// Autoplay pauses under the pointer, on focus, off screen and on the pause
// button, and never runs for reduced motion.

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

const DURATION = 5500; // ms per card
const pad = (n: number) => String(n).padStart(2, "0");

// Where a card sits relative to the middle one: 0 is the middle, -1 and 1
// its neighbours, -2 and 2 the outer cards
const offsetOf = (index: number, active: number) => {
  const n = CARDS.length;
  const d = (((index - active) % n) + n) % n;
  return d > n / 2 ? d - n : d;
};
// Each position's centre (in card widths from the middle) and size. The
// neighbours are 80% and the outer cards 64% of the middle card, with a gap
// of 6% of a card width between them.
const GAP = 0.06;
const SCALE = [1, 0.8, 0.64];
const X = [0, 0.5 + GAP + SCALE[1]! / 2, 0.5 + GAP + SCALE[1]! + GAP + SCALE[2]! / 2];

function CardLink({ dest, className, onClick, tabIndex, children }: { dest: Card["dest"]; className: string; onClick: (event: MouseEvent) => void; tabIndex: number | undefined; children: ReactNode }) {
  if ("to" in dest) return <Link to={dest.to} className={className} onClick={onClick} tabIndex={tabIndex}>{children}</Link>;
  return <Link to="/" hash={dest.hash} className={className} onClick={onClick} tabIndex={tabIndex}>{children}</Link>;
}

export function HeroGallery() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  // Where each card was last time, to spot the one that wraps round the back
  const lastOffsets = useRef<number[]>(CARDS.map((_, index) => offsetOf(index, 0)));
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);

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

  const offsets = CARDS.map((_, index) => offsetOf(index, active));
  useEffect(() => { lastOffsets.current = offsets; });

  const go = (step: number) => setActive((value) => (((value + step) % CARDS.length) + CARDS.length) % CARDS.length);
  const running = !paused && !hold && inView && !reduce;
  const current = CARDS[active]!;

  // Swipe on touch screens (and drag with a mouse): a clear sideways move of 40px or more
  const onPointerDown = (event: PointerEvent) => { swipe.current = { x: event.clientX, y: event.clientY, moved: false }; };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
      start.moved = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
  };

  return (
    <section
      ref={section}
      className="gallery"
      style={{ "--tone": current.tone } as CSSProperties}
      aria-roledescription="carousel"
      aria-labelledby="gallery-title"
    >
      <h1 id="gallery-title" className="sr-only">OGCW, One Great Culture World</h1>

      {/* The ambient light: the middle card's photo, blurred, over a wash of its colour */}
      <div className="gallery-bg" aria-hidden="true">
        {CARDS.map((card, index) => (
          <img key={card.id} src={card.photo} alt="" className={index === active ? "is-on" : undefined} />
        ))}
      </div>

      <div className="gallery-stage">
        <ol
          className="gallery-cards"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHold(true); }}
          onPointerLeave={() => setHold(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onFocus={() => setHold(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
          onKeyDown={onKeyDown}
        >
          {CARDS.map((card, index) => {
            const offset = offsets[index]!;
            const distance = Math.abs(offset);
            // A card jumping from one end of the row to the other moves out of sight, with no slide
            const wraps = Math.abs(offset - (lastOffsets.current[index] ?? offset)) > 2;
            return (
              <li
                key={card.id}
                className={`gallery-card${wraps ? " is-wrapping" : ""}`}
                data-pos={distance}
                style={{ "--x": Math.sign(offset) * X[distance]!, "--s": SCALE[distance], zIndex: 10 - distance } as CSSProperties}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${CARDS.length}: ${card.label}`}
                aria-current={offset === 0 ? "true" : undefined}
              >
                <CardLink
                  dest={card.dest}
                  className="gallery-card-link"
                  // Only the middle card is in the tab order; the others are reached with the arrows
                  tabIndex={offset === 0 ? undefined : -1}
                  onClick={(event) => {
                    if (swipe.current?.moved) { event.preventDefault(); swipe.current = null; return; }
                    // A card on the side comes to the middle first
                    if (offset !== 0) { event.preventDefault(); go(offset); }
                  }}
                >
                  <img src={card.photo} alt={card.alt} loading={distance < 2 ? "eager" : "lazy"} draggable={false} />
                  <span className="gallery-card-body">
                    <span className="gallery-card-label">{card.label}</span>
                    <span className="gallery-card-title">{card.title}</span>
                    <span className="gallery-card-copy">{card.copy}</span>
                    <span className="gallery-card-cta">{card.cta} <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></span>
                  </span>
                </CardLink>
              </li>
            );
          })}
        </ol>

        <div className="gallery-foot">
          <p className="gallery-now" aria-live={running ? "off" : "polite"}>{current.label}</p>
          <p className="gallery-count">
            <span className="sr-only">Card </span>
            <span>{pad(active + 1)}</span>
            <span className="gallery-line" aria-hidden="true">
              {!reduce && (
                <i key={active} style={{ "--dur": `${DURATION}ms` } as CSSProperties} data-run={running} onAnimationEnd={() => go(1)} />
              )}
            </span>
            <span className="sr-only"> of </span>
            <span>{pad(CARDS.length)}</span>
          </p>
          <div className="gallery-controls">
            <button type="button" aria-label="Previous card" onClick={() => go(-1)}><ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" /></button>
            {!reduce && (
              <button type="button" aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((value) => !value)}>
                {paused ? <Play size={15} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={15} strokeWidth={1.75} aria-hidden="true" />}
              </button>
            )}
            <button type="button" aria-label="Next card" onClick={() => go(1)}><ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
