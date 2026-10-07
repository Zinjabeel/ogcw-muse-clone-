import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { ProductGrid, ShopShell } from "../components/shop-kit";
import { BRANDS, GIFT_BANDS, PRODUCTS, SHOP_CATEGORIES, brandOf } from "../data/shop";
import { T } from "@/components/site-text";

// Shop all: every product, filtered by department, brand, price and tag,
// searched and sorted. The filters live in the web address
// (/shop/all?cat=sneakers&brand=jordan&sort=low), so a filtered list can be
// shared and the back button works.

type Sort = "featured" | "low" | "high" | "az";
export type ShopSearch = { q?: string; cat?: string; brand?: string; tag?: string; price?: string; sort?: Sort };
type Patch = { [K in keyof ShopSearch]?: ShopSearch[K] | undefined };
const str = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "az", label: "Name: A to Z" },
];
const TAGS = [{ id: "new", label: "New in" }, { id: "trending", label: "Trending" }, { id: "drops", label: "On the release calendar" }, { id: "gift", label: "Gift ideas" }];

export const Route = createFileRoute("/shop/all")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const sort = SORTS.find((item) => item.id === search["sort"])?.id;
    const out: ShopSearch = {};
    for (const key of ["q", "cat", "brand", "tag", "price"] as const) {
      const value = str(search[key]);
      if (value) out[key] = value;
    }
    if (sort) out.sort = sort;
    return out;
  },
  head: () => ({ meta: [{ title: "Shop all — OGCW Shop" }, { name: "description", content: "Every product in the OGCW Shop: sneakers, clothing, accessories and tech, filtered your way." }] }),
  component: ShopAll,
});

function ShopAll() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const set = (patch: Patch) => navigate({ search: (prev: ShopSearch) => {
    const next: Patch = { ...prev, ...patch };
    (Object.keys(next) as (keyof ShopSearch)[]).forEach((key) => { if (next[key] === undefined) delete next[key]; });
    return next as ShopSearch;
  } });

  const category = SHOP_CATEGORIES.find((item) => item.slug === search.cat);
  const band = GIFT_BANDS.find((item) => item.id === search.price);
  const words = (search.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  let products = PRODUCTS.filter((product) =>
    (!category || product.category === category.id) &&
    (!search.brand || product.brand === search.brand) &&
    (!search.tag || product.tags?.includes(search.tag as never)) &&
    (!band || band.test(product.price)) &&
    words.every((word) => `${brandOf(product).name} ${product.name} ${product.colour} ${product.kind} ${product.category}`.toLowerCase().includes(word)),
  );
  const sort = search.sort ?? "featured";
  const priced = (value: number | undefined, high: boolean) => value ?? (high ? -1 : Number.MAX_SAFE_INTEGER);
  if (sort === "low") products = [...products].sort((a, b) => priced(a.price, false) - priced(b.price, false));
  if (sort === "high") products = [...products].sort((a, b) => priced(b.price, true) - priced(a.price, true));
  if (sort === "az") products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  // Brands with products in the current department
  const brands = BRANDS.filter((brand) => PRODUCTS.some((product) => product.brand === brand.slug && (!category || product.category === category.id)));
  const chips = [
    category && { label: category.id, clear: { cat: undefined } },
    search.brand && { label: BRANDS.find((brand) => brand.slug === search.brand)?.name ?? search.brand, clear: { brand: undefined } },
    band && { label: band.label, clear: { price: undefined } },
    search.tag && { label: TAGS.find((tag) => tag.id === search.tag)?.label ?? search.tag, clear: { tag: undefined } },
    search.q && { label: `“${search.q}”`, clear: { q: undefined } },
  ].filter(Boolean) as unknown as { label: string; clear: Patch }[];
  const title = search.q ? `Results for “${search.q}”` : category?.id ?? TAGS.find((tag) => tag.id === search.tag)?.label ?? "Shop all";

  return (
    <ShopShell>
      <div className="sx-wrap sx-list-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span>{title}</span></nav>
        <h1 className="sx-page-title">{title}</h1>
        {category && <p className="sx-page-blurb">{category.blurb}</p>}
      </div>

      <div className="sx-wrap sx-list">
        <aside className={`sx-filters ${open ? "is-open" : ""}`} aria-label="Filters">
          <div className="sx-filters-top">
            <p className="sx-filter-title"><T k="shop.filters">Filter</T></p>
            <button type="button" className="sx-filters-close" onClick={() => setOpen(false)} aria-label="Close filters"><X size={18} aria-hidden="true" /></button>
          </div>
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.dept">Department</T></legend>
            <button type="button" className="sx-opt" aria-pressed={!category} onClick={() => set({ cat: undefined, brand: undefined })}>All</button>
            {SHOP_CATEGORIES.map((item) => (
              <button key={item.slug} type="button" className="sx-opt" aria-pressed={category?.slug === item.slug} onClick={() => set({ cat: item.slug, brand: undefined })}>
                {item.id} <span>{PRODUCTS.filter((product) => product.category === item.id).length}</span>
              </button>
            ))}
          </fieldset>
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.price">Price</T></legend>
            <button type="button" className="sx-opt" aria-pressed={!band} onClick={() => set({ price: undefined })}>Any price</button>
            {GIFT_BANDS.map((item) => (
              <button key={item.id} type="button" className="sx-opt" aria-pressed={band?.id === item.id} onClick={() => set({ price: item.id })}>{item.id === "big" ? "€200 and up" : item.label}</button>
            ))}
          </fieldset>
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.show">Show</T></legend>
            {TAGS.map((tag) => (
              <button key={tag.id} type="button" className="sx-opt" aria-pressed={search.tag === tag.id} onClick={() => set({ tag: search.tag === tag.id ? undefined : tag.id })}>{tag.label}</button>
            ))}
          </fieldset>
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.brand">Brand</T></legend>
            <div className="sx-brand-opts">
              {brands.map((brand) => (
                <button key={brand.slug} type="button" className="sx-opt sx-opt-sm" aria-pressed={search.brand === brand.slug} onClick={() => set({ brand: search.brand === brand.slug ? undefined : brand.slug })}>{brand.name}</button>
              ))}
            </div>
          </fieldset>
        </aside>

        <div className="sx-results">
          <div className="sx-toolbar">
            <button type="button" className="sx-filter-toggle" onClick={() => setOpen(true)}><SlidersHorizontal size={16} aria-hidden="true" /> <T k="shop.filters">Filter</T></button>
            <p className="sx-count-line" aria-live="polite">{products.length} {products.length === 1 ? "product" : "products"}</p>
            <label className="sx-sort">
              <span><T k="shop.sort">Sort</T></span>
              <select value={sort} onChange={(event) => set({ sort: event.target.value === "featured" ? undefined : (event.target.value as Sort) })}>
                {SORTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>
          {chips.length > 0 && (
            <ul className="sx-chips">
              {chips.map((chip) => (
                <li key={chip.label}><button type="button" onClick={() => set(chip.clear)}>{chip.label} <X size={13} aria-hidden="true" /></button></li>
              ))}
              <li><Link to="/shop/all" className="sx-clear"><T k="shop.filters.clear">Clear all</T></Link></li>
            </ul>
          )}
          {products.length ? <ProductGrid products={products} cols={4} /> : (
            <div className="sx-empty">
              <p><T k="shop.empty">Nothing matches those filters yet.</T></p>
              <Link to="/shop/all" className="sx-btn"><T k="shop.empty.cta">See everything</T></Link>
            </div>
          )}
          <p className="sx-fine"><T k="shop.fine.list">Guide prices in euros; the final price is set by each retailer. Photos: Wikimedia Commons (free licences, credited on each product) and Unsplash.</T></p>
        </div>
      </div>
    </ShopShell>
  );
}
