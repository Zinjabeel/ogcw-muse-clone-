import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LIVE_PRODUCTS, fullName, getProduct, type ShopProduct } from "@/data/shop";
import { UPCOMING } from "@/data/shop-upcoming";

// The shop's menu panels, after Moncler's: point at a section in the header
// and a quiet panel drops under it, full width: a few columns of small
// links, each under a heading, and one or two photos with a line under them
// on the right. The page behind dims. Keys open it too; Escape closes it.

type ShopSearch = { cat?: string; kind?: string; brand?: string; tag?: string };
type MenuLink = { label: string; to: string; search?: ShopSearch; params?: { id: string } };
type Column = { title: string; links: MenuLink[] };
type Card = { image: string; caption: string; to: string; search?: ShopSearch; params?: { id: string }; white?: boolean };
type Panel = { columns: Column[]; cards: Card[] };

const all = (label: string, search: ShopSearch): MenuLink => ({ label, to: "/shop/all", search });
const named = (product: ShopProduct): MenuLink => ({ label: fullName(product), to: "/shop/p/$id", params: { id: product.id } });
const tagged = (tag: "trending" | "new" | "drops" | "limited", category: ShopProduct["category"], n = 5) =>
  LIVE_PRODUCTS.filter((product) => product.tags?.includes(tag) && product.category === category).slice(0, n);
const card = (id: string, caption: string): Card[] => {
  const product = getProduct(id);
  return product ? [{ image: product.image, caption, to: "/shop/p/$id", params: { id }, white: product.stage === "white" }] : [];
};

const byTag = (tag: "trending" | "new" | "drops" | "limited", allLabel: string): Column[] => [
  { title: "Sneakers", links: [...tagged(tag, "Sneakers").map(named), all(`${allLabel}: sneakers`, { tag, cat: "sneakers" })] },
  { title: "Clothing", links: [...tagged(tag, "Clothing").map(named), all(`${allLabel}: clothing`, { tag, cat: "clothing" })] },
  { title: "Watches", links: [...tagged(tag, "Accessories").map(named), all(`${allLabel}: watches`, { tag, cat: "accessories" })] },
].filter((column) => column.links.length > 1);

export const PANELS: Record<string, Panel> = {
  shop: {
    columns: [
      { title: "Sneakers", links: [all("All sneakers", { cat: "sneakers" }), all("Jordan", { cat: "sneakers", brand: "jordan" }), all("Nike", { cat: "sneakers", brand: "nike" }), all("adidas", { cat: "sneakers", brand: "adidas" }), all("New Balance", { cat: "sneakers", brand: "new-balance" }), all("ASICS", { cat: "sneakers", brand: "asics" })] },
      { title: "Clothing", links: [all("All clothing", { cat: "clothing" }), all("Hoodies", { cat: "clothing", kind: "Hoodies & sweats" }), all("T-shirts", { cat: "clothing", kind: "T-shirts & shirts" }), all("Jeans", { cat: "clothing", kind: "Jeans" })] },
      { title: "Collections", links: [all("All watches", { cat: "accessories" }), all("Rolex", { cat: "accessories", brand: "rolex" }), all("Omega", { cat: "accessories", brand: "omega" }), all("Tudor", { cat: "accessories", brand: "tudor" }), all("Cartier", { cat: "accessories", brand: "cartier" })] },
      { title: "Highlights", links: [all("New in", { tag: "new" }), all("Trendiest", { tag: "trending" }), all("Limited editions", { tag: "limited" }), { label: "Brands A to Z", to: "/shop/brands" }, { label: "Upcoming", to: "/shop/drops" }] },
    ],
    cards: [
      { image: "/shop/looks/sneakers-aisle.jpg", caption: "Sneakers", to: "/shop/all", search: { cat: "sneakers" } },
      { image: "/shop/looks/collections-aisle.jpg", caption: "Collections", to: "/shop/all", search: { cat: "accessories" } },
    ],
  },
  trendiest: { columns: byTag("trending", "All trending"), cards: card("aj4-black-cat-2025", "Air Jordan 4 ‘Black Cat’") },
  "featured-drops": { columns: byTag("drops", "All featured drops"), cards: card("aj1-royal-2026", "Air Jordan 1 ‘Royal’ 2026") },
  latest: { columns: byTag("new", "All new in"), cards: card("grand-seiko-sbgj273-red", "Grand Seiko, red dial") },
  "check-this-out": {
    columns: [
      { title: "Collabs", links: ["fragment-travis-aj1-low-military-blue", "nigel-sylvester-aj4-brick-after-brick", "levis-denim-tears-logo-japan-jeans", "supreme-dickies-cordura-cargo-denim"].flatMap((id) => getProduct(id) ?? []).map(named) },
      { title: "Grails", links: ["rolex-land-dweller-36", "omega-speedmaster-145-022", "days-before-rodeo-hoodie", "kaws-fragment-tee"].flatMap((id) => getProduct(id) ?? []).map(named) },
      { title: "One at a time", links: [{ label: "Check this out", to: "/shop/check-this-out" }, all("Every limited piece", { tag: "limited" })] },
    ],
    cards: card("fragment-travis-aj1-low-military-blue", "Fragment x Travis Scott x Air Jordan 1 Low"),
  },
};

const short = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

/** Upcoming is built when it opens, from today's date */
function upcomingPanel(today: string): Panel {
  const next = UPCOMING.filter((pair) => pair.date >= today);
  const lead = next.find((pair) => pair.photo);
  return {
    columns: [
      { title: "Next to drop", links: next.slice(0, 5).map((pair) => ({ label: `${short(pair.date)} · ${pair.name}`, to: "/shop/drops" })) },
      { title: "After that", links: [...next.slice(5, 9).map((pair) => ({ label: `${short(pair.date)} · ${pair.name}`, to: "/shop/drops" })), { label: "The whole calendar", to: "/shop/drops" }] },
    ],
    cards: lead?.photo ? [{ image: lead.photo, caption: `${short(lead.date)}: ${lead.name}`, to: "/shop/drops", white: true }] : [],
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
