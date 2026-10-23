import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CalendarPlus } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ShopShell } from "../components/shop-kit";
import { DROPS } from "../data/drops";
import { UPCOMING, UPCOMING_SOURCE, type UpcomingPair } from "../data/shop-upcoming";
import { T } from "@/components/site-text";

// Upcoming (redesigned 15 Oct 2026, owner: "make it 100 times better", and no
// cards without a picture). A dark stage first: the next pair floating under
// a spotlight with a live countdown and "Add to calendar"; the strip under it
// puts any of the next pairs on the stage. Then the calendar month by month
// as big date cards, each shoe on its own lit stage. Pairs with no photo yet
// are a short list ("Under wraps"), never an empty box. Then the other dates
// OGCW covers. Dates from Just Fresh Kicks; photos and links from GOAT (and
// Stadium Goods where GOAT has no photo yet). No prices.
export const Route = createFileRoute("/shop/drops")({
  head: () => ({ meta: [{ title: "Upcoming: what drops next, OGCW Shop" }, { name: "description", content: "Every sneaker on the calendar, with a live countdown to the next drop: dates, colourways and where to find each pair." }] }),
  component: Upcoming,
});

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(iso));
const dayLong = (iso: string) => fmt(iso, { weekday: "long", day: "numeric", month: "long" });
const monthOf = (iso: string) => fmt(iso, { month: "long", year: "numeric" });
const daysUntil = (iso: string, today: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
const countdown = (iso: string, today: string) => {
  const days = daysUntil(iso, today);
  return days <= 0 ? "Out today" : days === 1 ? "Tomorrow" : `In ${days} days`;
};
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const linkOf = (pair: UpcomingPair) => pair.goat ?? pair.shop?.url ?? UPCOMING_SOURCE.url;

/** A calendar file for the release day (an all-day event), downloaded in the browser */
function addToCalendar(pair: UpcomingPair) {
  const day = pair.date.replace(/-/g, "");
  const next = new Date(Date.parse(pair.date) + 86_400_000).toISOString().slice(0, 10).replace(/-/g, "");
  const clean = (text: string) => text.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/[“”]/g, '"');
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OGCW//Shop//EN", "BEGIN:VEVENT",
    `UID:${pair.id}-${day}@ogcw`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${next}`,
    `SUMMARY:${clean(`Release: ${pair.name}`)}`,
    `DESCRIPTION:${clean([pair.colour, "Date from Just Fresh Kicks via the OGCW Shop; brands can move a date."].filter(Boolean).join(". "))}`,
    `URL:${linkOf(pair)}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${pair.id}.ics` });
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Days, hours, minutes and seconds to the start of the release day, ticking */
function useClock(iso: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const target = Date.parse(`${iso}T00:00:00`);
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [iso]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60, done: left === 0 };
}

function Upcoming() {
  // The date is read in the browser after load, so the page the server sends matches
  const [today, setToday] = useState(UPCOMING_SOURCE.updated);
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const pairs = UPCOMING.filter((pair) => pair.date >= today);
  const shown = pairs.filter((pair) => pair.photo);
  const wraps = pairs.filter((pair) => !pair.photo);
  const [pick, setPick] = useState<string | null>(null);
  const star = shown.find((pair) => pair.id === pick) ?? shown[0];
  const months = [...new Set(shown.map((pair) => monthOf(pair.date)))];
  const also = DROPS.filter((drop) => drop.kind !== "Sneakers" && drop.date >= today).slice(0, 8);

  return (
    <ShopShell>
      {star && <Stage pair={star} today={today} isNext={star.id === shown[0]?.id} />}

      {shown.length > 1 && (
        <nav className="dp-strip" aria-label="Put a pair on the stage">
          <ul>
            {shown.slice(0, 10).map((pair) => (
              <li key={pair.id}>
                <button type="button" className="dp-chip" aria-pressed={pair.id === star?.id} onClick={() => setPick(pair.id)}>
                  <span className="dp-chip-photo"><img src={pair.photo} alt="" loading="lazy" /></span>
                  <span className="dp-chip-date">{fmt(pair.date, { day: "numeric", month: "short" })}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <header className="dp-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Upcoming</T></span></nav>
        <h1 className="dp-title"><T k="shop.up.title">What drops next</T></h1>
        <p className="dp-dateline">
          {shown.length + wraps.length} pairs on the calendar · Updated {fmt(UPCOMING_SOURCE.updated, { day: "numeric", month: "long", year: "numeric" })} · Dates from <a href={UPCOMING_SOURCE.url} target="_blank" rel="noopener noreferrer">Just Fresh Kicks</a>; brands can move a date at short notice
        </p>
      </header>

      <div className="dp-months">
        {months.map((month) => {
          const list = shown.filter((pair) => monthOf(pair.date) === month);
          return (
            <section key={month} className="dp-month" aria-labelledby={`dp-${month.replace(/\s+/g, "-")}`}>
              <h2 id={`dp-${month.replace(/\s+/g, "-")}`} className="dp-month-name">{month.split(" ")[0]} <span>{month.split(" ")[1]} · {list.length} {list.length === 1 ? "pair" : "pairs"}</span></h2>
              <ul className="dp-grid">
                {list.map((pair) => <li key={pair.id}><DateCard pair={pair} today={today} /></li>)}
              </ul>
            </section>
          );
        })}
      </div>

      {wraps.length > 0 && (
        <section className="dp-wraps" aria-labelledby="dp-wraps-title">
          <h2 id="dp-wraps-title" className="dp-section-title"><T k="shop.up.wraps">Under wraps</T> <span><T k="shop.up.wraps.note">On the calendar, first photos soon</T></span></h2>
          <ul>
            {wraps.map((pair) => (
              <li key={pair.id} className="dp-wrap">
                <span className="dp-wrap-date"><strong>{fmt(pair.date, { day: "numeric" })}</strong> {fmt(pair.date, { month: "short" })}</span>
                <span className="dp-wrap-name">{pair.name}{pair.colour && <small>{pair.colour}</small>}</span>
                <span className="dp-wrap-count">{countdown(pair.date, today)}</span>
                <button type="button" className="dp-cal-mini" onClick={() => addToCalendar(pair)} aria-label={`Add ${pair.name} to your calendar`}><CalendarPlus size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {also.length > 0 && (
        <section className="dp-also" aria-labelledby="dp-also-title">
          <h2 id="dp-also-title" className="dp-section-title"><T k="shop.up.also">Also on the calendar</T> <span>Games, music, film and fights</span></h2>
          <ul>
            {also.map((drop) => {
              const body = (
                <>
                  <span className="dp-also-day">{fmt(drop.date, { day: "numeric", month: "short" })}</span>
                  <span className="dp-also-kind">{drop.kind}</span>
                  <span className="dp-also-name">{drop.name}<small>{drop.detail}</small></span>
                </>
              );
              return (
                <li key={drop.date + drop.name}>
                  {drop.slug ? <Link to="/news/$slug" params={{ slug: drop.slug }} className="dp-also-item">{body}<ArrowRight size={16} aria-hidden="true" /></Link> : <div className="dp-also-item">{body}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="dp-cta">
        <p className="dp-cta-kicker"><T k="shop.up.cta.kicker">Out now</T></p>
        <h2 className="dp-cta-title"><T k="shop.up.cta.title">The pairs you can already get</T></h2>
        <Link to="/shop/all" search={{ cat: "sneakers" }} className="dp-cta-btn"><T k="shop.up.cta">Shop all sneakers</T> <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </ShopShell>
  );
}

/* ---------- The stage: one pair under a spotlight, with the countdown ---------- */

function Stage({ pair, today, isNext }: { pair: UpcomingPair; today: string; isNext: boolean }) {
  const clock = useClock(pair.date);
  const stage = useRef<HTMLElement>(null);
  const lean = (event: PointerEvent<HTMLElement>) => {
    if (reduced() || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    stage.current?.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
    stage.current?.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
    stage.current?.style.setProperty("--lx", `${(x * 100 + 50).toFixed(1)}%`);
  };
  const rest = () => { stage.current?.style.setProperty("--rx", "0deg"); stage.current?.style.setProperty("--ry", "0deg"); };
  const units = clock ? ([["Days", clock.days], ["Hours", clock.hours], ["Mins", clock.mins], ["Secs", clock.secs]] as const) : null;
  return (
    <section ref={stage} className="dp-stage" aria-labelledby="dp-stage-title" onPointerMove={lean} onPointerLeave={rest}>
      <div className="dp-stage-copy">
        <p className="dp-stage-kicker">{isNext ? <T k="shop.up.next">The next drop</T> : <T k="shop.up.later">Coming up</T>} · {dayLong(pair.date)}</p>
        <h2 id="dp-stage-title" className="dp-stage-name">{pair.name}</h2>
        {pair.colour && <p className="dp-stage-colour">{pair.colour}</p>}
        <div className="dp-clock" role="timer" aria-label={countdown(pair.date, today)}>
          {units && !clock?.done ? units.map(([label, value]) => (
            <span key={label} className="dp-clock-unit"><strong>{String(value).padStart(2, "0")}</strong><small>{label}</small></span>
          )) : <span className="dp-clock-out">{countdown(pair.date, today)}</span>}
        </div>
        <div className="dp-stage-actions">
          <button type="button" className="dp-btn-cal" onClick={() => addToCalendar(pair)}><CalendarPlus size={17} aria-hidden="true" /> <T k="shop.up.cal">Add to calendar</T></button>
          {pair.product && <Link to="/shop/p/$id" params={{ id: pair.product }} className="dp-btn-line"><T k="shop.up.inshop">In the shop</T> <ArrowRight size={15} aria-hidden="true" /></Link>}
          <a href={linkOf(pair)} target="_blank" rel="noopener noreferrer" className="dp-btn-line">{pair.goat ? "See it on GOAT" : pair.shop ? `See it at ${pair.shop.name}` : "The calendar"} <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
        {pair.note && <p className="dp-stage-note">{pair.note}</p>}
      </div>
      <div className="dp-stage-art" aria-hidden="true">
        <span className="dp-spot" />
        <span className="dp-shoe" key={pair.id} data-flat={!pair.photo?.includes(".png") || undefined}><img src={pair.photo} alt="" fetchPriority="high" /></span>
        <span className="dp-ground" />
        <span className="dp-day">{fmt(pair.date, { day: "numeric" })}<small>{fmt(pair.date, { month: "short" })}</small></span>
      </div>
    </section>
  );
}

/* ---------- A date card ---------- */

function DateCard({ pair, today }: { pair: UpcomingPair; today: string }) {
  const days = daysUntil(pair.date, today);
  return (
    <article className="dp-card">
      <a href={linkOf(pair)} target="_blank" rel="noopener noreferrer" className="dp-card-stage" data-flat={!pair.photo?.includes(".png") || undefined} tabIndex={-1} aria-hidden="true">
        <img src={pair.photo} alt="" loading="lazy" />
        <span className="dp-card-count" data-soon={days <= 7 || undefined}>{countdown(pair.date, today)}</span>
      </a>
      <div className="dp-card-body">
        <p className="dp-card-date"><strong>{fmt(pair.date, { day: "numeric" })}</strong><span>{fmt(pair.date, { weekday: "long" })}<br />{fmt(pair.date, { month: "long" })}</span></p>
        <div className="dp-card-text">
          <h3 className="dp-card-name"><a href={linkOf(pair)} target="_blank" rel="noopener noreferrer">{pair.name}</a></h3>
          {pair.colour && <p className="dp-card-colour">{pair.colour}</p>}
          {pair.note && <p className="dp-card-note">{pair.note}</p>}
          <div className="dp-card-actions">
            <button type="button" className="dp-cal-mini" onClick={() => addToCalendar(pair)} aria-label={`Add ${pair.name} to your calendar`}><CalendarPlus size={16} aria-hidden="true" /> <span>Calendar</span></button>
            {pair.product && <Link to="/shop/p/$id" params={{ id: pair.product }} className="dp-card-link">In the shop <ArrowRight size={13} aria-hidden="true" /></Link>}
            <a href={linkOf(pair)} target="_blank" rel="noopener noreferrer" className="dp-card-link">{pair.goat ? "GOAT" : pair.shop?.name ?? "Details"} <ArrowUpRight size={13} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </article>
  );
}
