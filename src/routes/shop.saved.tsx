import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProductGrid, ShopShell, useSaved } from "../components/shop-kit";
import { PRODUCTS } from "../data/shop";
import { T } from "@/components/site-text";

// Saved: the products hearted in this browser (kept here only if the reader
// allows preferences in the cookie panel; otherwise just for this visit)
export const Route = createFileRoute("/shop/saved")({
  head: () => ({ meta: [{ title: "Saved — OGCW Shop" }] }),
  component: Saved,
});

function Saved() {
  const { saved } = useSaved();
  const products = saved.flatMap((id) => PRODUCTS.find((product) => product.id === id) ?? []);
  return (
    <ShopShell>
      <div className="sx-wrap sx-list-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Saved</T></span></nav>
        <h1 className="sx-page-title"><T k="shop.saved.title">Saved</T></h1>
        <p className="sx-page-blurb"><T k="shop.saved.text">Tap the heart on anything in the shop to keep it here. Your list stays in this browser; no account needed.</T></p>
      </div>
      <div className="sx-wrap sx-section">
        {products.length ? <ProductGrid products={products} cols={4} /> : (
          <div className="sx-empty">
            <Heart size={28} aria-hidden="true" />
            <p><T k="shop.saved.empty">Nothing saved yet.</T></p>
            <Link to="/shop/all" search={{ tag: "trending" }} className="sx-btn"><T k="shop.saved.cta">Start with what’s trending</T></Link>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
