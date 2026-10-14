import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowDownAZ, ArrowRight, ArrowUpRight, Heart, Menu, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BRANDS, LIVE_PRODUCTS, getProduct, productsOf, type ShopBrand, type ShopProduct } from "@/data/shop";
import { logoOf } from "@/data/shop-logos";
import { cart, useCart } from "@/lib/shop-cart";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { MegaPanel } from "./shop-mega-menu";
import { ShopSearchPanel } from "./shop-search-panel";
import { useSaved } from "./shop-kit";
import { EditSection, T } from "./site-text";

// The shop's header: the menu and the A to Z drawer on the left, OGCW in the
// middle, search (Moncler's panel), saved and the cart on the right, and the
// sections on a row of their own. Pointing at a section opens its panel
// (src/components/shop-mega-menu.tsx). On the shop home and Check this out it
// lies over the opening picture until you scroll.

/** The shop's sections: in the header on wide screens, and in the menu */
export const SECTIONS = [
  { key: "shop", label: "Shop", to: "/shop" },
  { key: "men", label: "Men", to: "/shop/men" },
  { key: "women", label: "Women", to: "/shop/women" },
  { key: "trendiest", label: "Trendiest", to: "/shop/trendiest" },
  { key: "featured-drops", label: "Featured drops", to: "/shop/featured-drops" },
  { key: "latest", label: "Latest", to: "/shop/latest" },
  { key: "upcoming", label: "Upcoming", to: "/shop/drops" },
  { key: "check-this-out", label: "Check this out", to: "/shop/check-this-out" },
] as const;

type Search = Record<string, string>;
type MenuLink = { label: string; to: string; search?: Search };
type Group = { key: string; name: string; peek: string[]; links: MenuLink[]; all: MenuLink };
const all = (label: string, search: Search): MenuLink => ({ label, to: "/shop/all", search });

/** The menu's groups: each opens to its links and a few of its pieces */
const GROUPS: Group[] = [
  { key: "men", name: "Men", peek: ["fragment-travis-aj1-low-military-blue", "days-before-rodeo-hoodie", "rolex-explorer-114270"],
    links: [all("Sneakers", { cat: "sneakers", g: "men" }), all("Hoodies and sweats", { kind: "Hoodies & sweats", g: "men" }), all("Jeans", { kind: "Jeans", g: "men" }), all("Jackets", { kind: "Jackets", g: "men" }), all("Tees and shirts", { kind: "T-shirts & shirts", g: "men" }), all("Watches", { kind: "Watches", g: "men" })],
    all: { label: "The men’s shop", to: "/shop/men" } },
  { key: "women", name: "Women", peek: ["samba-og-cheetah-preloved-red", "rolex-datejust-lady-69174-440300", "wmns-air-max-95-pink-foam-hj5996-001"],
    links: [all("Sneakers", { cat: "sneakers", g: "women" }), all("Hoodies and knits", { kind: "Hoodies & sweats", g: "women" }), all("Tees and tops", { kind: "T-shirts & shirts", g: "women" }), all("Jackets", { kind: "Jackets", g: "women" }), all("Watches", { kind: "Watches", g: "women" })],
    all: { label: "The women’s shop", to: "/shop/women" } },
  { key: "sneakers", name: "Sneakers", peek: ["aj1-royal-2026", "nb-9060-black-cat", "asics-gel-1130-black-pure-silver"],
    links: [all("Jordan", { cat: "sneakers", brand: "jordan" }), all("Nike", { cat: "sneakers", brand: "nike" }), all("adidas", { cat: "sneakers", brand: "adidas" }), all("New Balance", { cat: "sneakers", brand: "new-balance" }), all("ASICS", { cat: "sneakers", brand: "asics" }), all("Basketball", { kind: "Basketball" }), all("Running", { kind: "Running" }), all("Lifestyle", { kind: "Lifestyle" })],
    all: all("Every pair", { cat: "sneakers" }) },
  { key: "clothing", name: "Clothing", peek: ["sp5der-pnk-hoodie", "levis-denim-tears-logo-japan-jeans", "kaws-fragment-tee"],
    links: [all("Hoodies and sweats", { kind: "Hoodies & sweats" }), all("Tees and shirts", { kind: "T-shirts & shirts" }), all("Jeans", { kind: "Jeans" }), all("Jackets", { kind: "Jackets" }), all("Pants and shorts", { kind: "Pants" }), all("Denim Tears", { cat: "clothing", brand: "denim-tears" }), all("Sp5der", { cat: "clothing", brand: "sp5der" }), all("Hellstar", { cat: "clothing", brand: "hellstar" })],
    all: all("All clothing", { cat: "clothing" }) },
  { key: "collections", name: "Collections", peek: ["rolex-land-dweller-36", "vacheron-patrimony-rose-gold", "omega-speedmaster-145-022"],
    links: [all("Rolex", { kind: "Watches", brand: "rolex" }), all("Audemars Piguet", { kind: "Watches", brand: "audemars-piguet" }), all("Vacheron Constantin", { kind: "Watches", brand: "vacheron-constantin" }), all("Cartier", { kind: "Watches", brand: "cartier" }), all("Omega", { kind: "Watches", brand: "omega" }), all("Every watch", { kind: "Watches" }), all("Caps and hats", { kind: "Caps & hats" }), all("Bags", { kind: "Bags" })],
    all: all("All collections", { cat: "accessories" }) },
  { key: "drops", name: "Drops and picks", peek: ["travis-scott-af1-ice-blue", "awake-ny-aj6-blueberry", "nigel-sylvester-aj4-brick-after-brick"],
    links: [{ label: "Trendiest", to: "/shop/trendiest" }, { label: "Featured drops", to: "/shop/featured-drops" }, { label: "Latest", to: "/shop/latest" }, { label: "Upcoming releases", to: "/shop/drops" }, { label: "Check this out", to: "/shop/check-this-out" }, all("Limited editions", { tag: "limited" })],
    all: { label: "The release calendar", to: "/shop/drops" } },
];

const pieces = (ids: string[]) => ids.map(getProduct).filter((product): product is ShopProduct => !!product);
const go = (link: MenuLink, children: ReactNode, className: string, onClick: () => void) => (
  <Link to={link.to as "/shop/all"} search={link.search as never} className={className} onClick={onClick}>{children}</Link>
);

/** The hamburger: the sections up top, then groups that open one at a time */
function ShopMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  useEffect(() => { if (!open) setOpenKey(null); }, [open]);
  return (
    <Drawer direction="left" open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DrawerContent className="sx-drawer sx-menu">
        <DrawerHeader className="sx-drawer-head">
          <DrawerTitle className="sx-drawer-title"><T k="shop.menu.title">The OGCW Shop</T></DrawerTitle>
          <DrawerDescription className="sx-drawer-desc"><T k="shop.menu.desc2">Pick an aisle. Each one opens.</T></DrawerDescription>
          <DrawerClose className="sx-drawer-x" aria-label="Close the menu"><X size={18} aria-hidden="true" /></DrawerClose>
        </DrawerHeader>
        <DrawerBody className="sx-drawer-body acc-body-wrap">
          <nav className="acc-quick" aria-label="Quick links">
            <Link to="/shop/latest" onClick={onClose}><T k="shop.menu.q.new">New in</T></Link>
            <Link to="/shop/trendiest" onClick={onClose}><T k="shop.menu.q.trend">Trendiest</T></Link>
            <Link to="/shop/drops" onClick={onClose}><T k="shop.menu.q.up">Upcoming</T></Link>
          </nav>
          <ul className="acc">
            {GROUPS.map((group, i) => {
              const on = openKey === group.key;
              const peek = pieces(group.peek);
              return (
                <li key={group.key} className="acc-item" data-open={on || undefined}>
                  <button type="button" className="acc-head" aria-expanded={on} aria-controls={`acc-${group.key}`} onClick={() => setOpenKey(on ? null : group.key)}>
                    <span className="acc-no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span className="acc-name">{group.name}</span>
                    <span className="acc-peek" aria-hidden="true">
                      {peek.map((product) => <span key={product.id} data-stage={product.stage}><img src={product.image} alt="" loading="lazy" /></span>)}
                    </span>
                    <span className="acc-plus" aria-hidden="true"><Plus size={16} strokeWidth={1.8} /></span>
                  </button>
                  <div className="acc-panel" id={`acc-${group.key}`} role="region" aria-label={group.name}>
                    <div className="acc-inner">
                      <ul className="acc-links">
                        {group.links.map((link) => <li key={link.label}>{go(link, link.label, "acc-link", onClose)}</li>)}
                      </ul>
                      <ul className="acc-shelf" aria-label={`From ${group.name}`}>
                        {peek.map((product) => (
                          <li key={product.id}>
                            <Link to="/shop/p/$id" params={{ id: product.id }} onClick={onClose} className="acc-shelf-item" data-stage={product.stage} aria-label={product.name}>
                              <img src={product.image} alt="" loading="lazy" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {go(group.all, <>{group.all.label} <ArrowRight size={14} aria-hidden="true" /></>, "acc-all", onClose)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <ul className="acc-more">
            <li><Link to="/shop/brands" onClick={onClose}><T k="shop.bar.brands-a-to-z">Brands A to Z</T></Link></li>
            <li><Link to="/shop/gifts" onClick={onClose}><T k="shop.bar.gift-guide">Gift guide</T></Link></li>
            <li><Link to="/shop/saved" onClick={onClose}><T k="shop.menu.saved">Saved</T></Link></li>
            <li><Link to="/" onClick={onClose}><T k="shop.menu.site">OGCW news and stories</T> <ArrowUpRight size={13} aria-hidden="true" /></Link></li>
          </ul>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const letterOf = (brand: ShopBrand) => brand.name[0]!.toUpperCase();

/** A to Z: a drawer of its own. Tap a letter and the list scrolls to it;
 *  scroll the list and the letter you're on lights up (nothing moves under
 *  the pointer). A line at the top narrows the list as you type. */
function BrandDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { brands, shops } = useMemo(() => {
    const live = new Set(LIVE_PRODUCTS.flatMap((product) => [product.brand, product.retailer ?? ""]));
    const list = BRANDS.filter((brand) => live.has(brand.slug)).sort((a, b) => a.name.localeCompare(b.name));
    return { brands: list.filter((brand) => !brand.store), shops: list.filter((brand) => brand.store) };
  }, []);
  const [find, setFind] = useState("");
  const [current, setCurrent] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const shown = brands.filter((brand) => !find.trim() || brand.name.toLowerCase().includes(find.trim().toLowerCase()));
  const letters = new Set(shown.map(letterOf));
  useEffect(() => { if (!open) setFind(""); }, [open]);
  // The letter you've scrolled to
  useEffect(() => {
    if (!open) return;
    const root = list.current;
    if (!root) return;
    const seen = new IntersectionObserver((entries) => {
      const top = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setCurrent(top.target.getAttribute("data-letter") ?? "");
    }, { root, rootMargin: "0px 0px -75% 0px" });
    root.querySelectorAll("[data-letter]").forEach((section) => seen.observe(section));
    return () => seen.disconnect();
  }, [open, find]);
  const jump = (letter: string) => {
    const target = list.current?.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
    if (target && list.current) list.current.scrollTo({ top: target.offsetTop - 4, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setCurrent(letter);
  };
  return (
    <Drawer direction="left" open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DrawerContent className="sx-drawer sx-menu az-drawer">
        <DrawerHeader className="sx-drawer-head">
          <DrawerTitle className="sx-drawer-title"><T k="shop.az.title">Brands A to Z</T></DrawerTitle>
          <DrawerDescription className="sx-drawer-desc"><T k="shop.az.desc">Tap a letter, then scroll.</T></DrawerDescription>
          <DrawerClose className="sx-drawer-x" aria-label="Close Brands A to Z"><X size={18} aria-hidden="true" /></DrawerClose>
        </DrawerHeader>
        <div className="azd-top">
          <label className="azd-find">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">Find a brand</span>
            <input type="search" placeholder="Find a brand" value={find} onChange={(event) => setFind(event.target.value)} autoComplete="off" />
          </label>
          <div className="azd-letters" role="group" aria-label="Jump to a letter">
            {ALPHABET.map((letter) => (
              <button key={letter} type="button" disabled={!letters.has(letter)} aria-current={current === letter ? "true" : undefined} onClick={() => jump(letter)}>{letter}</button>
            ))}
          </div>
        </div>
        <div className="azd-list" ref={list}>
          {ALPHABET.filter((letter) => letters.has(letter)).map((letter) => (
            <section key={letter} data-letter={letter} className="azd-group" aria-label={letter}>
              <p className="azd-letter" aria-hidden="true">{letter}</p>
              <ul>
                {shown.filter((brand) => letterOf(brand) === letter).map((brand) => <li key={brand.slug}><BrandRow brand={brand} onPick={onClose} /></li>)}
              </ul>
            </section>
          ))}
          {!find && shops.length > 0 && (
            <section className="azd-group azd-shops" aria-label="Where it’s bought">
              <p className="azd-letter azd-letter-word"><T k="shop.brands.shops">Where it’s bought</T></p>
              <ul>{shops.map((brand) => <li key={brand.slug}><BrandRow brand={brand} onPick={onClose} /></li>)}</ul>
            </section>
          )}
          {shown.length === 0 && <p className="azd-none">No brand by that name yet.</p>}
          <Link to="/shop/brands" className="acc-all azd-all" onClick={onClose}><T k="shop.az.page">Every brand, with logos</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function BrandRow({ brand, onPick }: { brand: ShopBrand; onPick: () => void }) {
  const logo = logoOf(brand.slug);
  const peek = productsOf(brand.slug).filter((product) => LIVE_PRODUCTS.includes(product)).slice(0, 3);
  return (
    <Link to="/shop/$slug" params={{ slug: brand.slug }} className="azd-row" onClick={onPick}>
      <span className="azd-mark" aria-hidden="true">{logo ? <img src={logo} alt="" loading="lazy" /> : brand.name[0]}</span>
      <span className="azd-name">{brand.name}</span>
      <span className="azd-peek" aria-hidden="true">{peek.map((product) => <span key={product.id} data-stage={product.stage}><img src={product.image} alt="" loading="lazy" /></span>)}</span>
      <ArrowRight size={14} className="azd-go" aria-hidden="true" />
    </Link>
  );
}

export function ShopHeader() {
  const { saved } = useSaved();
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const location = useRouterState({ select: (state) => state.location });
  const home = location.pathname === "/shop" || location.pathname === "/shop/";
  // Pages that open on a full-bleed picture: the header lies over it until you scroll
  const overlay = home || ["/shop/check-this-out", "/shop/men", "/shop/women"].includes(location.pathname);
  const [over, setOver] = useState(overlay);
  useEffect(() => {
    if (!overlay) { setOver(false); return; }
    const update = () => setOver(window.scrollY < 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [overlay]);
  useEffect(() => { setMenu(false); setBrandsOpen(false); setSearching(false); }, [location.pathname, location.searchStr]);
  // The menu panel under the sections: opens while you point at (or focus) one
  const [panel, setPanel] = useState<string | null>(null);
  const closing = useRef(0);
  const openPanel = (key: string) => { window.clearTimeout(closing.current); if (!searching) setPanel(key); };
  const closeSoon = () => { window.clearTimeout(closing.current); closing.current = window.setTimeout(() => setPanel(null), 140); };
  useEffect(() => { setPanel(null); }, [location.pathname, location.searchStr]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);
  const here = (section: (typeof SECTIONS)[number]) => (section.to === "/shop" ? home : location.pathname === section.to);
  const closeSearch = () => setSearching(false);
  return (
    <EditSection name="Shop pages">
      <header className="sx-top" data-over={(over && !panel && !searching) || undefined} data-menu={panel || (searching ? "search" : undefined)} onMouseLeave={closeSoon}>
        <div className="sx-top-row">
          <div className="sx-top-left">
            <button type="button" className="sx-burger" aria-label="Open the shop menu" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={20} strokeWidth={1.8} aria-hidden="true" /></button>
            <button type="button" className="sx-az-btn" aria-label="Brands A to Z" title="Brands A to Z" aria-expanded={brandsOpen} onClick={() => setBrandsOpen(true)}><ArrowDownAZ size={20} strokeWidth={1.8} aria-hidden="true" /></button>
          </div>
          <Link to="/shop" className="sx-brand" data-site-logo="" aria-label="OGCW Shop home">OGCW</Link>
          <div className="sx-top-tools">
            <button type="button" className="sx-icon sx-search-btn" aria-label="Search the shop" aria-expanded={searching} onClick={() => { setPanel(null); setSearching((value) => !value); }}>
              <Search size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className="sx-search-word"><T k="shop.search.word">Search</T></span>
            </button>
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
        <nav className="sx-nav" aria-label="Shop sections">
          {SECTIONS.map((section) => (
            <Link key={section.key} to={section.to} className="sx-nav-link" data-on={here(section) || undefined} data-open={panel === section.key || undefined} aria-current={here(section) ? "page" : undefined} aria-expanded={panel === section.key} onMouseEnter={() => openPanel(section.key)} onFocus={() => openPanel(section.key)}>
              <T k={`shop.nav.${section.key}`}>{section.label}</T>
            </Link>
          ))}
        </nav>
        {panel && !searching && <div onMouseEnter={() => window.clearTimeout(closing.current)}><MegaPanel section={panel} onClose={() => setPanel(null)} /></div>}
        <ShopSearchPanel open={searching} onClose={closeSearch} />
      </header>
      {panel && !searching && <div className="mm-dim" aria-hidden="true" onMouseEnter={closeSoon} onClick={() => setPanel(null)} />}
      <ShopMenu open={menu} onClose={() => setMenu(false)} />
      <BrandDrawer open={brandsOpen} onClose={() => setBrandsOpen(false)} />
    </EditSection>
  );
}
