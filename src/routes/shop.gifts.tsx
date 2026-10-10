import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid, ShopShell } from "../components/shop-kit";
import { PRODUCTS } from "../data/shop";
import { T } from "@/components/site-text";

// The gift guide: the pieces picked as gifts. No prices in the shop for now
// (owner, 10 Oct 2026), so no price bands either.
export const Route = createFileRoute("/shop/gifts")({
  head: () => ({ meta: [{ title: "Gift guide: OGCW Shop" }, { name: "description", content: "Gift ideas from the OGCW Shop." }] }),
  component: Gifts,
});

function Gifts() {
  const items = PRODUCTS.filter((product) => product.tags?.includes("gift"));
  return (
    <ShopShell>
      <section className="sx-gift-hero sx-gift-hero-gold">
        <div className="sx-wrap">
          <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Gift guide</T></span></nav>
          <h1 className="sx-hero-title"><T k="shop.gifts.title">The OGCW gift guide</T></h1>
          <p className="sx-hero-text"><T k="shop.gifts.text3">Something for everyone on your list. Each shop sets its own prices and delivery.</T></p>
        </div>
      </section>
      <div className="sx-wrap sx-section">
        <ProductGrid products={items} cols={4} />
      </div>
    </ShopShell>
  );
}
