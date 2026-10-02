import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { ARIRANG_TOUR as TOUR, type TourStop } from "../data/tours";
import btsStadiumPhoto from "../assets/news/bts-arirang-paris-stadium.jpg";
import { T } from "@/components/site-text";

// Tour guide: BTS’s Arirang World Tour, every date on one page. A photo
// header with the tour’s numbers and the next show, a bar for how much of
// the tour has been played, then each leg in order with its cities, venues
// and dates. Played shows are marked and carry their reported attendance and
// gross; the next city is highlighted. Then the setlist, what to prepare and
// the questions people ask.

export const Route = createFileRoute("/tour/bts-arirang")({
  head: () => ({
    meta: [
      { title: "BTS: Arirang World Tour dates — OGCW" },
      { name: "description", content: "Every date on BTS’s Arirang World Tour: 88 stadium shows in 34 cities, with venues, the setlist and what to know before you go." },
      { property: "og:title", content: "BTS: Arirang World Tour dates — OGCW" },
      { property: "og:type", content: "article" },
    ],
  }),
  component: TourPage,
});

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(day(iso));
const dateLabel = (iso: string) => fmt(iso, { day: "numeric", month: "short" });
const rangeLabel = (dates: string[]) => `${fmt(dates[0]!, { day: "numeric", month: "long" })}${dates.length > 1 ? ` – ${fmt(dates.at(-1)!, { day: "numeric", month: "long", year: "numeric" })}` : `, ${fmt(dates[0]!, { year: "numeric" })}`}`;

function TourPage() {
  // Today, worked out in the browser, decides what has been played
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  const allDates = TOUR.legs.flatMap((leg) => leg.stops.flatMap((stop) => stop.dates));
  const played = today ? allDates.filter((d) => d < today).length : 0;
  const stops = TOUR.legs.flatMap((leg) => leg.stops);
  const next = today ? stops.find((stop) => stop.dates.at(-1)! >= today) : undefined;
  const daysToNext = today && next ? Math.max(0, Math.round((day(next.dates.find((d) => d >= today)!).getTime() - day(today).getTime()) / 864e5)) : null;
  const status = (stop: TourStop) => (!today ? "upcoming" : stop.dates.at(-1)! < today ? "played" : stop === next ? "next" : "upcoming");

  return (
    <SiteShell>
      <main className="tour">
        <header className="tour-hero" style={{ backgroundImage: `url(${btsStadiumPhoto})` } as CSSProperties}>
          <div className="page-wrap tour-hero-inner">
            <nav className="og-crumbs" aria-label="Breadcrumb">
              <Link to="/music"><T>Music</T></Link>
              <span aria-hidden="true">/</span>
              <span><T>Tour guide</T></span>
            </nav>
            <p className="og-kicker"><T>Tour guide</T></p>
            <h1 className="tour-title"><T>BTS: Arirang World Tour</T></h1>
            <p className="tour-deck"><T>Every date of the biggest tour of BTS’s career:</T> {TOUR.shows} stadium shows, from Goyang in April 2026 to the Philippines in March 2027.</p>
            <dl className="tour-stats">
              <div><dt><T>Shows</T></dt><dd>{TOUR.shows}</dd></div>
              <div><dt><T>Cities</T></dt><dd>{TOUR.cities}</dd></div>
              <div><dt><T>Countries</T></dt><dd>{TOUR.countries}</dd></div>
              <div><dt><T>Dates</T></dt><dd className="tour-stats-range"><T>9 Apr 2026 – 16 Mar 2027</T></dd></div>
            </dl>
            {next && (
              <p className="tour-next">
                <span className="tour-next-label"><T>Next up</T></span>
                <strong>{next.city}, {next.country}</strong>
                <span>{next.dates.map(dateLabel).join(", ")} · {next.venue}</span>
                {daysToNext !== null && <span className="tour-next-count">{daysToNext === 0 ? "Tonight" : `In ${daysToNext} ${daysToNext === 1 ? "day" : "days"}`}</span>}
              </p>
            )}
          </div>
        </header>

        <div className="page-wrap tour-body">
          <div className="tour-progress" aria-label={`${played} of ${allDates.length} shows played`}>
            <div className="tour-progress-bar"><i style={{ width: `${(played / allDates.length) * 100}%` }} /></div>
            <p><strong>{played}</strong> <T>of</T> {allDates.length} shows played</p>
          </div>

          <div className="tour-legs">
            {TOUR.legs.map((leg, legIndex) => (
              <section key={legIndex} className="tour-leg" aria-label={`${leg.name}, ${rangeLabel([leg.stops[0]!.dates[0]!, leg.stops.at(-1)!.dates.at(-1)!])}`}>
                <div className="tour-leg-head">
                  <h2><T>{leg.name}</T></h2>
                  <span>{rangeLabel([leg.stops[0]!.dates[0]!, leg.stops.at(-1)!.dates.at(-1)!])}</span>
                </div>
                <ol className="tour-stops">
                  {leg.stops.map((stop) => {
                    const state = status(stop);
                    return (
                      <li key={stop.city + stop.dates[0]} className="tour-stop" data-state={state}>
                        <div className="tour-dates">
                          {stop.dates.map((d) => (
                            <span key={d} className="tour-date"><b>{fmt(d, { day: "numeric" })}</b>{fmt(d, { month: "short" })}</span>
                          ))}
                        </div>
                        <div className="tour-place">
                          <p className="tour-city"><T>{stop.city}</T><span>{stop.country}</span></p>
                          <p className="tour-venue"><T>{stop.venue}</T></p>
                          {stop.attendance && <p className="tour-numbers">{stop.attendance} fans · {stop.gross}</p>}
                        </div>
                        <span className="tour-state">{state === "played" ? <><Check size={13} strokeWidth={2.5} aria-hidden="true" /> <T>Played</T></> : state === "next" ? "Next up" : "Upcoming"}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>

          <section className="tour-section" aria-labelledby="setlist">
            <h2 id="setlist" className="og-section-title"><T>The setlist</T></h2>
            <p className="tour-copy"><T>From the opening night in Goyang. Two songs from the back catalogue change every night in the encore, straight after “Dynamite”.</T></p>
            <div className="tour-setlist">
              {Object.entries(TOUR.setlist).map(([act, songs]) => (
                <div key={act}>
                  <p className="tour-act">{act}</p>
                  <ol>{songs.map((song) => <li key={song}>{song}</li>)}</ol>
                </div>
              ))}
            </div>
          </section>

          <section className="tour-section tour-two" aria-labelledby="prepare">
            <div>
              <h2 id="prepare" className="og-section-title"><T>Before you go</T></h2>
              <ul className="tour-check">
                {[
                  "Buy only from the official ticket seller for your city, and check the exact date: several cities have non-consecutive nights.",
                  "Arrive early. Queues for these stadium shows start hours before the doors open.",
                  "Check the stadium’s bag policy before you leave home.",
                  "Bring a charged phone and a power bank; mobile networks slow down in a full stadium.",
                  "Plan your journey home before the show, as public transport is packed afterwards.",
                ].map((item) => <li key={item}><Check size={16} strokeWidth={2.5} aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
            </div>
            <div>
              <h2 className="og-section-title"><T>Questions and answers</T></h2>
              <div className="og-faq">
                {[
                  ["How long is the tour?", "From 9 April 2026 in Goyang, South Korea, to 16 March 2027 in the Philippines: 88 shows in 34 cities across 23 countries."],
                  ["What is the stage like?", "A 360-degree stage modelled on a jeongja, a traditional Korean pavilion, inspired by Gyeonghoeru at Gyeongbokgung Palace in Seoul."],
                  ["Which shows have been the biggest?", "The two nights at the Stade de France in Paris drew 185,000 people, and four nights at Allegiant Stadium in Las Vegas grossed $49.5 million, a record for that venue."],
                  ["Where can I buy tickets?", "From the official ticket seller for each city, listed on BTS’s official channels. Be careful with resale sites."],
                ].map(([question, answer], index) => (
                  <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>
                ))}
              </div>
            </div>
          </section>

          <div className="tour-foot">
            <Link to="/news/$slug" params={{ slug: TOUR.story }} className="og-cta"><T>Read our story on the tour</T> <ArrowRight size={16} aria-hidden="true" /></Link>
            <a href={TOUR.source.url} target="_blank" rel="noopener noreferrer" className="tour-source"><T>Source:</T> {TOUR.source.name} <ArrowUpRight size={13} aria-hidden="true" /></a>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
