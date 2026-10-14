import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AddToCart, BlankCard, ProductPhoto, SaveButton, ShopShell, firstTapShowsBack } from "../components/shop-kit";
import { SNEAKER_DROPS, fullName, getProduct, isLive, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// The shop home, top to bottom (after Killstar's store):
//   hero          one photo, edge to edge, with the headline and a link at the bottom
//   what's new    square cards that keep gliding by, even under the pointer
//   new season    a still photo the size of the section, with a link; it slides
//                 up over What's new, and a short scroll glides the rest of the way
//   the edit      eight cards, four over four
//   the aisles    three tall photo cards side by side: sneakers, clothing, collections
//   the rows      sneakers, Cactus Jack, ComplexCon picks, graphic tees, denim and
//                 watches, black and white in turn, four cards to a line
//   explore       featured drops, release dates, limited editions, brands, the gift guide
// The cards are the live catalogue (src/data/shop-catalog.ts): each has two
// photos, the second under the pointer. No prices or counts anywhere. Words
// never move on scroll; with reduced motion nothing moves at all.

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
/** The products with these ids, in this order (the live catalogue: src/data/shop-catalog.ts) */
const pieces = (...ids: string[]) => ids.flatMap((id) => getProduct(id) ?? []);

// What's new: the latest pieces across the aisles
const RAIL = pieces("aj1-royal-2026", "rolex-land-dweller-36", "denim-tears-patchwork-pant-blue", "sp5der-splat-punk-hoodie", "awake-ny-aj6-blueberry", "panerai-radiomir-manual-white", "ksubi-maxx-astral-kraftwerk", "aj4-rare-air-tour-yellow", "grand-seiko-sbgj273-red", "nike-air-bakin-varsity-red");
// The aisle photos: the owner's pictures for Sneakers and Collections ("sneakers,
// clothing and collections"; the clothing one was a Gemini blob link that only
// opens in the owner's browser, so it stays), clothing from Unsplash (Nathaniel Cherian)
const LOOKS = [
  { key: "sneakers", label: "Sneakers", search: { cat: "sneakers" }, image: "/shop/looks/sneakers-aisle.jpg", alt: "A hand holding out a white and sage green sneaker towards the camera" },
  { key: "clothing", label: "Clothing", search: { cat: "clothing" }, image: "/shop/looks/clothing.webp", alt: "A red and white football shirt hanging on a wall in warm light" },
  { key: "collections", label: "Collections", search: { cat: "accessories" }, image: "/shop/looks/collections-aisle.jpg", alt: "A hand in a black sleeve wearing a steel chronograph, on grey" },
];
// The edit: one of each, across the shop
const EDIT = pieces("fragment-travis-aj1-low-military-blue", "cartier-tank-basculante", "denim-tears-baggy-pant-selvedge", "nike-centre-swoosh-hoodie", "omega-speedmaster-145-022", "tiger-totem-hoodie", "cactus-jack-script-tee", "nb-9060-black-cat");
// The collection rows, black and white in turn: names the owner can change with the site editor
type RowSearch = { cat?: string; q?: string; tag?: string };
const ROWS: { key: string; title: string; tone: "dark" | "light"; items: ShopProduct[]; search: RowSearch }[] = [
  { key: "sneakers", title: "Sneakers right now", tone: "dark", search: { cat: "sneakers" }, items: pieces("aj4-black-cat-2025", "travis-scott-af1-ice-blue", "nigel-sylvester-aj4-brick-after-brick", "aj11-gamma-blue-2025", "samba-og-cheetah-preloved-red", "aj13-flint-2026", "huf-air-max-1-orange", "nb-1906r-silver-metallic-black") },
  { key: "travis", title: "Travis Scott x Cactus Jack", tone: "light", search: { q: "Cactus Jack" }, items: pieces("days-before-rodeo-hoodie", "circus-maximus-hoodie", "utopia-hoodie", "apple-pie-hoodie") },
  { key: "complexcon", title: "ComplexCon top picks for 2026", tone: "dark", search: { q: "Sp5der" }, items: pieces("sp5der-pnk-hoodie", "sp5der-og-web-hoodie", "sp5der-splat-punk-hoodie", "sp5der-beluga-hoodie", "cactus-jack-barcelona-hoodie", "nocta-nike-canada-hoodie", "sp5der-denim-v3-indigo", "yeezy-350-v2-onyx") },
  { key: "tees", title: "Graphic tees", tone: "light", search: { q: "Tee" }, items: pieces("kaws-fragment-tee", "mcdonalds-smile-tee", "fragment-tee", "cactus-mac-tee") },
  { key: "denim", title: "Denim", tone: "dark", search: { q: "Jeans" }, items: pieces("levis-denim-tears-logo-japan-jeans", "amiri-carpenter-jeans-aged-black", "hellstar-denim-blue", "butter-goods-solar-fade-grey", "ksubi-chitch-chronicle-trashed", "purple-brand-baggy-black", "acne-studios-printed-jeans-blue", "supreme-dickies-cordura-cargo-denim") },
  { key: "collections", title: "Collections", tone: "light", search: { cat: "accessories" }, items: pieces("rolex-explorer-114270", "omega-seamaster-300m-blue", "tudor-black-bay-58-black", "cartier-roadster-silver", "vacheron-patrimony-rose-gold", "breitling-navitimer-b01-46", "nomos-zurich-807", "bell-ross-br05-blue") },
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
        {ROWS.map((row) => <CollectionRow key={row.key} slug={row.key} title={row.title} tone={row.tone} items={row.items} search={row.search} />)}
        <Explore />
      </div>
    </ShopShell>
  );
}

/* ---------- The hero: one photo, the headline and a link ---------- */

// One sneaker on a deep blue wall: Karsten Winegeart on Unsplash (Unsplash License)
function Hero() {
  return (
    <section className="sh-hero" aria-labelledby="sh-hero-title">
      <img className="sh-hero-img" src="/shop/looks/hero-sneaker.webp" alt="A single white, black and blue sneaker floating against a deep blue wall" />
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
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-square-link" tabIndex={hidden ? -1 : undefined} onClick={firstTapShowsBack}>
        <ProductPhoto product={product} hidden={hidden} className="sh-square-photo" />
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
          {EDIT.map((product) => <li key={product.id}><ShopCard product={product} /></li>)}
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

function CollectionRow({ slug, title, tone, items, search }: { slug: string; title: string; tone: "dark" | "light"; items: ShopProduct[]; search: RowSearch }) {
  return (
    <section className="sh-row" data-tone={tone} aria-label={title}>
      <header className="sh-head">
        <h2 className="sh-h2"><T k={`shop.row.${slug}`}>{title}</T></h2>
        <Link to="/shop/all" search={search} className="sh-textlink"><T k="shop.row.all">Shop the collection</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      <ul className="sh-cards sh-cards-4">
        {items.map((product) => <li key={product.id}><ShopCard product={product} tone={tone} /></li>)}
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
              <span className="sh-tile-note"><T k="shop.explore.drops.note">The Jordans on the calendar, the collabs and the One Piece pack.</T></span>
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
