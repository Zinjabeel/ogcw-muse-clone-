import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { AddToCart, Price, SaveButton, ShopSearch, ShopShell, brandLine, euro } from "../components/shop-kit";
import { BRANDS, GIFT_BANDS, PRODUCTS, SNEAKER_DROPS, fullName, getProduct, productsOf, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// The shop home, top to bottom:
//   hero          the headline, the big search and a row of tall arched cards that turns by itself
//   what's new    a rail that keeps turning, even under the pointer
//   collections   slides up over What's new and takes its place (one small scroll is enough:
//                 the page glides the rest of the way); its card changes every 2 seconds
//   the edit      New in, Trending, Limited, Gift ideas, with the photo pinned beside the list
//   the aisles    three big photo cards: sneakers, clothing, watches and chains
//   stream        ten streaming services
//   explore       featured drops, release dates, limited editions, brands, the gift guide
// Words never move on scroll; only the cards and photos do. With reduced
// motion nothing turns by itself and nothing glides.

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "The OGCW Shop: sneakers, shirts, watches and streaming" },
      { name: "description", content: "Sneakers, football shirts, watches, chains and streaming subscriptions, picked by OGCW and bought straight from the shop that makes them." },
      { property: "og:title", content: "The OGCW Shop" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShopHome,
});

const pick = (ids: string[]) => ids.flatMap((id) => getProduct(id) ?? []);
const count = (tag: string) => PRODUCTS.filter((product) => product.tags?.includes(tag as never)).length;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HERO = pick(["jordan-4-retro-grey", "rolex-submariner", "one-piece-air-max-plus-mera-mera", "adidas-argentina-1998-home", "omega-swatch-moonswatch", "nike-air-max-97-silver", "supreme-box-logo-hoodie-pink", "cartier-santos-steel", "jordan-4-retro-sage", "adidas-samba-og-cloud-white-core-black-gum"]);
const NEW_IN = PRODUCTS.filter((product) => product.tags?.includes("new")).slice(0, 12);
const COLLECTIONS = [
  { id: "jordans", label: "Jordans", items: pick(["jordan-4-retro-grey", "jordan-4-retro-sage", "jordan-1-high-og-silver", "stockx-air-jordan-4-retro-military-black-white-grey-black", "stockx-air-jordan-1-high-university-blue-white-university-blue-black", "jordan-6-retro-infrared", "jordan-5-retro-grape"]) },
  { id: "terrace", label: "Terrace", items: pick(["adidas-samba-og-cloud-white-core-black-gum", "adidas-gazelle-indoor-blue", "adidas-handball-spezial", "adidas-sl-72-og-red", "onitsuka-tiger-mexico-66-yellow", "puma-speedcat-og"]) },
  { id: "shirts", label: "Shirts", items: pick(["adidas-argentina-1998-home", "adidas-france-home-retro", "adidas-argentina-2006-away", "lakers-kobe-bryant-8-jersey", "nba-all-star-1995-jersey", "bape-mitchell-ness-bulls-jersey"]) },
  { id: "steel", label: "Steel", items: pick(["rolex-submariner", "patek-philippe-nautilus", "audemars-piguet-royal-oak-skeleton", "cartier-santos-steel", "omega-swatch-moonswatch", "tag-heuer-monaco"]) },
];
const EDIT = [
  { tag: "new", label: "New in", note: "Fresh pairs, shirts and steel, added this season.", image: "one-piece-air-max-plus-mera-mera" },
  { tag: "trending", label: "Trending", note: "What people are wearing right now.", image: "adidas-samba-og-cloud-white-core-black-gum" },
  { tag: "limited", label: "Limited", note: "Collabs, grails and pieces that won’t come back.", image: "patek-philippe-nautilus" },
  { tag: "gift", label: "Gift ideas", note: "Easy wins, from a €20 Casio up.", image: "omega-swatch-moonswatch" },
].map((row) => ({ ...row, product: getProduct(row.image)!, count: count(row.tag) }));
// The three big photo cards (photos from Unsplash, credited under them)
const LOOKS = [
  { key: "sneakers", label: "Sneakers", search: { cat: "sneakers" }, image: "/shop/looks/sneakers.webp", alt: "White Nike sneakers on dark asphalt beside a painted white line" },
  { key: "clothing", label: "Clothing", search: { cat: "clothing" }, image: "/shop/looks/clothing.webp", alt: "A red and white football shirt hanging on a wall in warm light" },
  { key: "watches", label: "Watches & chains", search: { cat: "accessories" }, image: "/shop/looks/watches.webp", alt: "A man in a black coat wearing a gold chain" },
];
const STREAM = pick(["netflix-standard", "disney-plus", "max-streaming", "prime-video", "apple-tv-plus", "crunchyroll-premium", "spotify-premium", "youtube-premium", "dazn-standard", "playstation-plus"]);
const brandCount = BRANDS.filter((brand) => productsOf(brand.slug).length > 0).length;

/** An index that moves on by itself every `ms` (never under reduced motion, never in a hidden tab) */
function useTurn(ms: number, onTurn: () => void, deps: unknown[] = []) {
  const turn = useRef(onTurn);
  turn.current = onTurn;
  useEffect(() => {
    if (reduced()) return;
    const timer = window.setInterval(() => { if (!document.hidden) turn.current(); }, ms);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}

/** What's new and New collections stick in turn; a scroll that stops part
 *  way between them glides on to the end, in the direction it was going */
function useStackGlide(stack: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    let last = window.scrollY;
    let dir = 1;
    let timer = 0;
    const zone = () => {
      const header = document.querySelector<HTMLElement>(".sx-top")?.getBoundingClientRect().height ?? 0;
      const first = el.children[0] as HTMLElement | undefined;
      const start = el.getBoundingClientRect().top + window.scrollY - header;
      return { start, end: start + (first?.getBoundingClientRect().height ?? 0) };
    };
    const settle = () => {
      const { start, end } = zone();
      const y = window.scrollY;
      if (y > start + 2 && y < end - 2) window.scrollTo({ top: dir > 0 ? end : start, behavior: reduced() ? "auto" : "smooth" });
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== last) dir = y > last ? 1 : -1;
      last = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 140);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.clearTimeout(timer); };
  }, [stack]);
}

function ShopHome() {
  const stack = useRef<HTMLDivElement>(null);
  useStackGlide(stack);
  return (
    <ShopShell>
      <div className="sh">
        <Hero />
        <div className="sh-stack" ref={stack}>
          <WhatsNew />
          <Collections />
        </div>
        <TheEdit />
        <Looks />
        <StreamAndChill />
        <Explore />
      </div>
    </ShopShell>
  );
}

/* ---------- The hero ---------- */

function Hero() {
  return (
    <section className="sh-hero" aria-labelledby="sh-hero-title">
      <div className="sh-hero-copy">
        <h1 id="sh-hero-title" className="sh-hero-title">
          <span><T k="shop.hero.l1">Wear the culture.</T></span>
          <span><T k="shop.hero.l2">Buy it at the source.</T></span>
        </h1>
        <p className="sh-hero-sub"><T k="shop.hero.sub">Sneakers, shirts, watches and streaming, picked by OGCW and bought from the shop that makes them.</T></p>
        <ShopSearch big />
      </div>
      <Arches />
    </section>
  );
}

function Arches() {
  const [active, setActive] = useState(0);
  const start = useRef<number | null>(null);
  const n = HERO.length;
  const go = (step: number) => setActive((value) => (value + step + n) % n);
  useTurn(3000, () => go(1));
  const down = (event: ReactPointerEvent) => { start.current = event.clientX; };
  const up = (event: ReactPointerEvent) => {
    if (start.current === null) return;
    const moved = event.clientX - start.current;
    start.current = null;
    if (Math.abs(moved) > 40) go(moved < 0 ? 1 : -1);
  };
  return (
    <div className="sh-arches" role="group" aria-roledescription="carousel" aria-label="Picks from the shop">
      <ul className="sh-arch-track" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { start.current = null; }}>
        {HERO.map((product, index) => {
          let slot = index - active;
          if (slot > n / 2) slot -= n;
          if (slot < -n / 2) slot += n;
          const shown = Math.abs(slot) <= 2;
          return (
            <li key={product.id} className="sh-arch" data-centre={slot === 0 || undefined} style={{ "--slot": slot, "--abs": Math.min(Math.abs(slot), 3) } as CSSProperties} aria-hidden={!shown}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-arch-card" tabIndex={shown ? 0 : -1} draggable={false} aria-label={`${fullName(product)}, ${product.colour}`}>
                <img src={product.image} alt="" draggable={false} />
                {slot === 0 && (
                  <span className="sh-arch-chip">
                    <strong>{product.name}</strong>
                    <span>{product.price !== undefined ? euro(product.price) : <T k="shop.hero.atshop">Price at the shop</T>}</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <button type="button" className="sh-arrow is-prev" onClick={() => go(-1)} aria-label="Previous pick"><ArrowLeft size={18} aria-hidden="true" /></button>
      <button type="button" className="sh-arrow is-next" onClick={() => go(1)} aria-label="Next pick"><ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  );
}

/* ---------- What's new: a rail that keeps turning ---------- */

function StageCard({ product, hidden = false }: { product: ShopProduct; hidden?: boolean }) {
  const tags = product.tags ?? [];
  const chip = tags.includes("limited") ? "Limited" : tags.includes("drops") ? "Drop" : tags.includes("new") ? "New" : undefined;
  return (
    <article className="sh-card" aria-hidden={hidden || undefined}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-card-link" tabIndex={hidden ? -1 : undefined}>
        <img src={product.image} alt={hidden ? "" : `${fullName(product)}, ${product.colour}`} loading="lazy" />
        {chip && <span className="sh-chip"><Sparkle size={11} aria-hidden="true" /> {chip}</span>}
        <span className="sh-card-text">
          <span className="sh-card-brand">{brandLine(product)}</span>
          <span className="sh-card-name">{product.name}</span>
          <Price product={product} />
        </span>
      </Link>
      {!hidden && <SaveButton product={product} />}
      {!hidden && <AddToCart product={product} />}
    </article>
  );
}

function WhatsNew() {
  const n = NEW_IN.length;
  // Three copies side by side, so the rail can turn on forever; after each
  // step past the end it jumps back to the middle copy without a transition
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  useTurn(3000, () => setIndex((value) => value + 1));
  useEffect(() => {
    if (index >= 0 && index < n) return;
    const timer = window.setTimeout(() => { setInstant(true); setIndex((value) => ((value % n) + n) % n); }, 760);
    return () => window.clearTimeout(timer);
  }, [index, n]);
  useEffect(() => {
    if (!instant) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    return () => cancelAnimationFrame(frame);
  }, [instant]);
  const at = ((index % n) + n) % n;
  return (
    <section className="sh-sec sh-new" aria-labelledby="sh-new-title">
      <div className="sh-panel">
        <header className="sh-head">
          <h2 id="sh-new-title" className="sh-h2"><T k="shop.story.new">See what’s new</T></h2>
          <Link to="/shop/all" search={{ tag: "new" }} className="sh-textlink"><T k="shop.story.new.all">Shop all new in</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </header>
        <div className="sh-loop">
          <ul className={`sh-loop-track${instant ? " is-instant" : ""}`} style={{ "--i": index + n } as CSSProperties}>
            {[0, 1, 2].flatMap((copy) => NEW_IN.map((product) => (
              <li key={`${copy}-${product.id}`} className="sh-loop-item"><StageCard product={product} hidden={copy !== 1} /></li>
            )))}
          </ul>
        </div>
        <div className="sh-rail-foot">
          <div className="sh-dots" role="group" aria-label="Cards">
            {NEW_IN.map((product, dot) => (
              <button key={product.id} type="button" className="sh-dot" aria-pressed={dot === at} aria-label={`Show ${fullName(product)}`} onClick={() => setIndex(dot)} />
            ))}
          </div>
          <div className="sh-arrows">
            <button type="button" className="sh-arrow" onClick={() => setIndex((value) => value - 1)} aria-label="Previous cards"><ArrowLeft size={18} aria-hidden="true" /></button>
            <button type="button" className="sh-arrow" onClick={() => setIndex((value) => value + 1)} aria-label="Next cards"><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- New collections: one card, a new piece every 2 seconds ---------- */

function Collections() {
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const items = COLLECTIONS[tab]!.items;
  const product = items[index % items.length]!;
  const step = (by: number) => setIndex((value) => (value + by + items.length) % items.length);
  useTurn(2000, () => step(1), [tab]);
  return (
    <section className="sh-sec sh-coll" aria-labelledby="sh-coll-title">
      <div className="sh-panel">
        <header className="sh-head">
          <h2 id="sh-coll-title" className="sh-h2"><T k="shop.story.coll">New collections</T></h2>
          <div className="sh-tabs" role="group" aria-label="Collections">
            {COLLECTIONS.map((item, i) => (
              <button key={item.id} type="button" className="sh-tab" aria-pressed={i === tab} onClick={() => { setTab(i); setIndex(0); }}>
                <T k={`shop.story.coll.${item.id}`}>{item.label}</T>
              </button>
            ))}
          </div>
        </header>
        <div className="sh-coll-stage">
          <span className="sh-back sh-back-1" aria-hidden="true" />
          <span className="sh-back sh-back-2" aria-hidden="true" />
          <button type="button" className="sh-arrow is-side is-prev" onClick={() => step(-1)} aria-label="Previous piece"><ArrowLeft size={18} aria-hidden="true" /></button>
          <div className="sh-coll-card">
            <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-coll-photo" key={product.id} tabIndex={-1} aria-hidden="true">
              <img src={product.image} alt="" />
            </Link>
            <span className="sh-bubble is-a">{fullName(product)}</span>
            <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-coll-shop" aria-label={`Shop ${fullName(product)}`}>
              <T k="shop.story.coll.shop">Shop</T> <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <span className="sh-coll-dots" aria-hidden="true">
              {items.map((item, i) => <span key={item.id} data-on={i === index % items.length || undefined} />)}
            </span>
          </div>
          <button type="button" className="sh-arrow is-side is-next" onClick={() => step(1)} aria-label="Next piece"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}

/* ---------- The edit: a numbered list, the photo pinned beside it ---------- */

function TheEdit() {
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset["row"]));
    }, { rootMargin: "-46% 0px -46% 0px" });
    rows.current.forEach((row) => row && io.observe(row));
    return () => io.disconnect();
  }, []);
  return (
    <section className="sh-sec sh-edit" aria-labelledby="sh-edit-title">
      <div className="sh-panel">
        <h2 id="sh-edit-title" className="sr-only">The edit</h2>
        <ol className="sh-edit-list">
          {EDIT.map((row, index) => (
            <li key={row.tag} ref={(node) => { rows.current[index] = node; }} data-row={index} className="sh-edit-row" data-on={index === active || undefined}>
              <Link to="/shop/all" search={{ tag: row.tag }} className="sh-edit-link" onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)}>
                <span className="sh-edit-name"><T k={`shop.story.edit.${row.tag}`}>{row.label}</T></span>
                <span className="sh-edit-num">0{index + 1}</span>
                <span className="sh-edit-note"><T k={`shop.story.edit.${row.tag}.note`}>{row.note}</T></span>
                <span className="sh-edit-count">{row.count} pieces <ArrowRight size={15} aria-hidden="true" /></span>
              </Link>
              <img className="sh-edit-inline" src={row.product.image} alt="" loading="lazy" />
            </li>
          ))}
        </ol>
        <div className="sh-edit-pin" aria-hidden="true">
          <div className="sh-edit-frame">
            {EDIT.map((row, index) => <img key={row.tag} src={row.product.image} alt="" loading="lazy" data-on={index === active || undefined} />)}
            <span className="sh-edit-tag">{EDIT[active]!.label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- The aisles: three big photo cards ---------- */

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
                <span className="sh-look-more"><T k="shop.looks.more">Discover more</T> <ArrowRight size={13} aria-hidden="true" /></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="sh-credit"><T k="shop.looks.credit">Photos: Justus Menke, Nathaniel Cherian and Alberto Rodríguez Santana on Unsplash.</T></p>
    </section>
  );
}

/* ---------- Stream and chill: ten services ---------- */

function StreamAndChill() {
  return (
    <section className="sh-sec sh-stream" aria-labelledby="sh-stream-title">
      <header className="sh-head">
        <h2 id="sh-stream-title" className="sh-h2"><T k="shop.stream.title">Pick your favourite way to stream and chill</T></h2>
        <Link to="/shop/all" search={{ cat: "streaming" }} className="sh-textlink"><T k="shop.stream.all">Every subscription</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      <ul className="sh-stream-grid">
        {STREAM.map((product) => (
          <li key={product.id}>
            <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-service">
              <img src={product.image} alt="" loading="lazy" />
              <span className="sh-service-text">
                <span className="sh-service-name">{product.name}</span>
                <span className="sh-service-note">{product.colour}</span>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
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
  const limited = getProduct("patek-philippe-nautilus")!;
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
              <span className="sh-tile-kicker">{count("drops")} <T k="shop.explore.drops.n">pieces</T></span>
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
          <Link to="/shop/all" search={{ tag: "limited" }} className="sh-tile sh-tile-photo is-stage">
            <img src={limited.image} alt="" loading="lazy" />
            <span className="sh-tile-text">
              <span className="sh-tile-kicker">{count("limited")} <T k="shop.explore.limited.n">pieces</T></span>
              <span className="sh-tile-name"><T k="shop.explore.limited">Limited editions</T></span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/shop/brands" className="sh-tile sh-tile-az">
            <span className="sh-tile-letters" aria-hidden="true">A&nbsp;B&nbsp;C<br />X&nbsp;Y&nbsp;Z</span>
            <span className="sh-tile-kicker">{brandCount} <T k="shop.explore.brands.n">brands</T></span>
            <span className="sh-tile-name"><T k="shop.explore.brands">Brands A to Z</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </li>
        <li>
          <Link to="/shop/gifts" className="sh-tile sh-tile-gift">
            <span className="sh-tile-bands">{GIFT_BANDS.map((band) => <span key={band.id}>{band.label}</span>)}</span>
            <span className="sh-tile-name"><T k="shop.explore.gifts">Gift guide</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

