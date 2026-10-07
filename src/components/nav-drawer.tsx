import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { EPISODES, EVENTS, SECTIONS, SHOPS, type Article, type Episode, type Photo, type SectionId, type Shop, type UpcomingEvent } from "@/data/content";
import { useStories, type Stories } from "@/lib/stories";
import { SOCIALS, SocialIcon } from "./socials";
import { openConsent } from "@/lib/consent";
import { S, T } from "./site-text";

// Site menu: "The OGCW Index", a full-screen contents page that drops down
// over the site. Each section is a numbered line in large serif type with
// what is in it; pointing at one (or tabbing or arrowing to it) shows its
// latest stories on the right, and the whole screen takes that section's
// colour, as the hero does. Along the bottom: the next few upcoming events,
// the smaller pages and OGCW's socials. On phones the list stands alone,
// each line with its latest headline under it.

type Item = { kind: "article"; a: Article } | { kind: "episode"; e: Episode } | { kind: "shop"; s: Shop };
type SectionPath = "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/sports" | "/originals" | "/shop" | "/trends" | "/blog" | "/about";
type Section = { label: string; to: SectionPath; note: string; heading: string; tone: string; items: Item[] };

const asItems = (list: Article[]): Item[] => list.map((a) => ({ kind: "article", a }));

// The menu's lines, with the live stories from the studio
function buildSections(stories: Stories): Section[] {
  const longReads = [...stories.all].sort((a, b) => b.words - a.words);
  const section = (id: SectionId) => stories.inSection(id);
  return [
    { label: "News", to: "/news", note: `${stories.all.length} stories`, heading: "Latest", tone: "#6f8499", items: asItems(stories.all.slice(0, 4)) },
    { label: "Music", to: "/music", note: `${section("music").length} stories`, heading: "Latest in Music", tone: "#6e3320", items: asItems(section("music").slice(0, 4)) },
    { label: "Games", to: "/games", note: `${section("games").length} stories`, heading: "Latest in Games", tone: "#4f7f96", items: asItems(section("games").slice(0, 4)) },
    { label: "Streaming", to: "/streaming", note: `${section("streaming").length} stories`, heading: "Latest in Streaming", tone: "#5a4a8a", items: asItems(section("streaming").slice(0, 4)) },
    { label: "Culture", to: "/culture", note: `${section("culture").length} stories`, heading: "Latest in Culture", tone: "#6b3a3a", items: asItems(section("culture").slice(0, 4)) },
    { label: "Sports", to: "/sports", note: `${section("sports").length} stories`, heading: "Latest in Sports", tone: "#2f5d46", items: asItems(section("sports").slice(0, 4)) },
    { label: "Originals", to: "/originals", note: `${EPISODES.length} episodes`, heading: "New episodes", tone: "#7b6f5a", items: EPISODES.slice(0, 4).map((e) => ({ kind: "episode", e })) },
    { label: "Shop", to: "/shop", note: `${SHOPS.length} shops`, heading: "The shops", tone: "#a91728", items: SHOPS.slice(0, 4).map((s) => ({ kind: "shop", s })) },
    { label: "Trends", to: "/trends", note: "The report", heading: "Trending now", tone: "#3f6b5a", items: asItems(stories.trending.slice(0, 4)) },
    { label: "Blog", to: "/blog", note: "Long reads", heading: "The longest reads", tone: "#7a5a3c", items: asItems(longReads.slice(0, 4)) },
    { label: "About", to: "/about", note: "Who we are", heading: "Editors’ picks", tone: "#8c5e4a", items: asItems(stories.editorsPicks.slice(0, 4)) },
  ];
}

const PAGES = [
  { label: "About", to: "/about" },
  { label: "FAQ", info: "faq" },
  { label: "Help", info: "help" },
  { label: "Contact", info: "contact" },
  { label: "Explore", to: "/explore" },
] as const;
const LEGAL = [
  { label: "Terms", info: "terms" },
  { label: "Privacy", info: "privacy" },
  { label: "Cookies", info: "cookies" },
  { label: "Legal notice", info: "legal" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const itemKey = (item: Item) => (item.kind === "article" ? item.a.slug : item.kind === "episode" ? item.e.slug : item.s.slug);
const itemPhoto = (item: Item) => (item.kind === "article" ? item.a.photo : item.kind === "episode" ? item.e.still : item.s.hero);
const itemTitle = (item: Item) => (item.kind === "article" ? item.a.title : item.kind === "episode" ? item.e.title : `Shop ${item.s.name}`);
/** An item's title on the page: a story's headline can be changed there by an admin */
const ItemTitle = ({ item }: { item: Item }) => (item.kind === "article" ? <S story={item.a} f="title" /> : <T>{itemTitle(item)}</T>);
const itemSub = (item: Item) => (item.kind === "article" ? `${item.a.kicker} · ${SECTIONS[item.a.section].label}` : item.kind === "episode" ? `${item.e.series} · ${item.e.length}` : item.s.tagline);
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
        <span className="ix-ev-cat"><T>{event.category}</T></span>
        <span className="ix-ev-title"><T>{event.title}</T></span>
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
  const stories = useStories();
  const SECTIONS = useMemo(() => buildSections(stories), [stories]);
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
            <Link to="/" className="ix-logo" aria-label="OGCW home" onClick={go}><T>OGCW</T></Link>
          </div>
          <p className="ix-dateline">
            <span><T k="ix.index">The Index</T></span>
            {today && <span className="ix-today">{today.label}</span>}
          </p>
          <button type="button" className="ix-search" onClick={() => close(onSearch)}>
            <Search size={15} strokeWidth={1.75} aria-hidden="true" /> <span><T k="ix.search">Search</T></span>
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
                      <span className="ix-name"><span><T k={`nav.${section.to.slice(1)}`}>{section.label}</T></span></span>
                      <span className="ix-note">{section.note}</span>
                      {lead && <span className="ix-latest">{section.to === "/shop" ? SHOPS.map((s) => s.name).join(", ") : <ItemTitle item={lead} />}</span>}
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
                    <span><T k={`ix.${section.to.slice(1)}.heading`}>{section.heading}</T></span>
                    <span className="ix-card-num">{pad(index + 1)} / {pad(SECTIONS.length)}</span>
                  </p>
                  {lead && (
                    <ItemLink item={lead} className="ix-lead" onGo={go}>
                      <span className="ix-lead-media">
                        <img src={itemPhoto(lead).src} alt="" loading="lazy" style={{ objectPosition: crop?.pos ?? "50% 50%" }} />
                      </span>
                      <span className="ix-lead-sub">{itemSub(lead)}</span>
                      <span className="ix-lead-title"><ItemTitle item={lead} /></span>
                    </ItemLink>
                  )}
                  <ol className="ix-more">
                    {rest.slice(0, 3).map((item) => (
                      <li key={itemKey(item)}>
                        <ItemLink item={item} className="ix-more-link" onGo={go}>
                          <span className="ix-more-title"><ItemTitle item={item} /></span>
                          <span className="ix-more-sub">{itemSub(item)}</span>
                        </ItemLink>
                      </li>
                    ))}
                  </ol>
                  <Link to={section.to} className="ix-all" onClick={go}>
                    <T k="ix.go">Go to</T> <T k={`nav.${section.to.slice(1)}`}>{section.label}</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </section>
              );
            })}
          </div>
        </div>

        <div className="ix-foot">
          <section className="ix-events" aria-labelledby="ix-events-title">
            <p id="ix-events-title" className="ix-foot-head">
              <T k="ix.coming">Coming up</T>
            </p>
            <ol>
              {upcoming.map((event) => <li key={event.date + event.title}><EventLink event={event} onGo={go} /></li>)}
            </ol>
          </section>
          <div className="ix-foot-side">
            <nav className="ix-pages" aria-labelledby="ix-pages-title">
              <p id="ix-pages-title" className="ix-foot-head"><T k="ix.pages">More from OGCW</T></p>
              <ul>
                {PAGES.map((page) => (
                  <li key={page.label}>
                    {"to" in page
                      ? <Link to={page.to} onClick={go}><T k={`nav.${page.to.slice(1)}`}>{page.label}</T></Link>
                      : <Link to="/info/$slug" params={{ slug: page.info }} onClick={go}><T k={`more.${page.info}`}>{page.label}</T></Link>}
                  </li>
                ))}
              </ul>
            </nav>
            <nav className="ix-pages" aria-labelledby="ix-legal-title">
              <p id="ix-legal-title" className="ix-foot-head"><T k="ix.legal">Legal</T></p>
              <ul>
                {LEGAL.map((page) => (
                  <li key={page.label}><Link to="/info/$slug" params={{ slug: page.info }} onClick={go}><T k={`more.${page.info}`}>{page.label}</T></Link></li>
                ))}
                <li><button type="button" className="ix-text-button" onClick={() => close(openConsent)}><T k="ix.cookies">Cookie settings</T></button></li>
              </ul>
            </nav>
            <div className="ix-social">
              <p className="ix-foot-head"><T k="ix.follow">Follow</T></p>
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
