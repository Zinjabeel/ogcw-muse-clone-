import { Link } from "@tanstack/react-router";
import { ChevronDown, Clapperboard, Gamepad2, Music2, Radio, Shirt, type LucideIcon } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { EVENTS, type EventCategory, type UpcomingEvent } from "@/data/content";
import { useStories } from "@/lib/stories";
import { T } from "./site-text";

// Upcoming events: the calendar rail on the news front. What is coming up
// across music, games, film, fashion and streaming, grouped by month; events
// that have finished drop off. Each event is a small card with its own soft
// colour (mixed from the card surface, so it sits quietly in every theme),
// the photo of the story that covers it (or its category's icon), and how
// long there is to go. The first few show, the rest open with "Show all".

const month = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(iso));
const day = (iso: string) => new Date(iso).getUTCDate();
const weekday = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(iso));
const shortMonth = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(iso));

const ICONS: Record<EventCategory, LucideIcon> = { Music: Music2, Games: Gamepad2, Film: Clapperboard, Fashion: Shirt, Streaming: Radio };

// Each card's colour: hues spread round the wheel so neighbours never match
const HUES = [18, 205, 140, 285, 48, 330, 172, 235, 95, 0, 260, 120];

/** "Today", "Tomorrow", "In 5 days", "On now"… (worked out in the browser, on today's date) */
function countdown(event: UpcomingEvent, today: string) {
  const days = Math.round((Date.parse(event.date) - Date.parse(today)) / 86_400_000);
  if (days <= 0) return event.end && event.end > today ? "On now" : "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  return `In ${Math.round(days / 7)} weeks`;
}

function EventRow({ event, index, today }: { event: UpcomingEvent; index: number; today: string | null }) {
  const stories = useStories();
  const story = event.slug ? stories.all.find((item) => item.slug === event.slug) : undefined;
  const Icon = ICONS[event.category];
  const style = { "--ev-hue": HUES[index % HUES.length] } as CSSProperties;
  const inner = (
    <>
      <span className="ev-date" aria-label={`${weekday(event.date)} ${day(event.date)} ${shortMonth(event.date)}`}>
        <span className="ev-weekday" aria-hidden="true">{weekday(event.date)}</span>
        <span className="ev-day" aria-hidden="true">{day(event.date)}{event.end && <span className="ev-to">–{day(event.end)}</span>}</span>
        <span className="ev-mon" aria-hidden="true">{shortMonth(event.date)}</span>
      </span>
      <span className="ev-text">
        <span className="ev-top">
          <span className="ev-cat"><T>{event.category}</T></span>
          {today && <span className="ev-when">{countdown(event, today)}</span>}
        </span>
        <span className="ev-title"><T>{event.title}</T></span>
        <span className="ev-detail"><T>{event.detail}</T></span>
      </span>
      <span className="ev-media" aria-hidden="true">
        {story ? <img src={story.photo.src} alt="" loading="lazy" style={{ objectPosition: story.photo.crop?.pos ?? "50% 40%" }} /> : <Icon size={20} strokeWidth={1.75} />}
      </span>
    </>
  );
  return event.slug
    ? <Link to="/news/$slug" params={{ slug: event.slug }} className="ev-row ev-link" style={style}>{inner}</Link>
    : <div className="ev-row" style={style}>{inner}</div>;
}

export function UpcomingEvents({ show = 8 }: { show?: number }) {
  const [all, setAll] = useState(false);
  // Today's date comes from the browser once the page is open (the server's day may differ)
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  const from = today ?? new Date().toISOString().slice(0, 10);
  const upcoming = EVENTS.filter((event) => (event.end ?? event.date) >= from);
  const visible = all ? upcoming : upcoming.slice(0, show);
  // Group the visible events by month
  const groups: { month: string; events: { event: UpcomingEvent; index: number }[] }[] = [];
  visible.forEach((event, index) => {
    const name = month(event.date);
    const last = groups[groups.length - 1];
    if (last?.month === name) last.events.push({ event, index });
    else groups.push({ month: name, events: [{ event, index }] });
  });

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
            <ol className="ev-list">
              {group.events.map(({ event, index }) => <li key={event.date + event.title}><EventRow event={event} index={index} today={today} /></li>)}
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
