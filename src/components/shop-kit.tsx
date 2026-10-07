import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, Search } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { formatPrice } from "@/data/content";
import { brandOf, buyUrl, SHOP_CATEGORIES, type ShopProduct } from "@/data/shop";
import { storePreference } from "@/lib/consent";
import { SiteShell } from "./ogcw-layout";
import { EditSection, T } from "./site-text";

// The OGCW Shop's own pieces: the shop bar under the site header (its
// wordmark, the departments, a search and the saved list), the product
// card, the heart that saves a product, and the price line. Every shop page
// is wrapped in <ShopShell>.

const SAVED_KEY = "ogcw-shop-saved";
let memory: string[] | null = null; // this visit's list, when the browser can't keep it

function readSaved(): string[] {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    memory = raw ? (JSON.parse(raw) as string[]).filter((id) => typeof id === "string") : [];
  } catch {
    memory = [];
  }
  return memory;
}

/** The products saved in this browser, and a way to save or unsave one */
export function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    setSaved(readSaved());
    const update = () => setSaved([...readSaved()]);
    window.addEventListener("ogcw-saved", update);
    return () => window.removeEventListener("ogcw-saved", update);
  }, []);
  const toggle = (id: string) => {
    const list = readSaved();
    memory = list.includes(id) ? list.filter((item) => item !== id) : [id, ...list];
    storePreference(SAVED_KEY, JSON.stringify(memory)); // kept only if the reader allows preferences
    window.dispatchEvent(new Event("ogcw-saved"));
  };
  return { saved, toggle, has: (id: string) => saved.includes(id) };
}

export function Price({ product }: { product: ShopProduct }) {
  return product.price !== undefined
    ? <span className="sx-price">{formatPrice(product.price)}</span>
    : <span className="sx-price sx-price-none"><T k="shop.price.none">Price at the retailer</T></span>;
}

export function SaveButton({ product, big = false }: { product: ShopProduct; big?: boolean }) {
  const { has, toggle } = useSaved();
  const on = has(product.id);
  return (
    <button
      type="button"
      className={`sx-save ${big ? "sx-save-big" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${product.name} from saved` : `Save ${product.name}`}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle(product.id); }}
    >
      <Heart size={big ? 18 : 16} strokeWidth={2} fill={on ? "currentColor" : "none"} aria-hidden="true" />
      {big && <span>{on ? "Saved" : "Save"}</span>}
    </button>
  );
}

export function ProductTile({ product, size = "md" }: { product: ShopProduct; size?: "md" | "lg" }) {
  const brand = brandOf(product);
  return (
    <article className={`sx-tile sx-tile-${size}`}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-tile-link">
        <span className="sx-tile-photo">
          <img src={product.image} alt={`${brand.name} ${product.name}, ${product.colour}`} loading="lazy" />
          {product.tags?.includes("new") && <span className="sx-badge"><T k="shop.badge.new">New in</T></span>}
          {!product.tags?.includes("new") && product.tags?.includes("drops") && <span className="sx-badge sx-badge-dark"><T k="shop.badge.drop">On the calendar</T></span>}
        </span>
        <span className="sx-tile-brand">{brand.name}</span>
        <span className="sx-tile-name">{product.name}</span>
        <span className="sx-tile-colour">{product.colour}</span>
        <Price product={product} />
      </Link>
      <SaveButton product={product} />
    </article>
  );
}

export function ProductGrid({ products, cols = 4 }: { products: ShopProduct[]; cols?: 3 | 4 | 5 }) {
  return (
    <ul className={`sx-grid sx-grid-${cols}`}>
      {products.map((product) => <li key={product.id}><ProductTile product={product} /></li>)}
    </ul>
  );
}

export function BuyButton({ product }: { product: ShopProduct & { url?: string } }) {
  const brand = brandOf(product);
  return (
    <a className="sx-buy" href={buyUrl(product)} target="_blank" rel="noopener noreferrer sponsored">
      <T k="shop.buy">Shop at</T> {brand.name} <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}

const DEPARTMENTS = [
  { label: "New in", search: { tag: "new" } },
  ...SHOP_CATEGORIES.map((category) => ({ label: category.id, search: { cat: category.slug } })),
  { label: "Trending", search: { tag: "trending" } },
] as const;

function ShopBar() {
  const { saved } = useSaved();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const location = useRouterState({ select: (state) => state.location });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ to: "/shop/all", search: query.trim() ? { q: query.trim() } : {} });
  };
  const here = (search: Record<string, string>) =>
    location.pathname === "/shop/all" && Object.entries(search).every(([key, value]) => (location.search as Record<string, unknown>)[key] === value);
  return (
    <div className="sx-bar">
      <div className="sx-bar-row">
        <Link to="/shop" className="sx-wordmark" aria-label="OGCW Shop home">OGCW <span>Shop</span></Link>
        <form className="sx-search" role="search" onSubmit={onSubmit}>
          <Search size={16} aria-hidden="true" />
          <label htmlFor="shop-search" className="sr-only">Search the shop</label>
          <input id="shop-search" type="search" placeholder="Search sneakers, brands, caps…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </form>
        <div className="sx-bar-tools">
          <Link to="/shop/brands" className="sx-tool"><T k="shop.bar.brands">Brands</T></Link>
          <Link to="/shop/gifts" className="sx-tool"><T k="shop.bar.gifts">Gift guide</T></Link>
          <Link to="/shop/saved" className="sx-tool sx-tool-saved" aria-label={`Saved, ${saved.length} items`}>
            <Heart size={16} strokeWidth={2} aria-hidden="true" /> <T k="shop.bar.saved">Saved</T>
            {saved.length > 0 && <span className="sx-count">{saved.length}</span>}
          </Link>
        </div>
      </div>
      <nav className="sx-depts" aria-label="Shop departments">
        <ul>
          {DEPARTMENTS.map((dept) => (
            <li key={dept.label}>
              <Link to="/shop/all" search={dept.search} className="sx-dept" data-on={here(dept.search) || undefined}><T k={`shop.dept.${dept.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{dept.label}</T></Link>
            </li>
          ))}
          <li><Link to="/shop/all" className="sx-dept" data-on={(location.pathname === "/shop/all" && !Object.keys(location.search as object).length) || undefined}><T k="shop.dept.all">Shop all</T></Link></li>
          <li><Link to="/shop/drops" className="sx-dept sx-dept-gold"><T k="shop.dept.drops">Release dates</T></Link></li>
        </ul>
      </nav>
    </div>
  );
}

/** Every shop page: the site header, the shop bar, the page, the shop's promise */
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <EditSection name="Shop pages">
        <div className="sx" data-band="light">
          <ShopBar />
          <main className="sx-main">{children}</main>
          <section className="sx-promise" aria-label="How the shop works">
            <div className="sx-wrap sx-promise-row">
              <p><strong><T k="shop.promise.1">Picked by OGCW</T></strong> <T k="shop.promise.1.copy">From the brands in our stories.</T></p>
              <p><strong><T k="shop.promise.2">Bought from the retailer</T></strong> <T k="shop.promise.2.copy">They handle stock, sizes, payment and delivery.</T></p>
              <p><strong><T k="shop.promise.3">Guide prices</T></strong> <T k="shop.promise.3.copy">In euros; the retailer sets the final price.</T></p>
              <Link to="/info/$slug" params={{ slug: "faq" }} className="sx-link"><T k="shop.promise.faq">Questions?</T> <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
      </EditSection>
    </SiteShell>
  );
}

export function ShopHead({ kicker, title, children, k }: { kicker: string; title: string; children?: ReactNode; k: string }) {
  return (
    <header className="sx-head">
      <div>
        <p className="sx-kicker"><T k={`${k}.kicker`}>{kicker}</T></p>
        <h2 className="sx-title"><T k={`${k}.title`}>{title}</T></h2>
      </div>
      {children}
    </header>
  );
}
