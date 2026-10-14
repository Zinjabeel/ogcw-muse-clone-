import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ShopShell } from "../components/shop-kit";
import { DROPS } from "../data/drops";
import { UPCOMING, UPCOMING_SOURCE, type UpcomingPair } from "../data/shop-upcoming";
import { T } from "@/components/site-text";

// Upcoming, laid out like a news front: the next pair to drop as the lead
// story with its photo, the four after it down the side, then the rest of
// the calendar month by month as story cards, and the other dates OGCW
// covers (games, music, film, fights) as a strip of headlines. Dates from
// Just Fresh Kicks; photos and links from GOAT. No prices.
export const Route = createFileRoute("/shop/drops")({
  head: () => ({ meta: [{ title: "Upcoming: what drops next, OGCW Shop" }, { name: "description", content: "The sneakers on the calendar through the end of 2026, as news: dates, colourways and where to find each pair." }] }),
  component: Upcoming,
});

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(iso));
const dayLong = (iso: string) => fmt(iso, { weekday: "long", day: "numeric", month: "long" });
const dayShort = (iso: string) => fmt(iso, { weekday: "short", day: "numeric", month: "short" });
const monthOf = (iso: string) => fmt(iso, { month: "long", year: "numeric" });
const daysUntil = (iso: string, today: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
const countdown = (iso: string, today: string) => {
  const days = daysUntil(iso, today);
  return days <= 0 ? "Out today" : days === 1 ? "Tomorrow" : `In ${days} days`;
};

function Upcoming() {
  // The date is read in the browser after load, so the page the server sends matches
  const [today, setToday] = useState(UPCOMING_SOURCE.updated);
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const pairs = UPCOMING.filter((pair) => pair.date >= today);
  const [lead, ...rest] = pairs;
  const side = rest.slice(0, 4);
  const later = rest.slice(4);
  const months = [...new Set(later.map((pair) => monthOf(pair.date)))];
  const also = DROPS.filter((drop) => drop.kind !== "Sneakers" && drop.date >= today).slice(0, 8);

  return (
    <ShopShell>
      <header className="up-mast">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Upcoming</T></span></nav>
        <p className="up-kicker"><T k="shop.up.kicker">Upcoming</T></p>
        <h1 className="up-title"><T k="shop.up.title">What drops next</T></h1>
        <p className="up-dateline">
          Updated {fmt(UPCOMING_SOURCE.updated, { day: "numeric", month: "long", year: "numeric" })} · Dates from <a href={UPCOMING_SOURCE.url} target="_blank" rel="noopener noreferrer">Just Fresh Kicks</a>; brands can move a date at short notice
        </p>
      </header>

      {lead && (
        <section className="up-front" aria-label="The next drops">
          <article className="up-lead">
            <a href={lead.goat ?? UPCOMING_SOURCE.url} target="_blank" rel="noopener noreferrer" className="up-lead-photo">
              {lead.photo && <img src={lead.photo} alt={lead.name} />}
              <span className="up-count">{countdown(lead.date, today)}</span>
            </a>
            <div className="up-lead-text">
              <p className="up-meta"><span className="up-tag">Sneakers</span> {dayLong(lead.date)}</p>
              <h2 className="up-lead-title">{lead.name}</h2>
              {lead.colour && <p className="up-deck">{lead.colour}. The next pair on the calendar.</p>}
              <PairLinks pair={lead} />
            </div>
          </article>
          <aside className="up-side" aria-label="Next up">
            <p className="up-side-head"><T k="shop.up.next">Next up</T></p>
            <ol className="up-side-list">
              {side.map((pair) => (
                <li key={pair.id}>
                  <a href={pair.goat ?? UPCOMING_SOURCE.url} target="_blank" rel="noopener noreferrer" className="up-side-item">
                    <span className="up-side-photo">{pair.photo ? <img src={pair.photo} alt="" loading="lazy" /> : <DateBlock iso={pair.date} />}</span>
                    <span className="up-side-text">
                      <span className="up-meta">{dayShort(pair.date)} · {countdown(pair.date, today)}</span>
                      <span className="up-side-name">{pair.name}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      )}

      <div className="up-months">
        {months.map((month) => (
          <section key={month} className="up-month" aria-labelledby={`up-${month.replace(/\s+/g, "-")}`}>
            <h2 id={`up-${month.replace(/\s+/g, "-")}`} className="up-month-name">{month}</h2>
            <ul className="up-grid">
              {later.filter((pair) => monthOf(pair.date) === month).map((pair) => <li key={pair.id}><PairCard pair={pair} today={today} /></li>)}
            </ul>
          </section>
        ))}
      </div>

      {also.length > 0 && (
        <section className="up-also" aria-labelledby="up-also-title">
          <h2 id="up-also-title" className="up-month-name"><T k="shop.up.also">Also on the calendar</T></h2>
          <ul className="up-also-list">
            {also.map((drop) => {
              const body = (
                <>
                  <span className="up-meta"><span className="up-tag">{drop.kind}</span> {dayShort(drop.date)}</span>
                  <span className="up-also-name">{drop.name}</span>
                  <span className="up-also-detail">{drop.detail}</span>
                </>
              );
              return (
                <li key={drop.date + drop.name}>
                  {drop.slug ? <Link to="/news/$slug" params={{ slug: drop.slug }} className="up-also-item">{body}<span className="up-also-go"><T k="shop.up.read">Read the story</T> <ArrowRight size={14} aria-hidden="true" /></span></Link> : <div className="up-also-item">{body}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="up-cta">
        <p className="up-kicker"><T k="shop.up.cta.kicker">Out now</T></p>
        <h2 className="up-cta-title"><T k="shop.up.cta.title">The pairs you can already get</T></h2>
        <Link to="/shop/all" search={{ cat: "sneakers" }} className="sh-cta sh-cta-gold"><T k="shop.up.cta">Shop all sneakers</T> <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </ShopShell>
  );
}

function PairLinks({ pair }: { pair: UpcomingPair }) {
  return (
    <span className="up-links">
      {pair.product && <Link to="/shop/p/$id" params={{ id: pair.product }} className="sh-cta sh-cta-gold"><T k="shop.up.inshop">In the shop</T> <ArrowRight size={16} aria-hidden="true" /></Link>}
      {pair.goat && <a href={pair.goat} target="_blank" rel="noopener noreferrer" className="up-textlink"><T k="shop.up.goat">See it on GOAT</T> <ArrowUpRight size={14} aria-hidden="true" /></a>}
    </span>
  );
}

function DateBlock({ iso }: { iso: string }) {
  return (
    <span className="up-dateblock" aria-hidden="true">
      <span>{fmt(iso, { day: "numeric" })}</span>
      <span>{fmt(iso, { month: "short" })}</span>
    </span>
  );
}

function PairCard({ pair, today }: { pair: UpcomingPair; today: string }) {
  return (
    <article className="up-card">
      <a href={pair.goat ?? UPCOMING_SOURCE.url} target="_blank" rel="noopener noreferrer" className="up-card-photo" tabIndex={-1} aria-hidden="true">
        {pair.photo ? <img src={pair.photo} alt="" loading="lazy" /> : <DateBlock iso={pair.date} />}
        <span className="up-count">{countdown(pair.date, today)}</span>
      </a>
      <p className="up-meta"><span className="up-tag">Sneakers</span> {dayLong(pair.date)}</p>
      <h3 className="up-card-title"><a href={pair.goat ?? UPCOMING_SOURCE.url} target="_blank" rel="noopener noreferrer">{pair.name}</a></h3>
      {(pair.colour || pair.note) && <p className="up-card-deck">{[pair.colour, pair.note].filter(Boolean).join(". ")}</p>}
    </article>
  );
}
