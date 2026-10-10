import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductGrid, ShopShell } from "../components/shop-kit";
import { SNEAKER_DROPS, PRODUCTS } from "../data/shop";
import { T } from "@/components/site-text";

// Release dates: every sneaker on the calendar, month by month, with the
// Jordans already in the shop underneath
export const Route = createFileRoute("/shop/drops")({
  head: () => ({ meta: [{ title: "Sneaker release dates — OGCW Shop" }, { name: "description", content: "Air Jordan release dates for October, November and December 2026, with retail prices." }] }),
  component: Drops,
});

const monthName = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
const dayLabel = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));

function Drops() {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const upcoming = SNEAKER_DROPS.filter((drop) => drop.date >= today);
  const months = [...new Set(upcoming.map((drop) => monthName(drop.date)))];
  const source = upcoming.find((drop) => drop.source)?.source;
  return (
    <ShopShell>
      <section className="sx-gift-hero" data-band="dark">
        <div className="sx-wrap">
          <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Release dates</T></span></nav>
          <h1 className="sx-hero-title"><T k="shop.drops.title">Sneaker release dates</T></h1>
          <p className="sx-hero-text"><T k="shop.drops.text2">Every pair on the calendar between now and the end of the year.</T></p>
        </div>
      </section>
      <div className="sx-wrap sx-section">
        {months.map((month) => (
          <section key={month} className="sx-month" aria-label={month}>
            <h2 className="sx-month-name">{month}</h2>
            <ol className="sx-cal">
              {upcoming.filter((drop) => monthName(drop.date) === month).map((drop) => (
                <li key={drop.date + drop.name} className="sx-cal-row">
                  <span className="sx-cal-day">{dayLabel(drop.date)}</span>
                  <span className="sx-cal-name">{drop.name}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {source && <p className="sx-fine">Dates: <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} <ArrowUpRight size={12} aria-hidden="true" /></a>. Brands can move a date at short notice.</p>}
      </div>
      <section className="sx-wrap sx-section" aria-labelledby="in-the-shop">
        <header className="sx-head"><div><p className="sx-kicker"><T k="shop.drops.now.kicker">Out now</T></p><h2 id="in-the-shop" className="sx-title"><T k="shop.drops.now">Jordans in the shop</T></h2></div></header>
        <ProductGrid products={PRODUCTS.filter((product) => product.brand === "jordan")} cols={4} />
      </section>
    </ShopShell>
  );
}
