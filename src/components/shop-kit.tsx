import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronDown, Heart, Menu, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BRANDS, PRODUCTS, brandOf, buyUrl, fullName, isLive, retailerOf, type ShopProduct } from "@/data/shop";
import { storePreference } from "@/lib/consent";
import { cart, useCart } from "@/lib/shop-cart";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { SiteShell } from "./ogcw-layout";
import { EditSection, T } from "./site-text";

// The OGCW Shop's own pieces: its header (menu, A to Z, the name, the
// sections, the orb search, saved and the cart), the product card on its
// black stage, the heart that saves a product, the add-to-cart button, the
// cart drawer and the price line. Every shop page is wrapped in <ShopShell>.

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

/** Prices are not shown anywhere in the shop for now (owner, 10 Oct 2026); each shop has its own */
export function Price(_: { product: ShopProduct }) {
  return null;
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
  if (!isLive(product)) return <BlankCard />;
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

/** The shop's search, after the 21st.dev orb input: a black pill with the
 *  moving orb, a divider and a placeholder that types itself */
const HINTS = ["Search Jordan 4s…", "Find a Rolex…", "Retro football shirts…", "Netflix, Spotify, DAZN…", "Something for the weekend?"];

function useTypedHint(hints: string[], paused: boolean) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(hints[0] ?? "");
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setText(hints[index] ?? ""); setTyping(false); return; }
    const chars = Array.from(hints[index] ?? "");
    let at = 0;
    let timeout = 0;
    setText("");
    setTyping(true);
    const interval = window.setInterval(() => {
      if (at < chars.length) { at += 1; setText(chars.slice(0, at).join("")); return; }
      window.clearInterval(interval);
      setTyping(false);
      timeout = window.setTimeout(() => setIndex((value) => (value + 1) % hints.length), 2200);
    }, 75);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [index, hints, paused]);
  return `${text}${typing ? "|" : ""}`;
}

export function ShopSearch({ initial = "" }: { initial?: string }) {
  const navigate = useNavigate();
  const id = useId();
  const [query, setQuery] = useState(initial);
  const [focused, setFocused] = useState(false);
  useEffect(() => setQuery(initial), [initial]);
  const hint = useTypedHint(HINTS, focused || query.length > 0);
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ to: "/shop/all", search: query.trim() ? { q: query.trim() } : {} });
  };
  return (
    <form className="sx-orb" data-focus={focused || undefined} role="search" onSubmit={onSubmit}>
      <span className="sx-orb-ball" aria-hidden="true"><img src="/shop/orb.webp" alt="" /></span>
      <span className="sx-orb-line" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">Search the shop</label>
      <input id={id} type="search" placeholder={hint} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoComplete="off" />
      <button type="submit" className="sx-orb-go" aria-label="Search"><Search size={16} strokeWidth={2} aria-hidden="true" /></button>
    </form>
  );
}

/** "A to Z": point at it, pick a letter, pick a brand */
function BrandIndex() {
  // Every product under the first letter of its name; a letter with none
  // takes the products with any word starting with it, so every letter is full
  const groups = useMemo(() => {
    const all = PRODUCTS.map((product) => ({ product, name: fullName(product).replace(/[“”’"]/g, "") })).sort((a, b) => a.name.localeCompare(b.name));
    const map = new Map<string, typeof all>();
    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      let list = all.filter((item) => item.name[0]!.toUpperCase() === letter);
      if (!list.length) list = all.filter((item) => item.name.split(/[\s/-]+/).some((word) => word[0]?.toUpperCase() === letter));
      if (!list.length) list = all.filter((item) => `${item.name} ${item.product.colour}`.split(/[\s/-]+/).some((word) => word[0]?.toUpperCase() === letter));
      if (list.length) map.set(letter, list);
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
  const entries = groups.get(letter) ?? [];
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
            {entries.map(({ product, name }) => (
              <li key={product.id}>
                {isLive(product)
                  ? <Link to="/shop/p/$id" params={{ id: product.id }}>{name}</Link>
                  : <Link to="/shop/all" search={{ q: name }}>{name}</Link>}
              </li>
            ))}
          </ul>
          <Link to="/shop/brands" className="sx-az-all"><T k="shop.az.all.brands">Brands A to Z</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
}

/** The shop's sections: in the header on wide screens, always in the menu */
const SECTIONS = [
  { key: "shop", label: "Shop", to: "/shop", tag: "" },
  { key: "trendiest", label: "Trendiest", to: "/shop/all", tag: "trending" },
  { key: "featured-drops", label: "Featured drops", to: "/shop/all", tag: "drops" },
  { key: "latest", label: "Latest", to: "/shop/all", tag: "new" },
  { key: "upcoming", label: "Upcoming", to: "/shop/drops", tag: "" },
  { key: "check-this-out", label: "Check this out", to: "/shop/all", tag: "limited" },
] as const;
const AISLE_LINKS = [
  { key: "sneakers", label: "Sneakers", cat: "sneakers" },
  { key: "clothing", label: "Clothing", cat: "clothing" },
  { key: "watches", label: "Watches & chains", cat: "accessories" },
  { key: "streaming", label: "Streaming", cat: "streaming" },
] as const;

/** The menu behind the hamburger: the sections, the aisles and the rest */
function ShopMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const go = () => onClose();
  return (
    <Drawer direction="left" open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DrawerContent className="sx-drawer sx-menu">
        <DrawerHeader className="sx-drawer-head">
          <DrawerTitle className="sx-drawer-title"><T k="shop.brand.name">One Great Culture World</T></DrawerTitle>
          <DrawerDescription className="sx-drawer-desc"><T k="shop.menu.desc">The OGCW Shop</T></DrawerDescription>
          <DrawerClose className="sx-drawer-x" aria-label="Close the menu"><X size={18} aria-hidden="true" /></DrawerClose>
        </DrawerHeader>
        <DrawerBody className="sx-drawer-body">
          <ul className="sx-menu-big">
            {SECTIONS.map((section) => (
              <li key={section.key}><Link to={section.to} search={section.tag ? { tag: section.tag } : {}} onClick={go}><T k={`shop.nav.${section.key}`}>{section.label}</T></Link></li>
            ))}
          </ul>
          <p className="sx-menu-label"><T k="shop.menu.aisles">Aisles</T></p>
          <ul className="sx-menu-small">
            {AISLE_LINKS.map((aisle) => (
              <li key={aisle.key}><Link to="/shop/all" search={{ cat: aisle.cat }} onClick={go}><T k={`shop.menu.${aisle.key}`}>{aisle.label}</T></Link></li>
            ))}
          </ul>
          <p className="sx-menu-label"><T k="shop.menu.more">More</T></p>
          <ul className="sx-menu-small">
            <li><Link to="/shop/brands" onClick={go}><T k="shop.bar.brands-a-to-z">Brands A to Z</T></Link></li>
            <li><Link to="/shop/gifts" onClick={go}><T k="shop.bar.gift-guide">Gift guide</T></Link></li>
            <li><Link to="/shop/saved" onClick={go}><T k="shop.menu.saved">Saved</T></Link></li>
            <li><Link to="/" onClick={go}><T k="shop.menu.site">OGCW news and stories</T> <ArrowUpRight size={14} aria-hidden="true" /></Link></li>
          </ul>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

/** The shop's own header, one slim row: the menu, A to Z and the name on
 *  the left, the sections in the middle, search, saved and the cart on the
 *  right. On the shop home it lies over the hero photo until you scroll. */
function ShopHeader() {
  const { saved } = useSaved();
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const location = useRouterState({ select: (state) => state.location });
  const home = location.pathname === "/shop" || location.pathname === "/shop/";
  const [over, setOver] = useState(home);
  useEffect(() => {
    if (!home) { setOver(false); return; }
    const update = () => setOver(window.scrollY < 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [home]);
  useEffect(() => setMenu(false), [location.pathname, location.searchStr]);
  const tag = (location.search as Record<string, unknown>)["tag"];
  const here = (section: (typeof SECTIONS)[number]) =>
    section.to === "/shop" ? home : location.pathname === section.to && (section.tag ? tag === section.tag : true);
  return (
    <EditSection name="Shop pages">
      <header className="sx-top" data-over={over || undefined}>
        <div className="sx-top-row">
          <div className="sx-top-left">
            <button type="button" className="sx-burger" aria-label="Open the shop menu" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={20} strokeWidth={1.8} aria-hidden="true" /></button>
            <BrandIndex />
            <Link to="/shop" className="sx-brand" data-site-logo="" aria-label="OGCW Shop home">OGCW</Link>
          </div>
          <nav className="sx-nav" aria-label="Shop sections">
            {SECTIONS.map((section) => (
              <Link key={section.key} to={section.to} search={section.tag ? { tag: section.tag } : {}} className="sx-nav-link" data-on={here(section) || undefined} aria-current={here(section) ? "page" : undefined}>
                <T k={`shop.nav.${section.key}`}>{section.label}</T>
              </Link>
            ))}
          </nav>
          <div className="sx-top-tools">
            <ShopSearch />
            <Link to="/shop/saved" className="sx-icon" aria-label={`Saved, ${saved.length} items`}>
              <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
              {saved.length > 0 && <span className="sx-count">{saved.length}</span>}
            </Link>
            <button type="button" className="sx-icon" onClick={() => cart.setOpen(true)} aria-label={`Shopping cart, ${count} items`}>
              <ShoppingCart size={19} strokeWidth={1.8} aria-hidden="true" />
              {count > 0 && <span className="sx-count">{count}</span>}
            </button>
          </div>
        </div>
      </header>
      <ShopMenu open={menu} onClose={() => setMenu(false)} />
    </EditSection>
  );
}

/** The cart: the efferd drawer from the right, with the items, quantities, the guide total and a promo code */
function CartDrawer() {
  const { items, count, code, open } = useCart();
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
                      <span className="sx-cart-sub">{retailerOf(product).name}</span>
                      <div className="sx-qty" role="group" aria-label={`Quantity of ${fullName(product)}`}>
                        <button type="button" onClick={() => cart.set(product.id, qty - 1)} aria-label="One less"><Minus size={13} aria-hidden="true" /></button>
                        <span aria-live="polite">{qty}</span>
                        <button type="button" onClick={() => cart.set(product.id, qty + 1)} aria-label="One more" disabled={qty >= 9}><Plus size={13} aria-hidden="true" /></button>
                      </div>
                    </div>
                    <div className="sx-cart-end">
                      <button type="button" className="sx-cart-remove" onClick={() => cart.remove(product.id)} aria-label={`Remove ${fullName(product)}`}><Trash2 size={14} aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="sx-sum">
                <div><dt><T k="shop.cart.prices">Prices</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
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
