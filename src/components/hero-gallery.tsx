import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { EditableImage, T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// Gallery hero: the five doors into OGCW (About, News, Shop, Forum,
// Subscribe), rebuilt 21 Oct 2026 as tall photo panels standing edge to
// edge across the whole screen, after the expanding galleries of fashion
// and sports sites. One panel is open wide with its words over the foot of
// its photo, in a shade of the photo's own colour; the other four stand
// narrow beside it, dimmed, with their number and name up the side. Every
// few seconds the next panel opens (the line in the bar underneath shows how
// long is left). Pointing at a panel, tabbing to it, or tapping it opens it;
// the open one is the link. The arrows, the arrow keys and the pause button
// work too. It stops under the pointer, on focus, off screen and while an
// admin edits, and never runs for reduced motion. Nothing moves on scroll.

export type Card = {
  id: string;
  label: string;
  title: string;
  copy: string;
  cta: string;
  dest: { to: "/about" | "/news" | "/shop" | "/forum" } | { hash: string };
  photo: string;
  alt: string;
  tone: string; // the photo's own average colour, measured from the image
};

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=80`;

export const CARDS: Card[] = [
  { id: "about", label: "About OGCW", title: "One Great Culture World", copy: "Who we are, what we cover and the people behind the stories.", cta: "Meet OGCW", dest: { to: "/about" }, photo: photo("photo-1470229722913-7c0e2dbbafd3"), alt: "A crowd with hands raised in front of a stage glowing orange", tone: "#8c5e4a" },
  { id: "news", label: "News", title: "Today’s news", copy: "Music, games, streaming and culture, reported every day with the sources linked.", cta: "Read the news", dest: { to: "/news" }, photo: photo("photo-1548495010-25018cf4d1a3"), alt: "A wall of giant lit billboards at night, the Glico running man in the middle", tone: "#4d749b" },
  { id: "shop", label: "Shop", title: "The OGCW Shop", copy: "Our picks from Nike, Adidas, StockX and Uniqlo, bought straight from the retailer.", cta: "Visit the shop", dest: { to: "/shop" }, photo: photo("photo-1542291026-7eec264c27ff"), alt: "A red Nike running shoe against a red background", tone: "#a91728" },
  { id: "blog", label: "Forum", title: "Join the OGCW Forum", copy: "Seven rooms to argue the rankings, swap release-day stories and vote on the week.", cta: "Open the forum", dest: { to: "/forum" }, photo: photo("photo-1552146334-354db0c44c97"), alt: "A man reading an illustrated magazine by a café window", tone: "#857f75" },
  { id: "subscribe", label: "Newsletter", title: "Subscribe for daily news", copy: "The day’s biggest stories in your inbox every morning. Free, and one tap to leave.", cta: "Subscribe", dest: { hash: "newsletter-title" }, photo: photo("photo-1743184437508-f1b3b793922b"), alt: "Scrolling the news on a phone beside a red coffee cup", tone: "#8f4a44" },
];

const DURATION = 5500; // ms per panel
const AIM_MS = 160; // how long the pointer rests on a panel before it opens
const pad = (n: number) => String(n).padStart(2, "0");

export function CardLink({ dest, className, onClick, tabIndex, children }: { dest: Card["dest"]; className: string; onClick: (event: MouseEvent) => void; tabIndex: number | undefined; children: ReactNode }) {
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
  const aim = useRef<number | undefined>(undefined);

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
  useEffect(() => () => window.clearTimeout(aim.current), []);

  const go = (step: number) => setActive((value) => (((value + step) % CARDS.length) + CARDS.length) % CARDS.length);
  const site = useSiteText();
  // Hold still while an admin points at or edits a text, so the panel stays open
  const running = !paused && !hold && inView && !reduce && !site.busy;
  const current = CARDS[active]!;
  const next = CARDS[(active + 1) % CARDS.length]!;

  // A panel opens once the pointer rests on it, so sweeping across the row doesn't flick them all open
  const aimAt = (index: number) => {
    window.clearTimeout(aim.current);
    aim.current = window.setTimeout(() => setActive(index), AIM_MS);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (((active + (event.key === "ArrowRight" ? 1 : -1)) % CARDS.length) + CARDS.length) % CARDS.length;
    setActive(next);
    section.current?.querySelectorAll<HTMLElement>(".glx-link")[next]?.focus();
  };

  return (
    <section ref={section} className="gallery glx" aria-roledescription="carousel" aria-labelledby="gallery-title">
      <h1 id="gallery-title" className="sr-only">OGCW, One Great Culture World</h1>

      <ol
        className="glx-panels"
        // Keeps turning under the mouse (owner, 23 Oct 2026); only keyboard focus holds it still
        onPointerLeave={() => window.clearTimeout(aim.current)}
        onFocus={(event) => { if (event.target.matches(":focus-visible")) setHold(true); }}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
        onKeyDown={onKeyDown}
      >
        {CARDS.map((card, index) => {
          const open = index === active;
          return (
            <li
              key={card.id}
              className="glx-panel"
              data-open={open}
              style={{ "--tone": card.tone } as CSSProperties}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${CARDS.length}: ${card.label}`}
              aria-current={open ? "true" : undefined}
              onPointerEnter={(event) => { if (event.pointerType === "mouse" && !open) aimAt(index); }}
              onPointerLeave={() => window.clearTimeout(aim.current)}
              // Tabbing to a panel opens it (a click or a tap opens it in onClick, before it can be followed)
              onFocus={(event) => { if (event.target.matches(":focus-visible")) setActive(index); }}
            >
              <CardLink
                dest={card.dest}
                className="glx-link"
                tabIndex={undefined}
                // A closed panel opens first; the open one is the link
                onClick={(event) => { if (!open) { event.preventDefault(); setActive(index); } }}
              >
                <span className="glx-photo">
                  <EditableImage k={`hero.card.${card.id}`} src={card.photo} alt={card.alt} loading="lazy" draggable={false} />
                </span>
                <span className="glx-spine" aria-hidden="true">
                  <span className="glx-num">{pad(index + 1)}</span>
                  <span className="glx-spine-label"><T k={`hero.card.${card.id}.label`}>{card.label}</T></span>
                </span>
                <span className="glx-body">
                  <span className="glx-label"><span className="glx-num">{pad(index + 1)}</span><T k={`hero.card.${card.id}.label`}>{card.label}</T></span>
                  <span className="glx-title"><T k={`hero.card.${card.id}.title`}>{card.title}</T></span>
                  <span className="glx-copy"><T k={`hero.card.${card.id}.copy`}>{card.copy}</T></span>
                  <span className="glx-cta"><T k={`hero.card.${card.id}.cta`}>{card.cta}</T> <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></span>
                </span>
              </CardLink>
            </li>
          );
        })}
      </ol>

      {/* Which panel is open and how long it has left, and the controls */}
      <div className="glx-foot">
        <p className="glx-count">
          <span className="sr-only">Panel </span>
          <span>{pad(active + 1)}</span>
          <span className="glx-line" aria-hidden="true">
            {!reduce && <i key={active} style={{ "--dur": `${DURATION}ms` } as CSSProperties} data-run={running} onAnimationEnd={() => go(1)} />}
          </span>
          <span className="sr-only"> of </span>
          <span>{pad(CARDS.length)}</span>
        </p>
        <p className="sr-only" aria-live={running ? "off" : "polite"}><T k={`hero.card.${current.id}.label`}>{current.label}</T></p>
        <p className="glx-next" aria-hidden="true"><span className="glx-next-tag"><T k="hero.gallery.next">Next</T></span><T k={`hero.card.${next.id}.label`}>{next.label}</T></p>
        <div className="glx-controls">
          <button type="button" aria-label="Previous panel" onClick={() => go(-1)}><ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" /></button>
          {!reduce && (
            <button type="button" aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((value) => !value)}>
              {paused ? <Play size={15} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={15} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          )}
          <button type="button" aria-label="Next panel" onClick={() => go(1)}><ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
