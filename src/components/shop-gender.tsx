import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { LIVE_PRODUCTS, brandOf, type ShopProduct } from "@/data/shop";
import { AddToCart, LoadMore, ProductPhoto, SaveButton, ShopShell, brandLine, dollars, firstTapShowsBack, useLoadMore, Was } from "./shop-kit";
import { T } from "./site-text";

// The men's and women's shops. At the top, two big photo cards side by side,
// the height of the shop home's hero: jackets and sneakers (owner, 15 Oct
// 2026). Then the list: the types as words with a line under the one you're
// on (like the menu), "Filter and sort" opening a small card over the list
// (not another page), and big cards four across with an editorial picture
// every few rows. Twelve at a time, then "Load more".

type Look = { image: string; kicker: string; title: string; to: { kind?: string; cat?: string }; credit: string };
type HeroCard = { key: string; label: string; image: string; pos?: string; alt: string; credit: string; to: Filter };
export type GenderPage = {
  gender: "men" | "women";
  title: string;
  cards: [HeroCard, HeroCard];
  looks: Look[];
};

/** The list's filter: one type ("Jackets"), or a whole aisle ("Sneakers") */
type Filter = { kind?: string; cat?: string };
type Sort = "featured" | "low" | "high" | "new";

const ORDER = ["Jackets", "Hoodies & sweats", "Basketball", "Running", "Lifestyle", "Jeans", "T-shirts & shirts", "Pants", "Watches", "Caps & hats", "Bags"];
const LABEL: Record<string, string> = { "Hoodies & sweats": "Hoodies and knits", "T-shirts & shirts": "Tees and shirts", Basketball: "Basketball", Running: "Running", Lifestyle: "Lifestyle", "Caps & hats": "Caps and hats" };
const SORTS: [Sort, string][] = [["featured", "Featured"], ["new", "Newest"], ["low", "Price, low to high"], ["high", "Price, high to low"]];

export function GenderShop({ page }: { page: GenderPage }) {
  const [filter, setFilter] = useState<Filter>({});
  const [view, setView] = useState<"front" | "other">("front");
  const [panel, setPanel] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [brands, setBrands] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const all = useMemo(() => {
    const mine = LIVE_PRODUCTS.filter((product) => product.gender === page.gender || product.gender === "unisex");
    // Outerwear and knits lead, as in a fall/winter edit, then the rest by type
    return [...mine].sort((a, b) => (ORDER.indexOf(a.kind) + 1 || 99) - (ORDER.indexOf(b.kind) + 1 || 99) || Number(!!b.tags?.includes("trending")) - Number(!!a.tags?.includes("trending")));
  }, [page.gender]);
  const kinds = ORDER.filter((item) => all.some((product) => product.kind === item));
  const brandList = useMemo(() => [...new Set(all.map((product) => product.brand))].map((slug) => ({ slug, name: brandOf(all.find((product) => product.brand === slug)!).name })).sort((a, b) => a.name.localeCompare(b.name)), [all]);

  const low = Number(min) || 0;
  const high = Number(max) || Infinity;
  let list = all.filter((product) => (!filter.kind || product.kind === filter.kind) && (!filter.cat || product.category === filter.cat));
  if (brands.length) list = list.filter((product) => brands.includes(product.brand));
  if (min || max) list = list.filter((product) => product.price !== undefined && product.price >= low && product.price <= high);
  if (sort === "low" || sort === "high") list = [...list].sort((a, b) => ((a.price ?? 1e9) - (b.price ?? 1e9)) * (sort === "low" ? 1 : -1));
  if (sort === "new") list = [...list].sort((a, b) => (b.released ?? "").localeCompare(a.released ?? ""));
  const filtering = brands.length > 0 || !!min || !!max || sort !== "featured";
  const { shown, more } = useLoadMore(`${filter.kind}|${filter.cat}|${brands.join()}|${min}|${max}|${sort}`);

  const pick = (next: Filter, scroll = false) => {
    setFilter(next);
    if (scroll) document.getElementById("gx-list")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const same = (a: Filter, b: Filter) => a.kind === b.kind && a.cat === b.cat;
  const clear = () => { setBrands([]); setMin(""); setMax(""); setSort("featured"); };

  return (
    <ShopShell>
      <section className="gx-cards" aria-label={page.title}>
        {page.cards.map((card) => (
          <button key={card.key} type="button" className="gx-hcard" onClick={() => pick(card.to, true)}>
            <img src={card.image} alt={card.alt} style={{ objectPosition: card.pos }} fetchPriority="high" />
            <span className="gx-hcard-text">
              <span className="gx-hcard-kicker">{page.title}</span>
              <span className="gx-hcard-name">{card.label}</span>
              <span className="gx-hcard-more"><T k="shop.gx.discover">Discover more</T></span>
            </span>
            <span className="gx-credit">Photo: {card.credit}</span>
          </button>
        ))}
      </section>

      <section id="gx-list" className="gx-list" aria-labelledby="gx-title">
        <header className="gx-head">
          <nav className="gx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link></nav>
          <h1 id="gx-title" className="gx-title">{page.title}</h1>
          <div className="gx-tabs" role="group" aria-label="Types">
            <button type="button" className="gx-tab" aria-pressed={same(filter, {})} onClick={() => pick({})}>Everything</button>
            {all.some((product) => product.category === "Sneakers") && <button type="button" className="gx-tab" aria-pressed={same(filter, { cat: "Sneakers" })} onClick={() => pick({ cat: "Sneakers" })}>All sneakers</button>}
            {kinds.map((item) => <button key={item} type="button" className="gx-tab" aria-pressed={same(filter, { kind: item })} onClick={() => pick(same(filter, { kind: item }) ? {} : { kind: item })}>{LABEL[item] ?? item}</button>)}
          </div>
        </header>
        <div className="gx-bar">
          <div className="gx-view" role="radiogroup" aria-label="View">
            <span>View:</span>
            <button type="button" role="radio" aria-checked={view === "front"} onClick={() => setView("front")}>Product</button>
            <button type="button" role="radio" aria-checked={view === "other"} onClick={() => setView("other")}>Other side</button>
          </div>
          <p className="gx-count">{list.length} {list.length === 1 ? "piece" : "pieces"}</p>
          <div className="gx-filter-wrap">
            <button type="button" className="gx-filter" aria-expanded={panel} aria-controls="gx-panel" onClick={() => setPanel((value) => !value)}>
              <SlidersHorizontal size={15} aria-hidden="true" /> Filter and sort{filtering && <span className="gx-filter-dot" aria-label="(filters on)" />}
            </button>
            {panel && (
              <FilterCard
                sort={sort} setSort={setSort} brands={brands} setBrands={setBrands} brandList={brandList}
                min={min} max={max} setMin={setMin} setMax={setMax} count={list.length}
                onClear={clear} onClose={() => setPanel(false)} gender={page.gender} filter={filter}
              />
            )}
          </div>
        </div>

        <ul className="gx-grid" data-view={view}>
          {list.slice(0, shown).map((product, i) => {
            const look = !filter.kind && !filter.cat && !filtering && i > 0 && i % 10 === 6 ? page.looks[Math.floor(i / 10) % page.looks.length] : undefined;
            return (
              <Fragment key={product.id}>
                {look && (
                  <li className="gx-look">
                    <button type="button" onClick={() => pick(look.to)} className="gx-look-link">
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
        {!list.length && <p className="gx-empty">Nothing matches those filters. <button type="button" onClick={clear}>Clear them</button></p>}
        <LoadMore shown={shown} total={list.length} onMore={more} />
      </section>
    </ShopShell>
  );
}

type FilterCardProps = {
  sort: Sort; setSort: (sort: Sort) => void;
  brands: string[]; setBrands: (brands: string[]) => void; brandList: { slug: string; name: string }[];
  min: string; max: string; setMin: (value: string) => void; setMax: (value: string) => void;
  count: number; onClear: () => void; onClose: () => void; gender: "men" | "women"; filter: Filter;
};

/** The small card that opens over the list: sort, brands and a price range */
function FilterCard({ sort, setSort, brands, setBrands, brandList, min, max, setMin, setMax, count, onClear, onClose, gender, filter }: FilterCardProps) {
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!card.current?.contains(target) && !target.closest(".gx-filter")) onClose();
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    card.current?.querySelector<HTMLElement>("button, input")?.focus();
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  const toggle = (slug: string) => setBrands(brands.includes(slug) ? brands.filter((item) => item !== slug) : [...brands, slug]);
  return (
    <div ref={card} id="gx-panel" className="gx-panel" role="dialog" aria-label="Filter and sort">
      <header className="gx-panel-head">
        <p>Filter and sort</p>
        <button type="button" className="gx-panel-x" onClick={onClose} aria-label="Close"><X size={16} aria-hidden="true" /></button>
      </header>
      <fieldset className="gx-panel-group">
        <legend>Sort by</legend>
        <div className="gx-panel-sorts">
          {SORTS.map(([value, label]) => <button key={value} type="button" className="gx-pill" aria-pressed={sort === value} onClick={() => setSort(value)}>{label}</button>)}
        </div>
      </fieldset>
      <fieldset className="gx-panel-group">
        <legend>Price (US$)</legend>
        <div className="gx-panel-price">
          <label><span>Min</span><input inputMode="numeric" value={min} onChange={(event) => setMin(event.target.value.replace(/\D/g, ""))} placeholder="0" /></label>
          <span aria-hidden="true">–</span>
          <label><span>Max</span><input inputMode="numeric" value={max} onChange={(event) => setMax(event.target.value.replace(/\D/g, ""))} placeholder="Any" /></label>
        </div>
      </fieldset>
      <fieldset className="gx-panel-group">
        <legend>Brand{brands.length > 0 && ` (${brands.length})`}</legend>
        <ul className="gx-panel-brands">
          {brandList.map((brand) => (
            <li key={brand.slug}>
              <label className="gx-check"><input type="checkbox" checked={brands.includes(brand.slug)} onChange={() => toggle(brand.slug)} /><span>{brand.name}</span></label>
            </li>
          ))}
        </ul>
      </fieldset>
      <footer className="gx-panel-foot">
        <button type="button" className="gx-panel-clear" onClick={onClear}>Clear</button>
        <Link to="/shop/all" search={{ g: gender, ...(filter.kind ? { kind: filter.kind } : {}) }} className="gx-panel-all">Every filter <ArrowRight size={13} aria-hidden="true" /></Link>
        <button type="button" className="gx-panel-show" onClick={onClose}>Show {count}</button>
      </footer>
    </div>
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
