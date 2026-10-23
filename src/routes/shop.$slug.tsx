import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ProductGrid, ShopShell, dollars } from "../components/shop-kit";
import { BRANDS, getBrand, isLive, productsOf, type ShopBrand, type ShopCategory, type ShopProduct } from "../data/shop";
import { logoOf } from "../data/shop-logos";
import { T } from "@/components/site-text";

// A brand's own shop (owner, 15 Oct 2026: no row of three pictures and no
// big "Visit" button). At the top, one big picture: the brand's best piece
// alone on a light stage, leaning towards the pointer in 3D, with the brand's
// name huge behind it. Then its products (by department, sorted by price),
// and "More brands": a 3D cover-flow of the other brands, each with its own
// best piece, turning by itself, with an arrow on each side.
export const Route = createFileRoute("/shop/$slug")({
  beforeLoad: ({ params }) => {
    if (!getBrand(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const brand = getBrand(params.slug);
    const title = brand ? `Shop ${brand.name} — OGCW Shop` : "OGCW Shop";
    return { meta: [{ title }, { name: "description", content: brand?.blurb ?? "" }, { property: "og:title", content: title }, { property: "og:type", content: "website" }] };
  },
  component: BrandPage,
});

type Sort = "featured" | "low" | "high";
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A brand's best piece for its picture: trending first, then anything with a price, on a white stage */
const starOf = (products: ShopProduct[]) =>
  products.find((product) => product.stage === "white" && product.price && product.tags?.includes("trending"))
  ?? products.find((product) => product.stage === "white" && product.price)
  ?? products[0];

function BrandPage() {
  const { slug } = Route.useParams();
  const brand = getBrand(slug);
  const [dept, setDept] = useState<"All" | ShopCategory>("All");
  const [sort, setSort] = useState<Sort>("featured");
  if (!brand) return null;
  const all = productsOf(brand.slug).filter(isLive);
  const depts = ["All", ...new Set(all.map((product) => product.category))] as ("All" | ShopCategory)[];
  let products = dept === "All" ? all : all.filter((product) => product.category === dept);
  if (sort !== "featured") products = [...products].sort((a, b) => ((a.price ?? 1e9) - (b.price ?? 1e9)) * (sort === "low" ? 1 : -1));

  return (
    <ShopShell>
      <BrandStage brand={brand} products={all} />

      <section id="brand-pieces" className="sx-wrap sx-section" aria-label={`${brand.name} products`}>
        <div className="sx-toolbar">
          <div className="sx-tabs" role="group" aria-label="Department">
            {depts.map((item) => <button key={item} type="button" className="sx-opt" aria-pressed={dept === item} onClick={() => setDept(item)}>{item}</button>)}
          </div>
          <span className="sx-count-line" />
          <label className="sx-sort">
            <span><T k="shop.sort">Sort</T></span>
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="low">Price, low to high</option>
              <option value="high">Price, high to low</option>
            </select>
          </label>
        </div>
        {products.length ? <ProductGrid products={products} cols={4} /> : <p className="bx-none">New pieces from {brand.name} are on the way.</p>}
      </section>

      <BrandFlow current={brand.slug} />
    </ShopShell>
  );
}

/* ---------- The big picture ---------- */

function BrandStage({ brand, products }: { brand: ShopBrand; products: ShopProduct[] }) {
  const star = starOf(products);
  const stage = useRef<HTMLElement>(null);
  const prices = products.map((product) => product.price).filter((price): price is number => !!price);
  const kinds = [...new Set(products.map((product) => product.category))];
  const logo = logoOf(brand.slug);
  // The piece leans towards the pointer (written straight to CSS, no re-render)
  const lean = (event: PointerEvent<HTMLElement>) => {
    if (reduced() || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    stage.current?.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    stage.current?.style.setProperty("--ry", `${(x * 16).toFixed(2)}deg`);
    stage.current?.style.setProperty("--mx", `${(x * 100 + 50).toFixed(1)}%`);
  };
  const rest = () => { stage.current?.style.setProperty("--rx", "0deg"); stage.current?.style.setProperty("--ry", "0deg"); };
  return (
    <section ref={stage} className="bx-stage" aria-labelledby="brand-title" onPointerMove={lean} onPointerLeave={rest}>
      <p className="bx-word" aria-hidden="true">{brand.name}</p>
      {star && isLive(star) && (
        <Link to="/shop/p/$id" params={{ id: star.id }} className="bx-star" aria-label={`${brand.name}: ${star.name}`}>
          <span className="bx-star-tilt">
            <img src={star.image} alt="" fetchPriority="high" />
          </span>
          <span className="bx-floor" aria-hidden="true" />
        </Link>
      )}
      <div className="bx-copy">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <Link to="/shop/brands"><T>Brands</T></Link></nav>
        <h1 id="brand-title" className="bx-name">{logo ? <img src={logo} alt={brand.name} className="bx-logo" /> : brand.name}</h1>
        <p className="bx-blurb">{brand.blurb}</p>
        <ul className="bx-facts">
          <li><strong>{products.length}</strong> {products.length === 1 ? "piece" : "pieces"}</li>
          {prices.length > 0 && <li>From <strong>{dollars(Math.min(...prices))}</strong></li>}
          {kinds.length > 0 && <li>{kinds.join(" · ")}</li>}
        </ul>
        <a href="#brand-pieces" className="bx-go"><T k="shop.brand.go">Shop the collection</T> <ArrowDown size={16} aria-hidden="true" /></a>
      </div>
      {star && isLive(star) && <p className="bx-caption">{star.name}{star.price ? ` · ${dollars(star.price)}` : ""} · <a href={brand.site} target="_blank" rel="noopener noreferrer">{brand.name} online <ArrowUpRight size={12} aria-hidden="true" /></a></p>}
    </section>
  );
}

/* ---------- More brands: a 3D cover-flow ---------- */

function BrandFlow({ current }: { current: string }) {
  const navigate = useNavigate();
  const list = useMemo(() => BRANDS
    .map((brand) => ({ brand, products: productsOf(brand.slug).filter(isLive) }))
    .filter((item) => item.products.length > 0 && item.brand.slug !== current && !item.brand.store)
    .sort((a, b) => b.products.length - a.products.length), [current]);
  const [index, setIndex] = useState(0);
  const go = (dir: 1 | -1) => setIndex((value) => (value + dir + list.length) % list.length);
  // Turns by itself every few seconds (the pointer doesn't stop it: owner's rule)
  useEffect(() => {
    if (reduced() || list.length < 2) return;
    const timer = window.setInterval(() => { if (!document.hidden) setIndex((value) => (value + 1) % list.length); }, 3600);
    return () => window.clearInterval(timer);
  }, [list.length]);
  if (!list.length) return null;
  return (
    <section className="bx-more" aria-labelledby="more-brands">
      <header className="bx-more-head">
        <p className="bx-more-kicker"><T k="shop.brand.more.kicker">Keep shopping</T></p>
        <h2 id="more-brands" className="bx-more-title"><mark><T k="shop.brand.more">More brands</T></mark></h2>
      </header>
      <div className="bx-flow" role="group" aria-roledescription="carousel" aria-label="Brands">
        <button type="button" className="bx-flow-arrow is-prev" onClick={() => go(-1)} aria-label="Previous brand"><ArrowLeft size={20} aria-hidden="true" /></button>
        <ul className="bx-flow-ring">
          {list.map(({ brand, products }, i) => {
            // The shortest way round from the brand in front
            let d = i - index;
            if (d > list.length / 2) d -= list.length;
            if (d < -list.length / 2) d += list.length;
            const star = starOf(products);
            const logo = logoOf(brand.slug);
            const front = d === 0;
            return (
              <li key={brand.slug} className="bx-card-wrap" style={{ "--d": d, "--a": Math.abs(d) } as CSSProperties} data-front={front || undefined} aria-hidden={Math.abs(d) > 3 || undefined}>
                <button
                  type="button"
                  className="bx-card"
                  tabIndex={Math.abs(d) > 2 ? -1 : 0}
                  onClick={() => (front ? navigate({ to: "/shop/$slug", params: { slug: brand.slug } }) : setIndex(i))}
                  aria-label={front ? `Shop ${brand.name}` : `Show ${brand.name}`}
                >
                  <span className="bx-card-photo">{star && <img src={star.image} alt="" loading="lazy" />}</span>
                  <span className="bx-card-name">{logo ? <img src={logo} alt="" className="bx-card-logo" /> : null}<span className={logo ? "bx-sr" : undefined}>{brand.name}</span></span>
                  <span className="bx-card-meta">{products.length} {products.length === 1 ? "piece" : "pieces"}</span>
                  <span className="bx-card-go">Shop {brand.name} <ArrowRight size={13} aria-hidden="true" /></span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="bx-flow-arrow is-next" onClick={() => go(1)} aria-label="Next brand"><ArrowRight size={20} aria-hidden="true" /></button>
      </div>
      <p className="bx-flow-now" aria-live="polite">{list[index]?.brand.name}</p>
      <div className="bx-more-all"><Link to="/shop/brands" className="bx-more-link"><T k="shop.brand.all">Every brand, A to Z</T> <ArrowRight size={15} aria-hidden="true" /></Link></div>
    </section>
  );
}
