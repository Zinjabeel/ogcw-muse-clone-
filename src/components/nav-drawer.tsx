import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { EPISODES, SHOPS, type Article, type Episode, type Photo, type SectionId, type Shop } from "@/data/content";
import { useStories, type Stories } from "@/lib/stories";
import { SOCIALS, SocialIcon } from "./socials";
import { openConsent } from "@/lib/consent";
import { S, T } from "./site-text";

// The site menu (owner, 18 Oct 2026: "make it look simpler… I love the
// transparent effect, keep it but more professional"; nothing may look
// faded). One sheet of dark glass over the page: the close button where the
// menu button was, OGCW in the middle and Search on the right; the sections
// in one clean list of white serif names (the one under the pointer turns
// gold); on computers a single quiet preview beside it, the section's newest
// story; along the bottom one line of small links and the socials.

type Item = { kind: "article"; a: Article } | { kind: "episode"; e: Episode } | { kind: "shop"; s: Shop };
type SectionPath = "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/sports" | "/originals" | "/shop" | "/trends" | "/forum" | "/about";
type Section = { label: string; to: SectionPath; note: string; heading: string; item: Item | undefined; also?: SectionPath[] };

const article = (a: Article | undefined): Item | undefined => (a ? { kind: "article", a } : undefined);

// The menu's sections, with the header's names (owner, 19 Oct 2026: fewer,
// nothing said twice): the five desks, then the rest of OGCW. Gaming covers
// the games desk and the streamers. Each shows its newest story.
function buildSections(stories: Stories): Section[] {
  const longest = [...stories.all].sort((a, b) => b.words - a.words)[0];
  const first = (id: SectionId) => stories.inSection(id)[0];
  const count = (n: number) => `${n} ${n === 1 ? "story" : "stories"}`;
  const inSection = (id: SectionId) => stories.inSection(id).length;
  const gaming = stories.all.find((a) => a.section === "games" || a.section === "streaming");
  return [
    { label: "Latest", to: "/news", note: count(stories.all.length), heading: "The latest", item: article(stories.all[0]) },
    { label: "Music", to: "/music", note: count(inSection("music")), heading: "Latest in Music", item: article(first("music")) },
    { label: "Gaming", to: "/games", note: count(inSection("games") + inSection("streaming")), heading: "Latest in Gaming", item: article(gaming), also: ["/streaming"] },
    { label: "Culture", to: "/culture", note: count(inSection("culture")), heading: "Latest in Culture", item: article(first("culture")) },
    { label: "Sports", to: "/sports", note: count(inSection("sports")), heading: "Latest in Sports", item: article(first("sports")) },
    { label: "Originals", to: "/originals", note: `${EPISODES.length} episodes`, heading: "New episode", item: EPISODES[0] && { kind: "episode", e: EPISODES[0] } },
    { label: "Forum", to: "/forum", note: "Seven rooms", heading: "The longest read", item: article(longest) },
    { label: "Trends", to: "/trends", note: "The report", heading: "Trending now", item: article(stories.trending[0]) },
    { label: "Shop", to: "/shop", note: `${SHOPS.length} shops`, heading: "The shops", item: SHOPS[0] && { kind: "shop", s: SHOPS[0] } },
    { label: "About", to: "/about", note: "Who we are", heading: "Editors’ pick", item: article(stories.editorsPicks[0]) },
  ];
}

const PAGES = [
  { label: "About", to: "/about" },
  { label: "FAQ", info: "faq" },
  { label: "Help", info: "help" },
  { label: "Contact", info: "contact" },
  { label: "Newsletter", info: "newsletter" },
  { label: "Terms", info: "terms" },
  { label: "Privacy", info: "privacy" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
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

export function NavDrawer({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState(0);
  const stories = useStories();
  const sections = useMemo(() => buildSections(stories), [stories]);
  // The section of the page you're on is marked and previewed first
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentIndex = sections.findIndex((s) => [s.to, ...(s.also ?? [])].some((to) => pathname === to || pathname.startsWith(`${to}/`)));
  const home = Math.max(currentIndex, 0);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setShown(home);
      el.showModal();
      // Focus starts on the sheet itself: the first Tab reaches the close button
      el.querySelector<HTMLElement>(".om-sheet")?.focus({ preventScroll: true });
    }
  }, [open, home]);

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
    window.setTimeout(finish, 260);
  };
  const go = () => close();
  // A click on the glass itself (not on a link or button) closes the menu
  const onGlass = (event: MouseEvent<HTMLDialogElement>) => {
    const target = event.target as HTMLElement;
    if (target === event.currentTarget || target.classList.contains("om-sheet") || target.classList.contains("om-body")) close();
  };

  // Up and down arrows move through the list
  const onListKey = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>(".om-link")];
    const at = rows.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    event.preventDefault();
    rows[(at + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length]?.focus();
  };

  const preview = sections[shown];

  return (
    <dialog ref={dialog} className="om" aria-label="Menu" data-closing={closing ? "" : undefined} onCancel={(event) => { event.preventDefault(); close(); }} onClick={onGlass}>
      <div className="om-sheet" tabIndex={-1}>
        <div className="om-bar">
          <button type="button" className="om-icon" aria-label="Close menu" onClick={go}><X size={19} strokeWidth={1.6} aria-hidden="true" /></button>
          <Link to="/" className="om-logo" aria-label="OGCW home" onClick={go}><T>OGCW</T></Link>
          <button type="button" className="om-search" onClick={() => close(onSearch)}>
            <Search size={16} strokeWidth={1.8} aria-hidden="true" /> <span><T k="ix.search">Search</T></span>
          </button>
        </div>

        <div className="om-body">
          <nav className="om-nav" aria-label="Sections">
            <ol className="om-list" onKeyDown={onListKey} onPointerLeave={() => setShown(home)}>
              {sections.map((section, index) => (
                <li key={section.to} style={{ "--i": index } as CSSProperties}>
                  <Link
                    to={section.to}
                    className="om-link"
                    data-on={index === shown || undefined}
                    aria-current={index === currentIndex ? "page" : undefined}
                    onPointerEnter={(event) => { if (event.pointerType === "mouse") setShown(index); }}
                    onFocus={() => setShown(index)}
                    onClick={go}
                  >
                    <span className="om-no" aria-hidden="true">{pad(index + 1)}</span>
                    <span className="om-name"><T k={`nav.${section.to.slice(1)}`}>{section.label}</T></span>
                    <span className="om-note">{index === currentIndex ? <T k="ix.here">You’re here</T> : section.note}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          {/* One quiet preview (computers): the section's newest story */}
          {preview && (
            <aside className="om-preview" aria-label={`${preview.heading}: ${preview.label}`}>
              <p className="om-preview-head"><T k={`ix.${preview.to.slice(1)}.heading`}>{preview.heading}</T></p>
              {preview.item && (
                <ItemLink item={preview.item} className="om-story" onGo={go} key={preview.to}>
                  <span className="om-story-photo"><img src={itemPhoto(preview.item).src} alt="" style={{ objectPosition: itemPhoto(preview.item).crop?.pos ?? "50% 50%" }} /></span>
                  <span className="om-story-label">{itemLabel(preview.item)}</span>
                  <span className="om-story-title"><ItemTitle item={preview.item} /></span>
                </ItemLink>
              )}
              <Link to={preview.to} className="om-go" onClick={go}>
                <T k="ix.go">Go to</T> <T k={`nav.${preview.to.slice(1)}`}>{preview.label}</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              </Link>
            </aside>
          )}
        </div>

        <div className="om-foot">
          <ul className="om-pages">
            {PAGES.map((page) => (
              <li key={page.label}>
                {"to" in page
                  ? <Link to={page.to} onClick={go}><T k={`nav.${page.to.slice(1)}`}>{page.label}</T></Link>
                  : <Link to="/info/$slug" params={{ slug: page.info }} onClick={go}><T k={`more.${page.info}`}>{page.label}</T></Link>}
              </li>
            ))}
            <li><button type="button" onClick={() => close(openConsent)}><T k="ix.cookies">Cookie settings</T></button></li>
          </ul>
          <ul className="om-social" aria-label="Follow OGCW">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noreferrer" aria-label={`OGCW on ${social.name}`}><SocialIcon path={social.path} size={15} /></a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
