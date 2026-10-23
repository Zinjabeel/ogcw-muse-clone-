import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductPhoto, ShopShell, brandLine, dollars, firstTapShowsBack, Was } from "../components/shop-kit";
import { LIVE_PRODUCTS, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// Latest: the shop as a timeline. Every piece with a release date, newest
// first, under its month in big type, with the day on each card; a row of
// months at the top jumps down the page. Then what came in this season
// without a date (clothing and watches).
export const Route = createFileRoute("/shop/latest")({
  head: () => ({ meta: [{ title: "Latest: OGCW Shop" }, { name: "description", content: "The newest pieces in the OGCW Shop, month by month: the latest Jordans, collabs, clothing and watches." }] }),
  component: Latest,
});

const TODAY = "2026-10-14";
const month = (iso: string) => iso.slice(0, 7);
const monthName = (key: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${key}-01`));
const dayOf = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

const DATED = LIVE_PRODUCTS.filter((product) => product.released && product.released <= TODAY && product.released >= "2025-06-01").sort((a, b) => b.released!.localeCompare(a.released!));
const MONTHS = [...new Set(DATED.map((product) => month(product.released!)))];
const SEASON = LIVE_PRODUCTS.filter((product) => !product.released && product.tags?.includes("new")).slice(0, 12);

function Latest() {
  return (
    <ShopShell>
      <header className="lt-head">
        <div className="sx-wrap">
          <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span>Latest</span></nav>
          <h1 className="lt-title"><T k="shop.lt.title">Just in</T></h1>
          <p className="lt-blurb"><T k="shop.lt.blurb">The newest pieces, month by month, with the day each one came out.</T></p>
        </div>
        <nav className="lt-months" aria-label="Months">
          <div className="sx-wrap lt-months-in">
            {MONTHS.map((key) => <a key={key} href={`#m-${key}`}>{monthName(key)}</a>)}
            {SEASON.length > 0 && <a href="#m-season">New this season</a>}
          </div>
        </nav>
      </header>
      <div className="sx-wrap lt-body">
        {MONTHS.map((key) => (
          <section key={key} id={`m-${key}`} className="lt-month" aria-labelledby={`lt-${key}`}>
            <h2 id={`lt-${key}`} className="lt-month-title"><span>{monthName(key).split(" ")[0]}</span> <span className="lt-year">{key.slice(0, 4)}</span></h2>
            <ul className="lt-grid">
              {DATED.filter((product) => month(product.released!) === key).slice(0, 12).map((product) => <li key={product.id}><DayCard product={product} /></li>)}
            </ul>
          </section>
        ))}
        {SEASON.length > 0 && (
          <section id="m-season" className="lt-month" aria-labelledby="lt-season">
            <h2 id="lt-season" className="lt-month-title"><span>New this season</span></h2>
            <ul className="lt-grid">{SEASON.map((product) => <li key={product.id}><DayCard product={product} /></li>)}</ul>
          </section>
        )}
        <p className="lt-end"><Link to="/shop/all" search={{ sort: "new" }} className="sx-gold">Everything, newest first <ArrowRight size={15} aria-hidden="true" /></Link></p>
      </div>
    </ShopShell>
  );
}

function DayCard({ product }: { product: ShopProduct }) {
  return (
    <Link to="/shop/p/$id" params={{ id: product.id }} className="lt-card" onClick={firstTapShowsBack}>
      <ProductPhoto product={product} className="lt-card-photo">
        {product.released && <span className="lt-day">{dayOf(product.released)}</span>}
      </ProductPhoto>
      <span className="lt-card-brand">{brandLine(product)}</span>
      <span className="lt-card-name">{product.name}</span>
      <span className="lt-card-price">{product.price ? <>{dollars(product.price)}<Was product={product} /></> : "At the shop"}</span>
    </Link>
  );
}
