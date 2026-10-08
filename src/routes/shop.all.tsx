import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { ProductGrid, ShopShell } from "../components/shop-kit";
import { BRANDS, GIFT_BANDS, PRODUCTS, SHOP_CATEGORIES, brandOf, retailerOf } from "../data/shop";
import { T } from "@/components/site-text";

// An aisle, or the whole shop: every product, filtered by aisle, type,
// brand, price and tag, searched and sorted. The filters live in the web
// address (/shop/all?cat=sneakers&kind=Running&sort=low), so a filtered
// list can be shared and the back button works.

type Sort = "featured" | "low" | "high" | "az";
export type ShopSearch = { q?: string; cat?: string; kind?: string; brand?: string; tag?: string; price?: string; sort?: Sort };
type Patch = { [K in keyof ShopSearch]?: ShopSearch[K] | undefined };
const str = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "az", label: "Name: A to Z" },
];
const TAGS = [
  { id: "drops", label: "Featured drops", blurb: "The One Piece Air Max Plus pack, the Jordans on the release calendar and the retro shirts." },
  { id: "new", label: "New in", blurb: "Added to the shop this season." },
  { id: "trending", label: "Trending", blurb: "What people are wearing right now." },
  { id: "limited", label: "Limited editions", blurb: "Collabs, grails and one-off pieces." },
  { id: "gift", label: "Gift ideas", blurb: "Easy wins for the people on your list." },
];
const AISLES = [
  { label: "Everything", search: {} },
  ...SHOP_CATEGORIES.map((category) => ({ label: category.label, search: { cat: category.slug } })),
  { label: "Featured drops", search: { tag: "drops" } },
];

export const Route = createFileRoute("/shop/all")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const sort = SORTS.find((item) => item.id === search["sort"])?.id;
    const out: ShopSearch = {};
    for (const key of ["q", "cat", "kind", "brand", "tag", "price"] as const) {
      const value = str(search[key]);
      if (value) out[key] = value;
    }
    if (sort) out.sort = sort;
    return out;
  },
  head: () => ({ meta: [{ title: "Shop: OGCW Shop" }, { name: "description", content: "Every product in the OGCW Shop: sneakers, clothing, watches, chains and streaming, filtered your way." }] }),
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
  const tag = TAGS.find((item) => item.id === search.tag);
  const words = (search.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const inAisle = PRODUCTS.filter((product) => !category || product.category === category.id);
  const matches = (product: (typeof PRODUCTS)[number], skip?: "kind" | "brand") =>
    (skip === "kind" || !search.kind || product.kind === search.kind) &&
    (skip === "brand" || !search.brand || product.brand === search.brand || product.retailer === search.brand) &&
    (!tag || product.tags?.includes(tag.id as never)) &&
    (!band || band.test(product.price)) &&
    words.every((word) => `${brandOf(product).name} ${retailerOf(product).name} ${product.name} ${product.colour} ${product.kind} ${product.category}`.toLowerCase().includes(word));
  let products = inAisle.filter((product) => matches(product));
  const sort = search.sort ?? "featured";
  const priced = (value: number | undefined, high: boolean) => value ?? (high ? -1 : Number.MAX_SAFE_INTEGER);
  if (sort === "low") products = [...products].sort((a, b) => priced(a.price, false) - priced(b.price, false));
  if (sort === "high") products = [...products].sort((a, b) => priced(b.price, true) - priced(a.price, true));
  if (sort === "az") products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  // The types and brands on offer, with how many each would show
  const kinds = [...new Set(inAisle.map((product) => product.kind))].map((kind) => ({ kind, n: inAisle.filter((product) => product.kind === kind && matches(product, "kind")).length })).filter((item) => item.n > 0 || item.kind === search.kind).sort((a, b) => b.n - a.n);
  const brands = BRANDS.map((brand) => ({ brand, n: inAisle.filter((product) => (product.brand === brand.slug || product.retailer === brand.slug) && matches(product, "brand")).length })).filter((item) => item.n > 0 || item.brand.slug === search.brand);
  const chips = [
    category && { label: category.label, clear: { cat: undefined, kind: undefined, brand: undefined } },
    search.kind && { label: search.kind, clear: { kind: undefined } },
    search.brand && { label: BRANDS.find((brand) => brand.slug === search.brand)?.name ?? search.brand, clear: { brand: undefined } },
    band && { label: band.label, clear: { price: undefined } },
    tag && { label: tag.label, clear: { tag: undefined } },
    search.q && { label: `“${search.q}”`, clear: { q: undefined } },
  ].filter(Boolean) as unknown as { label: string; clear: Patch }[];
  const title = search.q ? `Results for “${search.q}”` : category?.label ?? tag?.label ?? "Everything";
  const blurb = search.q ? undefined : category?.blurb ?? tag?.blurb ?? "Every piece in the OGCW Shop, from the sneaker giants to the streaming subscriptions.";
  const here = ({ search: aisle }: { search: { cat?: string; tag?: string } }) =>
    aisle.cat ? search.cat === aisle.cat : aisle.tag ? !search.cat && search.tag === aisle.tag : !search.cat && search.tag !== "drops";

  return (
    <ShopShell>
      <header className="sx-wrap sx-aisle-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span>{title}</span></nav>
        <div className="sx-aisle-title-row">
          <h1 className="sx-page-title">{title}</h1>
          <p className="sx-aisle-n">{products.length} <span>{products.length === 1 ? "piece" : "pieces"}</span></p>
        </div>
        {blurb && <p className="sx-page-blurb">{blurb}</p>}
        <nav className="sx-aisle-tabs" aria-label="Aisles">
          {AISLES.map((aisle) => (
            <Link key={aisle.label} to="/shop/all" search={aisle.search} className="sx-pill" data-on={here(aisle) || undefined}>{aisle.label}</Link>
          ))}
        </nav>
      </header>

      <div className="sx-wrap sx-list">
        <aside className={`sx-filters ${open ? "is-open" : ""}`} aria-label="Filters">
          <div className="sx-filters-top">
            <p className="sx-filter-title"><T k="shop.filters">Filter</T></p>
            <button type="button" className="sx-filters-close" onClick={() => setOpen(false)} aria-label="Close filters"><X size={18} aria-hidden="true" /></button>
          </div>
          {kinds.length > 1 && (
            <fieldset className="sx-filter">
              <legend><T k="shop.filters.kind">Type</T></legend>
              <button type="button" className="sx-opt" aria-pressed={!search.kind} onClick={() => set({ kind: undefined })}>All types</button>
              {kinds.map((item) => (
                <button key={item.kind} type="button" className="sx-opt" aria-pressed={search.kind === item.kind} onClick={() => set({ kind: search.kind === item.kind ? undefined : item.kind })}>
                  {item.kind} <span>{item.n}</span>
                </button>
              ))}
            </fieldset>
          )}
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.show">Show</T></legend>
            {TAGS.map((item) => (
              <button key={item.id} type="button" className="sx-opt" aria-pressed={search.tag === item.id} onClick={() => set({ tag: search.tag === item.id ? undefined : item.id })}>{item.label}</button>
            ))}
          </fieldset>
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.price">Guide price</T></legend>
            <button type="button" className="sx-opt" aria-pressed={!band} onClick={() => set({ price: undefined })}>Any price</button>
            {GIFT_BANDS.map((item) => (
              <button key={item.id} type="button" className="sx-opt" aria-pressed={band?.id === item.id} onClick={() => set({ price: item.id })}>{item.id === "big" ? "€200 and up" : item.label}</button>
            ))}
          </fieldset>
          <fieldset className="sx-filter">
            <legend><T k="shop.filters.brand">Brand</T></legend>
            <div className="sx-brand-opts">
              {brands.map(({ brand, n }) => (
                <button key={brand.slug} type="button" className="sx-opt sx-opt-sm" aria-pressed={search.brand === brand.slug} onClick={() => set({ brand: search.brand === brand.slug ? undefined : brand.slug })}>{brand.name} <span>{n}</span></button>
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
          {products.length ? <ProductGrid products={products} cols={3} /> : (
            <div className="sx-empty">
              <p><T k="shop.empty">Nothing matches those filters yet.</T></p>
              <Link to="/shop/all" className="sx-gold"><T k="shop.empty.cta">See everything</T></Link>
            </div>
          )}
          <p className="sx-fine"><T k="shop.fine.list2">Guide prices in euros; the final price is set by each shop. Photos: Wikimedia Commons and Unsplash, credited on each product.</T></p>
        </div>
      </div>
    </ShopShell>
  );
}
