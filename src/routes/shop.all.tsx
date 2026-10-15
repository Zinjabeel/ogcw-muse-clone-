import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ProductGrid, ShopShell, dollars } from "../components/shop-kit";
import { BRANDS, LIVE_PRODUCTS, SHOP_CATEGORIES, type ShopProduct } from "../data/shop";
import { logoOf } from "../data/shop-logos";
import { moreLike, searchShop } from "@/lib/shop-search";
import { T } from "@/components/site-text";

// An aisle, or the whole shop: every piece, filtered and sorted, and the
// shop's search (src/lib/shop-search.ts: typos and intent, and the closest
// pieces when nothing fits). The filters: the type (pointing at one, or
// clicking it, opens its brands in a pop-up beside it), men or women, the
// price (a slider, or typed in), sizes, colours by name, what's new or
// limited, and the brand. Every filter takes more than one choice (owner,
// 15 Oct): within a filter any of them fits, across filters all must. They
// live in the web address (/shop/all?kind=Jeans,Jackets&brand=amiri,ksubi),
// so a list can be shared.

type Sort = "featured" | "low" | "high" | "new" | "az";
export type ShopSearch = { q?: string; cat?: string; kind?: string; brand?: string; tag?: string; g?: string; size?: string; colour?: string; min?: number; max?: number; sort?: Sort };
type Patch = { [K in keyof ShopSearch]?: ShopSearch[K] | undefined };
type ListKey = "kind" | "brand" | "tag" | "g" | "size" | "colour";
const str = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : undefined);
/** A filter's choices, from the web address ("Jeans,Jackets") */
const listOf = (value: string | undefined) => (value ? value.split(",").filter(Boolean) : []);
const joined = (list: string[]) => (list.length ? list.join(",") : undefined);
const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "new", label: "Newest releases" },
  { id: "az", label: "Name: A to Z" },
];
const TAGS = [
  { id: "new", label: "New in", blurb: "Added to the shop this season." },
  { id: "trending", label: "Trending", blurb: "What people are wearing right now." },
  { id: "limited", label: "Limited editions", blurb: "Collabs, grails and one-off pieces." },
  { id: "drops", label: "Coming soon", blurb: "The pairs on the release calendar." },
];
const COLOURS: { id: string; label: string; words: string[] }[] = [
  { id: "black", label: "Black", words: ["black", "onyx", "noir", "obsidian"] },
  { id: "white", label: "White", words: ["white", "sail", "ivory", "summit"] },
  { id: "grey", label: "Grey", words: ["grey", "gray", "graphite", "slate", "cement", "charcoal"] },
  { id: "brown", label: "Brown", words: ["brown", "chocolate", "mocha", "tan", "coffee", "baroque"] },
  { id: "cream", label: "Cream", words: ["cream", "beige", "sand", "bone", "muslin", "oatmeal"] },
  { id: "blue", label: "Blue", words: ["blue", "navy", "royal", "indigo", "cobalt", "denim"] },
  { id: "green", label: "Green", words: ["green", "olive", "khaki", "army", "mint"] },
  { id: "red", label: "Red", words: ["red", "crimson", "burgundy", "cinnabar", "infrared"] },
  { id: "pink", label: "Pink", words: ["pink", "rose", "punch"] },
  { id: "yellow", label: "Yellow", words: ["yellow", "maize", "canary", "gold"] },
  { id: "orange", label: "Orange", words: ["orange", "mango"] },
  { id: "purple", label: "Purple", words: ["purple", "violet", "grape", "concord"] },
  { id: "silver", label: "Silver", words: ["silver", "metallic", "chrome", "steel"] },
];
const colourOf = (product: ShopProduct, id: string) => {
  const text = ` ${`${product.colour} ${product.name}`.toLowerCase().replace(/[^a-z]+/g, " ")} `;
  return (COLOURS.find((colour) => colour.id === id)?.words ?? [id]).some((word) => text.includes(` ${word} `));
};
const CLOTHING_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];
const sizeRank = (size: string) => { const i = CLOTHING_ORDER.indexOf(size); return i >= 0 ? i : Number.parseFloat(size.replace(/ (\d)\/(\d)/, (_, a, b) => `.${Math.round((Number(a) / Number(b)) * 100)}`)) || 999; };

export const Route = createFileRoute("/shop/all")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const out: ShopSearch = {};
    for (const key of ["q", "cat", "kind", "brand", "tag", "g", "size", "colour"] as const) {
      const value = str(search[key]);
      if (value) out[key] = value;
    }
    const min = num(search["min"]); const max = num(search["max"]);
    if (min !== undefined) out.min = min;
    if (max !== undefined) out.max = max;
    const sort = SORTS.find((item) => item.id === search["sort"])?.id;
    if (sort) out.sort = sort;
    return out;
  },
  head: () => ({ meta: [{ title: "Shop: OGCW Shop" }, { name: "description", content: "Every piece in the OGCW Shop: sneakers, clothing, watches, caps and bags, filtered your way." }] }),
  component: ShopAll,
});

// The price slider runs on a curve, so $50 to $500 gets as much room as $5,000 to $50,000
const PRICES = LIVE_PRODUCTS.flatMap((product) => (product.price ? [product.price] : []));
const LOW = Math.max(20, Math.floor(Math.min(...PRICES) / 10) * 10);
const HIGH = Math.ceil(Math.max(...PRICES) / 1000) * 1000;
const STEPS = 200;
const toPrice = (step: number) => { const value = Math.exp(Math.log(LOW) + (step / STEPS) * (Math.log(HIGH) - Math.log(LOW))); return value < 1000 ? Math.round(value / 10) * 10 : Math.round(value / 100) * 100; };
const toStep = (price: number) => Math.round(((Math.log(Math.min(HIGH, Math.max(LOW, price))) - Math.log(LOW)) / (Math.log(HIGH) - Math.log(LOW))) * STEPS);

function ShopAll() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const set = (patch: Patch) => navigate({ search: (prev: ShopSearch) => {
    const next: Patch = { ...prev, ...patch };
    (Object.keys(next) as (keyof ShopSearch)[]).forEach((key) => { if (next[key] === undefined) delete next[key]; });
    return next as ShopSearch;
  }, resetScroll: false });

  const picked = {
    kind: listOf(search.kind), brand: listOf(search.brand), tag: listOf(search.tag),
    g: listOf(search.g), size: listOf(search.size), colour: listOf(search.colour),
  };
  /** Add a choice to a filter, or take it off again */
  const toggle = (key: ListKey, value: string) => set({ [key]: joined(picked[key].includes(value) ? picked[key].filter((item) => item !== value) : [...picked[key], value]) });

  const category = SHOP_CATEGORIES.find((item) => item.slug === search.cat);
  const tags = TAGS.filter((item) => picked.tag.includes(item.id));
  const inAisle = useMemo(() => LIVE_PRODUCTS.filter((product) => !category || product.category === category.id), [category]);
  type Skip = "kind" | "brand" | "price" | "size" | "colour" | "g";
  const fits = (product: ShopProduct, skip?: Skip) =>
    (skip === "kind" || !picked.kind.length || picked.kind.includes(product.kind)) &&
    (skip === "brand" || !picked.brand.length || picked.brand.includes(product.brand) || picked.brand.includes(product.retailer ?? "")) &&
    (skip === "g" || !picked.g.length || picked.g.includes(product.gender ?? "") || product.gender === "unisex") &&
    (!picked.tag.length || picked.tag.some((tag) => product.tags?.includes(tag as never))) &&
    (skip === "price" || ((search.min === undefined || (product.price ?? 0) >= search.min) && (search.max === undefined || (product.price !== undefined && product.price <= search.max)))) &&
    (skip === "size" || !picked.size.length || picked.size.some((size) => (product.sizes ?? []).includes(size))) &&
    (skip === "colour" || !picked.colour.length || picked.colour.some((colour) => colourOf(product, colour)));
  const pool = inAisle.filter((product) => fits(product));
  const found = useMemo(() => (search.q ? searchShop(search.q, { pool }) : null), [search.q, pool.map((product) => product.id).join()]);
  let products = found ? found.results : pool;
  const sort = search.sort ?? "featured";
  const priced = (value: number | undefined, high: boolean) => value ?? (high ? -1 : Number.MAX_SAFE_INTEGER);
  if (sort === "low") products = [...products].sort((a, b) => priced(a.price, false) - priced(b.price, false));
  if (sort === "high") products = [...products].sort((a, b) => priced(b.price, true) - priced(a.price, true));
  if (sort === "new") products = [...products].sort((a, b) => (b.released ?? "").localeCompare(a.released ?? ""));
  if (sort === "az") products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  const more = found && products.length < 4 ? moreLike(found, 8).filter((product) => !products.includes(product)) : [];

  // What the filters can offer from here
  const kinds = useMemo(() => {
    const list = [...new Set(inAisle.map((product) => product.kind))];
    return SHOP_CATEGORIES.map((cat) => ({ cat, kinds: list.filter((kind) => inAisle.some((product) => product.kind === kind && product.category === cat.id)) })).filter((group) => group.kinds.length);
  }, [inAisle]);
  const brandsFor = (kinds: string[]) => BRANDS.filter((brand) => !brand.store && inAisle.some((product) => (!kinds.length || kinds.includes(product.kind)) && product.brand === brand.slug));
  const brands = brandsFor(picked.kind).filter((brand) => inAisle.some((product) => product.brand === brand.slug && fits(product, "brand")) || picked.brand.includes(brand.slug));
  const sizeGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    for (const product of inAisle.filter((item) => fits(item, "size"))) {
      if (!product.sizes || product.sizes.length < 2) continue;
      const label = product.sizeLabel === "Size" ? "Clothing" : product.sizeLabel ?? "Size";
      if (!groups.has(label)) groups.set(label, new Set());
      product.sizes.forEach((size) => groups.get(label)!.add(size));
    }
    return [...groups].map(([label, sizes]) => ({ label, sizes: [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b)) }));
  }, [inAisle, search.kind, search.brand, search.g, search.tag, search.colour, search.min, search.max]);
  const colours = COLOURS.filter((colour) => picked.colour.includes(colour.id) || inAisle.some((product) => fits(product, "colour") && colourOf(product, colour.id)));

  const without = (key: ListKey, value: string): Patch => ({ [key]: joined(picked[key].filter((item) => item !== value)) });
  const chips = [
    category && { label: category.label, clear: { cat: undefined, kind: undefined, brand: undefined } },
    ...picked.kind.map((kind) => ({ label: kind, clear: without("kind", kind) })),
    ...picked.brand.map((slug) => ({ label: BRANDS.find((brand) => brand.slug === slug)?.name ?? slug, clear: without("brand", slug) })),
    ...picked.g.map((g) => ({ label: g === "men" ? "Men" : "Women", clear: without("g", g) })),
    (search.min !== undefined || search.max !== undefined) && { label: `${dollars(search.min ?? LOW)} to ${dollars(search.max ?? HIGH)}`, clear: { min: undefined, max: undefined } },
    ...picked.size.map((size) => ({ label: `Size ${size}`, clear: without("size", size) })),
    ...picked.colour.map((id) => ({ label: COLOURS.find((colour) => colour.id === id)?.label ?? id, clear: without("colour", id) })),
    ...tags.map((tag) => ({ label: tag.label, clear: without("tag", tag.id) })),
    search.q && { label: `“${search.q}”`, clear: { q: undefined } },
  ].filter(Boolean) as { label: string; clear: Patch }[];
  const title = found ? found.intent.label || `“${search.q}”` : picked.kind.length === 1 ? picked.kind[0]! : category?.label ?? (tags.length === 1 ? tags[0]!.label : undefined) ?? "Everything";
  const blurb = found ? undefined : category?.blurb ?? (tags.length === 1 ? tags[0]!.blurb : undefined) ?? "Every piece in the OGCW Shop, from the sneaker giants to the Geneva watchmakers.";

  return (
    <ShopShell>
      <header className="sx-wrap sx-aisle-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span>{found ? "Search" : title}</span></nav>
        <QueryLine initial={search.q ?? ""} onSearch={(q) => set({ q: q || undefined })} />
        <div className="sx-aisle-title-row">
          <h1 className="sx-page-title">{title}</h1>
        </div>
        {found?.intent.fixed && <p className="fx-note">Showing results for <strong>{found.intent.read}</strong>. You typed “{search.q}”.</p>}
        {found && !found.exact && (
          <p className="fx-note fx-note-soft">{found.loosened.includes("everything") ? <>Nothing in the shop for that yet, so here’s what’s trending.</> : <>Nothing fits all of that right now, so these are the closest (we let go of {found.loosened.join(" and ")}).</>}</p>
        )}
        {blurb && <p className="sx-page-blurb">{blurb}</p>}
        <nav className="sx-aisle-tabs" aria-label="Aisles">
          <Link to="/shop/all" search={{}} className="sx-pill" data-on={!search.cat || undefined}>Everything</Link>
          {SHOP_CATEGORIES.filter((cat) => LIVE_PRODUCTS.some((product) => product.category === cat.id)).map((cat) => (
            <Link key={cat.slug} to="/shop/all" search={{ cat: cat.slug }} className="sx-pill" data-on={search.cat === cat.slug || undefined}>{cat.label}</Link>
          ))}
          <Link to="/shop/men" className="sx-pill">Men</Link>
          <Link to="/shop/women" className="sx-pill">Women</Link>
        </nav>
      </header>

      <div className="sx-wrap sx-list fx-list">
        <aside className={`sx-filters fx ${open ? "is-open" : ""}`} aria-label="Filters">
          <div className="sx-filters-top">
            <p className="sx-filter-title"><T k="shop.filters">Filter</T></p>
            <button type="button" className="sx-filters-close" onClick={() => setOpen(false)} aria-label="Close filters"><X size={18} aria-hidden="true" /></button>
          </div>

          <TypeFilter groups={kinds} kinds={picked.kind} brands={picked.brand} brandsFor={(kind) => brandsFor([kind])}
            onAll={() => set({ kind: undefined, brand: undefined })}
            onKind={(kind) => toggle("kind", kind)}
            onBrand={(kind, brand) => set({ kind: joined(picked.kind.includes(kind) ? picked.kind : [...picked.kind, kind]), brand: joined(picked.brand.includes(brand) ? picked.brand.filter((item) => item !== brand) : [...picked.brand, brand]) })}
            onKindOnly={(kind) => set({ kind: joined(picked.kind.includes(kind) ? picked.kind : [...picked.kind, kind]) })} />

          <fieldset className="fx-group">
            <legend>For</legend>
            <div className="fx-checks">
              {(["men", "women"] as const).map((g) => <CheckRow key={g} label={g === "men" ? "Men" : "Women"} on={picked.g.includes(g)} onClick={() => toggle("g", g)} />)}
            </div>
          </fieldset>

          <PriceFilter products={inAisle.filter((product) => fits(product, "price"))} min={search.min} max={search.max} onChange={(min, max) => set({ min, max })} />

          {sizeGroups.length > 0 && (
            <fieldset className="fx-group">
              <legend>Size</legend>
              {sizeGroups.map((group) => (
                <div key={group.label} className="fx-sizes">
                  <p className="fx-sub">{group.label}</p>
                  <div className="fx-size-grid">
                    {group.sizes.map((size) => (
                      <button key={size} type="button" className="fx-size" aria-pressed={picked.size.includes(size)} onClick={() => toggle("size", size)}>{size}</button>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
          )}

          {colours.length > 1 && (
            <fieldset className="fx-group">
              <legend>Colour</legend>
              <div className="fx-checks">
                {colours.map((colour) => <CheckRow key={colour.id} label={colour.label} on={picked.colour.includes(colour.id)} onClick={() => toggle("colour", colour.id)} />)}
              </div>
            </fieldset>
          )}

          <fieldset className="fx-group">
            <legend>Show</legend>
            <div className="fx-checks">
              {TAGS.map((item) => <CheckRow key={item.id} label={item.label} on={picked.tag.includes(item.id)} onClick={() => toggle("tag", item.id)} />)}
            </div>
          </fieldset>

          <BrandFilter brands={brands} picked={picked.brand} onPick={(brand) => toggle("brand", brand)} />
        </aside>

        <div className="sx-results">
          <div className="sx-toolbar">
            <button type="button" className="sx-filter-toggle" onClick={() => setOpen(true)}><SlidersHorizontal size={16} aria-hidden="true" /> <T k="shop.filters">Filter</T></button>
            <span className="sx-count-line" />
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
          {products.length ? <ProductGrid products={products} cols={3} priced /> : (
            <div className="sx-empty">
              <p><T k="shop.empty">Nothing matches those filters yet.</T></p>
              <Link to="/shop/all" className="sx-gold"><T k="shop.empty.cta">See everything</T></Link>
            </div>
          )}
          {more.length > 0 && (
            <section className="sx-section" aria-labelledby="fx-more">
              <header className="sx-head"><div><p className="sx-kicker">Close to it</p><h2 id="fx-more" className="sx-title">More like it</h2></div></header>
              <ProductGrid products={more} cols={3} priced />
            </section>
          )}
          <p className="sx-fine"><T k="shop.fine.list3">Prices are each shop’s own, in US dollars, as they stood on 14 Oct 2026. Each shop sets its own stock and delivery.</T></p>
        </div>
      </div>
    </ShopShell>
  );
}

/** A choice you can tick, one of several */
function CheckRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className="fx-check" role="checkbox" aria-checked={on} onClick={onClick}>
      <span className="fx-box" aria-hidden="true">{on && <Check size={12} strokeWidth={3} />}</span>{label}
    </button>
  );
}

/** The search on the page: one line, Moncler-style */
function QueryLine({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const submit = (event: FormEvent) => { event.preventDefault(); onSearch(value.trim()); };
  return (
    <form className="fx-q" role="search" onSubmit={submit}>
      <Search size={18} strokeWidth={1.6} aria-hidden="true" />
      <label htmlFor="fx-q" className="sr-only">Search the shop</label>
      <input id="fx-q" type="search" value={value} placeholder="Search the shop: try “nike shoes” or “rolex under 6000”" onChange={(event) => setValue(event.target.value)} autoComplete="off" spellCheck={false} enterKeyHint="search" />
      {value && <button type="button" className="fx-q-clear" onClick={() => { setValue(""); onSearch(""); }}>Clear</button>}
    </form>
  );
}

/** The types, by aisle. Ticking one adds it; pointing at one, or clicking
 *  it, opens its brands in a pop-up beside it, where any number can be ticked */
function TypeFilter({ groups, kinds, brands, brandsFor, onAll, onKind, onBrand, onKindOnly }: {
  groups: { cat: (typeof SHOP_CATEGORIES)[number]; kinds: string[] }[]; kinds: string[]; brands: string[]; brandsFor: (kind: string) => typeof BRANDS;
  onAll: () => void; onKind: (kind: string) => void; onBrand: (kind: string, brand: string) => void; onKindOnly: (kind: string) => void;
}) {
  const [shown, setShown] = useState<string | null>(null);
  const timer = useRef(0);
  const show = (kind: string | null) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setShown(kind), kind ? 60 : 220); };
  const root = useRef<HTMLFieldSetElement>(null);
  // A click outside the pop-up closes it
  useEffect(() => {
    if (!shown) return;
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setShown(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setShown(null); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [shown]);
  return (
    <fieldset className="fx-group fx-types" ref={root} onMouseLeave={() => show(null)}>
      <legend>Type</legend>
      <button type="button" className="fx-type" aria-pressed={!kinds.length} onClick={() => { onAll(); setShown(null); }} onMouseEnter={() => show(null)}>Everything</button>
      {groups.map(({ cat, kinds: list }) => (
        <div key={cat.slug} className="fx-type-group">
          <p className="fx-sub">{cat.label}</p>
          {list.map((kind) => {
            const its = brandsFor(kind);
            const on = kinds.includes(kind);
            return (
              <div key={kind} className="fx-type-row" onMouseEnter={() => show(kind)}>
                <button type="button" className="fx-type" aria-pressed={on} aria-expanded={shown === kind} onClick={() => { onKind(kind); window.clearTimeout(timer.current); setShown(kind); }}>
                  <span className="fx-box" aria-hidden="true">{on && <Check size={12} strokeWidth={3} />}</span>
                  <span className="fx-type-name">{kind}</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
                {shown === kind && its.length > 0 && (
                  <div className="fx-fly" role="group" aria-label={`${kind} by brand`} onMouseEnter={() => show(kind)}>
                    <p className="fx-fly-title">{kind}</p>
                    <button type="button" className="fx-fly-all" onClick={() => onKindOnly(kind)}>All {kind.toLowerCase()} <ArrowRight size={13} aria-hidden="true" /></button>
                    <ul>
                      {its.map((item) => {
                        const logo = logoOf(item.slug);
                        const ticked = on && brands.includes(item.slug);
                        return (
                          <li key={item.slug}>
                            <button type="button" role="checkbox" aria-checked={ticked} onClick={() => onBrand(kind, item.slug)}>
                              <span className="fx-fly-mark" aria-hidden="true">{logo ? <img src={logo} alt="" /> : item.name[0]}</span>
                              <span className="fx-fly-name">{item.name}</span>
                              <span className="fx-box" aria-hidden="true">{ticked && <Check size={12} strokeWidth={3} />}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </fieldset>
  );
}

/** Price: two handles on one track over a little chart of where the prices
 *  fall, and two boxes to type the lowest and highest price in */
function PriceFilter({ products, min, max, onChange }: { products: ShopProduct[]; min?: number | undefined; max?: number | undefined; onChange: (min?: number, max?: number) => void }) {
  const [lo, setLo] = useState(toStep(min ?? LOW));
  const [hi, setHi] = useState(toStep(max ?? HIGH));
  const [typedLo, setTypedLo] = useState(min === undefined ? "" : String(min));
  const [typedHi, setTypedHi] = useState(max === undefined ? "" : String(max));
  useEffect(() => { setLo(toStep(min ?? LOW)); setHi(toStep(max ?? HIGH)); setTypedLo(min === undefined ? "" : String(min)); setTypedHi(max === undefined ? "" : String(max)); }, [min, max]);
  const bars = useMemo(() => {
    const counts = Array.from({ length: 28 }, () => 0);
    for (const product of products) if (product.price) counts[Math.min(27, Math.floor((toStep(product.price) / STEPS) * 28))]! += 1;
    const top = Math.max(1, ...counts);
    return counts.map((n) => n / top);
  }, [products]);
  const commit = () => onChange(lo <= 0 ? undefined : toPrice(lo), hi >= STEPS ? undefined : toPrice(hi));
  const typed = (event: FormEvent) => {
    event.preventDefault();
    const a = typedLo.trim() ? Math.max(0, Math.round(Number(typedLo.replace(/[^\d.]/g, "")))) : undefined;
    const b = typedHi.trim() ? Math.max(0, Math.round(Number(typedHi.replace(/[^\d.]/g, "")))) : undefined;
    const [from, to] = a !== undefined && b !== undefined && a > b ? [b, a] : [a, b];
    onChange(Number.isFinite(from) ? from : undefined, Number.isFinite(to) ? to : undefined);
  };
  return (
    <fieldset className="fx-group fx-price">
      <legend>Price</legend>
      <div className="fx-bars" aria-hidden="true">
        {bars.map((height, i) => <span key={i} style={{ height: `${8 + height * 92}%` }} data-in={((i + 0.5) / 28) * STEPS >= lo && ((i + 0.5) / 28) * STEPS <= hi || undefined} />)}
      </div>
      <div className="fx-range" style={{ ["--lo" as string]: `${(lo / STEPS) * 100}%`, ["--hi" as string]: `${(hi / STEPS) * 100}%` }}>
        <input type="range" min={0} max={STEPS} value={lo} aria-label="Lowest price" aria-valuetext={dollars(toPrice(lo))} onChange={(event) => setLo(Math.min(Number(event.target.value), hi - 4))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
        <input type="range" min={0} max={STEPS} value={hi} aria-label="Highest price" aria-valuetext={dollars(toPrice(hi))} onChange={(event) => setHi(Math.max(Number(event.target.value), lo + 4))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
      </div>
      <form className="fx-price-typed" onSubmit={typed}>
        <label>
          <span>Min</span>
          <span className="fx-money"><span aria-hidden="true">$</span><input inputMode="numeric" value={typedLo} placeholder={String(LOW)} onChange={(event) => setTypedLo(event.target.value)} onBlur={typed} aria-label="Lowest price in dollars" /></span>
        </label>
        <span className="fx-price-dash" aria-hidden="true">–</span>
        <label>
          <span>Max</span>
          <span className="fx-money"><span aria-hidden="true">$</span><input inputMode="numeric" value={typedHi} placeholder={HIGH.toLocaleString("en-US")} onChange={(event) => setTypedHi(event.target.value)} onBlur={typed} aria-label="Highest price in dollars" /></span>
        </label>
        <button type="submit" className="sr-only">Set the price</button>
      </form>
      <div className="fx-price-quick">
        {[[undefined, 150], [150, 400], [400, 1500], [1500, undefined]].map(([a, b]) => (
          <button key={`${a}-${b}`} type="button" className="sx-opt sx-opt-sm" aria-pressed={min === a && max === b} onClick={() => onChange(a, b)}>{a === undefined ? `Under ${dollars(b!)}` : b === undefined ? `${dollars(a)}+` : `${dollars(a)}–${dollars(b)}`}</button>
        ))}
      </div>
    </fieldset>
  );
}

/** Brands: the list, with a line to narrow it; tick as many as you like */
function BrandFilter({ brands, picked, onPick }: { brands: typeof BRANDS; picked: string[]; onPick: (brand: string) => void }) {
  const [find, setFind] = useState("");
  const list = brands.filter((brand) => !find || brand.name.toLowerCase().includes(find.toLowerCase()));
  return (
    <fieldset className="fx-group">
      <legend>Brand</legend>
      {brands.length > 8 && <input className="fx-find" type="search" placeholder="Find a brand" value={find} onChange={(event) => setFind(event.target.value)} aria-label="Find a brand" />}
      <div className="fx-checks fx-brand-checks">
        {list.map((brand) => <CheckRow key={brand.slug} label={brand.name} on={picked.includes(brand.slug)} onClick={() => onPick(brand.slug)} />)}
      </div>
    </fieldset>
  );
}
