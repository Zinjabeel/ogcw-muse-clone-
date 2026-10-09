import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronDown, Heart, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BRANDS, brandOf, buyUrl, fullName, productsOf, retailerOf, type ShopProduct } from "@/data/shop";
import { storePreference } from "@/lib/consent";
import { cart, useCart } from "@/lib/shop-cart";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { SiteShell } from "./ogcw-layout";
import { EditSection, T } from "./site-text";

// The OGCW Shop's own pieces: the pill bar under the site header (the
// aisles, the wordmark, a search, saved and the cart), the product card on
// its black stage, the heart that saves a product, the add-to-cart button,
// the cart drawer and the price line. Every shop page is wrapped in
// <ShopShell>. The shop is always dark: black, charcoal and OGCW yellow.

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

/** Euros without cents when there are none: €210, €19.50 */
export const euro = (value: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value);

export function Price({ product }: { product: ShopProduct }) {
  return product.price !== undefined
    ? <span className="sx-price">{euro(product.price)}</span>
    : <span className="sx-price sx-price-none"><T k="shop.price.shop">Price at the shop</T></span>;
}

/** The guide total: the priced items, with a "+" when some are priced at the shop */
export const guideTotal = (subtotal: number, unpriced: number) => (subtotal > 0 ? `${euro(subtotal)}${unpriced > 0 ? " +" : ""}` : "At the shop");

/** The brand line on a card: the brand, or "Via StockX" for a resale shop */
export const brandLine = (product: ShopProduct) => {
  const brand = brandOf(product);
  return brand.store ? `Via ${brand.name}` : brand.name;
};

export function SaveButton({ product, big = false }: { product: ShopProduct; big?: boolean }) {
  const { has, toggle } = useSaved();
  const on = has(product.id);
  return (
    <button
      type="button"
      className={`sx-save ${big ? "sx-save-big" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${fullName(product)} from saved` : `Save ${fullName(product)}`}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle(product.id); }}
    >
      <Heart size={big ? 18 : 16} strokeWidth={2} fill={on ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}

/** Add to cart: a round "+" on cards, a full button on the product page */
export function AddToCart({ product, full = false }: { product: ShopProduct; full?: boolean }) {
  const { items } = useCart();
  const inCart = items.find((item) => item.id === product.id)?.qty ?? 0;
  return (
    <button
      type="button"
      className={full ? "sx-add-full" : "sx-add"}
      aria-label={full ? undefined : `Add ${fullName(product)} to cart`}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); cart.add(product.id); }}
    >
      {full ? <><ShoppingBag size={17} strokeWidth={2} aria-hidden="true" /> <T k="shop.add">Add to cart</T>{inCart > 0 && <span className="sx-add-n">{inCart}</span>}</> : <Plus size={18} strokeWidth={2.2} aria-hidden="true" />}
    </button>
  );
}

export function ProductTile({ product, size = "md" }: { product: ShopProduct; size?: "md" | "lg" }) {
  const tags = product.tags ?? [];
  const badge = tags.includes("limited") ? "Limited" : tags.includes("new") ? "New in" : tags.includes("drops") ? "Featured drop" : undefined;
  return (
    <article className={`sx-tile sx-tile-${size}`}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-tile-link">
        <span className="sx-tile-photo">
          <img src={product.image} alt={`${fullName(product)}, ${product.colour}`} loading="lazy" />
          {badge && <span className="sx-badge"><T k={`shop.badge.${badge.toLowerCase().replace(/\s+/g, "-")}`}>{badge}</T></span>}
        </span>
        <span className="sx-tile-brand">{brandLine(product)}</span>
        <span className="sx-tile-name">{product.name}</span>
        <span className="sx-tile-colour">{product.colour}</span>
        <Price product={product} />
      </Link>
      <SaveButton product={product} />
      <AddToCart product={product} />
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

/** "Shop at …": the product at its own shop (the brand, or a resale shop) */
export function BuyButton({ product }: { product: ShopProduct }) {
  return (
    <a className="sx-buy" href={buyUrl(product)} target="_blank" rel="noopener noreferrer sponsored">
      <T k="shop.buy">Shop at</T> {retailerOf(product).name} <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}

/** The shop's sections: the only links in its header */
const SECTIONS = [
  { key: "shop", label: "Shop", to: "/shop", tag: "" },
  { key: "trendiest", label: "Trendiest", to: "/shop/all", tag: "trending" },
  { key: "featured-drops", label: "Featured drops", to: "/shop/all", tag: "drops" },
  { key: "latest", label: "Latest", to: "/shop/all", tag: "new" },
  { key: "upcoming", label: "Upcoming", to: "/shop/drops", tag: "" },
  { key: "check-this-out", label: "Check this out", to: "/shop/all", tag: "limited" },
] as const;

/** The shop's search: big in the hero, slim on the aisle pages */
export function ShopSearch({ big = false, initial = "" }: { big?: boolean; initial?: string }) {
  const navigate = useNavigate();
  const id = useId();
  const [query, setQuery] = useState(initial);
  useEffect(() => setQuery(initial), [initial]);
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ to: "/shop/all", search: query.trim() ? { q: query.trim() } : {} });
  };
  return (
    <form className={`sx-search${big ? " is-big" : ""}`} role="search" onSubmit={onSubmit}>
      <Search size={big ? 20 : 16} strokeWidth={2} aria-hidden="true" />
      <label htmlFor={id} className="sr-only">Search the shop</label>
      <input id={id} type="search" placeholder="Search sneakers, shirts, watches or streaming" value={query} onChange={(event) => setQuery(event.target.value)} />
      {big && <button type="submit" className="sx-gold"><T k="shop.search.go">Search</T></button>}
    </form>
  );
}

/** "A to Z": point at it, pick a letter, pick a brand */
function BrandIndex() {
  const groups = useMemo(() => {
    const brands = BRANDS.filter((brand) => productsOf(brand.slug).length > 0).sort((a, b) => a.name.localeCompare(b.name));
    const map = new Map<string, typeof brands>();
    for (const brand of brands) {
      const first = brand.name[0]!.toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : "#";
      map.set(letter, [...(map.get(letter) ?? []), brand]);
    }
    return map;
  }, []);
  const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState(() => letters.find((item) => groups.has(item)) ?? "A");
  const root = useRef<HTMLDivElement>(null);
  const pointer = useRef("");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  const brands = groups.get(letter) ?? [];
  return (
    <div className="sx-az" ref={root} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {/* A mouse opens it by pointing, so a click keeps it open; touch and keys toggle it */}
      <button type="button" className="sx-az-btn" aria-expanded={open} aria-controls="shop-az" onPointerDown={(event) => { pointer.current = event.pointerType; }} onClick={() => { const mouse = pointer.current === "mouse"; pointer.current = ""; setOpen((value) => (mouse ? true : !value)); }}>
        <T k="shop.az">A to Z</T> <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div id="shop-az" className="sx-az-panel">
          <div className="sx-az-letters" role="group" aria-label="Brands by letter">
            {letters.map((item) => (
              <button key={item} type="button" disabled={!groups.has(item)} aria-pressed={item === letter} onMouseEnter={() => groups.has(item) && setLetter(item)} onFocus={() => setLetter(item)} onClick={() => setLetter(item)}>{item}</button>
            ))}
          </div>
          <ul className="sx-az-brands">
            {brands.map((brand) => (
              <li key={brand.slug}><Link to="/shop/$slug" params={{ slug: brand.slug }}>{brand.name} <span>{productsOf(brand.slug).length}</span></Link></li>
            ))}
          </ul>
          <Link to="/shop/brands" className="sx-az-all"><T k="shop.az.all">Every brand</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
}

/** The shop's own header: One Great Culture World, its sections, saved, the cart and A to Z */
function ShopHeader() {
  const { saved } = useSaved();
  const { count } = useCart();
  const location = useRouterState({ select: (state) => state.location });
  const tag = (location.search as Record<string, unknown>)["tag"];
  const here = (section: (typeof SECTIONS)[number]) =>
    section.to === "/shop" ? location.pathname === "/shop" || location.pathname === "/shop/" : location.pathname === section.to && (section.tag ? tag === section.tag : true);
  return (
    <EditSection name="Shop pages">
      <header className="sx-top">
        <div className="sx-top-row">
          <Link to="/shop" className="sx-brand"><T k="shop.brand.name">One Great Culture World</T></Link>
          <div className="sx-top-tools">
            <Link to="/shop/saved" className="sx-round" aria-label={`Saved, ${saved.length} items`}>
              <Heart size={17} strokeWidth={2} aria-hidden="true" />
              {saved.length > 0 && <span className="sx-count">{saved.length}</span>}
            </Link>
            <button type="button" className="sx-round" onClick={() => cart.setOpen(true)} aria-label={`Shopping cart, ${count} items`}>
              <ShoppingCart size={17} strokeWidth={2} aria-hidden="true" />
              {count > 0 && <span className="sx-count">{count}</span>}
            </button>
            <BrandIndex />
          </div>
        </div>
        <nav className="sx-nav" aria-label="Shop sections">
          {SECTIONS.map((section) => (
            <Link key={section.key} to={section.to} search={section.tag ? { tag: section.tag } : {}} className="sx-nav-link" data-on={here(section) || undefined} aria-current={here(section) ? "page" : undefined}>
              <T k={`shop.nav.${section.key}`}>{section.label}</T>
            </Link>
          ))}
        </nav>
      </header>
    </EditSection>
  );
}

/** The cart: the efferd drawer from the right, with the items, quantities, the guide total and a promo code */
function CartDrawer() {
  const { items, count, subtotal, unpriced, code, open } = useCart();
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();
  useEffect(() => setDraft(code), [code]);
  const checkout = () => {
    cart.setOpen(false);
    navigate({ to: "/shop/checkout" });
  };
  const shops = new Set(items.map((item) => retailerOf(item.product).slug)).size;
  return (
    <Drawer direction="right" open={open} onOpenChange={cart.setOpen}>
      <DrawerContent className="sx-drawer">
        <DrawerHeader className="sx-drawer-head">
          <DrawerTitle className="sx-drawer-title">
            <ShoppingCart size={19} aria-hidden="true" /> <T k="shop.cart.title">Shopping cart</T> <span>({count} {count === 1 ? "item" : "items"})</span>
          </DrawerTitle>
          <DrawerDescription className="sx-drawer-desc"><T k="shop.cart.desc">Review your items before checkout.</T></DrawerDescription>
          <DrawerClose className="sx-drawer-x" aria-label="Close the cart"><X size={18} aria-hidden="true" /></DrawerClose>
        </DrawerHeader>
        <DrawerBody className="sx-drawer-body">
          {items.length === 0 ? (
            <div className="sx-cart-empty">
              <ShoppingCart size={56} strokeWidth={1.4} aria-hidden="true" />
              <p><T k="shop.cart.empty">Your cart is empty</T></p>
              <DrawerClose className="sx-ghost"><T k="shop.cart.continue">Continue shopping</T></DrawerClose>
            </div>
          ) : (
            <>
              <ul className="sx-cart-list">
                {items.map(({ product, qty }) => (
                  <li key={product.id} className="sx-cart-item">
                    <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-cart-img" onClick={() => cart.setOpen(false)}>
                      <img src={product.image} alt="" />
                    </Link>
                    <div className="sx-cart-info">
                      <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-cart-name" onClick={() => cart.setOpen(false)}>{fullName(product)}</Link>
                      <span className="sx-cart-sub">{product.price !== undefined ? `${euro(product.price)} each` : "Price at the shop"} · {retailerOf(product).name}</span>
                      <div className="sx-qty" role="group" aria-label={`Quantity of ${fullName(product)}`}>
                        <button type="button" onClick={() => cart.set(product.id, qty - 1)} aria-label="One less"><Minus size={13} aria-hidden="true" /></button>
                        <span aria-live="polite">{qty}</span>
                        <button type="button" onClick={() => cart.set(product.id, qty + 1)} aria-label="One more" disabled={qty >= 9}><Plus size={13} aria-hidden="true" /></button>
                      </div>
                    </div>
                    <div className="sx-cart-end">
                      <span className="sx-cart-total">{product.price !== undefined ? euro(product.price * qty) : "At the shop"}</span>
                      <button type="button" className="sx-cart-remove" onClick={() => cart.remove(product.id)} aria-label={`Remove ${fullName(product)}`}><Trash2 size={14} aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="sx-sum">
                <div><dt><T k="shop.cart.subtotal">Subtotal (guide)</T></dt><dd>{euro(subtotal)}</dd></div>
                {unpriced > 0 && <div><dt><T k="shop.cart.unpriced">Priced at the shop</T></dt><dd>{unpriced} {unpriced === 1 ? "item" : "items"}</dd></div>}
                <div><dt><T k="shop.cart.shipping">Shipping</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
                <div><dt><T k="shop.cart.tax">Tax</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
                <div className="sx-sum-total"><dt><T k="shop.cart.total">Total</T></dt><dd>{guideTotal(subtotal, unpriced)}</dd></div>
              </dl>

              <form className="sx-promo" onSubmit={(event) => { event.preventDefault(); cart.setCode(draft); }}>
                <label htmlFor="shop-promo" className="sr-only">Promo code</label>
                <input id="shop-promo" placeholder="Promo code" value={draft} onChange={(event) => setDraft(event.target.value)} autoComplete="off" />
                <button type="submit" className="sx-ghost"><T k="shop.cart.apply">Apply</T></button>
              </form>
              <p className="sx-promo-note" aria-live="polite">
                {code ? <>Saved <strong>{code}</strong>. Use it at the shop’s checkout; we’ll show it on the next page.</> : <T k="shop.cart.promo">Codes are used at each shop’s own checkout.</T>}
              </p>
              <p className="sx-cart-fine">{shops === 1 ? "One shop" : `${shops} shops`}: OGCW doesn’t sell anything itself. Checkout sends each item to its own shop, which handles sizes, payment and delivery.</p>
            </>
          )}
        </DrawerBody>
        <DrawerFooter className="sx-drawer-foot">
          <DrawerClose className="sx-ghost"><T k="shop.cart.continue">Continue shopping</T></DrawerClose>
          <button type="button" className="sx-gold" disabled={items.length === 0} onClick={checkout}>
            <T k="shop.cart.checkout">Checkout</T> {subtotal > 0 && <>({euro(subtotal)}{unpriced > 0 ? "+" : ""})</>}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** Every shop page: the shop's own header (no site header: the shop opens
 *  in its own tab), the page, the shop's promise, the site footer and the cart */
export function ShopShell({ children, promise = true }: { children: ReactNode; promise?: boolean }) {
  return (
    <SiteShell header={<ShopHeader />}>
      <EditSection name="Shop pages">
        <div className="sx">
          <main className="sx-main">{children}</main>
          {promise && (
            <section className="sx-promise" aria-label="How the shop works">
              <div className="sx-wrap sx-promise-row">
                <p><strong><T k="shop.promise.1">Picked by OGCW</T></strong> <T k="shop.promise.1.copy">From the brands in our stories.</T></p>
                <p><strong><T k="shop.promise.2b">Bought at the source</T></strong> <T k="shop.promise.2b.copy">Each shop handles stock, sizes, payment and delivery.</T></p>
                <p><strong><T k="shop.promise.3">Guide prices</T></strong> <T k="shop.promise.3b.copy">In euros; each shop sets the final price.</T></p>
                <Link to="/info/$slug" params={{ slug: "faq" }} className="sx-link"><T k="shop.promise.faq">Questions?</T> <ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </section>
          )}
          <CartDrawer />
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
