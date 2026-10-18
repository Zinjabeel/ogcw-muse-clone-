import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddToCart, BlankCard, ProductPhoto, SaveButton, ShopShell, Was, dollars, firstTapShowsBack } from "../components/shop-kit";
import { BRANDS, LIVE_PRODUCTS, brandOf, fullName, getProduct, isLive, type ShopProduct } from "../data/shop";
import { LOGO_SLUGS, logoOf } from "../data/shop-logos";
import { UPCOMING } from "../data/shop-upcoming";
import { T } from "@/components/site-text";

// The shop home, top to bottom (after Killstar's store):
//   hero          an open sneaker shop at night, edge to edge, the headline and a link
//   brands        a still row of logos, each to its brand
//   new season    two big photo cards, men and women, like Crowd favourites
//   what's new    a row of square cards that moves on by itself (even under the
//                 pointer), with an arrow each side
//   favourites    three tall photo cards side by side: sneakers, clothing, collections
//   the rows      Travis Scott, the next pairs to drop, sneakers, ComplexCon, graphic
//                 tees, limited editions, denim, the watch houses (three brand
//                 cards), collections: black and white in turn, narrower than the page
//   explore       featured drops, release dates, limited editions, brands, saved
// The cards are the live catalogue (src/data/shop-catalog.ts): each has two
// photos, the second under the pointer. No prices or counts on the cards, but a piece
// under its retail price shows both, the retail one struck through. Words
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
type Row = { key: string; title: string; tone: "dark" | "light"; items: ShopProduct[]; search: RowSearch; cta: string; spot?: Spot; size?: "denim" | "collections"; split?: true };
const ROWS: Record<string, Row> = {
  sneakers: { key: "sneakers", title: "Sneakers right now", tone: "light", search: { cat: "sneakers" }, cta: "Shop all sneakers", items: pieces("aj4-black-cat-2025", "nigel-sylvester-aj4-brick-after-brick", "samba-og-cheetah-preloved-red", "nb-1906r-silver-metallic-black") },
  travis: { key: "travis", title: "Travis Scott x Cactus Jack", tone: "dark", search: { q: "Cactus Jack" }, cta: "Shop Cactus Jack", items: pieces("days-before-rodeo-hoodie", "circus-maximus-hoodie", "utopia-hoodie", "apple-pie-hoodie") },
  complexcon: { key: "complexcon", title: "ComplexCon top picks for 2026", tone: "dark", search: { q: "Sp5der" }, cta: "Shop Sp5der", items: pieces("sp5der-pnk-hoodie", "sp5der-og-web-hoodie", "sp5der-splat-punk-hoodie", "sp5der-beluga-hoodie") },
  tees: { key: "tees", title: "Graphic tees", tone: "light", search: { cat: "clothing", kind: "T-shirts & shirts" }, cta: "Shop all tees", items: pieces("kaws-fragment-tee", "mcdonalds-smile-tee", "fragment-tee", "cactus-mac-tee") },
  // Spotlight photos: Christian Agbede and Gilles De Muynck on Unsplash (Unsplash License)
  denim: { key: "denim", title: "Denim", tone: "dark", search: { cat: "clothing", kind: "Jeans" }, cta: "Shop all denim", size: "denim", items: pieces("levis-denim-tears-logo-japan-jeans", "amiri-carpenter-jeans-aged-black", "butter-goods-solar-fade-grey", "supreme-dickies-cordura-cargo-denim"),
    spot: { image: "/shop/looks/spot-denim.webp", alt: "A young man in a black beanie and very wide washed jeans leaning on the bonnet of a white car", line: "Wide, washed and worn in: Denim Tears, Amiri, Ksubi and more." } },
  // Split in two (owner, 18 Oct): the photo in the middle of a white half, the
  // four watches evenly on a black half with their names under them
  collections: { key: "collections", title: "Collections", tone: "light", search: { cat: "accessories" }, cta: "Shop all collections", size: "collections", split: true, items: pieces("rolex-explorer-114270", "omega-seamaster-300m-blue", "cartier-tank-basculante", "vacheron-patrimony-rose-gold"),
    spot: { image: "/shop/looks/spot-watch.webp", alt: "A hand fastening a gold skeleton watch on a brown leather strap, under a pale blue shirt cuff", line: "Watches, caps and bags. The watches are pre-owned." } },
};
// The bands between the rows: a line, a button and a row of pictures each
const LIMITED = pieces("fragment-travis-aj1-low-military-blue", "levis-denim-tears-logo-japan-jeans", "awake-ny-aj6-blueberry");
const BANDS = {
  calendar: { key: "calendar", kicker: "Release calendar", title: "The next pairs to drop", cta: "See the dates", to: "/shop/drops" as const, search: {} },
  limited: { key: "limited", kicker: "Collabs and grails", title: "Limited editions, while they last", cta: "Shop limited", to: "/shop/all" as const, search: { tag: "limited" } },
};
// The brands under the hero, still, in one row
const LIVE_BRANDS = new Set(LIVE_PRODUCTS.map((product) => product.brand));
const STRIP = LOGO_SLUGS.flatMap((slug) => { const logo = logoOf(slug); return logo && LIVE_BRANDS.has(slug) ? [{ slug, logo }] : []; }).slice(0, 12);
// The new season, two big cards: men and women (photos: behrouz sasani and Howen, Unsplash;
// the owner's own two pictures go here when they come)
const HALVES = [
  { key: "men", to: "/shop/men" as const, image: "/shop/looks/fw-men.webp", alt: "A man in a black puffer jacket over a white tee and a chain, by a window" },
  { key: "women", to: "/shop/women" as const, image: "/shop/looks/fw-women.webp", alt: "A woman in a navy puffer jacket leaning on a green Land Rover" },
];
// The watch houses: three brands, each with a campaign photo (brand photos, via Pinterest)
const HOUSES = [
  { slug: "rolex", name: "Rolex", line: "The Submariner, the Datejust and the Land-Dweller", image: "/shop/looks/watch-rolex.jpg", alt: "A Rolex diver’s watch with a black bezel resting on blue sand" },
  { slug: "vacheron-constantin", name: "Vacheron Constantin", line: "Geneva since 1755: the Overseas and the Patrimony", image: "/shop/looks/watch-vacheron.jpg", alt: "A Vacheron Constantin Overseas with a blue dial on a blue fabric strap" },
  { slug: "audemars-piguet", name: "Audemars Piguet", line: "The Royal Oak, the Offshore and the CODE 11.59", image: "/shop/looks/watch-ap.jpg", alt: "A model in a cobalt blue jacket stretching an arm out to show an Audemars Piguet watch" },
];

function ShopHome() {
  return (
    <ShopShell>
      <div className="sh">
        <Hero />
        <LogoStrip />
        <NewSeason />
        <WhatsNew />
        <Looks />
        <CollectionRow row={ROWS["travis"]!} />
        <CollectionRow row={ROWS["sneakers"]!} />
        <CollectionRow row={ROWS["complexcon"]!} />
        <CollectionRow row={ROWS["tees"]!} />
        <CollectionRow row={ROWS["denim"]!} />
        <WatchHouses />
        <CollectionRow row={ROWS["collections"]!} />
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

const chipOf = (product: ShopProduct) => (product.tags?.includes("limited") ? "Limited" : product.tags?.includes("new") ? "New in" : product.tags?.includes("trending") ? "Trendiest" : undefined);

function ShopCard({ product, hidden = false, tone }: { product: ShopProduct | null; hidden?: boolean; tone?: "dark" | "light" | undefined }) {
  if (!product || !isLive(product)) return <BlankCard tone={tone} />;
  const brand = brandOf(product);
  const chip = chipOf(product);
  return (
    <article className="sh-square" aria-hidden={hidden || undefined}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-square-link" tabIndex={hidden ? -1 : undefined} onClick={firstTapShowsBack}>
        <ProductPhoto product={product} hidden={hidden} className="sh-square-photo">
          {/* The tag and the price side by side, at the foot of the photo */}
          <span className="sh-tags">
            {chip && <span className="sh-chip">{chip}</span>}
            <span className="sh-price-pill">{product.price ? <>{dollars(product.price)}<Was product={product} /></> : product.url ? "Sold out" : "At the shop"}</span>
          </span>
        </ProductPhoto>
        <span className="sh-square-brand">{brand.store ? product.kind : brand.name}</span>
        <span className="sh-square-name">{fullName(product)}</span>
      </Link>
      {!hidden && <SaveButton product={product} />}
      {!hidden && <AddToCart product={product} />}
    </article>
  );
}

/* ---------- The new season: men and women, two big cards like Crowd favourites ---------- */

function NewSeason() {
  return (
    <section className="sh-sec sh-looks sh-season2" aria-labelledby="sh-season-title">
      <header className="sh-looks-head">
        <h2 id="sh-season-title" className="sh-h2"><T k="shop.season.title">The new season</T></h2>
      </header>
      <ul className="sh-looks-grid sh-looks-two">
        {HALVES.map((half) => (
          <li key={half.key}>
            <Link to={half.to} className="sh-look">
              <img src={half.image} alt={half.alt} loading="lazy" />
              <span className="sh-look-text">
                <span className="sh-look-name"><T k={`shop.season.${half.key}.name`}>{half.key === "men" ? "Men" : "Women"}</T></span>
                <span className="sh-look-more"><T k="shop.looks.more">Discover more</T></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- What's new: a row of square cards that moves on by itself, with an arrow each side ---------- */

function WhatsNew() {
  const track = useRef<HTMLUListElement>(null);
  /** One card on (or back), round to the start after the last */
  const step = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const by = card.offsetWidth + gap;
    const end = el.scrollWidth - el.clientWidth - 4;
    const smooth = reduced() ? "auto" : "smooth";
    if (dir > 0 && el.scrollLeft >= end) el.scrollTo({ left: 0, behavior: smooth });
    else if (dir < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: smooth });
    else el.scrollBy({ left: dir * by, behavior: smooth });
  };
  // It moves on by itself every few seconds (the pointer doesn't stop it: owner's rule); not with reduced motion,
  // and not while someone is tabbing through its cards with the keyboard, so a card never slides away from them
  useEffect(() => {
    if (reduced()) return;
    const timer = window.setInterval(() => { if (!document.hidden && !track.current?.contains(document.activeElement)) step(1); }, 3800);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <section className="sh-sec sh-new" aria-labelledby="sh-new-title">
      <div className="sh-panel">
        <header className="sh-head">
          <h2 id="sh-new-title" className="sh-h2"><T k="shop.story.new">See what’s new</T></h2>
          <Link to="/shop/all" search={{ tag: "new" }} className="sh-textlink"><T k="shop.story.new.all">Shop all new in</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </header>
        <div className="sh-rail">
          <button type="button" className="sh-rail-arrow is-prev" onClick={() => step(-1)} aria-label="Back"><ArrowLeft size={18} aria-hidden="true" /></button>
          <ul className="sh-rail-track" ref={track}>
            {RAIL.map((product) => <li key={product.id} className="sh-rail-item"><ShopCard product={product} /></li>)}
          </ul>
          <button type="button" className="sh-rail-arrow is-next" onClick={() => step(1)} aria-label="Next"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
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
  if (row.split && row.spot) return <SplitRow row={row} spot={row.spot} />;
  return (
    <section className="sh-row" data-tone={row.tone} aria-label={row.title}>
      <header className="sh-head">
        <h2 className="sh-h2"><T k={`shop.row.${row.key}`}>{row.title}</T></h2>
        <Link to="/shop/all" search={row.search} className="sh-textlink"><T k="shop.row.all">Shop the collection</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      {row.spot ? (
        <div className="sh-spot" data-size={row.size}>
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

/* A row in two halves: on the white one the title over the big photo, both in
   the middle; on the black one the four cards, two over two and evenly spaced,
   their names under them, then the button. The section keeps just the class
   "sh-row" (the site editor knows it by that) and is one box inside, so the
   colours chosen in the editor still paint it */
function SplitRow({ row, spot }: { row: Row; spot: Spot }) {
  return (
    <section className="sh-row" data-tone={row.tone} data-split="" aria-label={row.title}>
      <div className="sh-split">
        <div className="sh-half is-light">
          <h2 className="sh-h2"><T k={`shop.row.${row.key}`}>{row.title}</T></h2>
          <Link to="/shop/all" search={row.search} className="sh-spot-photo">
            <img src={spot.image} alt={spot.alt} loading="lazy" />
            <span className="sh-spot-text">
              <span className="sh-spot-line"><T k={`shop.row.${row.key}.line`}>{spot.line}</T></span>
              <span className="sh-spot-go"><T k={`shop.row.${row.key}.cta`}>{row.cta}</T> <ArrowRight size={15} aria-hidden="true" /></span>
            </span>
          </Link>
        </div>
        <div className="sh-half is-dark">
          <ul className="sh-cards sh-split-cards">
            {row.items.map((product) => <li key={product.id}><ShopCard product={product} tone="dark" /></li>)}
          </ul>
          <Link to="/shop/all" search={row.search} className="sh-cta"><T k={`shop.row.${row.key}.cta`}>{row.cta}</T> <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
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

/** The next pairs to drop, further out (owner, 15 Oct): three from December on, then 2027 (dates read in the browser) */
function CalendarBand() {
  const [today, setToday] = useState("2026-10-14");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const ahead = UPCOMING.filter((pair) => pair.date >= today && pair.photo);
  const far = ahead.filter((pair) => pair.date >= "2026-12-01");
  const picked = [...far.filter((pair) => pair.date < "2027-01-01").slice(0, 3), ...far.filter((pair) => pair.date >= "2027-01-01").slice(0, 2)];
  for (const pair of far) if (picked.length < 5 && !picked.includes(pair)) picked.push(pair);
  const days = (iso: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  const cards: BandCard[] = picked.slice(0, 5).map((pair) => {
    const n = days(pair.date);
    return { key: pair.id, image: pair.photo!, chip: n <= 0 ? "Out today" : n === 1 ? "Tomorrow" : n <= 21 ? `In ${n} days` : shortDate(pair.date), name: pair.name, to: { pathname: "/shop/drops" } };
  });
  return <BandRow band={BANDS.calendar} cards={cards} narrow />;
}

/** Limited editions: the collabs, the same way, full width */
function LimitedBand() {
  const cards: BandCard[] = LIMITED.map((product) => ({ key: product.id, image: product.image, chip: product.kind === "Watches" ? "Grail" : "Collab", name: product.name, to: { pathname: "/shop/p/$id", id: product.id } }));
  return <BandRow band={BANDS.limited} cards={cards} />;
}

/* ---------- The watch houses: three brands, three campaign photos ---------- */

function WatchHouses() {
  return (
    <section className="sh-sec sh-looks sh-houses" aria-labelledby="sh-houses-title">
      <header className="sh-looks-head">
        <h2 id="sh-houses-title" className="sh-h2"><T k="shop.houses.title">The watch houses</T></h2>
        <Link to="/shop/all" search={{ kind: "Watches" }} className="sh-textlink"><T k="shop.houses.all">Every watch</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      {/* Three tall cards side by side, exactly like Crowd favourites (owner, 15 Oct) */}
      <ul className="sh-looks-grid">
        {HOUSES.map((house) => (
          <li key={house.slug}>
            <Link to="/shop/all" search={{ kind: "Watches", brand: house.slug }} className="sh-look">
              <img src={house.image} alt={house.alt} loading="lazy" />
              <span className="sh-look-text">
                <span className="sh-look-name">{house.name}</span>
                <span className="sh-look-more"><T k="shop.looks.more">Discover more</T></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="sh-houses-credit">Campaign photos: Rolex, Vacheron Constantin and Audemars Piguet, via Pinterest. The watches are pre-owned, checked by Watchfinder & Co.</p>
    </section>
  );
}
