import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { ProductCard, ShopCard } from "../components/cards";
import { SHOPS } from "../data/content";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop — OGCW" },
      { name: "description", content: "The OGCW edit from Nike, Adidas, StockX and Uniqlo: the pieces behind the stories, picked by our style desk." },
      { property: "og:title", content: "Shop — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShopIndex,
});

function ShopIndex() {
  return (
    <SiteShell>
      <PageIntro kicker="OGCW Shop" title="Shop" copy="Four shops, one edit: the pieces behind the stories, picked by the OGCW style desk and bought straight from the retailer." />
      <main className="page-wrap pb-24">
        <div className="og-shop-cards">
          {SHOPS.map((shop) => <ShopCard key={shop.slug} shop={shop} />)}
        </div>

        <section className="og-block" aria-labelledby="staff-picks">
          <div className="og-section-head">
            <h2 id="staff-picks" className="og-section-title">Staff picks</h2>
            <span className="og-more-link">One from each shop</span>
          </div>
          <ul className="og-products og-products-4">
            {SHOPS.map((shop) => {
              const pick = shop.products[0]!;
              return <li key={shop.slug}><ProductCard product={pick} shop={shop} showShop /></li>;
            })}
          </ul>
          <p className="og-fine">Guide prices in euros; the final price is set by each retailer. Product photos via Unsplash.</p>
        </section>

        <section className="og-block og-how" aria-labelledby="how-shop-works">
          <h2 id="how-shop-works" className="og-section-title">How the OGCW Shop works</h2>
          <ol className="og-how-list">
            <li><span className="og-how-num">01</span><strong>Picked by OGCW</strong><span>Every product is chosen by our style desk, from the brands in our stories.</span></li>
            <li><span className="og-how-num">02</span><strong>Bought from the retailer</strong><span>“Shop at” takes you straight to the brand or marketplace; they handle stock, sizing, payment and delivery.</span></li>
            <li><span className="og-how-num">03</span><strong>Guide prices</strong><span>Prices are guides in euros. The final price is always set by the retailer.</span></li>
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
