import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Sparkle } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { AddToCart, Price, SaveButton, ShopShell, brandLine, euro } from "../components/shop-kit";
import { BRANDS, PRODUCTS, SHOP_CATEGORIES, fullName, getBrand, getProduct, productsIn, productsOf, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// The shop home is a story told by scrolling. Each move from one part to
// the next has its own effect:
//   hero          the arched cards rise in; on the way out the frame shrinks and rounds
//   what's new    the heading wipes in, the cards slide in from the right
//   collections   the panel rises, the cards behind it fan out as you scroll
//   find a piece  the tiles open one after another, the brand pills scatter
//   the edit      the lines draw in, the pinned photo changes with each line
//   our promise   the words light up one by one as you scroll
//   the aisles    the five aisles zoom in
//   let's go      the headline types itself
// The scroll-linked parts use CSS scroll-driven animations; the rest switch
// on once with an IntersectionObserver. With reduced motion, nothing moves.

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

const HERO = pick(["jordan-4-retro-grey", "rolex-submariner", "jordan-4-retro-sage", "adidas-argentina-1998-home", "omega-swatch-moonswatch", "nike-air-max-97-silver", "supreme-box-logo-hoodie-pink", "cartier-santos-steel", "adidas-samba-og-cloud-white-core-black-gum"]);
const NEW_IN = PRODUCTS.filter((product) => product.tags?.includes("new")).slice(0, 12);
const COLLECTIONS = [
  { id: "jordans", label: "Jordans", items: pick(["jordan-4-retro-grey", "jordan-4-retro-sage", "jordan-1-high-og-silver", "stockx-air-jordan-4-retro-military-black-white-grey-black", "stockx-air-jordan-1-high-university-blue-white-university-blue-black", "jordan-6-retro-infrared", "jordan-5-retro-grape"]) },
  { id: "terrace", label: "Terrace", items: pick(["adidas-samba-og-cloud-white-core-black-gum", "adidas-gazelle-indoor-blue", "adidas-handball-spezial", "adidas-sl-72-og-red", "onitsuka-tiger-mexico-66-yellow", "puma-speedcat-og"]) },
  { id: "shirts", label: "Shirts", items: pick(["adidas-argentina-1998-home", "adidas-france-home-retro", "adidas-argentina-2006-away", "lakers-kobe-bryant-8-jersey", "nba-all-star-1995-jersey", "bape-mitchell-ness-bulls-jersey"]) },
  { id: "steel", label: "Steel", items: pick(["rolex-submariner", "patek-philippe-nautilus", "audemars-piguet-royal-oak-skeleton", "cartier-santos-steel", "omega-swatch-moonswatch", "tag-heuer-monaco"]) },
];
// The brand pills in the bento: where each one lands (centre, in %) and its tilt
const PILLS = [
  { slug: "rolex", x: 22, y: 24, r: -9 },
  { slug: "jordan", x: 62, y: 17, r: 8 },
  { slug: "cartier", x: 82, y: 42, r: -13 },
  { slug: "adidas", x: 38, y: 50, r: 5 },
  { slug: "casio", x: 16, y: 74, r: 11 },
  { slug: "omega", x: 66, y: 68, r: -6 },
  { slug: "onitsuka-tiger", x: 42, y: 88, r: -11 },
  { slug: "supreme", x: 85, y: 88, r: 9 },
].flatMap((pill) => {
  const brand = getBrand(pill.slug);
  return brand ? [{ ...pill, name: brand.name }] : [];
});
const EDIT = [
  { tag: "new", label: "New in", note: "Fresh pairs, shirts and steel, added this season.", image: "one-piece-air-max-plus-mera-mera" },
  { tag: "trending", label: "Trending", note: "What people are wearing right now.", image: "adidas-samba-og-cloud-white-core-black-gum" },
  { tag: "limited", label: "Limited", note: "Collabs, grails and pieces that won’t come back.", image: "patek-philippe-nautilus" },
  { tag: "gift", label: "Gift ideas", note: "Easy wins, from a €20 Casio up.", image: "omega-swatch-moonswatch" },
].map((row) => ({ ...row, product: getProduct(row.image)!, count: count(row.tag) }));
// The promise, word by word: *gold* words, and products in the line
type Bit = string | { img: string };
const PROMISE: Bit[] = ["OGCW", "doesn’t", "sell", "*anything.*", "We", "find", "the", "pair", { img: "jordan-4-retro-grey" }, "the", "shirt", { img: "adidas-argentina-1998-home" }, "the", "watch", { img: "rolex-submariner" }, "and", "the", "show", "worth", "your", "money,", "then", "send", "you", "*straight*", "to", "the", "shop", "that", "makes", "it.", "*No middleman, no markup.*"];
const STREAM_LOGOS = pick(["netflix-standard", "spotify-premium", "ufc-fight-pass", "playstation-plus", "crunchyroll-premium", "dazn-standard"]);
const category = (slug: string) => SHOP_CATEGORIES.find((item) => item.slug === slug)!;
const AISLES = [
  { key: "sneakers", label: "Sneakers", blurb: category("sneakers").blurb, search: { cat: "sneakers" }, image: getProduct("jordan-4-retro-grey")!.image, count: `${productsIn("Sneakers").length} pairs` },
  { key: "clothing", label: "Clothing", blurb: "Football shirts, jerseys, merch and limited editions.", search: { cat: "clothing" }, image: getProduct("adidas-argentina-1998-home")!.image, count: `${productsIn("Clothing").length} pieces` },
  { key: "watches", label: "Watches & chains", blurb: "Rolex to Casio, and gold chains.", search: { cat: "accessories" }, image: getProduct("rolex-submariner")!.image, count: `${productsIn("Accessories").length} pieces` },
  { key: "drops", label: "Featured drops", blurb: "The One Piece pack, the Jordans on the calendar and the retro shirts.", search: { tag: "drops" }, image: "/shop/one-piece-air-max-plus-pack.webp", count: `${count("drops")} drops` },
  { key: "streaming", label: "Streaming", blurb: category("streaming").blurb, search: { cat: "streaming" }, image: "", count: `${productsIn("Streaming").length} subscriptions` },
];
const brandCount = BRANDS.filter((brand) => productsOf(brand.slug).length > 0).length;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Switch on each [data-fx] part once, as it comes into view */
function useStoryFx() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -18% 0px" });
    el.querySelectorAll("[data-fx]").forEach((node) => io.observe(node));
    el.classList.add("is-ready");
    return () => io.disconnect();
  }, []);
  return root;
}

function ShopHome() {
  const root = useStoryFx();
  return (
    <ShopShell promise={false}>
      <div className="sh" ref={root}>
        <Hero />
        <div id="shop-story" className="sh-anchor" />
        <WhatsNew />
        <Collections />
        <FindYourPiece />
        <TheEdit />
        <OurPromise />
        <Aisles />
        <LetsGo />
      </div>
    </ShopShell>
  );
}

/* ---------- The hero: badge, two lines, a line of copy, one button, the arched cards ---------- */

function Hero() {
  const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  return (
    <section className="sh-hero" aria-labelledby="sh-hero-title">
      <div className="sh-hero-frame">
        <div className="sh-intro" aria-hidden="true"><span>OGCW</span></div>
        <div className="sh-hero-copy">
          <p className="sh-badge"><span className="sh-badge-dot" aria-hidden="true" /> {PRODUCTS.length} <T k="shop.hero.badge">picks from</T> {brandCount} <T k="shop.hero.badge2">brands, bought at the source</T></p>
          <h1 id="sh-hero-title" className="sh-hero-title">
            <span className="sh-line"><span><T k="shop.hero.l1">Wear the culture.</T></span></span>
            <span className="sh-line"><span><T k="shop.hero.l2">Buy it at the source.</T></span></span>
          </h1>
          <p className="sh-hero-sub"><T k="shop.hero.sub">Sneakers, shirts, watches and streaming, picked by OGCW and bought from the shop that makes them.</T></p>
          <div className="sh-hero-ctas">
            <button type="button" className="sh-cta" onClick={go("shop-story")}><T k="shop.hero.cta">Start the story</T> <span className="sh-cta-dot"><ArrowDown size={16} aria-hidden="true" /></span></button>
            <button type="button" className="sh-skip" onClick={go("aisles")}><T k="shop.hero.skip">Skip to the aisles</T></button>
          </div>
        </div>
        <Arches />
      </div>
    </section>
  );
}

function Arches() {
  const [active, setActive] = useState(0);
  const start = useRef<number | null>(null);
  const n = HERO.length;
  const go = (step: number) => setActive((value) => (value + step + n) % n);
  const down = (event: ReactPointerEvent) => { start.current = event.clientX; };
  const up = (event: ReactPointerEvent) => {
    if (start.current === null) return;
    const moved = event.clientX - start.current;
    start.current = null;
    if (Math.abs(moved) > 40) go(moved < 0 ? 1 : -1);
  };
  const centre = HERO[active]!;
  return (
    <div className="sh-arches" role="group" aria-roledescription="carousel" aria-label="Picks from the shop">
      <button type="button" className="sh-arrow is-prev" onClick={() => go(-1)} aria-label="Previous pick"><ArrowLeft size={18} aria-hidden="true" /></button>
      <ul className="sh-arch-track" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { start.current = null; }}>
        {HERO.map((product, index) => {
          let slot = index - active;
          if (slot > n / 2) slot -= n;
          if (slot < -n / 2) slot += n;
          const shown = Math.abs(slot) <= 2;
          return (
            <li key={product.id} className="sh-arch" data-centre={slot === 0 || undefined} data-far={Math.abs(slot) > 1 || undefined} style={{ "--slot": slot, "--abs": Math.abs(slot), "--i": index } as CSSProperties} aria-hidden={!shown}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-arch-card" tabIndex={shown ? 0 : -1} draggable={false}>
                <img src={product.image} alt={fullName(product)} draggable={false} />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="sh-arch-chip" aria-live="polite" key={centre.id}>
        <strong>{centre.name}</strong>
        {centre.price !== undefined ? <><span>{euro(centre.price)}</span> <small><T k="shop.hero.guide">guide</T></small></> : <small><T k="shop.hero.atshop">Price at the shop</T></small>}
      </p>
      <button type="button" className="sh-arrow is-next" onClick={() => go(1)} aria-label="Next pick"><ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  );
}

/* ---------- What's new: a rail of cards with arrows and dots ---------- */

function StageCard({ product }: { product: ShopProduct }) {
  const tags = product.tags ?? [];
  const chip = tags.includes("limited") ? "Limited" : tags.includes("drops") ? "Drop" : tags.includes("new") ? "New" : undefined;
  return (
    <article className="sh-card">
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-card-link">
        <img src={product.image} alt={`${fullName(product)}, ${product.colour}`} loading="lazy" />
        {chip && <span className="sh-chip"><Sparkle size={11} aria-hidden="true" /> {chip}</span>}
        <span className="sh-card-text">
          <span className="sh-card-brand">{brandLine(product)}</span>
          <span className="sh-card-name">{product.name}</span>
          <Price product={product} />
        </span>
      </Link>
      <SaveButton product={product} />
      <AddToCart product={product} />
    </article>
  );
}

function WhatsNew() {
  const rail = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const total = Math.max(1, Math.ceil((el.scrollWidth - 4) / el.clientWidth));
        setPages(total);
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
        setPage(atEnd ? total - 1 : Math.round(el.scrollLeft / el.clientWidth));
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", measure); ro.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  const to = (next: number) => rail.current?.scrollTo({ left: next * rail.current.clientWidth, behavior: reduced() ? "auto" : "smooth" });
  return (
    <section className="sh-sec sh-new" data-fx aria-labelledby="sh-new-title">
      <div className="sh-panel">
        <header className="sh-head">
          <h2 id="sh-new-title" className="sh-h2 sh-wipe"><T k="shop.story.new">See what’s new</T></h2>
          <Link to="/shop/all" search={{ tag: "new" }} className="sh-textlink"><T k="shop.story.new.all">Shop all new in</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </header>
        <ul className="sh-rail" ref={rail}>
          {NEW_IN.map((product, index) => (
            <li key={product.id} className="sh-rail-item" style={{ "--i": index } as CSSProperties}><StageCard product={product} /></li>
          ))}
        </ul>
        <div className="sh-rail-foot">
          <div className="sh-dots" role="group" aria-label="Pages">
            {Array.from({ length: pages }, (_, index) => (
              <button key={index} type="button" className="sh-dot" aria-pressed={index === page} aria-label={`Page ${index + 1} of ${pages}`} onClick={() => to(index)} />
            ))}
          </div>
          <div className="sh-arrows">
            <button type="button" className="sh-arrow" onClick={() => to(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous cards"><ArrowLeft size={18} aria-hidden="true" /></button>
            <button type="button" className="sh-arrow" onClick={() => to(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} aria-label="Next cards"><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- New collections: tabs, one big card, two cards fanned out behind ---------- */

function Collections() {
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const items = COLLECTIONS[tab]!.items;
  const product = items[index % items.length]!;
  const step = (by: number) => setIndex((value) => (value + by + items.length) % items.length);
  return (
    <section className="sh-sec sh-coll" data-fx aria-labelledby="sh-coll-title">
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
          <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-coll-card" key={product.id} aria-label={`${fullName(product)}, ${product.colour}`}>
            <img src={product.image} alt="" />
            <span className="sh-bubble is-a">{product.name}</span>
            <span className="sh-bubble is-b">{product.price !== undefined ? euro(product.price) : "Price at the shop"}</span>
            <span className="sh-coll-dots" aria-hidden="true">
              {items.map((item, i) => <span key={item.id} data-on={i === index % items.length || undefined} />)}
            </span>
          </Link>
          <button type="button" className="sh-arrow is-side is-next" onClick={() => step(1)} aria-label="Next piece"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
        <p className="sh-coll-line" aria-live="polite"><span>{brandLine(product)}</span> {product.colour}</p>
      </div>
    </section>
  );
}

/* ---------- Find your piece: the bento, with brand pills that scatter ---------- */

function FindYourPiece() {
  const photo = getProduct("rolex-daytona-gold")!;
  return (
    <section className="sh-sec sh-bento" data-fx aria-labelledby="sh-bento-title">
      <div className="sh-tile sh-bento-main" style={{ "--d": 0 } as CSSProperties}>
        <p className="sh-bento-note"><T k="shop.story.bento.note">OGCW picks from the brands in our stories, from Rolex to Casio and Jordan to Onitsuka Tiger.</T></p>
        <h2 id="sh-bento-title" className="sh-h2 sh-h2-xl"><T k="shop.story.bento.title">Find your piece here</T></h2>
        <Link to="/shop/all" className="sh-bento-link">
          <em><T k="shop.story.bento.link">From terrace classics to Swiss steel</T></em>
          <span className="sh-circle"><ArrowRight size={18} aria-hidden="true" /></span>
        </Link>
        <img className="sh-bento-ghost" src={getProduct("jordan-1-high-og-silver")!.image} alt="" loading="lazy" />
      </div>
      <Link to="/shop/p/$id" params={{ id: photo.id }} className="sh-tile sh-bento-photo" style={{ "--d": 1 } as CSSProperties} aria-label={fullName(photo)}>
        <img src={photo.image} alt="" loading="lazy" />
      </Link>
      <Link to="/shop/all" search={{ tag: "drops" }} className="sh-tile sh-bento-gold" style={{ "--d": 2 } as CSSProperties}>
        <span className="sh-bento-gold-title"><Sparkle size={16} aria-hidden="true" /> <T k="shop.story.bento.drops">Shop the latest drops</T></span>
        <span className="sh-bento-gold-text"><T k="shop.story.bento.drops.text">The One Piece Air Max Plus pack, the Jordans on the calendar and the retro shirts.</T></span>
      </Link>
      <div className="sh-tile sh-bento-pills" style={{ "--d": 3 } as CSSProperties}>
        {PILLS.map((pill, index) => (
          <Link key={pill.slug} to="/shop/$slug" params={{ slug: pill.slug }} className="sh-pill" style={{ "--x": pill.x, "--y": pill.y, "--r": `${pill.r}deg`, "--i": index } as CSSProperties}>{pill.name}</Link>
        ))}
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
            <li key={row.tag} ref={(node) => { rows.current[index] = node; }} data-row={index} data-fx className="sh-edit-row" data-on={index === active || undefined}>
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
            <span className="sh-edit-steps">{EDIT.map((row, index) => <span key={row.tag} data-on={index === active || undefined} />)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- The promise: the words light up as you scroll ---------- */

function OurPromise() {
  const words = PROMISE.length;
  const text = PROMISE.map((bit) => (typeof bit === "string" ? bit.replace(/\*/g, "") : "")).filter(Boolean).join(" ");
  return (
    <section className="sh-sec sh-words" aria-label="How the OGCW Shop works">
      <div className="sh-words-pin">
        <p className="sh-words-text" style={{ "--n": words } as CSSProperties} aria-label={text}>
          {PROMISE.map((bit, index) => {
            const style = { "--i": index } as CSSProperties;
            if (typeof bit !== "string") {
              const product = getProduct(bit.img)!;
              return <Fragment key={index}><span className="sh-w sh-w-img" style={style} aria-hidden="true"><img src={product.image} alt="" loading="lazy" /></span>{" "}</Fragment>;
            }
            const gold = bit.startsWith("*");
            return <Fragment key={index}><span className={`sh-w${gold ? " is-gold" : ""}`} style={style} aria-hidden="true">{bit.replace(/\*/g, "")}</span>{" "}</Fragment>;
          })}
        </p>
      </div>
    </section>
  );
}

/* ---------- The aisles: where the story ends and the shopping starts ---------- */

function Aisles() {
  return (
    <section className="sh-sec sh-aisles" id="aisles" aria-labelledby="sh-aisles-title">
      <header className="sh-head sh-aisles-head">
        <h2 id="sh-aisles-title" className="sh-h2"><T k="shop.story.aisles">Pick your aisle</T></h2>
        <p className="sh-aisles-sub"><T k="shop.story.aisles.sub">Every piece, sorted. Choose one and dig in.</T></p>
      </header>
      <ul className="sh-aisle-grid">
        {AISLES.map((aisle) => (
          <li key={aisle.key} className={`sh-aisle is-${aisle.key}`}>
            <Link to="/shop/all" search={aisle.search} className="sh-aisle-link">
              {aisle.image ? <img className="sh-aisle-img" src={aisle.image} alt="" loading="lazy" /> : (
                <span className="sh-aisle-logos" aria-hidden="true">{STREAM_LOGOS.map((product) => <img key={product.id} src={product.image} alt="" loading="lazy" />)}</span>
              )}
              <span className="sh-aisle-text">
                <span className="sh-aisle-count">{aisle.count}</span>
                <span className="sh-aisle-name"><T k={`shop.story.aisle.${aisle.key}`}>{aisle.label}</T></span>
                <span className="sh-aisle-blurb"><T k={`shop.story.aisle.${aisle.key}.blurb`}>{aisle.blurb}</T></span>
              </span>
              <span className="sh-circle"><ArrowUpRight size={18} aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Let's go: the headline types itself, then the shop's small print ---------- */

const TYPED = ["Let’s go", "shopping."];

function LetsGo() {
  let letter = 0;
  return (
    <section className="sh-sec sh-close" data-fx aria-labelledby="sh-close-title">
      <Link to="/shop/all" className="sh-close-circle" aria-label="Shop everything"><ArrowUpRight size={26} aria-hidden="true" /></Link>
      <div className="sh-panel">
        <div className="sh-close-top">
          <h2 id="sh-close-title" className="sh-type" aria-label={TYPED.join(" ")}>
            {TYPED.map((line, row) => (
              <span key={line} className="sh-type-line" aria-hidden="true">
                {[...line].map((char) => <span key={letter} style={{ "--i": letter++ } as CSSProperties}>{char}</span>)}
                {row === TYPED.length - 1 && <span className="sh-caret" style={{ "--i": letter } as CSSProperties} />}
              </span>
            ))}
          </h2>
          <p className="sh-close-text"><T k="shop.story.close.text">Picked by OGCW and bought from the shop that makes it. Every price is a guide; each shop sets the final one.</T></p>
        </div>
        <div className="sh-close-cols">
          <div>
            <p className="sh-close-mark">OGCW<span>Shop</span></p>
            <p className="sh-close-small"><T k="shop.story.close.small">The shop of One Great Culture World.</T></p>
          </div>
          <div>
            <h3><T k="shop.story.close.aisles">Aisles</T></h3>
            <ul>{AISLES.map((aisle) => <li key={aisle.key}><Link to="/shop/all" search={aisle.search}>{aisle.label}</Link></li>)}</ul>
          </div>
          <div>
            <h3><T k="shop.story.close.how">How it works</T></h3>
            <ol>
              <li><T k="shop.story.close.how1">Add what you like to the cart.</T></li>
              <li><T k="shop.story.close.how2">Checkout lists each item by its shop.</T></li>
              <li><T k="shop.story.close.how3">Buy it there: they handle sizes, payment and delivery.</T></li>
            </ol>
          </div>
          <div>
            <h3><T k="shop.story.close.more">More</T></h3>
            <ul>
              <li><Link to="/shop/drops"><T k="shop.bar.release-dates">Release dates</T></Link></li>
              <li><Link to="/shop/brands"><T k="shop.bar.brands-a-to-z">Brands A to Z</T></Link></li>
              <li><Link to="/shop/gifts"><T k="shop.bar.gift-guide">Gift guide</T></Link></li>
              <li><Link to="/info/$slug" params={{ slug: "faq" }}><T k="shop.promise.faq">Questions?</T></Link></li>
            </ul>
          </div>
        </div>
        <p className="sh-close-strip">
          <span><T k="shop.story.close.strip1">Guide prices in euros</T></span>
          <span><T k="shop.story.close.strip2">Photos: Wikimedia Commons and Unsplash, credited on each product</T></span>
          <span><T k="shop.story.close.strip3">OGCW sells nothing itself</T></span>
        </p>
      </div>
    </section>
  );
}
