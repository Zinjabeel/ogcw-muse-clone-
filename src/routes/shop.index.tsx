import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AddToCart, BlankCard, SaveButton, ShopShell } from "../components/shop-kit";
import { SNEAKER_DROPS, fullName, getProduct, isLive, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// The shop home, top to bottom (after Killstar's store):
//   hero          one photo, edge to edge, with the headline and a link at the bottom
//   what's new    square cards that keep gliding by, even under the pointer
//   new season    a still photo the size of the section, with a link; it slides
//                 up over What's new, and a short scroll glides the rest of the way
//   the edit      eight cards, four over four
//   the aisles    three tall photo cards side by side
//   collections   four rows of four cards, black, white, black, white
//   explore       featured drops, release dates, limited editions, brands, the gift guide
// For now only the One Piece Air Max Plus pairs show; every other product is
// a blank card (owner, 10 Oct 2026). No prices or counts anywhere. Words never
// move on scroll; with reduced motion nothing moves at all.

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "The OGCW Shop" },
      { name: "description", content: "Sneakers, football shirts, watches, chains and streaming, picked by OGCW and bought straight from the shop that makes them." },
      { property: "og:title", content: "The OGCW Shop" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShopHome,
});

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ONE_PIECE = ["one-piece-air-max-plus-ope-ope", "one-piece-air-max-plus-gomu-gomu", "one-piece-air-max-plus-mera-mera"].flatMap((id) => getProduct(id) ?? []);
/** A row of `size` slots: the given products first, blank cards after */
const slots = (products: ShopProduct[], size: number): (ShopProduct | null)[] => Array.from({ length: size }, (_, i) => products[i] ?? null);

const RAIL = slots(ONE_PIECE, 10);
const EDIT = slots(ONE_PIECE, 8);
// Photos from Unsplash (Justus Menke, Nathaniel Cherian, Alberto Rodríguez Santana,
// Nicolas Ladino Silva, Danist Soh)
const LOOKS = [
  { key: "sneakers", label: "Sneakers", search: { cat: "sneakers" }, image: "/shop/looks/sneakers.webp", alt: "White Nike sneakers on dark asphalt beside a painted white line" },
  { key: "clothing", label: "Clothing", search: { cat: "clothing" }, image: "/shop/looks/clothing.webp", alt: "A red and white football shirt hanging on a wall in warm light" },
  { key: "watches", label: "Watches & chains", search: { cat: "accessories" }, image: "/shop/looks/watches.webp", alt: "A man in a black coat wearing a gold chain" },
];
// The collection rows: names the owner can change with the site editor
const ROWS = [
  { key: "nike", title: "Nike x One Piece", tone: "dark" as const, items: slots(ONE_PIECE, 4) },
  { key: "travis", title: "Travis Scott x Cactus Jack", tone: "light" as const, items: slots([], 4) },
  { key: "complexcon", title: "ComplexCon top picks for 2026", tone: "dark" as const, items: slots([], 4) },
  { key: "worldcup", title: "Retro shirts for the World Cup", tone: "light" as const, items: slots([], 4) },
];

/** Scroll the page to `top` with a soft ease in and out; any wheel, touch or key takes over */
function glideTo(top: number, ms: number, done: () => void) {
  if (reduced()) { window.scrollTo(0, top); done(); return; }
  const from = window.scrollY;
  const distance = top - from;
  const start = performance.now();
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let frame = 0;
  const stop = () => { cancelAnimationFrame(frame); off(); done(); };
  const off = () => { window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop); window.removeEventListener("keydown", stop); };
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    window.scrollTo(0, from + distance * ease(p));
    if (p < 1) frame = requestAnimationFrame(step);
    else { off(); done(); }
  };
  frame = requestAnimationFrame(step);
}

/** What's new and the new-season photo stick in turn. The photo's progress
 *  over What's new is --p (0 to 1), and a scroll that stops part way glides
 *  on to the end, in the direction it was going */
function useStack(stack: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    let last = window.scrollY;
    let dir = 1;
    let timer = 0;
    let gliding = false;
    let frame = 0;
    const zone = () => {
      const header = document.querySelector<HTMLElement>(".sx-top")?.getBoundingClientRect().height ?? 0;
      const first = el.children[0] as HTMLElement | undefined;
      const start = el.getBoundingClientRect().top + window.scrollY - header;
      return { start, end: start + (first?.getBoundingClientRect().height ?? 0) };
    };
    const paint = () => {
      const { start, end } = zone();
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const settle = () => {
      if (gliding) return;
      const { start, end } = zone();
      const y = window.scrollY;
      if (y <= start + 2 || y >= end - 2) return;
      gliding = true;
      glideTo(dir > 0 ? end : start, 1100, () => { gliding = false; });
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== last && !gliding) dir = y > last ? 1 : -1;
      last = y;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 90);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [stack]);
}

function ShopHome() {
  const stack = useRef<HTMLDivElement>(null);
  useStack(stack);
  return (
    <ShopShell>
      <div className="sh">
        <Hero />
        <div className="sh-stack" ref={stack}>
          <WhatsNew />
          <NewSeason />
        </div>
        <TheEdit />
        <Looks />
        {ROWS.map((row) => <CollectionRow key={row.key} slug={row.key} title={row.title} tone={row.tone} items={row.items} />)}
        <Explore />
      </div>
    </ShopShell>
  );
}

/* ---------- The hero: one photo, the headline and a link ---------- */

function Hero() {
  return (
    <section className="sh-hero" aria-labelledby="sh-hero-title">
      <img className="sh-hero-img" src="/shop/looks/hero.webp" alt="Four friends in long coats and trainers standing in a city street at night" />
      <div className="sh-hero-copy">
        <h1 id="sh-hero-title" className="sh-hero-title"><T k="shop.hero.title">Wear the culture</T></h1>
        <Link to="/shop/all" search={{ tag: "new" }} className="sh-hero-cta"><T k="shop.hero.cta">Shop the latest</T></Link>
      </div>
    </section>
  );
}

/* ---------- A square card: a product, or a blank one still to come ---------- */

function ShopCard({ product, hidden = false, tone }: { product: ShopProduct | null; hidden?: boolean; tone?: "dark" | "light" | undefined }) {
  if (!product || !isLive(product)) return <BlankCard tone={tone} />;
  return (
    <article className="sh-square" aria-hidden={hidden || undefined}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-square-link" tabIndex={hidden ? -1 : undefined}>
        <span className="sh-square-photo"><img src={product.image} alt={hidden ? "" : `${fullName(product)}, ${product.colour}`} loading="lazy" /></span>
        <span className="sh-square-name">{fullName(product)}</span>
      </Link>
      {!hidden && <SaveButton product={product} />}
      {!hidden && <AddToCart product={product} />}
    </article>
  );
}

/* ---------- What's new: square cards gliding by without a stop ---------- */

function WhatsNew() {
  return (
    <section className="sh-sec sh-new" aria-labelledby="sh-new-title">
      <div className="sh-panel">
        <header className="sh-head">
          <h2 id="sh-new-title" className="sh-h2"><T k="shop.story.new">See what’s new</T></h2>
          <Link to="/shop/all" search={{ tag: "new" }} className="sh-textlink"><T k="shop.story.new.all">Shop all new in</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </header>
        <div className="sh-marquee">
          {/* Two copies one after the other, so the row can glide on forever */}
          <ul className="sh-marquee-track" style={{ "--n": RAIL.length } as CSSProperties}>
            {[0, 1].flatMap((copy) => RAIL.map((product, i) => (
              <li key={`${copy}-${i}`} className="sh-marquee-item"><ShopCard product={product} hidden={copy === 1} /></li>
            )))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- The new season: one still photo with a link ---------- */

function NewSeason() {
  return (
    <section className="sh-sec sh-season" aria-labelledby="sh-season-title">
      <Link to="/shop/all" search={{ tag: "new" }} className="sh-season-card">
        <img src="/shop/looks/new-season.webp" alt="Air Jordans lined up on a lit shop shelf" loading="lazy" />
        <span className="sh-season-text">
          <span id="sh-season-title" className="sh-season-title"><T k="shop.season.title">The new season</T></span>
          <span className="sh-season-cta"><T k="shop.season.cta">Shop new in</T></span>
        </span>
      </Link>
    </section>
  );
}

/* ---------- The edit: eight cards, four over four ---------- */

function TheEdit() {
  return (
    <section className="sh-sec sh-grid8" aria-labelledby="sh-edit-title">
      <div className="sh-panel">
        <header className="sh-head">
          <h2 id="sh-edit-title" className="sh-h2"><T k="shop.edit.title">The edit</T></h2>
          <Link to="/shop/all" className="sh-textlink"><T k="shop.edit.all">Shop everything</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </header>
        <ul className="sh-cards sh-cards-4">
          {EDIT.map((product, i) => <li key={i}><ShopCard product={product} /></li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------- The aisles: three tall photo cards side by side ---------- */

function Looks() {
  return (
    <section className="sh-sec sh-looks" aria-labelledby="sh-looks-title">
      <header className="sh-looks-head">
        <h2 id="sh-looks-title" className="sh-h2"><T k="shop.looks.title">Shop the aisles</T></h2>
        <p><T k="shop.looks.text">From terrace classics to Swiss steel: the pairs, shirts, watches and chains in our stories, each bought from the shop that makes it.</T></p>
      </header>
      <ul className="sh-looks-grid">
        {LOOKS.map((look) => (
          <li key={look.key}>
            <Link to="/shop/all" search={look.search} className="sh-look">
              <img src={look.image} alt={look.alt} loading="lazy" />
              <span className="sh-look-text">
                <span className="sh-look-name"><T k={`shop.looks.${look.key}`}>{look.label}</T></span>
                <span className="sh-look-more"><T k="shop.looks.more">Discover more</T></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- The collection rows: four cards each, black and white in turn ---------- */

function CollectionRow({ slug, title, tone, items }: { slug: string; title: string; tone: "dark" | "light"; items: (ShopProduct | null)[] }) {
  return (
    <section className="sh-row" data-tone={tone} aria-label={title}>
      <header className="sh-head">
        <h2 className="sh-h2"><T k={`shop.row.${slug}`}>{title}</T></h2>
        <Link to="/shop/all" className="sh-textlink"><T k="shop.row.all">Shop the collection</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      <ul className="sh-cards sh-cards-4">
        {items.map((product, i) => <li key={i}><ShopCard product={product} tone={tone} /></li>)}
      </ul>
    </section>
  );
}

/* ---------- Explore ---------- */

const dayMonth = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

function Explore() {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const next = SNEAKER_DROPS.find((drop) => drop.date >= today);
  return (
    <section className="sh-sec sh-explore" aria-labelledby="sh-explore-title">
      <header className="sh-head">
        <h2 id="sh-explore-title" className="sh-h2"><T k="shop.explore.title">Explore</T></h2>
      </header>
      <ul className="sh-explore-grid">
        <li className="is-drops">
          <Link to="/shop/all" search={{ tag: "drops" }} className="sh-tile sh-tile-photo">
            <img src="/shop/one-piece-air-max-plus-pack.webp" alt="" loading="lazy" />
            <span className="sh-tile-text">
              <span className="sh-tile-name"><T k="shop.explore.drops">Featured drops</T></span>
              <span className="sh-tile-note"><T k="shop.explore.drops.note">The One Piece pack, the Jordans on the calendar and the retro shirts.</T></span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/shop/drops" className="sh-tile sh-tile-date">
            <span className="sh-tile-kicker"><T k="shop.explore.dates.kicker">Next on the calendar</T></span>
            {next ? (
              <>
                <span className="sh-tile-big">{dayMonth(next.date)}</span>
                <span className="sh-tile-note">{next.name}</span>
              </>
            ) : <span className="sh-tile-note"><T k="shop.explore.dates.none">New dates soon.</T></span>}
            <span className="sh-tile-name"><T k="shop.explore.dates">Release dates</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </li>
        <li>
          <Link to="/shop/all" search={{ tag: "limited" }} className="sh-tile sh-tile-plain">
            <span className="sh-tile-kicker"><T k="shop.explore.limited.kicker">Collabs and grails</T></span>
            <span className="sh-tile-name"><T k="shop.explore.limited">Limited editions</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </li>
        <li>
          <Link to="/shop/brands" className="sh-tile sh-tile-az">
            <span className="sh-tile-letters" aria-hidden="true">A&nbsp;B&nbsp;C<br />X&nbsp;Y&nbsp;Z</span>
            <span className="sh-tile-name"><T k="shop.explore.brands">Brands A to Z</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </li>
        <li>
          <Link to="/shop/saved" className="sh-tile sh-tile-gift">
            <span className="sh-tile-kicker"><T k="shop.explore.saved.kicker">Your list</T></span>
            <span className="sh-tile-name"><T k="shop.explore.saved">Saved pieces</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
