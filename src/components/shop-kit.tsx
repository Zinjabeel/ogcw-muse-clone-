import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronDown, Heart, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { brandOf, buyUrl, fullName, retailerOf, type ShopProduct } from "@/data/shop";
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

const AISLES = [
  { label: "Sneakers", cat: "sneakers" },
  { label: "Clothing", cat: "clothing" },
  { label: "Watches & chains", cat: "accessories" },
  { label: "Streaming", cat: "streaming" },
] as const;

const MORE = [
  { label: "Featured drops", to: "/shop/all", search: { tag: "drops" } },
  { label: "New in", to: "/shop/all", search: { tag: "new" } },
  { label: "Trending", to: "/shop/all", search: { tag: "trending" } },
  { label: "Limited editions", to: "/shop/all", search: { tag: "limited" } },
  { label: "Shop all", to: "/shop/all", search: {} },
  { label: "Release dates", to: "/shop/drops", search: {} },
  { label: "Brands A to Z", to: "/shop/brands", search: {} },
  { label: "Gift guide", to: "/shop/gifts", search: {} },
] as const;

const keyOf = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "");

function ShopBar() {
  const { saved } = useSaved();
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const more = useRef<HTMLDetailsElement>(null);
  const location = useRouterState({ select: (state) => state.location });
  const search = location.search as Record<string, unknown>;
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ to: "/shop/all", search: query.trim() ? { q: query.trim() } : {} });
  };
  // The "More" list closes when you pick something or click elsewhere
  useEffect(() => {
    if (more.current) more.current.open = false;
  }, [location.pathname, location.searchStr]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (more.current?.open && !more.current.contains(event.target as Node)) more.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="sx-bar">
      <div className="sx-bar-row">
        <nav className="sx-pills" aria-label="Shop aisles">
          <Link to="/shop" className="sx-pill" data-on={location.pathname === "/shop" || location.pathname === "/shop/" || undefined}><T k="shop.bar.home">Shop</T></Link>
          {AISLES.map((aisle) => (
            <Link key={aisle.cat} to="/shop/all" search={{ cat: aisle.cat }} className="sx-pill" data-on={(location.pathname === "/shop/all" && search["cat"] === aisle.cat) || undefined}>
              <T k={`shop.bar.${keyOf(aisle.label)}`}>{aisle.label}</T>
            </Link>
          ))}
          <details className="sx-more" ref={more}>
            <summary className="sx-pill"><T k="shop.bar.more">More</T> <ChevronDown size={14} aria-hidden="true" /></summary>
            <ul className="sx-more-list">
              {MORE.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} search={item.search}><T k={`shop.bar.${keyOf(item.label)}`}>{item.label}</T></Link>
                </li>
              ))}
            </ul>
          </details>
        </nav>
        <Link to="/shop" className="sx-wordmark" aria-label="OGCW Shop home">OGCW<span>Shop</span></Link>
        <div className="sx-bar-tools">
          <form className="sx-search" role="search" onSubmit={onSubmit}>
            <Search size={15} aria-hidden="true" />
            <label htmlFor="shop-search" className="sr-only">Search the shop</label>
            <input id="shop-search" type="search" placeholder="Search the shop" value={query} onChange={(event) => setQuery(event.target.value)} />
          </form>
          <Link to="/shop/saved" className="sx-round" aria-label={`Saved, ${saved.length} items`}>
            <Heart size={17} strokeWidth={2} aria-hidden="true" />
            {saved.length > 0 && <span className="sx-count">{saved.length}</span>}
          </Link>
          <button type="button" className="sx-cart-btn" onClick={() => cart.setOpen(true)} aria-label={`Shopping cart, ${count} items`}>
            <ShoppingCart size={16} strokeWidth={2} aria-hidden="true" />
            <span className="sx-cart-label"><T k="shop.bar.cart">Cart</T></span>
            {count > 0 && <span className="sx-count">{count}</span>}
          </button>
        </div>
      </div>
    </div>
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

const DISPLAY_FONT = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&display=swap";

/** Every shop page: the site header, the shop bar, the page, the shop's promise and the cart */
export function ShopShell({ children, promise = true }: { children: ReactNode; promise?: boolean }) {
  return (
    <SiteShell>
      {/* The shop's wide display face, loaded only on shop pages */}
      <link rel="stylesheet" href={DISPLAY_FONT} precedence="default" />
      <EditSection name="Shop pages">
        <div className="sx">
          <ShopBar />
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
