import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { EVENTS, type UpcomingEvent } from "@/data/content";
import { T } from "./site-text";

// Upcoming events: the calendar rail on the news front (in place of the old
// Briefing). What is coming up across music, games, film, fashion and
// streaming, grouped by month; events that have finished drop off. The first
// few show, the rest open with "Show all". An event with a story links to it.

const month = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(iso));
const day = (iso: string) => new Date(iso).getUTCDate();
const weekday = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(iso));

function EventRow({ event }: { event: UpcomingEvent }) {
  const inner = (
    <>
      <span className="ev-date">
        <span className="ev-day">{day(event.date)}{event.end && <span className="ev-to">–{day(event.end)}</span>}</span>
        <span className="ev-weekday">{weekday(event.date)}</span>
      </span>
      <span className="ev-text">
        <span className="ev-cat" data-cat={event.category}><T>{event.category}</T></span>
        <span className="ev-title"><T>{event.title}</T></span>
        <span className="ev-detail"><T>{event.detail}</T></span>
      </span>
    </>
  );
  return event.slug
    ? <Link to="/news/$slug" params={{ slug: event.slug }} className="ev-row ev-link">{inner}</Link>
    : <div className="ev-row">{inner}</div>;
}

export function UpcomingEvents({ show = 8 }: { show?: number }) {
  const [all, setAll] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = EVENTS.filter((event) => (event.end ?? event.date) >= today);
  const visible = all ? upcoming : upcoming.slice(0, show);
  // Group the visible events by month
  const groups: { month: string; events: UpcomingEvent[] }[] = [];
  for (const event of visible) {
    const name = month(event.date);
    const last = groups[groups.length - 1];
    if (last?.month === name) last.events.push(event);
    else groups.push({ month: name, events: [event] });
  }

  return (
    <div className="bs-briefing ev">
      <p id="events-title" className="bs-briefing-head">
        <span><T k="events.title">Upcoming events</T></span>
        <span className="bs-dot" aria-hidden="true" />
      </p>
      <div className="bs-briefing-body">
        <p className="bs-briefing-intro"><T k="events.intro">Releases, shows and big nights across music, games, film, fashion and streaming.</T></p>
        {groups.map((group) => (
          <section key={group.month} className="ev-month" aria-label={group.month}>
            <p className="ev-month-name" aria-hidden="true">{group.month}</p>
            <ol>
              {group.events.map((event) => <li key={event.date + event.title}><EventRow event={event} /></li>)}
            </ol>
          </section>
        ))}
        {upcoming.length > show && (
          <button type="button" className="ev-more" aria-expanded={all} onClick={() => setAll((value) => !value)}>
            {all ? "Show fewer" : `Show all ${upcoming.length} events`}
            <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
