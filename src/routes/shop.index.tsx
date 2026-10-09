import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AddToCart, Price, SaveButton, ShopShell, brandLine } from "../components/shop-kit";
import { BRANDS, GIFT_BANDS, PRODUCTS, SNEAKER_DROPS, fullName, getProduct, productsOf, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// The shop home, top to bottom (after Killstar's store):
//   hero          one photo, edge to edge, with the headline and a link at the bottom
//   what's new    a rail that keeps turning, even under the pointer
//   new season    a still photo the size of the section, with a link; it slides
//                 up over What's new, and a short scroll glides the rest of the way
//   the edit      New in, Trending, Limited, Gift ideas, with a wide photo pinned beside them
//   the aisles    three tall photo cards side by side: sneakers, clothing, watches and chains
//   trendiest     four tall product cards side by side
//   explore       featured drops, release dates, limited editions, brands, the gift guide
// Words never move on scroll; only cards and photos do. With reduced motion
// nothing turns by itself and nothing glides.

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

const NEW_IN = PRODUCTS.filter((product) => product.tags?.includes("new")).slice(0, 12);
const EDIT = [
  { tag: "new", label: "New in", note: "Fresh pairs, shirts and steel, added this season.", image: "one-piece-air-max-plus-mera-mera" },
  { tag: "trending", label: "Trending", note: "What people are wearing right now.", image: "adidas-samba-og-cloud-white-core-black-gum" },
  { tag: "limited", label: "Limited", note: "Collabs, grails and pieces that won’t come back.", image: "patek-philippe-nautilus" },
  { tag: "gift", label: "Gift ideas", note: "Easy wins, from a €20 Casio up.", image: "omega-swatch-moonswatch" },
].map((row) => ({ ...row, product: getProduct(row.image)!, count: count(row.tag) }));
// Photos from Unsplash (Justus Menke, Nathaniel Cherian, Alberto Rodríguez Santana,
// Nicolas Ladino Silva, Danist Soh)
const LOOKS = [
  { key: "sneakers", label: "Sneakers", search: { cat: "sneakers" }, image: "/shop/looks/sneakers.webp", alt: "White Nike sneakers on dark asphalt beside a painted white line" },
  { key: "clothing", label: "Clothing", search: { cat: "clothing" }, image: "/shop/looks/clothing.webp", alt: "A red and white football shirt hanging on a wall in warm light" },
  { key: "watches", label: "Watches & chains", search: { cat: "accessories" }, image: "/shop/looks/watches.webp", alt: "A man in a black coat wearing a gold chain" },
];
const TRENDIEST = pick(["nike-air-max-97-silver", "adidas-samba-og-cloud-white-core-black-gum", "supreme-box-logo-hoodie-pink", "rolex-submariner"]);
const brandCount = BRANDS.filter((brand) => productsOf(brand.slug).length > 0).length;

/** An index that moves on by itself every `ms` (never under reduced motion, never in a hidden tab) */
function useTurn(ms: number, onTurn: () => void) {
  const turn = useRef(onTurn);
  turn.current = onTurn;
  useEffect(() => {
    if (reduced()) return;
    const timer = window.setInterval(() => { if (!document.hidden) turn.current(); }, ms);
    return () => window.clearInterval(timer);
  }, [ms]);
}

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
        <Trendiest />
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

/* ---------- The edit: a numbered list, a wide photo pinned beside it ---------- */

function TheEdit() {
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  // The row nearest the middle of the screen is the one shown
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const middle = window.innerHeight / 2;
      let best = 0;
      let gap = Infinity;
      rows.current.forEach((row, index) => {
        if (!row) return;
        const box = row.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < gap) { gap = distance; best = index; }
      });
      setActive(best);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <section className="sh-sec sh-edit" aria-labelledby="sh-edit-title">
      <div className="sh-panel">
        <h2 id="sh-edit-title" className="sr-only">The edit</h2>
        <ol className="sh-edit-list">
          {EDIT.map((row, index) => (
            <li key={row.tag} ref={(node) => { rows.current[index] = node; }} className="sh-edit-row" data-on={index === active || undefined}>
              <Link to="/shop/all" search={{ tag: row.tag }} className="sh-edit-link">
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

/* ---------- Trendiest: four tall product cards side by side ---------- */

function Trendiest() {
  return (
    <section className="sh-sec sh-picks" aria-labelledby="sh-picks-title">
      <header className="sh-looks-head">
        <h2 id="sh-picks-title" className="sh-h2"><T k="shop.picks.title">Trendiest right now</T></h2>
        <Link to="/shop/all" search={{ tag: "trending" }} className="sh-textlink"><T k="shop.picks.all">Shop trendiest</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>
      <ul className="sh-picks-grid">
        {TRENDIEST.map((product) => (
          <li key={product.id} className="sh-pick">
            <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-pick-link">
              <span className="sh-pick-photo"><img src={product.image} alt={`${fullName(product)}, ${product.colour}`} loading="lazy" /></span>
              <span className="sh-pick-badge"><T k="shop.picks.badge">Trending</T></span>
              <span className="sh-pick-text">
                <span className="sh-pick-name">{fullName(product)}</span>
                <Price product={product} />
              </span>
            </Link>
            <SaveButton product={product} />
            <AddToCart product={product} />
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
