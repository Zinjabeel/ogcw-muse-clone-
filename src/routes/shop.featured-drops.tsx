import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Carousel, ProductPhoto, ProductTile, ShopShell, brandLine, dollars, Was } from "../components/shop-kit";
import { LIVE_PRODUCTS, getProduct } from "../data/shop";
import { UPCOMING } from "../data/shop-upcoming";
import { T } from "@/components/site-text";

// Featured drops: the collabs, as an edit. The lead drop on a split with a
// countdown (worked out after the page loads), then the collab pairs already
// out, the next dates on the calendar, collab clothing, and the grails, each
// a row that scrolls with an arrow on each side.
export const Route = createFileRoute("/shop/featured-drops")({
  head: () => ({ meta: [{ title: "Featured drops: OGCW Shop" }, { name: "description", content: "The collabs that matter: Travis Scott, Fragment, Awake NY, Denim Tears and more, with the next dates on the calendar." }] }),
  component: FeaturedDrops,
});

const LEAD = getProduct("travis-scott-af1-ice-blue");
const TODAY = "2026-10-14";
const OUT = LIVE_PRODUCTS.filter((product) => product.category === "Sneakers" && product.tags?.includes("limited") && product.id !== LEAD?.id).sort((a, b) => (b.released ?? "").localeCompare(a.released ?? "")).slice(0, 12);
const CLOTHES = LIVE_PRODUCTS.filter((product) => product.category === "Clothing" && product.tags?.includes("limited")).slice(0, 16);
const GRAILS = LIVE_PRODUCTS.filter((product) => product.kind === "Watches" && product.tags?.includes("limited")).slice(0, 12);
const longDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(iso));

function FeaturedDrops() {
  const [left, setLeft] = useState<string | null>(null);
  const [today, setToday] = useState(TODAY);
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
    if (!LEAD?.released) return;
    const days = Math.ceil((Date.parse(`${LEAD.released}T15:00:00Z`) - Date.now()) / 86_400_000);
    setLeft(days > 1 ? `${days} days to go` : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Out now");
  }, []);
  const next = UPCOMING.filter((pair) => pair.date >= today && pair.photo);
  return (
    <ShopShell>
      {LEAD && (
        <section className="fd-lead" aria-labelledby="fd-title">
          <div className="fd-lead-copy">
            <p className="fd-kicker"><T k="shop.fd.kicker">Featured drop</T>{LEAD.released && <> · {longDate(LEAD.released)}</>}</p>
            <h1 id="fd-title" className="fd-title">{LEAD.name}</h1>
            <p className="fd-colour">{LEAD.colour}</p>
            {left && <p className="fd-count" aria-live="polite">{left}</p>}
            <div className="fd-actions">
              <Link to="/shop/p/$id" params={{ id: LEAD.id }} className="sx-gold"><T k="shop.fd.see">See the pair</T> <ArrowRight size={15} aria-hidden="true" /></Link>
              <Link to="/shop/drops" className="sx-ghost"><T k="shop.fd.calendar">The calendar</T></Link>
            </div>
            <p className="fd-fine">Date as GOAT lists it; prices and sizes on the pair’s page.</p>
          </div>
          <ProductPhoto product={LEAD} className="fd-lead-photo" />
        </section>
      )}

      <section className="sx-wrap fd-out" aria-labelledby="fd-out">
        <header className="fd-head"><p className="fd-num">01</p><h2 id="fd-out" className="fd-h">Out now: the collabs</h2></header>
        <Carousel per={3} label="Out now: the collabs">
          {OUT.map((product) => (
            <li key={product.id}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="fd-card">
                <ProductPhoto product={product} className="fd-card-photo" />
                <span className="fd-card-meta">{product.released ? longDate(product.released) : ""}</span>
                <span className="fd-card-name">{product.name}</span>
                <span className="fd-card-price">{brandLine(product)} · {product.price ? <>{dollars(product.price)}<Was product={product} /></> : "At the shop"}</span>
              </Link>
            </li>
          ))}
        </Carousel>
      </section>

      {next.length > 0 && (
        <section className="fd-cal" aria-labelledby="fd-cal">
          <div className="sx-wrap">
            <header className="fd-head"><p className="fd-num">02</p><h2 id="fd-cal" className="fd-h">On the calendar</h2><Link to="/shop/drops" className="sx-link">Every date <ArrowRight size={14} aria-hidden="true" /></Link></header>
            <Carousel per={6} label="On the calendar" tone="dark">
              {next.map((pair) => (
                <li key={pair.id}>
                  <a href={pair.goat ?? "/shop/drops"} target={pair.goat ? "_blank" : undefined} rel="noopener noreferrer" className="fd-date">
                    <span className="fd-date-day">{longDate(pair.date)}</span>
                    <span className="fd-date-photo"><img src={pair.photo} alt="" loading="lazy" /></span>
                    <span className="fd-date-name">{pair.name}</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </Carousel>
          </div>
        </section>
      )}

      <section className="sx-wrap fd-out" aria-labelledby="fd-clothes">
        <header className="fd-head"><p className="fd-num">03</p><h2 id="fd-clothes" className="fd-h">Collab clothing</h2><Link to="/shop/all" search={{ cat: "clothing", tag: "limited" }} className="sx-link">All of it <ArrowRight size={14} aria-hidden="true" /></Link></header>
        <Carousel per={4} label="Collab clothing">{CLOTHES.map((product) => <li key={product.id}><ProductTile product={product} priced /></li>)}</Carousel>
      </section>

      {GRAILS.length > 0 && (
        <section className="sx-wrap fd-out" aria-labelledby="fd-grails">
          <header className="fd-head"><p className="fd-num">04</p><h2 id="fd-grails" className="fd-h">Grails on the wrist</h2><Link to="/shop/all" search={{ kind: "Watches", tag: "limited" }} className="sx-link">More grails <ArrowRight size={14} aria-hidden="true" /></Link></header>
          <Carousel per={4} label="Grails on the wrist">{GRAILS.map((product) => <li key={product.id}><ProductTile product={product} priced /></li>)}</Carousel>
        </section>
      )}
    </ShopShell>
  );
}
