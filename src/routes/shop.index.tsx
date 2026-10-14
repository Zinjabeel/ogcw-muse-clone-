import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AddToCart, BlankCard, ProductPhoto, SaveButton, ShopShell, firstTapShowsBack } from "../components/shop-kit";
import { BRANDS, SNEAKER_DROPS, brandOf, fullName, getProduct, isLive, type ShopProduct } from "../data/shop";
import { LOGO_SLUGS, logoOf } from "../data/shop-logos";
import { UPCOMING } from "../data/shop-upcoming";
import { T } from "@/components/site-text";

// The shop home, top to bottom (after Killstar's store):
//   hero          one photo, edge to edge, with the headline and a link at the bottom
//   what's new    square cards that keep gliding by, even under the pointer
//   new season    a still photo the size of the section, with a link; it slides
//                 up over What's new, and a short scroll glides the rest of the way
//   the aisles    three tall photo cards side by side: sneakers, clothing, collections
//   the rows      sneakers, Cactus Jack, ComplexCon picks, graphic tees, denim and
//                 watches, black and white in turn: one kind of product each, four
//                 cards and a button to the aisle; bands with one line and a button
//                 (release dates, limited editions, brands) between them
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

// What's new: the newest pairs (each section holds one kind of product: owner, 14 Oct)
const RAIL = pieces("aj1-royal-2026", "awake-ny-aj6-blueberry", "aj4-rare-air-tour-yellow", "nike-air-bakin-varsity-red", "aj13-flint-2026", "travis-scott-af1-ice-blue", "aj3-true-blue-2026", "aj5-black-carolina-2026");
// The aisle photos: the owner's pictures ("sneakers, clothing and collections";
// the clothing one sent in the chat, 14 Oct)
const LOOKS = [
  { key: "sneakers", label: "Sneakers", search: { cat: "sneakers" }, image: "/shop/looks/sneakers-aisle.jpg", alt: "A hand holding out a white and sage green sneaker towards the camera" },
  { key: "clothing", label: "Clothing", search: { cat: "clothing" }, image: "/shop/looks/clothing-aisle.webp", alt: "Seen from behind, a person pulling up the hood of a washed black hoodie printed with carved figures" },
  { key: "collections", label: "Collections", search: { cat: "accessories" }, image: "/shop/looks/collections-aisle.jpg", alt: "A hand in a black sleeve wearing a steel chronograph, on grey" },
];
// The collection rows, black and white in turn, one kind of product each and
// four cards to a row, with a button to the whole aisle under it. Names (and
// the buttons) the owner can change with the site editor
type RowSearch = { cat?: string; q?: string; tag?: string; kind?: string };
/** A spotlight row: one big photo with a line and a button beside four cards, two over two */
type Spot = { image: string; alt: string; line: string };
type Row = { key: string; title: string; tone: "dark" | "light"; items: ShopProduct[]; search: RowSearch; cta: string; spot?: Spot };
const ROWS: Record<string, Row> = {
  sneakers: { key: "sneakers", title: "Sneakers right now", tone: "dark", search: { cat: "sneakers" }, cta: "Shop all sneakers", items: pieces("aj4-black-cat-2025", "nigel-sylvester-aj4-brick-after-brick", "samba-og-cheetah-preloved-red", "nb-1906r-silver-metallic-black") },
  travis: { key: "travis", title: "Travis Scott x Cactus Jack", tone: "light", search: { q: "Cactus Jack" }, cta: "Shop Cactus Jack", items: pieces("days-before-rodeo-hoodie", "circus-maximus-hoodie", "utopia-hoodie", "apple-pie-hoodie") },
  complexcon: { key: "complexcon", title: "ComplexCon top picks for 2026", tone: "dark", search: { q: "Sp5der" }, cta: "Shop Sp5der", items: pieces("sp5der-pnk-hoodie", "sp5der-og-web-hoodie", "sp5der-splat-punk-hoodie", "sp5der-beluga-hoodie") },
  tees: { key: "tees", title: "Graphic tees", tone: "light", search: { cat: "clothing", kind: "T-shirts & shirts" }, cta: "Shop all tees", items: pieces("kaws-fragment-tee", "mcdonalds-smile-tee", "fragment-tee", "cactus-mac-tee") },
  // Spotlight photos: Christian Agbede and Gilles De Muynck on Unsplash (Unsplash License)
  denim: { key: "denim", title: "Denim", tone: "dark", search: { cat: "clothing", kind: "Jeans" }, cta: "Shop all denim", items: pieces("levis-denim-tears-logo-japan-jeans", "amiri-carpenter-jeans-aged-black", "butter-goods-solar-fade-grey", "supreme-dickies-cordura-cargo-denim"),
    spot: { image: "/shop/looks/spot-denim.webp", alt: "A young man in a black beanie and very wide washed jeans leaning on the bonnet of a white car", line: "Wide, washed and worn in: Denim Tears, Amiri, Ksubi and more." } },
  collections: { key: "collections", title: "Collections", tone: "light", search: { cat: "accessories" }, cta: "Shop all watches", items: pieces("rolex-explorer-114270", "omega-seamaster-300m-blue", "cartier-tank-basculante", "vacheron-patrimony-rose-gold"),
    spot: { image: "/shop/looks/spot-watch.webp", alt: "A hand fastening a gold skeleton watch on a brown leather strap, under a pale blue shirt cuff", line: "Rolex to Nomos, pre-owned and checked by Watchfinder & Co." } },
};
// The bands between the rows: a line, a button and a picture each
const LIMITED_FAN = pieces("fragment-travis-aj1-low-military-blue", "rolex-land-dweller-36", "days-before-rodeo-hoodie");
const BANDS = {
  calendar: { key: "calendar", kicker: "Release calendar", title: "The next pairs to drop", cta: "See the dates", to: "/shop/drops" as const, search: {} },
  limited: { key: "limited", kicker: "Collabs and grails", title: "Limited editions, while they last", cta: "Shop limited", to: "/shop/all" as const, search: { tag: "limited" } },
  brands: { key: "brands", kicker: "Brands A to Z", title: "From Amiri to Vacheron Constantin", cta: "Browse the brands", to: "/shop/brands" as const, search: {} },
};
// The logos that glide under the hero (never stopping, as the owner asked of every carousel)
const STRIP = LOGO_SLUGS.flatMap((slug) => { const logo = logoOf(slug); return logo ? [{ slug, logo }] : []; });

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
        <LogoStrip />
        <div className="sh-stack" ref={stack}>
          <WhatsNew />
          <NewSeason />
        </div>
        <Looks />
        <CollectionRow row={ROWS["sneakers"]!} />
        <Band band={BANDS.calendar} />
        <CollectionRow row={ROWS["travis"]!} />
        <CollectionRow row={ROWS["complexcon"]!} />
        <Band band={BANDS.limited} />
        <CollectionRow row={ROWS["tees"]!} />
        <CollectionRow row={ROWS["denim"]!} />
        <Band band={BANDS.brands} />
        <CollectionRow row={ROWS["collections"]!} />
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

/* ---------- The brands, gliding by under the hero ---------- */

function LogoStrip() {
  const name = (slug: string) => BRANDS.find((brand) => brand.slug === slug)?.name ?? slug;
  return (
    <section className="sh-logos" aria-label="Brands in the shop">
      <Link to="/shop/brands" className="sh-logos-link" aria-label="Brands A to Z">
        <span className="sh-logos-track" style={{ "--n": STRIP.length } as CSSProperties}>
          {[0, 1].flatMap((copy) => STRIP.map((item) => (
            <img key={`${copy}-${item.slug}`} src={item.logo} alt={copy === 0 ? name(item.slug) : ""} loading="lazy" />
          )))}
        </span>
      </Link>
    </section>
  );
}

/* ---------- A square card: a product, or a blank one still to come ---------- */

const chipOf = (product: ShopProduct) => (product.tags?.includes("limited") ? "Limited" : product.tags?.includes("new") ? "New in" : undefined);

function ShopCard({ product, hidden = false, tone }: { product: ShopProduct | null; hidden?: boolean; tone?: "dark" | "light" | undefined }) {
  if (!product || !isLive(product)) return <BlankCard tone={tone} />;
  const brand = brandOf(product);
  const chip = chipOf(product);
  return (
    <article className="sh-square" aria-hidden={hidden || undefined}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-square-link" tabIndex={hidden ? -1 : undefined} onClick={firstTapShowsBack}>
        <ProductPhoto product={product} hidden={hidden} className="sh-square-photo">
          {chip && <span className="sh-chip">{chip}</span>}
        </ProductPhoto>
        <span className="sh-square-brand">{brand.store ? product.kind : brand.name}</span>
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

function CollectionRow({ row }: { row: Row }) {
  return (
    <section className="sh-row" data-tone={row.tone} aria-label={row.title}>
      <header className="sh-head">
        <h2 className="sh-h2"><T k={`shop.row.${row.key}`}>{row.title}</T></h2>
        <Link to="/shop/all" search={row.search} className="sh-textlink"><T k="shop.row.all">Shop the collection</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      {row.spot ? (
        <div className="sh-spot">
          <Link to="/shop/all" search={row.search} className="sh-spot-photo">
            <img src={row.spot.image} alt={row.spot.alt} loading="lazy" />
            <span className="sh-spot-text">
              <span className="sh-spot-line"><T k={`shop.row.${row.key}.line`}>{row.spot.line}</T></span>
              <span className="sh-spot-go"><T k={`shop.row.${row.key}.cta`}>{row.cta}</T> <ArrowRight size={15} aria-hidden="true" /></span>
            </span>
          </Link>
          <ul className="sh-cards sh-spot-cards">
            {row.items.map((product) => <li key={product.id}><ShopCard product={product} tone={row.tone} /></li>)}
          </ul>
        </div>
      ) : (
        <ul className="sh-cards sh-cards-4">
          {row.items.map((product) => <li key={product.id}><ShopCard product={product} tone={row.tone} /></li>)}
        </ul>
      )}
      <div className="sh-row-cta">
        <Link to="/shop/all" search={row.search} className="sh-cta"><T k={`shop.row.${row.key}.cta`}>{row.cta}</T> <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

/* ---------- A band between the rows: one line and a button ---------- */

function Band({ band }: { band: (typeof BANDS)[keyof typeof BANDS] }) {
  return (
    <section className="sh-band" data-band={band.key} aria-labelledby={`sh-band-${band.key}`}>
      <div className="sh-band-copy">
        <p className="sh-band-kicker"><T k={`shop.band.${band.key}.kicker`}>{band.kicker}</T></p>
        <h2 id={`sh-band-${band.key}`} className="sh-band-title"><T k={`shop.band.${band.key}.title`}>{band.title}</T></h2>
        <Link to={band.to} search={band.search} className="sh-cta sh-cta-gold"><T k={`shop.band.${band.key}.cta`}>{band.cta}</T> <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
      <div className="sh-band-art" aria-hidden="true">
        {band.key === "calendar" && <NextPair />}
        {band.key === "limited" && (
          <span className="sh-fan">{LIMITED_FAN.map((product) => <img key={product.id} src={product.image} alt="" loading="lazy" />)}</span>
        )}
        {band.key === "brands" && (
          <span className="sh-band-logos">{STRIP.slice(0, 9).map((item) => <img key={item.slug} src={item.logo} alt="" loading="lazy" />)}</span>
        )}
      </div>
    </section>
  );
}

/** The next pair on the calendar, with its date and how long to wait (read in the browser) */
function NextPair() {
  const [today, setToday] = useState("2026-10-14");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const next = UPCOMING.find((pair) => pair.date >= today && pair.photo);
  if (!next?.photo) return null;
  const days = Math.round((Date.parse(next.date) - Date.parse(today)) / 86_400_000);
  return (
    <span className="sh-next">
      <img src={next.photo} alt="" loading="lazy" />
      <span className="sh-next-when">{days <= 0 ? "Out today" : days === 1 ? "Tomorrow" : `In ${days} days`}</span>
      <span className="sh-next-name">{next.name}</span>
      <span className="sh-next-date">{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(next.date))}</span>
    </span>
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
            <img src="/shop/upcoming/aj11-space-jam-2026.png" alt="" loading="lazy" />
            <span className="sh-tile-text">
              <span className="sh-tile-name"><T k="shop.explore.drops">Featured drops</T></span>
              <span className="sh-tile-note"><T k="shop.explore.drops.note">The Jordans on the calendar and the collabs worth the wait.</T></span>
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
