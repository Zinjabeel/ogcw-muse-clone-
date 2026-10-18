import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { EPISODES, SECTIONS, SHOPS, type Article, type Episode, type Photo, type SectionId, type Shop } from "@/data/content";
import { useStories, type Stories } from "@/lib/stories";
import { SOCIALS, SocialIcon } from "./socials";
import { openConsent } from "@/lib/consent";
import { S, T } from "./site-text";

// The site menu (owner, 18 Oct 2026: "redesign it like the shop but infused
// with the front page"). Built like the shop's menu: a panel that slides in
// from the left over a dimmed page, with numbered sections that open one at
// a time. Dressed like the front page: the masthead (One Great Culture
// World, the date, Certified news), the lead story, gold serif numbers,
// stories set like "In brief" (gold label, serif headline, small photo), and
// the black band at the foot with the newsletter, socials and small pages.
// The section of the page you are on starts open.

type Item = { kind: "article"; a: Article } | { kind: "episode"; e: Episode } | { kind: "shop"; s: Shop };
type SectionPath = "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/sports" | "/originals" | "/shop" | "/trends" | "/forum" | "/about";
type Section = { label: string; to: SectionPath; note: string; items: Item[] };

const asItems = (list: Article[]): Item[] => list.map((a) => ({ kind: "article", a }));

// The menu's sections, with the live stories from the studio
function buildSections(stories: Stories): Section[] {
  const longReads = [...stories.all].sort((a, b) => b.words - a.words);
  const section = (id: SectionId) => stories.inSection(id);
  const count = (n: number) => `${n} ${n === 1 ? "story" : "stories"}`;
  return [
    { label: "News", to: "/news", note: count(stories.all.length), items: asItems(stories.all.slice(0, 3)) },
    { label: "Music", to: "/music", note: count(section("music").length), items: asItems(section("music").slice(0, 3)) },
    { label: "Games", to: "/games", note: count(section("games").length), items: asItems(section("games").slice(0, 3)) },
    { label: "Streaming", to: "/streaming", note: count(section("streaming").length), items: asItems(section("streaming").slice(0, 3)) },
    { label: "Culture", to: "/culture", note: count(section("culture").length), items: asItems(section("culture").slice(0, 3)) },
    { label: "Sports", to: "/sports", note: count(section("sports").length), items: asItems(section("sports").slice(0, 3)) },
    { label: "Originals", to: "/originals", note: `${EPISODES.length} episodes`, items: EPISODES.slice(0, 3).map((e) => ({ kind: "episode", e })) },
    { label: "Shop", to: "/shop", note: `${SHOPS.length} shops`, items: SHOPS.slice(0, 3).map((s) => ({ kind: "shop", s })) },
    { label: "Trends", to: "/trends", note: "The report", items: asItems(stories.trending.slice(0, 3)) },
    { label: "Forum", to: "/forum", note: "Seven rooms", items: asItems(longReads.slice(0, 3)) },
    { label: "About", to: "/about", note: "Who we are", items: asItems(stories.editorsPicks.slice(0, 3)) },
  ];
}

// Quick links under the masthead
const QUICK = [
  { key: "latest", label: "Latest news", to: "/news" },
  { key: "trending", label: "Trending", to: "/trends" },
  { key: "originals", label: "Originals", to: "/originals" },
  { key: "explore", label: "Explore", to: "/explore" },
] as const;
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
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
const itemKey = (item: Item) => (item.kind === "article" ? item.a.slug : item.kind === "episode" ? item.e.slug : item.s.slug);
const itemPhoto = (item: Item) => (item.kind === "article" ? item.a.photo : item.kind === "episode" ? item.e.still : item.s.hero);
const itemTitle = (item: Item) => (item.kind === "article" ? item.a.title : item.kind === "episode" ? item.e.title : `Shop ${item.s.name}`);
/** An item's title on the page: a story's headline can be changed there by an admin */
const ItemTitle = ({ item }: { item: Item }) => (item.kind === "article" ? <S story={item.a} f="title" /> : <T>{itemTitle(item)}</T>);
const itemLabel = (item: Item) => (item.kind === "article" ? `${item.a.kicker} · ${shortDate(item.a.updated ?? item.a.date)}` : item.kind === "episode" ? `${item.e.series} · ${item.e.length}` : item.s.tagline);

/** A small photo (also used by the search screen) */
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

const photoStyle = (photo: Photo): CSSProperties => ({ objectPosition: photo.crop?.pos ?? "50% 50%" });

export function NavDrawer({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const stories = useStories();
  const sections = useMemo(() => buildSections(stories), [stories]);
  // The lead story: the one at the top of the front page
  const lead = stories.slot("front-lead")[0] ?? stories.all[0];
  // The section of the page you're on is marked, and starts open
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentIndex = sections.findIndex((s) => pathname === s.to || pathname.startsWith(`${s.to}/`));

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setOpenKey(currentIndex >= 0 ? sections[currentIndex]!.to : null);
      setToday(new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date()));
      // Focus starts on the panel itself, at the top: the first Tab reaches the
      // close button, and nothing looks pressed when the menu opens
      el.showModal();
      const panel = el.querySelector<HTMLElement>(".om-panel");
      panel?.scrollTo({ top: 0 });
      panel?.focus({ preventScroll: true });
    }
  }, [open, currentIndex, sections]);

  // Every way of closing (Esc, a link, the close button) reports back
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);

  const close = (then?: () => void) => {
    const el = dialog.current;
    if (!el || closing) return;
    const finish = () => {
      el.close();
      setClosing(false);
      then?.();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    setClosing(true);
    window.setTimeout(finish, 300);
  };
  const go = () => close();
  // A click on the dimmed page beside the panel closes the menu
  const onBackdrop = (event: MouseEvent<HTMLDialogElement>) => { if (event.target === event.currentTarget) close(); };

  // Up and down arrows move between the sections
  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const heads = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(".om-head")];
    const at = heads.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    event.preventDefault();
    heads[(at + (event.key === "ArrowDown" ? 1 : -1) + heads.length) % heads.length]?.focus();
  };

  return (
    <dialog ref={dialog} className="om" aria-label="Menu" data-closing={closing ? "" : undefined} onCancel={(event) => { event.preventDefault(); close(); }} onClick={onBackdrop}>
      <div className="om-panel" data-band="light" tabIndex={-1}>
        {/* The close button sits where the menu button was */}
        <div className="om-top">
          <button type="button" className="om-close" aria-label="Close menu" onClick={go}><X size={18} strokeWidth={1.75} aria-hidden="true" /></button>
          <Link to="/" className="om-logo" aria-label="OGCW home" onClick={go}><T>OGCW</T></Link>
          <button type="button" className="om-search" onClick={() => close(onSearch)}>
            <Search size={15} strokeWidth={1.9} aria-hidden="true" /> <span><T k="ix.search">Search</T></span>
          </button>
        </div>

        {/* The front page's masthead, small */}
        <div className="om-mast">
          <p className="om-mast-name"><T k="ix.mast">One Great Culture World</T></p>
          <p className="om-mast-meta">
            <span>{today ?? <T k="ix.updated">Updated daily</T>}</span>
            <span className="om-mast-cert"><BadgeCheck size={13} strokeWidth={2} aria-hidden="true" /><T k="home.news.certified">Certified news</T></span>
          </p>
          <nav className="om-quick" aria-label="Quick links">
            {QUICK.map((link) => <Link key={link.key} to={link.to} onClick={go}><T k={`ix.quick.${link.key}`}>{link.label}</T></Link>)}
          </nav>
        </div>

        {/* The lead story, as on the front page */}
        {lead && (
          <Link to="/news/$slug" params={{ slug: lead.slug }} className="om-lead" onClick={go}>
            <span className="om-lead-photo"><img src={lead.photo.src} alt="" loading="lazy" style={photoStyle(lead.photo)} /></span>
            <span className="om-lead-label"><T k="ix.lead">The lead</T> · <S story={lead} f="kicker" /></span>
            <span className="om-lead-title"><S story={lead} f="title" /></span>
          </Link>
        )}

        {/* The sections, numbered, opening one at a time */}
        <nav className="om-index" aria-labelledby="om-index-title">
          <p id="om-index-title" className="om-index-head"><T k="ix.index">The Index</T></p>
          <ul className="om-acc" onKeyDown={onListKey}>
            {sections.map((section, index) => {
              const on = openKey === section.to;
              const id = `om-${section.to.slice(1)}`;
              return (
                <li key={section.to} className="om-item" data-open={on || undefined} data-here={index === currentIndex || undefined} style={{ "--i": index } as CSSProperties}>
                  <button type="button" className="om-head" aria-expanded={on} aria-controls={id} onClick={() => setOpenKey(on ? null : section.to)}>
                    <span className="om-no" aria-hidden="true">{pad(index + 1)}</span>
                    <span className="om-name"><T k={`nav.${section.to.slice(1)}`}>{section.label}</T></span>
                    <span className="om-note">{index === currentIndex ? <T k="ix.here">You’re here</T> : section.note}</span>
                    <span className="om-plus" aria-hidden="true"><Plus size={16} strokeWidth={1.9} /></span>
                  </button>
                  <div className="om-drop" id={id} role="region" aria-label={section.label}>
                    <div className="om-inner">
                      <ol className="om-brief">
                        {section.items.map((item, n) => (
                          <li key={itemKey(item)}>
                            <ItemLink item={item} className="om-brief-link" onGo={go}>
                              <span className="om-brief-num" aria-hidden="true">{n + 1}</span>
                              <span className="om-brief-text">
                                <span className="om-brief-label">{itemLabel(item)}</span>
                                <span className="om-brief-title"><ItemTitle item={item} /></span>
                              </span>
                              <span className="om-brief-photo"><img src={itemPhoto(item).src} alt="" loading="lazy" style={photoStyle(itemPhoto(item))} /></span>
                            </ItemLink>
                          </li>
                        ))}
                      </ol>
                      <Link to={section.to} className="om-go" onClick={go}>
                        <T k="ix.go">Go to</T> <T k={`nav.${section.to.slice(1)}`}>{section.label}</T> <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* The black band, as at the foot of the front page */}
        <div className="om-foot" data-band="dark">
          <p className="om-foot-kicker"><span className="om-tick" aria-hidden="true" /><T k="connect.newsletter.label">Newsletter</T></p>
          <p className="om-foot-title"><T k="connect.newsletter.title">Stay in the culture.</T></p>
          <Link to="/info/$slug" params={{ slug: "newsletter" }} className="om-foot-btn" onClick={go}>
            <T k="ix.signup">Sign up</T> <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </Link>
          <ul className="om-social" aria-label="Follow OGCW">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noreferrer" aria-label={`OGCW on ${social.name}`}><SocialIcon path={social.path} size={16} /></a>
              </li>
            ))}
          </ul>
          <div className="om-small">
            <nav aria-labelledby="om-pages-title">
              <p id="om-pages-title" className="om-small-head"><T k="ix.pages">More from OGCW</T></p>
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
            <nav aria-labelledby="om-legal-title">
              <p id="om-legal-title" className="om-small-head"><T k="ix.legal">Legal</T></p>
              <ul>
                {LEGAL.map((page) => <li key={page.label}><Link to="/info/$slug" params={{ slug: page.info }} onClick={go}><T k={`more.${page.info}`}>{page.label}</T></Link></li>)}
                <li><button type="button" onClick={() => close(openConsent)}><T k="ix.cookies">Cookie settings</T></button></li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </dialog>
  );
}
