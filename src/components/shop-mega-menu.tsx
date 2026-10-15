import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LIVE_PRODUCTS, fullName, getProduct, type ShopProduct } from "@/data/shop";
import { UPCOMING } from "@/data/shop-upcoming";
import { dollars } from "./shop-kit";

// The shop's menu panels, after Moncler's: point at a section in the header
// and a panel drops under it, full width: the columns of links, and two
// picture cards on the right (fewer pictures, owner 15 Oct). The page behind dims. Keys
// open it too; Escape closes it.

type Search = { cat?: string; kind?: string; brand?: string; tag?: string; g?: string };
type MenuLink = { label: string; to: string; search?: Search; params?: { id: string } };
type Column = { title: string; links: MenuLink[] };
type Card = { image: string; caption: string; to: string; search?: Search; params?: { id: string }; white?: boolean };
type Panel = { side: Card; columns: Column[]; cards: Card[]; strip: ShopProduct[]; stripLink: MenuLink };

const all = (label: string, search: Search): MenuLink => ({ label, to: "/shop/all", search });
const page = (label: string, to: string): MenuLink => ({ label, to });
const named = (product: ShopProduct): MenuLink => ({ label: fullName(product), to: "/shop/p/$id", params: { id: product.id } });
const look = (image: string, caption: string, to: string, search?: Search): Card => ({ image, caption, to, ...(search ? { search } : {}) });
const piece = (id: string, caption?: string): Card[] => {
  const product = getProduct(id);
  return product ? [{ image: product.image, caption: caption ?? product.name, to: "/shop/p/$id", params: { id }, white: product.stage === "white" }] : [];
};
const where = (test: (product: ShopProduct) => boolean, n = 7) => LIVE_PRODUCTS.filter(test).slice(0, n);
const tagged = (tag: "trending" | "new" | "drops" | "limited", category: ShopProduct["category"], n = 4) => where((product) => !!product.tags?.includes(tag) && product.category === category, n);
const forGender = (gender: "men" | "women", kind?: string) => (product: ShopProduct) => (product.gender === gender || product.gender === "unisex") && (!kind || product.kind === kind);

const byTag = (tag: "trending" | "new" | "drops" | "limited", label: string): Column[] => [
  { title: "Sneakers", links: [...tagged(tag, "Sneakers").map(named), all(`${label}: sneakers`, { tag, cat: "sneakers" })] },
  { title: "Clothing", links: [...tagged(tag, "Clothing").map(named), all(`${label}: clothing`, { tag, cat: "clothing" })] },
  { title: "Collections", links: [...tagged(tag, "Accessories").map(named), all(`${label}: collections`, { tag, cat: "accessories" })] },
].filter((column) => column.links.length > 1);

export const PANELS: Record<string, Panel> = {
  shop: {
    side: look("/shop/looks/hero-store.webp", "The whole shop", "/shop/all"),
    columns: [
      { title: "Sneakers", links: [all("All sneakers", { cat: "sneakers" }), all("Jordan", { cat: "sneakers", brand: "jordan" }), all("Nike", { cat: "sneakers", brand: "nike" }), all("adidas", { cat: "sneakers", brand: "adidas" }), all("New Balance", { cat: "sneakers", brand: "new-balance" }), all("ASICS", { cat: "sneakers", brand: "asics" })] },
      { title: "Clothing", links: [all("All clothing", { cat: "clothing" }), all("Hoodies and sweats", { kind: "Hoodies & sweats" }), all("Tees and shirts", { kind: "T-shirts & shirts" }), all("Jeans", { kind: "Jeans" }), all("Jackets", { kind: "Jackets" }), all("Pants and shorts", { kind: "Pants" })] },
      { title: "Collections", links: [all("All watches", { kind: "Watches" }), all("Rolex", { kind: "Watches", brand: "rolex" }), all("Audemars Piguet", { kind: "Watches", brand: "audemars-piguet" }), all("Cartier", { kind: "Watches", brand: "cartier" }), all("Caps and hats", { kind: "Caps & hats" }), all("Bags", { kind: "Bags" })] },
      { title: "Highlights", links: [page("Men", "/shop/men"), page("Women", "/shop/women"), all("Limited editions", { tag: "limited" }), page("Brands A to Z", "/shop/brands"), page("Upcoming", "/shop/drops")] },
    ],
    cards: [look("/shop/looks/sneakers-aisle.jpg", "Sneakers", "/shop/all", { cat: "sneakers" }), look("/shop/looks/clothing-aisle.webp", "Clothing", "/shop/all", { cat: "clothing" })],
    strip: where((product) => !!product.tags?.includes("trending")),
    stripLink: page("Trendiest", "/shop/trendiest"),
  },
  men: {
    side: look("/shop/looks/fw-men.webp", "Fall/Winter 2026", "/shop/men"),
    columns: [
      { title: "Clothing", links: [all("Jackets", { kind: "Jackets", g: "men" }), all("Hoodies and sweats", { kind: "Hoodies & sweats", g: "men" }), all("Tees and shirts", { kind: "T-shirts & shirts", g: "men" }), all("Jeans", { kind: "Jeans", g: "men" }), all("Pants and shorts", { kind: "Pants", g: "men" })] },
      { title: "Sneakers", links: [all("Basketball", { kind: "Basketball", g: "men" }), all("Running", { kind: "Running", g: "men" }), all("Lifestyle", { kind: "Lifestyle", g: "men" }), all("Jordan", { cat: "sneakers", brand: "jordan", g: "men" })] },
      { title: "Collections", links: [all("Watches", { kind: "Watches", g: "men" }), all("Caps and hats", { kind: "Caps & hats" }), all("Bags", { kind: "Bags" }), page("The men’s shop", "/shop/men")] },
    ],
    cards: [look("/shop/looks/fw-men-night.webp", "After dark", "/shop/men"), look("/shop/looks/season-men.webp", "Layer up", "/shop/all", { kind: "Hoodies & sweats", g: "men" })],
    strip: where(forGender("men", "Jackets")).concat(where(forGender("men", "Basketball"), 3)).slice(0, 7),
    stripLink: page("Everything for men", "/shop/men"),
  },
  women: {
    side: look("/shop/looks/fw-women.webp", "Fall/Winter 2026", "/shop/women"),
    columns: [
      { title: "Clothing", links: [all("Hoodies and knits", { kind: "Hoodies & sweats", g: "women" }), all("Tees and tops", { kind: "T-shirts & shirts", g: "women" }), all("Jackets", { kind: "Jackets", g: "women" }), all("Pants", { kind: "Pants", g: "women" })] },
      { title: "Sneakers", links: [all("All sneakers", { cat: "sneakers", g: "women" }), all("Jordan", { cat: "sneakers", brand: "jordan", g: "women" }), all("adidas", { cat: "sneakers", brand: "adidas", g: "women" }), all("ASICS", { cat: "sneakers", brand: "asics", g: "women" }), all("New Balance", { cat: "sneakers", brand: "new-balance", g: "women" })] },
      { title: "Collections", links: [all("Watches", { kind: "Watches", g: "women" }), all("Cartier", { kind: "Watches", brand: "cartier", g: "women" }), all("Rolex", { kind: "Watches", brand: "rolex", g: "women" }), page("The women’s shop", "/shop/women")] },
    ],
    cards: [look("/shop/looks/fw-women-night.webp", "City lights", "/shop/women"), look("/shop/looks/season-women.webp", "Neutral ground", "/shop/all", { kind: "Hoodies & sweats", g: "women" })],
    strip: where(forGender("women")).filter((product) => product.gender === "women"),
    stripLink: page("Everything for women", "/shop/women"),
  },
  trendiest: { side: look("/shop/looks/sneakers-aisle.jpg", "The Heat Index", "/shop/trendiest"), columns: byTag("trending", "All trending"), cards: [...piece("aj4-black-cat-2025", "Air Jordan 4 ‘Black Cat’"), ...piece("sp5der-pnk-hoodie", "Sp5der P*nk Hoodie")], strip: where((product) => !!product.tags?.includes("trending") && product.category === "Sneakers"), stripLink: page("The Heat Index", "/shop/trendiest") },
  "featured-drops": { side: look("/shop/looks/hero-store.webp", "Featured drops", "/shop/featured-drops"), columns: byTag("limited", "All limited"), cards: [...piece("travis-scott-af1-ice-blue", "Travis Scott x AF1 ‘Ice Blue’"), ...piece("fragment-travis-aj1-low-military-blue", "Fragment x Travis Scott AJ1 Low")], strip: where((product) => !!product.tags?.includes("limited") && product.category === "Sneakers"), stripLink: page("Every featured drop", "/shop/featured-drops") },
  latest: { side: look("/shop/looks/clothing-aisle.webp", "Just in", "/shop/latest"), columns: byTag("new", "All new in"), cards: [...piece("aj1-royal-2026", "Air Jordan 1 ‘Royal’ 2026"), ...piece("grand-seiko-sbgj273-red", "Grand Seiko, red dial")], strip: where((product) => !!product.tags?.includes("new")), stripLink: page("Just in, month by month", "/shop/latest") },
  "check-this-out": {
    side: look("/shop/looks/collections-aisle.jpg", "One at a time", "/shop/check-this-out"),
    columns: [
      { title: "Collabs", links: ["fragment-travis-aj1-low-military-blue", "nigel-sylvester-aj4-brick-after-brick", "levis-denim-tears-logo-japan-jeans", "supreme-dickies-cordura-cargo-denim"].flatMap((id) => getProduct(id) ?? []).map(named) },
      { title: "Grails", links: ["rolex-land-dweller-36", "omega-speedmaster-145-022", "days-before-rodeo-hoodie", "kaws-fragment-tee"].flatMap((id) => getProduct(id) ?? []).map(named) },
      { title: "One at a time", links: [page("Check this out", "/shop/check-this-out"), all("Every limited piece", { tag: "limited" })] },
    ],
    cards: [...piece("fragment-travis-aj1-low-military-blue", "Fragment x Travis Scott x Air Jordan 1 Low"), ...piece("rolex-land-dweller-36", "Rolex Land-Dweller 36")],
    strip: where((product) => !!product.tags?.includes("limited")),
    stripLink: page("Check this out", "/shop/check-this-out"),
  },
};

const short = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

/** Upcoming is built when it opens, from today's date */
function upcomingPanel(today: string): Panel {
  const next = UPCOMING.filter((pair) => pair.date >= today);
  const shots = next.filter((pair) => pair.photo);
  return {
    side: look("/shop/looks/sneakers-aisle.jpg", "The release calendar", "/shop/drops"),
    columns: [
      { title: "Next to drop", links: next.slice(0, 5).map((pair) => ({ label: `${short(pair.date)} · ${pair.name}`, to: "/shop/drops" })) },
      { title: "After that", links: [...next.slice(5, 10).map((pair) => ({ label: `${short(pair.date)} · ${pair.name}`, to: "/shop/drops" })), { label: "The whole calendar", to: "/shop/drops" }] },
    ],
    cards: shots.slice(0, 2).map((pair) => ({ image: pair.photo!, caption: `${short(pair.date)}: ${pair.name}`, to: "/shop/drops", white: true })),
    strip: [],
    stripLink: page("The whole calendar", "/shop/drops"),
  };
}

export function MegaPanel({ section, onClose }: { section: string; onClose: () => void }) {
  const [today, setToday] = useState("2026-10-14");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const panel = section === "upcoming" ? upcomingPanel(today) : PANELS[section];
  if (!panel) return null;
  const go = (link: MenuLink | Card, children: ReactNode, className?: string) => (
    <Link to={link.to as any} search={link.search as any} params={link.params as any} className={className} onClick={onClose}>{children}</Link>
  );
  return (
    <div className="mm-panel" role="region" aria-label="Menu">
      <div className="mm-inner">
        <div className="mm-cols" style={{ gridTemplateColumns: `repeat(${panel.columns.length}, minmax(0, 1fr))` }}>
          {panel.columns.map((column) => (
            <div key={column.title} className="mm-col">
              <p className="mm-col-title">{column.title}</p>
              <ul>
                {column.links.map((link) => <li key={link.label}>{go(link, link.label, "mm-link")}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {panel.cards.length > 0 && (
          <div className="mm-cards" data-n={panel.cards.length}>
            {panel.cards.map((item) => (
              <figure key={item.image} className="mm-card">
                {go(item, (
                  <>
                    <span className="mm-card-photo" data-white={item.white || undefined}><img src={item.image} alt="" loading="lazy" /></span>
                    <figcaption>{item.caption} <ArrowRight size={13} aria-hidden="true" /></figcaption>
                  </>
                ), "mm-card-link")}
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
