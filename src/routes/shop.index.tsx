import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AddToCart, BlankCard, ProductPhoto, SaveButton, ShopShell, dollars, firstTapShowsBack } from "../components/shop-kit";
import { BRANDS, LIVE_PRODUCTS, SNEAKER_DROPS, brandOf, fullName, getProduct, isLive, type ShopProduct } from "../data/shop";
import { LOGO_SLUGS, logoOf } from "../data/shop-logos";
import { UPCOMING } from "../data/shop-upcoming";
import { T } from "@/components/site-text";

// The shop home, top to bottom (after Killstar's store):
//   hero          an open sneaker shop at night, edge to edge, the headline and a link
//   brands        a still row of logos, each to its brand
//   what's new    square cards that keep gliding by, even under the pointer
//   new season    two halves, men and women: a photo, three pieces to point at
//                 (the photo turns into that piece), a link; it slides up over
//                 What's new, and a short scroll glides the rest of the way
//   favourites    three tall photo cards side by side: sneakers, clothing, collections
//   the rows      Travis Scott, the next pairs to drop, sneakers, ComplexCon, graphic
//                 tees, limited editions, denim, the watch houses (three brand
//                 cards), collections: black and white in turn, narrower than the page
//   explore       featured drops, release dates, limited editions, brands, saved
// The cards are the live catalogue (src/data/shop-catalog.ts): each has two
// photos, the second under the pointer. No prices or counts on the cards. Words
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
  sneakers: { key: "sneakers", title: "Sneakers right now", tone: "light", search: { cat: "sneakers" }, cta: "Shop all sneakers", items: pieces("aj4-black-cat-2025", "nigel-sylvester-aj4-brick-after-brick", "samba-og-cheetah-preloved-red", "nb-1906r-silver-metallic-black") },
  travis: { key: "travis", title: "Travis Scott x Cactus Jack", tone: "dark", search: { q: "Cactus Jack" }, cta: "Shop Cactus Jack", items: pieces("days-before-rodeo-hoodie", "circus-maximus-hoodie", "utopia-hoodie", "apple-pie-hoodie") },
  complexcon: { key: "complexcon", title: "ComplexCon top picks for 2026", tone: "dark", search: { q: "Sp5der" }, cta: "Shop Sp5der", items: pieces("sp5der-pnk-hoodie", "sp5der-og-web-hoodie", "sp5der-splat-punk-hoodie", "sp5der-beluga-hoodie") },
  tees: { key: "tees", title: "Graphic tees", tone: "light", search: { cat: "clothing", kind: "T-shirts & shirts" }, cta: "Shop all tees", items: pieces("kaws-fragment-tee", "mcdonalds-smile-tee", "fragment-tee", "cactus-mac-tee") },
  // Spotlight photos: Christian Agbede and Gilles De Muynck on Unsplash (Unsplash License)
  denim: { key: "denim", title: "Denim", tone: "dark", search: { cat: "clothing", kind: "Jeans" }, cta: "Shop all denim", items: pieces("levis-denim-tears-logo-japan-jeans", "amiri-carpenter-jeans-aged-black", "butter-goods-solar-fade-grey", "supreme-dickies-cordura-cargo-denim"),
    spot: { image: "/shop/looks/spot-denim.webp", alt: "A young man in a black beanie and very wide washed jeans leaning on the bonnet of a white car", line: "Wide, washed and worn in: Denim Tears, Amiri, Ksubi and more." } },
  collections: { key: "collections", title: "Collections", tone: "light", search: { cat: "accessories" }, cta: "Shop all collections", items: pieces("rolex-explorer-114270", "omega-seamaster-300m-blue", "cartier-tank-basculante", "vacheron-patrimony-rose-gold"),
    spot: { image: "/shop/looks/spot-watch.webp", alt: "A hand fastening a gold skeleton watch on a brown leather strap, under a pale blue shirt cuff", line: "Watches, caps and bags, the watches pre-owned and checked by Watchfinder & Co." } },
};
// The bands between the rows: a line, a button and a row of pictures each
const LIMITED = pieces("fragment-travis-aj1-low-military-blue", "rolex-land-dweller-36", "days-before-rodeo-hoodie", "levis-denim-tears-logo-japan-jeans", "awake-ny-aj6-blueberry");
const BANDS = {
  calendar: { key: "calendar", kicker: "Release calendar", title: "The next pairs to drop", cta: "See the dates", to: "/shop/drops" as const, search: {} },
  limited: { key: "limited", kicker: "Collabs and grails", title: "Limited editions, while they last", cta: "Shop limited", to: "/shop/all" as const, search: { tag: "limited" } },
};
// The brands under the hero, still, in one row
const LIVE_BRANDS = new Set(LIVE_PRODUCTS.map((product) => product.brand));
const STRIP = LOGO_SLUGS.flatMap((slug) => { const logo = logoOf(slug); return logo && LIVE_BRANDS.has(slug) ? [{ slug, logo }] : []; }).slice(0, 12);
// The new season, for men and for women (photos: Vladyslav Lytvyshchenko and Teslariu Mihai, Unsplash)
const HALVES = [
  { key: "men", kicker: "The new season · Men", title: "Layer up for the cold", to: "/shop/men" as const, cta: "Shop men", image: "/shop/looks/season-men.webp", alt: "A young man in a beanie, grey hoodie and tan puffer jacket on a snowy hillside", picks: pieces("denim-tears-cotton-wreath-puffer-jacket-black-fw25odp11842113", "nike-x-nocta-tech-fleece-full-zip-hoodie-cobalt-tint-fd8453-428", "magliano-souvenir-varsity-jacket-green-mgfw25ja01197") },
  { key: "women", kicker: "The new season · Women", title: "Soft knits, warm down", to: "/shop/women" as const, cta: "Shop women", image: "/shop/looks/season-women.webp", alt: "A young woman in a sand-coloured puffer jacket and a leather cap by a railway line", picks: pieces("acne-studios-fleece-logo-hoodie-tango-pink-ci0136-tang", "nike-women-s-x-sacai-double-zip-jacket-obsidian-court-purple-cd6297-451", "amiri-love-tie-dye-cropped-knit-sweater-multicolor-y0w05307cc-mult") },
];
// The watch houses: three brands, each with a campaign photo (brand photos, via Pinterest)
const HOUSES = [
  { slug: "rolex", name: "Rolex", line: "The Submariner, the Datejust and the Land-Dweller", image: "/shop/looks/watch-rolex.jpg", alt: "A Rolex diver’s watch with a black bezel resting on blue sand" },
  { slug: "vacheron-constantin", name: "Vacheron Constantin", line: "Geneva since 1755: the Overseas and the Patrimony", image: "/shop/looks/watch-vacheron.jpg", alt: "A Vacheron Constantin Overseas with a blue dial on a blue fabric strap" },
  { slug: "audemars-piguet", name: "Audemars Piguet", line: "The Royal Oak, the Offshore and the CODE 11.59", image: "/shop/looks/watch-ap.jpg", alt: "A model in a cobalt blue jacket stretching an arm out to show an Audemars Piguet watch" },
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
        <LogoStrip />
        <div className="sh-stack" ref={stack}>
          <WhatsNew />
          <NewSeason />
        </div>
        <Looks />
        <CollectionRow row={ROWS["travis"]!} />
        <CalendarBand />
        <CollectionRow row={ROWS["sneakers"]!} />
        <CollectionRow row={ROWS["complexcon"]!} />
        <CollectionRow row={ROWS["tees"]!} />
        <LimitedBand />
        <CollectionRow row={ROWS["denim"]!} />
        <WatchHouses />
        <CollectionRow row={ROWS["collections"]!} />
        <Explore />
      </div>
    </ShopShell>
  );
}

/* ---------- The hero: one photo, the headline and a link ---------- */

// An open sneaker shop at night, seen through the window: Mustafa Turhan on Unsplash (Unsplash License)
function Hero() {
  return (
    <section className="sh-hero" aria-labelledby="sh-hero-title">
      <img className="sh-hero-img" src="/shop/looks/hero-store.webp" alt="Walls of sneakers on glass shelves in a shop lit up at night, a shopper passing in front" fetchPriority="high" />
      <div className="sh-hero-copy">
        <h1 id="sh-hero-title" className="sh-hero-title"><T k="shop.hero.title">Wear the culture</T></h1>
        <Link to="/shop/all" search={{ tag: "new" }} className="sh-hero-cta"><T k="shop.hero.cta">Shop the latest</T></Link>
      </div>
    </section>
  );
}

/* ---------- The brands under the hero: one still row, each logo to its brand ---------- */

function LogoStrip() {
  const name = (slug: string) => BRANDS.find((brand) => brand.slug === slug)?.name ?? slug;
  return (
    <section className="sh-logos" aria-label="Brands in the shop">
      <ul className="sh-logos-row">
        {STRIP.map((item) => (
          <li key={item.slug}>
            <Link to="/shop/$slug" params={{ slug: item.slug }} className="sh-logo" title={name(item.slug)}>
              <img src={item.logo} alt={name(item.slug)} loading="lazy" />
            </Link>
          </li>
        ))}
        <li className="sh-logos-all-item">
          <Link to="/shop/brands" className="sh-logos-all"><T k="shop.logos.all">Brands A to Z</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </li>
      </ul>
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

/* ---------- The new season: two halves, men and women ---------- */

/** One half: a photo, three pieces to point at (the photo turns into the piece
 *  you're on, with its name and price under it) and a link to that shop */
function SeasonHalf({ half }: { half: (typeof HALVES)[number] }) {
  const [on, setOn] = useState<number | null>(null);
  const piece = on === null ? null : half.picks[on] ?? null;
  return (
    <div className="sh-half" data-half={half.key} onMouseLeave={() => setOn(null)}>
      <Link to={half.to} className="sh-half-photo" aria-label={half.cta}>
        <img src={half.image} alt={half.alt} loading="lazy" />
        {half.picks.map((product, i) => <img key={product.id} className="sh-half-piece" data-on={on === i || undefined} src={product.image} alt="" loading="lazy" />)}
        <span className="sh-half-tag">Fall/Winter 2026</span>
      </Link>
      <div className="sh-half-body">
        <p className="sh-half-kicker"><T k={`shop.season.${half.key}.kicker`}>{half.kicker}</T></p>
        <h3 className="sh-half-title"><T k={`shop.season.${half.key}.title`}>{half.title}</T></h3>
        <ul className="sh-half-picks" aria-label="Three from the season">
          {half.picks.map((product, i) => (
            <li key={product.id}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-half-pick" data-on={on === i || undefined} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} aria-label={fullName(product)}>
                <img src={product.image} alt="" loading="lazy" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="sh-half-now" aria-live="polite">{piece ? <>{fullName(piece)}{piece.price ? <span> · {dollars(piece.price)}</span> : null}</> : <span className="sh-half-hint">Point at a piece to see it</span>}</p>
        <Link to={half.to} className="sh-half-cta"><T k={`shop.season.${half.key}.cta`}>{half.cta}</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

function NewSeason() {
  return (
    <section className="sh-sec sh-season" aria-labelledby="sh-season-title">
      <h2 id="sh-season-title" className="sr-only"><T k="shop.season.title">The new season</T></h2>
      <div className="sh-season-split">
        {HALVES.map((half) => <SeasonHalf key={half.key} half={half} />)}
      </div>
    </section>
  );
}

/* ---------- Crowd favourites: three tall photo cards side by side ---------- */

function Looks() {
  return (
    <section className="sh-sec sh-looks" aria-labelledby="sh-looks-title">
      <header className="sh-looks-head">
        <h2 id="sh-looks-title" className="sh-h2"><T k="shop.looks.title2">Crowd favourites</T></h2>
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
        <div className="sh-spot is-compact">
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

/* ---------- The bands: a line and a button beside a row of pictures ---------- */

const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: iso.startsWith("2026") ? undefined : "numeric", timeZone: "UTC" }).format(new Date(iso));
type BandCard = { key: string; image: string; chip: string; name: string; to: { pathname: "/shop/p/$id"; id: string } | { pathname: "/shop/drops" } };

function BandRow({ band, cards, narrow = false }: { band: (typeof BANDS)[keyof typeof BANDS]; cards: BandCard[]; narrow?: boolean }) {
  return (
    <section className="sh-band2" data-band={band.key} data-narrow={narrow || undefined} aria-labelledby={`sh-band-${band.key}`}>
      <div className="sh-band2-in">
        <div className="sh-band-copy">
          <p className="sh-band-kicker"><T k={`shop.band.${band.key}.kicker`}>{band.kicker}</T></p>
          <h2 id={`sh-band-${band.key}`} className="sh-band2-title"><T k={`shop.band.${band.key}.title`}>{band.title}</T></h2>
          <Link to={band.to} search={band.search} className="sh-cta sh-cta-gold"><T k={`shop.band.${band.key}.cta`}>{band.cta}</T> <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <ul className="sh-band2-cards">
          {cards.map((card) => (
            <li key={card.key}>
              {card.to.pathname === "/shop/p/$id"
                ? <Link to="/shop/p/$id" params={{ id: card.to.id }} className="sh-band2-card"><BandCardBody card={card} /></Link>
                : <Link to="/shop/drops" className="sh-band2-card"><BandCardBody card={card} /></Link>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
function BandCardBody({ card }: { card: BandCard }) {
  return (
    <>
      <span className="sh-band2-photo"><img src={card.image} alt="" loading="lazy" /><span className="sh-band2-chip">{card.chip}</span></span>
      <span className="sh-band2-name">{card.name}</span>
    </>
  );
}

/** The next pairs to drop: the next three, then one from December and one from 2027 (dates read in the browser) */
function CalendarBand() {
  const [today, setToday] = useState("2026-10-14");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const ahead = UPCOMING.filter((pair) => pair.date >= today && pair.photo);
  const picked = [...ahead.slice(0, 3)];
  const later = [ahead.find((pair) => pair.date >= "2026-12-01" && !picked.includes(pair)), ahead.find((pair) => pair.date >= "2027-01-01" && !picked.includes(pair))];
  for (const pair of later) if (pair && !picked.includes(pair)) picked.push(pair);
  for (const pair of ahead) if (picked.length < 5 && !picked.includes(pair)) picked.push(pair);
  const days = (iso: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  const cards: BandCard[] = picked.slice(0, 5).map((pair) => {
    const n = days(pair.date);
    return { key: pair.id, image: pair.photo!, chip: n <= 0 ? "Out today" : n === 1 ? "Tomorrow" : n <= 21 ? `In ${n} days` : shortDate(pair.date), name: pair.name, to: { pathname: "/shop/drops" } };
  });
  return <BandRow band={BANDS.calendar} cards={cards} narrow />;
}

/** Limited editions: five collabs and grails, the same way, full width */
function LimitedBand() {
  const cards: BandCard[] = LIMITED.map((product) => ({ key: product.id, image: product.image, chip: product.kind === "Watches" ? "Grail" : "Collab", name: product.name, to: { pathname: "/shop/p/$id", id: product.id } }));
  return <BandRow band={BANDS.limited} cards={cards} />;
}

/* ---------- The watch houses: three brands, three campaign photos ---------- */

function WatchHouses() {
  return (
    <section className="sh-houses" aria-labelledby="sh-houses-title">
      <header className="sh-head sh-houses-head">
        <h2 id="sh-houses-title" className="sh-h2"><T k="shop.houses.title">The watch houses</T></h2>
        <Link to="/shop/all" search={{ kind: "Watches" }} className="sh-textlink"><T k="shop.houses.all">Every watch</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      <ul className="sh-houses-grid">
        {HOUSES.map((house) => (
          <li key={house.slug}>
            <Link to="/shop/all" search={{ kind: "Watches", brand: house.slug }} className="sh-house">
              <img src={house.image} alt={house.alt} loading="lazy" />
              <span className="sh-house-text">
                <span className="sh-house-name">{house.name}</span>
                <span className="sh-house-line"><T k={`shop.houses.${house.slug}`}>{house.line}</T></span>
                <span className="sh-house-go"><T k="shop.houses.go">Shop the house</T> <ArrowRight size={14} aria-hidden="true" /></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="sh-houses-credit">Campaign photos: Rolex, Vacheron Constantin and Audemars Piguet, via Pinterest. The watches are pre-owned, checked by Watchfinder & Co.</p>
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
          <Link to="/shop/featured-drops" className="sh-tile sh-tile-photo">
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
