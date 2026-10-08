import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid, ShopShell } from "../components/shop-kit";
import { GIFT_BANDS, PRODUCTS } from "../data/shop";
import { T } from "@/components/site-text";

// The gift guide: the shop by budget, each band its own row, gift ideas first
export const Route = createFileRoute("/shop/gifts")({
  head: () => ({ meta: [{ title: "Gift guide — OGCW Shop" }, { name: "description", content: "Gifts for every budget from the OGCW Shop: under €50, under €100, under €200 and the big gift." }] }),
  component: Gifts,
});

const NOTES: Record<string, string> = {
  "under-50": "Caps and the classic Casio.",
  "under-100": "Canvas classics, suede and the clog everyone has an opinion on.",
  "under-200": "The sneakers on every list, a shoe that lasts and a G-Shock that takes a hit.",
  big: "Jordan 4s, resale grails and the boot that lasts.",
};

function Gifts() {
  return (
    <ShopShell>
      <section className="sx-gift-hero sx-gift-hero-gold">
        <div className="sx-wrap">
          <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Gift guide</T></span></nav>
          <h1 className="sx-hero-title"><T k="shop.gifts.title">The OGCW gift guide</T></h1>
          <p className="sx-hero-text"><T k="shop.gifts.text2">Something for everyone on your list, sorted by budget. Every price is a guide; each shop sets the final one.</T></p>
          <nav className="sx-jump" aria-label="Budgets">{GIFT_BANDS.map((band) => <a key={band.id} href={`#${band.id}`} className="sx-pill sx-pill-dark">{band.label}</a>)}</nav>
        </div>
      </section>
      <div className="sx-wrap">
        {GIFT_BANDS.map((band) => {
          const items = PRODUCTS.filter((product) => band.test(product.price)).sort((a, b) => Number(!!b.tags?.includes("gift")) - Number(!!a.tags?.includes("gift")));
          return (
            <section key={band.id} id={band.id} className="sx-section" aria-labelledby={`${band.id}-title`}>
              <header className="sx-head"><div><p className="sx-kicker">{items.length} ideas</p><h2 id={`${band.id}-title`} className="sx-title">{band.label}</h2></div><p className="sx-head-note">{NOTES[band.id]}</p></header>
              <ProductGrid products={items.slice(0, 8)} cols={4} />
              {items.length > 8 && <Link to="/shop/all" search={{ price: band.id }} className="sx-ghost sx-more-btn">See all {items.length}</Link>}
            </section>
          );
        })}
      </div>
    </ShopShell>
  );
}
