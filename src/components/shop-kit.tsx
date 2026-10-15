import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { brandOf, buyUrl, fullName, isLive, retailerOf, type ShopProduct } from "@/data/shop";
import { storePreference } from "@/lib/consent";
import { cart, useCart } from "@/lib/shop-cart";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { SiteShell } from "./ogcw-layout";
import { ShopHeader } from "./shop-header";
import { EditSection, T } from "./site-text";

// The OGCW Shop's own pieces: the product card on its stage, the heart that
// saves a product, the add-to-cart button, the cart drawer and the price
// lines. Every shop page is wrapped in <ShopShell>, which brings the shop's
// header (src/components/shop-header.tsx) and the site's own footer.

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

/** US dollars, whole: $228, $6,825 (the shops' prices are in dollars) */
export const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

/** The day the prices were read from the shops */
export const PRICES_ON = "14 Oct 2026";

/** How far under its retail price a piece sells at the shop, in whole per cent
 *  (0 under 5%). Only real prices: the shop's own price against the brand's
 *  retail price, both as listed on 14 Oct 2026; no made-up "was" prices. */
export const offRetail = (product: ShopProduct) =>
  product.price && product.retail && product.price <= product.retail * 0.95 ? Math.round((1 - product.price / product.retail) * 100) : 0;

/** The retail price struck through, after the shop's price, when it's under retail */
export function Was({ product, qty = 1 }: { product: ShopProduct; qty?: number }) {
  if (!offRetail(product) || !product.retail) return null;
  return <s className="sx-was" aria-label={`Retail ${dollars(product.retail * qty)}`}>{dollars(product.retail * qty)}</s>;
}

/** The "-18%" tag on a photo, when the piece is under retail */
export function OffTag({ product }: { product: ShopProduct }) {
  const off = offRetail(product);
  return off ? <span className="sx-off">−{off}%</span> : null;
}

/** A card's price: small, under the name (only where a list can be sorted or filtered by price) */
export function Price({ product }: { product: ShopProduct }) {
  return product.price ? <span className="sx-tile-price" data-off={offRetail(product) ? "" : undefined}>{dollars(product.price)}<Was product={product} /></span> : <span className="sx-tile-price is-open">{product.url ? "Sold out" : "Price at the shop"}</span>;
}

/** The price on a product's page: the shop's price, where it's from and when, and the retail price */
export function PriceLine({ product }: { product: ShopProduct }) {
  const shop = retailerOf(product);
  if (!product.price) {
    return (
      <p className="px-price is-open">
        <strong>{product.url ? `Sold out at ${shop.name} right now` : `Price at ${shop.name}`}</strong>
        <span>{product.url ? "Their page shows when it’s back." : "Search for it there for today’s price."}</span>
      </p>
    );
  }
  return (
    <p className="px-price" data-off={offRetail(product) ? "" : undefined}>
      <strong>{dollars(product.price)}<Was product={product} />{offRetail(product) > 0 && <span className="sx-off is-inline">−{offRetail(product)}% under retail</span>}</strong>
      <span>{shop.slug === "goat" ? "Lowest new price on GOAT" : shop.slug === "stadium-goods" ? "Lowest price in stock at Stadium Goods" : `${shop.name}’s price`}, {shop.slug === "stadium-goods" ? "15 Oct 2026" : PRICES_ON}{product.retail ? <> · retail {dollars(product.retail)}</> : null}</span>
    </p>
  );
}

/** A product still to come: an empty card with empty lines where the text goes */
export function BlankCard({ tall = false, tone }: { tall?: boolean; tone?: "dark" | "light" | undefined }) {
  return (
    <div className={`sx-blank${tall ? " is-tall" : ""}`} data-tone={tone} aria-hidden="true">
      <span className="sx-blank-photo" />
      <span className="sx-blank-line" />
      <span className="sx-blank-line is-short" />
    </div>
  );
}

/** The total: the priced items, with a "+" when some are priced at the shop */
export const guideTotal = (subtotal: number, unpriced: number) => (subtotal > 0 ? `${dollars(subtotal)}${unpriced > 0 ? " +" : ""}` : "At the shop");

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

/** Add to cart: a round "+" on cards, a full button on the product page
 *  (where a piece made in sizes asks for one first) */
export function AddToCart({ product, full = false, size, onNeedSize }: { product: ShopProduct; full?: boolean; size?: string | undefined; onNeedSize?: () => void }) {
  const { items } = useCart();
  const inCart = items.filter((item) => item.id === product.id).reduce((sum, item) => sum + item.qty, 0);
  return (
    <button
      type="button"
      className={full ? "sx-add-full" : "sx-add"}
      aria-label={full ? undefined : `Add ${fullName(product)} to cart`}
      onClick={(event) => {
        event.preventDefault(); event.stopPropagation();
        if (onNeedSize && !size) { onNeedSize(); return; }
        cart.add(product.id, 1, size);
      }}
    >
      {full ? <><ShoppingBag size={17} strokeWidth={2} aria-hidden="true" /> <T k="shop.add">Add to cart</T>{inCart > 0 && <span className="sx-add-n">{inCart}</span>}</> : <Plus size={18} strokeWidth={2.2} aria-hidden="true" />}
    </button>
  );
}

/** A product's photos: the first, and the second (the other side, the back
 *  or another colour) fading in under the pointer. On a touch screen the
 *  first tap shows the second photo and the next one opens the product */
export function ProductPhoto({ product, hidden = false, className = "sx-tile-photo", children }: { product: ShopProduct; hidden?: boolean; className?: string; children?: ReactNode }) {
  return (
    <span className={`${className} sx-photo`} data-stage={product.stage} data-two={product.back ? "" : undefined}>
      <img className="sx-photo-1" src={product.image} alt={hidden ? "" : `${fullName(product)}, ${product.colour}`} loading="lazy" />
      {product.back && <img className="sx-photo-2" src={product.back} alt="" loading="lazy" />}
      <OffTag product={product} />
      {children}
    </span>
  );
}
/** On touch screens, the first tap on a two-photo card shows the second photo */
export const firstTapShowsBack = (event: MouseEvent<HTMLElement>) => {
  const card = event.currentTarget;
  if (!card.querySelector(".sx-photo[data-two]") || window.matchMedia("(hover: hover)").matches) return;
  if (card.dataset["flipped"] !== undefined) return;
  event.preventDefault();
  card.dataset["flipped"] = "";
  window.setTimeout(() => { delete card.dataset["flipped"]; }, 4000);
};

export function ProductTile({ product, size = "md", priced = false }: { product: ShopProduct; size?: "md" | "lg"; priced?: boolean }) {
  if (!isLive(product)) return <BlankCard />;
  const tags = product.tags ?? [];
  const badge = tags.includes("limited") ? "Limited" : tags.includes("new") ? "New in" : tags.includes("drops") ? "Featured drop" : undefined;
  return (
    <article className={`sx-tile sx-tile-${size}`}>
      <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-tile-link" onClick={firstTapShowsBack}>
        <ProductPhoto product={product}>
          {badge && <span className="sx-badge"><T k={`shop.badge.${badge.toLowerCase().replace(/\s+/g, "-")}`}>{badge}</T></span>}
        </ProductPhoto>
        <span className="sx-tile-brand">{brandLine(product)}</span>
        <span className="sx-tile-name">{product.name}</span>
        {priced && <Price product={product} />}
        <span className="sx-tile-colour">{product.colour}</span>
      </Link>
      <SaveButton product={product} />
      <AddToCart product={product} />
    </article>
  );
}

/** How many products a list shows before "Load more" (owner, 15 Oct 2026:
 *  every long list stops after 12 and loads the next 12 on demand) */
export const LOAD_STEP = 12;

/** Show `step` items, then `step` more each time; starts again when the list changes */
export function useLoadMore(ids: string, step = LOAD_STEP) {
  const [shown, setShown] = useState(step);
  useEffect(() => setShown(step), [ids, step]);
  return { shown, more: () => setShown((value) => value + step) };
}

/** The "Load more" button under a list, with how many are showing */
export function LoadMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <div className="sx-loadmore">
      <p className="sx-loadmore-count">{Math.min(shown, total)} of {total}</p>
      <span className="sx-loadmore-bar" aria-hidden="true"><span style={{ width: `${(Math.min(shown, total) / total) * 100}%` }} /></span>
      <button type="button" className="sx-loadmore-btn" onClick={onMore}><T k="shop.loadmore">Load more</T></button>
    </div>
  );
}

export function ProductGrid({ products, cols = 4, priced = true }: { products: ShopProduct[]; cols?: 3 | 4 | 5; priced?: boolean }) {
  const { shown, more } = useLoadMore(products.map((product) => product.id).join());
  return (
    <>
      <ul className={`sx-grid sx-grid-${cols}`}>
        {products.slice(0, shown).map((product) => <li key={product.id}><ProductTile product={product} priced={priced} /></li>)}
      </ul>
      <LoadMore shown={shown} total={products.length} onMore={more} />
    </>
  );
}

/** A row that scrolls sideways, with an arrow on each side: one item back or
 *  on per click, round to the other end from the last (owner, 15 Oct 2026).
 *  `per` is how many items fit across; `children` are the <li> items. */
export function Carousel({ children, per = 4, label, className = "", tone }: { children: ReactNode; per?: number; label: string; className?: string; tone?: "dark" }) {
  const track = useRef<HTMLUListElement>(null);
  const step = (dir: 1 | -1) => {
    const el = track.current;
    const item = el?.querySelector<HTMLElement>(":scope > li");
    if (!el || !item) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const end = el.scrollWidth - el.clientWidth - 4;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (dir > 0 && el.scrollLeft >= end) el.scrollTo({ left: 0, behavior });
    else if (dir < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior });
    else el.scrollBy({ left: dir * (item.offsetWidth + gap), behavior });
  };
  return (
    <div className={`sx-car ${className}`} data-tone={tone} style={{ "--per": per } as CSSProperties} role="group" aria-label={label}>
      <button type="button" className="sx-car-arrow is-prev" onClick={() => step(-1)} aria-label={`Back: ${label}`}><ArrowLeft size={18} aria-hidden="true" /></button>
      <ul className="sx-car-track" ref={track}>{children}</ul>
      <button type="button" className="sx-car-arrow is-next" onClick={() => step(1)} aria-label={`Next: ${label}`}><ArrowRight size={18} aria-hidden="true" /></button>
    </div>
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

/** The cart: the efferd drawer from the right, with the items, quantities, the guide total and a promo code */
function CartDrawer() {
  const { items, count, code, open, subtotal, unpriced } = useCart();
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
                {items.map(({ product, qty, size }) => (
                  <li key={`${product.id}-${size ?? ""}`} className="sx-cart-item">
                    <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-cart-img" data-stage={product.stage} onClick={() => cart.setOpen(false)}>
                      <img src={product.image} alt="" />
                    </Link>
                    <div className="sx-cart-info">
                      <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-cart-name" onClick={() => cart.setOpen(false)}>{fullName(product)}</Link>
                      <span className="sx-cart-sub">{[size && `${product.sizeLabel === "Waist" ? "Waist" : "Size"} ${size}`, retailerOf(product).name].filter(Boolean).join(" · ")}</span>
                      <div className="sx-qty" role="group" aria-label={`Quantity of ${fullName(product)}`}>
                        <button type="button" onClick={() => cart.set(product.id, qty - 1, size)} aria-label="One less"><Minus size={13} aria-hidden="true" /></button>
                        <span aria-live="polite">{qty}</span>
                        <button type="button" onClick={() => cart.set(product.id, qty + 1, size)} aria-label="One more" disabled={qty >= 9}><Plus size={13} aria-hidden="true" /></button>
                      </div>
                    </div>
                    <div className="sx-cart-end">
                      <span className="sx-cart-price">{product.price ? <>{dollars(product.price * qty)}<Was product={product} qty={qty} /></> : "At the shop"}</span>
                      <button type="button" className="sx-cart-remove" onClick={() => cart.remove(product.id, size)} aria-label={`Remove ${fullName(product)}`}><Trash2 size={14} aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="sx-sum">
                <div><dt><T k="shop.cart.subtotal">Subtotal</T></dt><dd>{guideTotal(subtotal, unpriced)}</dd></div>
                <div><dt><T k="shop.cart.shipping">Shipping</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
                <div><dt><T k="shop.cart.tax">Tax</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
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
            <T k="shop.cart.checkout">Checkout</T>
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** Every shop page: the shop's own header (no site header: the shop opens
 *  in its own tab), the page, the site's own footer and the cart */
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <SiteShell header={<ShopHeader />}>
      <EditSection name="Shop pages">
        <div className="sx">
          <main className="sx-main">{children}</main>
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
