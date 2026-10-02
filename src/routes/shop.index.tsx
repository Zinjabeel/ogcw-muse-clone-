import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { ProductCard, ShopCard } from "../components/cards";
import { SHOPS } from "../data/content";
import { T } from "@/components/site-text";

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
            <h2 id="staff-picks" className="og-section-title"><T k="shop.picks">Staff picks</T></h2>
            <span className="og-more-link"><T k="shop.picks.note">One from each shop</T></span>
          </div>
          <ul className="og-products og-products-4">
            {SHOPS.map((shop) => {
              const pick = shop.products[0]!;
              return <li key={shop.slug}><ProductCard product={pick} shop={shop} showShop /></li>;
            })}
          </ul>
          <p className="og-fine"><T k="shop.fine">Guide prices in euros; the final price is set by each retailer. Product photos via Unsplash.</T></p>
        </section>

        <section className="og-block og-how" aria-labelledby="how-shop-works">
          <h2 id="how-shop-works" className="og-section-title"><T k="shop.how">How the OGCW Shop works</T></h2>
          <ol className="og-how-list">
            <li><span className="og-how-num">01</span><strong><T k="shop.how.1">Picked by OGCW</T></strong><span><T k="shop.how.1.copy">Every product is chosen by our style desk, from the brands in our stories.</T></span></li>
            <li><span className="og-how-num">02</span><strong><T k="shop.how.2">Bought from the retailer</T></strong><span><T k="shop.how.2.copy">“Shop at” takes you straight to the brand or marketplace; they handle stock, sizing, payment and delivery.</T></span></li>
            <li><span className="og-how-num">03</span><strong><T k="shop.how.3">Guide prices</T></strong><span><T k="shop.how.3.copy">Prices are guides in euros. The final price is always set by the retailer.</T></span></li>
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
