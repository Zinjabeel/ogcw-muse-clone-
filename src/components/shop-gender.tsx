import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { LIVE_PRODUCTS, type ShopProduct } from "@/data/shop";
import { AddToCart, ProductPhoto, SaveButton, ShopShell, brandLine, dollars, firstTapShowsBack, Was } from "./shop-kit";
import { T } from "./site-text";

// The men's and women's shops, after Moncler's: a fall/winter picture over
// the whole first screen, then the list itself: the title with the types as
// chips beside it, a "View" switch (the front of every piece, or its other
// side) and big cards, four across, with an editorial picture every few
// rows. "Load more" brings the next rows.

type Look = { image: string; kicker: string; title: string; to: { kind?: string; cat?: string }; credit: string };
export type GenderPage = {
  gender: "men" | "women";
  title: string;
  hero: { image: string; pos?: string; kicker: string; title: string; credit: string; links: { label: string; kind?: string; cat?: string }[] };
  looks: Look[];
};

const ORDER = ["Jackets", "Hoodies & sweats", "Basketball", "Running", "Lifestyle", "Jeans", "T-shirts & shirts", "Pants", "Watches", "Caps & hats", "Bags"];
const CHIP: Record<string, string> = { "Hoodies & sweats": "Hoodies and knits", "T-shirts & shirts": "Tees and shirts", Basketball: "Basketball sneakers", Running: "Running sneakers", Lifestyle: "Lifestyle sneakers", "Caps & hats": "Caps and hats" };
const PAGE = 20;

export function GenderShop({ page }: { page: GenderPage }) {
  const [kind, setKind] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "other">("front");
  const [shown, setShown] = useState(PAGE);
  const all = useMemo(() => {
    const mine = LIVE_PRODUCTS.filter((product) => product.gender === page.gender || product.gender === "unisex");
    // Outerwear and knits lead, as in a fall/winter edit, then the rest by type
    return [...mine].sort((a, b) => (ORDER.indexOf(a.kind) + 1 || 99) - (ORDER.indexOf(b.kind) + 1 || 99) || Number(!!b.tags?.includes("trending")) - Number(!!a.tags?.includes("trending")));
  }, [page.gender]);
  const kinds = ORDER.filter((item) => all.some((product) => product.kind === item));
  const list = kind ? all.filter((product) => product.kind === kind) : all;
  const pick = (next: string | null) => { setKind(next); setShown(PAGE); };
  return (
    <ShopShell>
      <section className="gx-hero" aria-labelledby="gx-hero-title">
        <img src={page.hero.image} alt="" style={{ objectPosition: page.hero.pos }} fetchPriority="high" />
        <div className="gx-hero-copy">
          <p className="gx-hero-kicker">{page.hero.kicker}</p>
          <h1 id="gx-hero-title" className="gx-hero-title">{page.hero.title}</h1>
          <p className="gx-hero-links">
            {page.hero.links.map((link, i) => (
              <Fragment key={link.label}>
                {i > 0 && <span aria-hidden="true" className="gx-hero-sep" />}
                <button type="button" onClick={() => { pick(link.kind ?? null); document.getElementById("gx-list")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}>{link.label} <ChevronRight size={13} aria-hidden="true" /></button>
              </Fragment>
            ))}
          </p>
        </div>
        <p className="gx-credit">Photo: {page.hero.credit}, Unsplash</p>
      </section>

      <section id="gx-list" className="gx-list" aria-labelledby="gx-title">
        <header className="gx-head">
          <div>
            <nav className="gx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link></nav>
            <h2 id="gx-title" className="gx-title">{page.title}</h2>
          </div>
          <div className="gx-chips" role="group" aria-label="Types">
            <button type="button" className="gx-chip" aria-pressed={kind === null} onClick={() => pick(null)}>Everything</button>
            {kinds.map((item) => <button key={item} type="button" className="gx-chip" aria-pressed={kind === item} onClick={() => pick(kind === item ? null : item)}>{CHIP[item] ?? item}</button>)}
          </div>
        </header>
        <div className="gx-bar">
          <div className="gx-view" role="radiogroup" aria-label="View">
            <span>View:</span>
            <button type="button" role="radio" aria-checked={view === "front"} onClick={() => setView("front")}>Product</button>
            <button type="button" role="radio" aria-checked={view === "other"} onClick={() => setView("other")}>Other side</button>
          </div>
          <Link to="/shop/all" search={{ g: page.gender, ...(kind ? { kind } : {}) }} className="gx-filter">Filter and sort <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>

        <ul className="gx-grid" data-view={view}>
          {list.slice(0, shown).map((product, i) => {
            const look = !kind && i > 0 && i % 10 === 6 ? page.looks[Math.floor(i / 10) % page.looks.length] : undefined;
            return (
              <Fragment key={product.id}>
                {look && (
                  <li className="gx-look">
                    <button type="button" onClick={() => pick(look.to.kind ?? null)} className="gx-look-link">
                      <img src={look.image} alt="" loading="lazy" />
                      <span className="gx-look-copy">
                        <span className="gx-look-kicker">{look.kicker}</span>
                        <span className="gx-look-title">{look.title}</span>
                        <span className="gx-look-go">Shop it <ChevronRight size={13} aria-hidden="true" /></span>
                      </span>
                      <span className="gx-look-credit">Photo: {look.credit}</span>
                    </button>
                  </li>
                )}
                <li><GenderCard product={product} /></li>
              </Fragment>
            );
          })}
        </ul>
        {shown < list.length && (
          <div className="gx-more">
            <button type="button" className="sx-ghost" onClick={() => setShown((value) => value + PAGE)}>Load more</button>
          </div>
        )}
      </section>
    </ShopShell>
  );
}

function GenderCard({ product }: { product: ShopProduct }) {
  return (
    <article className="gx-card">
      <Link to="/shop/p/$id" params={{ id: product.id }} className="gx-card-link" onClick={firstTapShowsBack}>
        <ProductPhoto product={product} className="gx-card-photo" />
        <span className="gx-card-brand">{brandLine(product)}</span>
        <span className="gx-card-name">{product.name}</span>
        <span className="gx-card-price">{product.price ? <>{dollars(product.price)}<Was product={product} /></> : product.url ? "Sold out" : "Price at the shop"}</span>
        {product.sizes && product.sizes.length > 1 && <span className="gx-card-sizes">{product.sizes.length} sizes</span>}
      </Link>
      <SaveButton product={product} />
      <AddToCart product={product} />
    </article>
  );
}
