import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ProductGrid, ShopShell, dollars } from "../components/shop-kit";
import { BRANDS, LIVE_PRODUCTS, SHOP_CATEGORIES, type ShopProduct } from "../data/shop";
import { logoOf } from "../data/shop-logos";
import { moreLike, searchShop } from "@/lib/shop-search";
import { T } from "@/components/site-text";

// An aisle, or the whole shop: every piece, filtered and sorted, and the
// shop's search (src/lib/shop-search.ts: typos and intent, and the closest
// pieces when nothing fits). The filters: the type (point at one and its
// brands open beside it), men or women, a price slider, sizes, colours, what's
// new or limited, and the brand. They live in the web address
// (/shop/all?kind=Jeans&g=women&max=400), so a list can be shared.

type Sort = "featured" | "low" | "high" | "new" | "az";
export type ShopSearch = { q?: string; cat?: string; kind?: string; brand?: string; tag?: string; g?: string; size?: string; colour?: string; min?: number; max?: number; sort?: Sort };
type Patch = { [K in keyof ShopSearch]?: ShopSearch[K] | undefined };
const str = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : undefined);
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
const COLOURS: { id: string; label: string; swatch: string; words: string[] }[] = [
  { id: "black", label: "Black", swatch: "#111", words: ["black", "onyx", "noir", "obsidian"] },
  { id: "white", label: "White", swatch: "#f5f5f2", words: ["white", "sail", "ivory", "summit"] },
  { id: "grey", label: "Grey", swatch: "#9a9a9a", words: ["grey", "gray", "graphite", "slate", "cement", "charcoal"] },
  { id: "brown", label: "Brown", swatch: "#7a5233", words: ["brown", "chocolate", "mocha", "tan", "coffee", "baroque"] },
  { id: "cream", label: "Cream", swatch: "#e9dfc8", words: ["cream", "beige", "sand", "bone", "muslin", "oatmeal"] },
  { id: "blue", label: "Blue", swatch: "#2f5fb3", words: ["blue", "navy", "royal", "indigo", "cobalt", "denim"] },
  { id: "green", label: "Green", swatch: "#2f7a4b", words: ["green", "olive", "khaki", "army", "mint"] },
  { id: "red", label: "Red", swatch: "#c0302b", words: ["red", "crimson", "burgundy", "cinnabar", "infrared"] },
  { id: "pink", label: "Pink", swatch: "#e98bb0", words: ["pink", "rose", "punch"] },
  { id: "yellow", label: "Yellow", swatch: "#f2c230", words: ["yellow", "maize", "canary", "gold"] },
  { id: "orange", label: "Orange", swatch: "#e9752c", words: ["orange", "mango"] },
  { id: "purple", label: "Purple", swatch: "#6c4a9e", words: ["purple", "violet", "grape", "concord"] },
  { id: "silver", label: "Silver", swatch: "linear-gradient(135deg,#eee,#9aa0a6)", words: ["silver", "metallic", "chrome", "steel"] },
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

  const category = SHOP_CATEGORIES.find((item) => item.slug === search.cat);
  const tag = TAGS.find((item) => item.id === search.tag);
  const inAisle = useMemo(() => LIVE_PRODUCTS.filter((product) => !category || product.category === category.id), [category]);
  type Skip = "kind" | "brand" | "price" | "size" | "colour" | "g";
  const fits = (product: ShopProduct, skip?: Skip) =>
    (skip === "kind" || !search.kind || product.kind === search.kind) &&
    (skip === "brand" || !search.brand || product.brand === search.brand || product.retailer === search.brand) &&
    (skip === "g" || !search.g || product.gender === search.g || product.gender === "unisex") &&
    (!tag || product.tags?.includes(tag.id as never)) &&
    (skip === "price" || ((search.min === undefined || (product.price ?? 0) >= search.min) && (search.max === undefined || (product.price !== undefined && product.price <= search.max)))) &&
    (skip === "size" || !search.size || (product.sizes ?? []).includes(search.size)) &&
    (skip === "colour" || !search.colour || colourOf(product, search.colour));
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
  const brandsFor = (kind?: string) => BRANDS.filter((brand) => !brand.store && inAisle.some((product) => (!kind || product.kind === kind) && (product.brand === brand.slug)));
  const brands = brandsFor(search.kind).filter((brand) => inAisle.some((product) => product.brand === brand.slug && fits(product, "brand")) || brand.slug === search.brand);
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
  const colours = COLOURS.filter((colour) => inAisle.some((product) => fits(product, "colour") && colourOf(product, colour.id)));

  const chips = [
    category && { label: category.label, clear: { cat: undefined, kind: undefined, brand: undefined } },
    search.kind && { label: search.kind, clear: { kind: undefined } },
    search.brand && { label: BRANDS.find((brand) => brand.slug === search.brand)?.name ?? search.brand, clear: { brand: undefined } },
    search.g && { label: search.g === "men" ? "Men" : "Women", clear: { g: undefined } },
    (search.min !== undefined || search.max !== undefined) && { label: `${dollars(search.min ?? LOW)} to ${dollars(search.max ?? HIGH)}`, clear: { min: undefined, max: undefined } },
    search.size && { label: `Size ${search.size}`, clear: { size: undefined } },
    search.colour && { label: COLOURS.find((colour) => colour.id === search.colour)?.label ?? search.colour, clear: { colour: undefined } },
    tag && { label: tag.label, clear: { tag: undefined } },
    search.q && { label: `“${search.q}”`, clear: { q: undefined } },
  ].filter(Boolean) as unknown as { label: string; clear: Patch }[];
  const title = found ? found.intent.label || `“${search.q}”` : search.kind ?? category?.label ?? tag?.label ?? "Everything";
  const blurb = found ? undefined : category?.blurb ?? tag?.blurb ?? "Every piece in the OGCW Shop, from the sneaker giants to the Geneva watchmakers.";

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

          <TypeFilter groups={kinds} current={search.kind} brand={search.brand} brandsFor={brandsFor} onPick={(kind, brand) => set({ kind, brand })} />

          <fieldset className="fx-group">
            <legend>For</legend>
            <div className="fx-seg" role="radiogroup" aria-label="Who it’s for">
              {([undefined, "men", "women"] as const).map((g) => (
                <button key={g ?? "all"} type="button" role="radio" aria-checked={search.g === g} onClick={() => set({ g })}>{g === "men" ? "Men" : g === "women" ? "Women" : "Everyone"}</button>
              ))}
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
                      <button key={size} type="button" className="fx-size" aria-pressed={search.size === size} onClick={() => set({ size: search.size === size ? undefined : size })}>{size}</button>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
          )}

          {colours.length > 1 && (
            <fieldset className="fx-group">
              <legend>Colour</legend>
              <div className="fx-swatches">
                {colours.map((colour) => (
                  <button key={colour.id} type="button" className="fx-swatch" aria-pressed={search.colour === colour.id} aria-label={colour.label} title={colour.label} onClick={() => set({ colour: search.colour === colour.id ? undefined : colour.id })}>
                    <span style={{ background: colour.swatch }} />
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="fx-group">
            <legend>Show</legend>
            <div className="fx-tags">
              {TAGS.map((item) => (
                <button key={item.id} type="button" className="sx-opt" aria-pressed={search.tag === item.id} onClick={() => set({ tag: search.tag === item.id ? undefined : item.id })}>{item.label}</button>
              ))}
            </div>
          </fieldset>

          <BrandFilter brands={brands} current={search.brand} onPick={(brand) => set({ brand })} />
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

/** The types, by aisle. Pointing at one opens its brands beside it; on a touch
 *  screen, picking a type shows its brands under it */
function TypeFilter({ groups, current, brand, brandsFor, onPick }: { groups: { cat: (typeof SHOP_CATEGORIES)[number]; kinds: string[] }[]; current?: string | undefined; brand?: string | undefined; brandsFor: (kind?: string) => typeof BRANDS; onPick: (kind?: string, brand?: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const timer = useRef(0);
  const show = (kind: string | null) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setHover(kind), kind ? 60 : 160); };
  return (
    <fieldset className="fx-group fx-types" onMouseLeave={() => show(null)}>
      <legend>Type</legend>
      <button type="button" className="fx-type" aria-pressed={!current} onClick={() => onPick(undefined, undefined)} onMouseEnter={() => show(null)}>Everything</button>
      {groups.map(({ cat, kinds }) => (
        <div key={cat.slug} className="fx-type-group">
          <p className="fx-sub">{cat.label}</p>
          {kinds.map((kind) => {
            const list = brandsFor(kind);
            return (
              <div key={kind} className="fx-type-row" onMouseEnter={() => show(kind)}>
                <button type="button" className="fx-type" aria-pressed={current === kind} aria-expanded={hover === kind} onClick={() => onPick(current === kind ? undefined : kind, undefined)} onFocus={() => setHover(kind)}>
                  {kind} <ChevronRight size={14} aria-hidden="true" />
                </button>
                {hover === kind && list.length > 0 && (
                  <div className="fx-fly" role="group" aria-label={`${kind} by brand`} onMouseEnter={() => show(kind)}>
                    <p className="fx-fly-title">{kind}</p>
                    <button type="button" className="fx-fly-all" onClick={() => { onPick(kind, undefined); setHover(null); }}>All {kind.toLowerCase()} <ArrowRight size={13} aria-hidden="true" /></button>
                    <ul>
                      {list.map((item) => {
                        const logo = logoOf(item.slug);
                        return (
                          <li key={item.slug}>
                            <button type="button" aria-pressed={current === kind && brand === item.slug} onClick={() => { onPick(kind, item.slug); setHover(null); }}>
                              <span className="fx-fly-mark" aria-hidden="true">{logo ? <img src={logo} alt="" /> : item.name[0]}</span>{item.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {current === kind && (
                  <div className="fx-type-brands">
                    {list.map((item) => <button key={item.slug} type="button" className="sx-opt sx-opt-sm" aria-pressed={brand === item.slug} onClick={() => onPick(kind, brand === item.slug ? undefined : item.slug)}>{item.name}</button>)}
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

/** Price: two handles on one track, over a little chart of where the prices fall */
function PriceFilter({ products, min, max, onChange }: { products: ShopProduct[]; min?: number | undefined; max?: number | undefined; onChange: (min?: number, max?: number) => void }) {
  const [lo, setLo] = useState(toStep(min ?? LOW));
  const [hi, setHi] = useState(toStep(max ?? HIGH));
  useEffect(() => { setLo(toStep(min ?? LOW)); setHi(toStep(max ?? HIGH)); }, [min, max]);
  const bars = useMemo(() => {
    const counts = Array.from({ length: 28 }, () => 0);
    for (const product of products) if (product.price) counts[Math.min(27, Math.floor((toStep(product.price) / STEPS) * 28))]! += 1;
    const top = Math.max(1, ...counts);
    return counts.map((n) => n / top);
  }, [products]);
  const commit = () => onChange(lo <= 0 ? undefined : toPrice(lo), hi >= STEPS ? undefined : toPrice(hi));
  return (
    <fieldset className="fx-group fx-price">
      <legend>Price</legend>
      <div className="fx-bars" aria-hidden="true">
        {bars.map((height, i) => <span key={i} style={{ height: `${8 + height * 92}%` }} data-in={(i + 0.5) / 28 * STEPS >= lo && (i + 0.5) / 28 * STEPS <= hi || undefined} />)}
      </div>
      <div className="fx-range" style={{ ["--lo" as string]: `${(lo / STEPS) * 100}%`, ["--hi" as string]: `${(hi / STEPS) * 100}%` }}>
        <input type="range" min={0} max={STEPS} value={lo} aria-label="Lowest price" aria-valuetext={dollars(toPrice(lo))} onChange={(event) => setLo(Math.min(Number(event.target.value), hi - 4))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
        <input type="range" min={0} max={STEPS} value={hi} aria-label="Highest price" aria-valuetext={dollars(toPrice(hi))} onChange={(event) => setHi(Math.max(Number(event.target.value), lo + 4))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
      </div>
      <div className="fx-price-row">
        <span>{dollars(toPrice(lo))}</span>
        <span>{hi >= STEPS ? `${dollars(HIGH)}+` : dollars(toPrice(hi))}</span>
      </div>
      <div className="fx-price-quick">
        {[[undefined, 150], [150, 400], [400, 1500], [1500, undefined]].map(([a, b]) => (
          <button key={`${a}-${b}`} type="button" className="sx-opt sx-opt-sm" aria-pressed={min === a && max === b} onClick={() => onChange(a, b)}>{a === undefined ? `Under ${dollars(b!)}` : b === undefined ? `${dollars(a)}+` : `${dollars(a)}–${dollars(b)}`}</button>
        ))}
      </div>
    </fieldset>
  );
}

/** Brands: the list, with a line to narrow it */
function BrandFilter({ brands, current, onPick }: { brands: typeof BRANDS; current?: string | undefined; onPick: (brand?: string) => void }) {
  const [find, setFind] = useState("");
  const list = brands.filter((brand) => !find || brand.name.toLowerCase().includes(find.toLowerCase()));
  return (
    <fieldset className="fx-group">
      <legend>Brand</legend>
      {brands.length > 8 && <input className="fx-find" type="search" placeholder="Find a brand" value={find} onChange={(event) => setFind(event.target.value)} aria-label="Find a brand" />}
      <div className="sx-brand-opts">
        {list.map((brand) => (
          <button key={brand.slug} type="button" className="sx-opt sx-opt-sm" aria-pressed={current === brand.slug} onClick={() => onPick(current === brand.slug ? undefined : brand.slug)}>{brand.name}</button>
        ))}
      </div>
    </fieldset>
  );
}
