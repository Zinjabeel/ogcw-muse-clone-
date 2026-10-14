import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductPhoto, ShopShell, brandLine, dollars, firstTapShowsBack } from "../components/shop-kit";
import { LIVE_PRODUCTS, SHOP_CATEGORIES, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// Trendiest: the Heat Index. The pieces trending at GOAT and Watchfinder
// this week (the top of each shop's own trending lists when we read them,
// 14 Oct 2026) and the shop's own picks, in OGCW's order: the top three on a
// podium, the rest as a chart, then the heat by aisle.
export const Route = createFileRoute("/shop/trendiest")({
  head: () => ({ meta: [{ title: "Trendiest: OGCW Shop" }, { name: "description", content: "The Heat Index: the sneakers, clothing and watches trending right now, ranked by OGCW." }] }),
  component: Trendiest,
});

const HOT = LIVE_PRODUCTS.filter((product) => product.tags?.includes("trending"));
// One of each aisle in turn, so the chart isn't all one thing
const ranked = (() => {
  const queues = SHOP_CATEGORIES.map((cat) => HOT.filter((product) => product.category === cat.id));
  const out: ShopProduct[] = [];
  while (queues.some((queue) => queue.length)) for (const queue of queues) { const next = queue.shift(); if (next) out.push(next); }
  return out;
})();

function Trendiest() {
  const podium = ranked.slice(0, 3);
  const chart = ranked.slice(3, 18);
  return (
    <ShopShell>
      <section className="hx-open" aria-labelledby="hx-title">
        <div className="sx-wrap hx-open-in">
          <div className="hx-open-copy">
            <p className="hx-kicker"><T k="shop.tr.kicker">Trendiest · the week of 14 October</T></p>
            <h1 id="hx-title" className="hx-title"><T k="shop.tr.title">The Heat Index</T></h1>
            <p className="hx-blurb"><T k="shop.tr.blurb">What’s moving at GOAT and Watchfinder this week, with our own picks, in our order. Top three up front, the chart under it.</T></p>
          </div>
          <div className="hx-stack" aria-hidden="true">
            {podium.map((product) => <span key={product.id} className="hx-stack-card" data-stage={product.stage}><img src={product.image} alt="" /></span>)}
          </div>
        </div>
      </section>

      <section className="sx-wrap hx-podium" aria-label="The top three">
        {podium.map((product, i) => (
          <Link key={product.id} to="/shop/p/$id" params={{ id: product.id }} className="hx-pod" data-rank={i + 1} onClick={firstTapShowsBack}>
            <span className="hx-rank" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <ProductPhoto product={product} className="hx-pod-photo" />
            <span className="hx-pod-brand">{brandLine(product)}</span>
            <span className="hx-pod-name">{product.name}</span>
            <span className="hx-pod-price">{product.price ? dollars(product.price) : "Price at the shop"}</span>
          </Link>
        ))}
      </section>

      <section className="sx-wrap hx-chart" aria-labelledby="hx-chart-title">
        <h2 id="hx-chart-title" className="hx-h"><T k="shop.tr.chart">The chart</T></h2>
        <ol className="hx-rows">
          {chart.map((product, i) => (
            <li key={product.id}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="hx-row">
                <span className="hx-row-rank">{i + 4}</span>
                <ProductPhoto product={product} className="hx-row-photo" hidden />
                <span className="hx-row-text">
                  <span className="hx-row-brand">{brandLine(product)}</span>
                  <span className="hx-row-name">{product.name}</span>
                </span>
                <span className="hx-row-kind">{product.kind}</span>
                <span className="hx-row-price">{product.price ? dollars(product.price) : "At the shop"}</span>
                <ArrowUpRight size={16} className="hx-row-go" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="sx-wrap hx-aisles" aria-label="The heat by aisle">
        {SHOP_CATEGORIES.filter((cat) => HOT.some((product) => product.category === cat.id)).map((cat) => (
          <div key={cat.slug} className="hx-aisle">
            <header>
              <h2 className="hx-h">{cat.label}</h2>
              <Link to="/shop/all" search={{ cat: cat.slug, tag: "trending" }} className="sx-link">All trending {cat.label.toLowerCase()} <ArrowRight size={14} aria-hidden="true" /></Link>
            </header>
            <ul className="hx-mini">
              {HOT.filter((product) => product.category === cat.id).slice(0, 4).map((product) => (
                <li key={product.id}>
                  <Link to="/shop/p/$id" params={{ id: product.id }} className="hx-mini-card" onClick={firstTapShowsBack}>
                    <ProductPhoto product={product} className="hx-mini-photo" />
                    <span className="hx-mini-name">{product.name}</span>
                    <span className="hx-mini-price">{product.price ? dollars(product.price) : "At the shop"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </ShopShell>
  );
}
