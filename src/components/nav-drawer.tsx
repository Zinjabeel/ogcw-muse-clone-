import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ARTICLES, articlesIn, EPISODES, EVENTS, LISTS, SHOPS, type Article, type Episode, type Photo, type Shop, type UpcomingEvent } from "@/data/content";
import { SOCIALS, SocialIcon } from "./socials";

// Site menu: "The OGCW Index", a full-screen contents page that drops down
// over the site. Each section is a numbered line in large serif type with
// what is in it; pointing at one (or tabbing or arrowing to it) shows its
// latest stories on the right, and the whole screen takes that section's
// colour, as the hero does. Along the bottom: the next few upcoming events,
// the smaller pages and OGCW's socials. On phones the list stands alone,
// each line with its latest headline under it.

type Item = { kind: "article"; a: Article } | { kind: "episode"; e: Episode } | { kind: "shop"; s: Shop };
type SectionPath = "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/originals" | "/shop" | "/trends" | "/blog" | "/about";
type Section = { label: string; to: SectionPath; note: string; heading: string; tone: string; items: Item[] };

const stories = (list: Article[]): Item[] => list.map((a) => ({ kind: "article", a }));
const longReads = [...ARTICLES].sort((a, b) => parseInt(b.read, 10) - parseInt(a.read, 10));

const SECTIONS: Section[] = [
  { label: "News", to: "/news", note: `${ARTICLES.length} stories`, heading: "Latest", tone: "#6f8499", items: stories(ARTICLES.slice(0, 4)) },
  { label: "Music", to: "/music", note: `${articlesIn("music").length} stories`, heading: "Latest in Music", tone: "#6e3320", items: stories(articlesIn("music").slice(0, 4)) },
  { label: "Games", to: "/games", note: `${articlesIn("games").length} stories`, heading: "Latest in Games", tone: "#4f7f96", items: stories(articlesIn("games").slice(0, 4)) },
  { label: "Streaming", to: "/streaming", note: `${articlesIn("streaming").length} stories`, heading: "Latest in Streaming", tone: "#5a4a8a", items: stories(articlesIn("streaming").slice(0, 4)) },
  { label: "Culture", to: "/culture", note: `${articlesIn("culture").length} stories`, heading: "Latest in Culture", tone: "#6b3a3a", items: stories(articlesIn("culture").slice(0, 4)) },
  { label: "Originals", to: "/originals", note: `${EPISODES.length} episodes`, heading: "New episodes", tone: "#7b6f5a", items: EPISODES.slice(0, 4).map((e) => ({ kind: "episode", e })) },
  { label: "Shop", to: "/shop", note: `${SHOPS.length} shops`, heading: "The shops", tone: "#a91728", items: SHOPS.slice(0, 4).map((s) => ({ kind: "shop", s })) },
  { label: "Trends", to: "/trends", note: "The report", heading: "Trending now", tone: "#3f6b5a", items: stories(LISTS.trending.slice(0, 4)) },
  { label: "Blog", to: "/blog", note: "Long reads", heading: "The longest reads", tone: "#7a5a3c", items: stories(longReads.slice(0, 4)) },
  { label: "About", to: "/about", note: "Who we are", heading: "Editors’ picks", tone: "#8c5e4a", items: stories(LISTS.editorsPicks.slice(0, 4)) },
];

const PAGES = [
  { label: "Explore", to: "/explore" },
  { label: "FAQ", info: "faq" },
  { label: "Help", info: "help" },
  { label: "Press", info: "press" },
  { label: "Brand", info: "brand" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const itemKey = (item: Item) => (item.kind === "article" ? item.a.slug : item.kind === "episode" ? item.e.slug : item.s.slug);
const itemPhoto = (item: Item) => (item.kind === "article" ? item.a.photo : item.kind === "episode" ? item.e.still : item.s.hero);
const itemTitle = (item: Item) => (item.kind === "article" ? item.a.title : item.kind === "episode" ? item.e.title : `Shop ${item.s.name}`);
const itemSub = (item: Item) => (item.kind === "article" ? `${item.a.kicker} · ${item.a.read}` : item.kind === "episode" ? `${item.e.series} · ${item.e.length}` : item.s.tagline);
const eventDay = (iso: string) => new Date(iso).getUTCDate();
const eventMonth = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(iso));

export function Thumb({ photo }: { photo: Photo }) {
  const crop = photo.crop ?? { pos: "50% 50%" };
  return (
    <span className="drawer-thumb">
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom ?? 1), ["--origin" as string]: crop.pos }}
      />
    </span>
  );
}

function ItemLink({ item, className, onGo, children }: { item: Item; className: string; onGo: () => void; children: ReactNode }) {
  if (item.kind === "article") return <Link to="/news/$slug" params={{ slug: item.a.slug }} className={className} onClick={onGo}>{children}</Link>;
  if (item.kind === "episode") return <Link to="/originals/$slug" params={{ slug: item.e.slug }} className={className} onClick={onGo}>{children}</Link>;
  return <Link to="/shop/$slug" params={{ slug: item.s.slug }} className={className} onClick={onGo}>{children}</Link>;
}

function EventLink({ event, onGo }: { event: UpcomingEvent; onGo: () => void }) {
  const inner = (
    <>
      <span className="ix-ev-date"><b>{eventDay(event.date)}</b>{eventMonth(event.date)}</span>
      <span className="ix-ev-text">
        <span className="ix-ev-cat">{event.category}</span>
        <span className="ix-ev-title">{event.title}</span>
      </span>
    </>
  );
  return event.slug
    ? <Link to="/news/$slug" params={{ slug: event.slug }} className="ix-ev" onClick={onGo}>{inner}</Link>
    : <div className="ix-ev">{inner}</div>;
}

export function NavDrawer({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [preview, setPreview] = useState(0);
  const [today, setToday] = useState<{ iso: string; label: string } | null>(null);
  // The line for the page you’re on is marked, and previewed first
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentIndex = SECTIONS.findIndex((s) => pathname === s.to || pathname.startsWith(`${s.to}/`));

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setPreview(Math.max(currentIndex, 0));
      const now = new Date();
      setToday({ iso: now.toISOString().slice(0, 10), label: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now) });
      el.showModal();
    }
  }, [open, currentIndex]);

  // Listen for the native close event so every way of closing reports back.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);

  const close = (then?: () => void) => {
    const el = dialog.current;
    if (!el || closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      el.close();
      setClosing(false);
      then?.();
    };
    if (reduce) return finish();
    setClosing(true);
    window.setTimeout(finish, 280);
  };
  const go = () => close();

  // Up and down arrows move through the index
  const onListKey = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>(".ix-row")];
    const at = rows.indexOf(document.activeElement as HTMLAnchorElement);
    const next = rows[(at + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length];
    event.preventDefault();
    next?.focus();
  };

  const upcoming = today ? EVENTS.filter((event) => (event.end ?? event.date) >= today.iso).slice(0, 3) : [];

  return (
    <dialog
      ref={dialog}
      className="ix"
      aria-label="Menu"
      data-closing={closing ? "" : undefined}
      style={{ "--tone": SECTIONS[preview]!.tone } as CSSProperties}
      onCancel={(event) => { event.preventDefault(); close(); }}
    >
      {/* The ambient light: the previewed section's lead photo, blurred */}
      <div className="ix-glow" aria-hidden="true">
        {SECTIONS.map((section, index) => {
          const lead = section.items[0];
          return lead ? <img key={section.label} src={itemPhoto(lead).src} alt="" className={index === preview ? "is-on" : undefined} /> : null;
        })}
      </div>

      <div className="ix-inner">
        {/* The close button sits exactly where the menu button was */}
        <div className="ix-top">
          <div className="ix-brand">
            <button type="button" className="ix-close" aria-label="Close menu" onClick={go}>
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <Link to="/" className="ix-logo" aria-label="OGCW home" onClick={go}>OGCW</Link>
          </div>
          <p className="ix-dateline">
            <span>The Index</span>
            {today && <span className="ix-today">{today.label}</span>}
          </p>
          <button type="button" className="ix-search" onClick={() => close(onSearch)}>
            <Search size={15} strokeWidth={1.75} aria-hidden="true" /> <span>Search</span>
          </button>
        </div>

        <div className="ix-body">
          <nav className="ix-nav" aria-label="Sections">
            <ol className="ix-list" onKeyDown={onListKey}>
              {SECTIONS.map((section, index) => {
                const lead = section.items[0];
                return (
                  <li key={section.label} style={{ "--i": index } as CSSProperties}>
                    <Link
                      to={section.to}
                      className="ix-row"
                      data-on={index === preview}
                      aria-current={index === currentIndex ? "page" : undefined}
                      onPointerEnter={(event) => { if (event.pointerType === "mouse") setPreview(index); }}
                      onFocus={() => setPreview(index)}
                      onClick={go}
                    >
                      <span className="ix-num">{pad(index + 1)}</span>
                      <span className="ix-name"><span>{section.label}</span></span>
                      <span className="ix-note">{section.note}</span>
                      {lead && <span className="ix-latest">{section.to === "/shop" ? SHOPS.map((s) => s.name).join(", ") : itemTitle(lead)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* What is in the section under the pointer */}
          <div className="ix-preview">
            {SECTIONS.map((section, index) => {
              const on = index === preview;
              const [lead, ...rest] = section.items;
              const crop = lead ? itemPhoto(lead).crop : undefined;
              return (
                <section key={section.label} className="ix-card" data-on={on} inert={!on} aria-hidden={on ? undefined : true} aria-label={`${section.heading}: ${section.label}`}>
                  <p className="ix-card-head">
                    <span>{section.heading}</span>
                    <span className="ix-card-num">{pad(index + 1)} / {pad(SECTIONS.length)}</span>
                  </p>
                  {lead && (
                    <ItemLink item={lead} className="ix-lead" onGo={go}>
                      <span className="ix-lead-media">
                        <img src={itemPhoto(lead).src} alt="" loading="lazy" style={{ objectPosition: crop?.pos ?? "50% 50%" }} />
                      </span>
                      <span className="ix-lead-sub">{itemSub(lead)}</span>
                      <span className="ix-lead-title">{itemTitle(lead)}</span>
                    </ItemLink>
                  )}
                  <ol className="ix-more">
                    {rest.slice(0, 3).map((item) => (
                      <li key={itemKey(item)}>
                        <ItemLink item={item} className="ix-more-link" onGo={go}>
                          <span className="ix-more-title">{itemTitle(item)}</span>
                          <span className="ix-more-sub">{itemSub(item)}</span>
                        </ItemLink>
                      </li>
                    ))}
                  </ol>
                  <Link to={section.to} className="ix-all" onClick={go}>
                    Go to {section.label} <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </section>
              );
            })}
          </div>
        </div>

        <div className="ix-foot">
          <section className="ix-events" aria-labelledby="ix-events-title">
            <p id="ix-events-title" className="ix-foot-head">
              Coming up
              <Link to="/" hash="events-title" className="ix-foot-link" onClick={go}>All events <ArrowRight size={13} strokeWidth={2} aria-hidden="true" /></Link>
            </p>
            <ol>
              {upcoming.map((event) => <li key={event.date + event.title}><EventLink event={event} onGo={go} /></li>)}
            </ol>
          </section>
          <div className="ix-foot-side">
            <nav className="ix-pages" aria-labelledby="ix-pages-title">
              <p id="ix-pages-title" className="ix-foot-head">More from OGCW</p>
              <ul>
                {PAGES.map((page) => (
                  <li key={page.label}>
                    {"to" in page
                      ? <Link to={page.to} onClick={go}>{page.label}</Link>
                      : <Link to="/info/$slug" params={{ slug: page.info }} onClick={go}>{page.label}</Link>}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="ix-social">
              <p className="ix-foot-head">Follow</p>
              <ul>
                {SOCIALS.map((social) => (
                  <li key={social.name}>
                    <a href={social.href} target="_blank" rel="noreferrer" aria-label={`OGCW on ${social.name}`}>
                      <SocialIcon path={social.path} size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
