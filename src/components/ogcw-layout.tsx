import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, Search } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NavDrawer } from "./nav-drawer";
import { SearchOverlay } from "./search-overlay";
import { Footer2 } from "@/components/ui/footer-2";
import { BackgroundGradientGlow } from "@/components/ui/background-gradient-glow";
import { ThemeSwitcher } from "./theme-switcher";
import { HeroSwitcher } from "./hero-switcher";
import { CookieConsent } from "./cookie-consent";
import { AccountButton } from "./account-button";
import { EditSection, T } from "./site-text";
import { SiteMegaPanel, type SiteMenuKey } from "./site-mega-menu";
import { pageSection } from "@/lib/site-sections";

// Header navigation (owner, 20 Oct 2026): News for you, the four desks,
// then Shop, Originals and Forum, and "Discover" (no arrow) for the rest.
// Gaming covers games and the streamers (/streaming lights it up). On the
// News page the header is one compact row (the page has its own masthead):
// the first five beside the menu button, a small OGCW in the middle, the
// other four on the right. Admins can rename any of them (nav.*).
type Tier = "all" | "mid" | "wide";
type NavItem = { label: string; to: "/news" | "/music" | "/games" | "/culture" | "/sports" | "/shop" | "/originals" | "/forum"; tier: Tier; also?: string[] };
const nav: NavItem[] = [
  { label: "News for you", to: "/news", tier: "all" },
  { label: "Music", to: "/music", tier: "all" },
  { label: "Gaming", to: "/games", tier: "all", also: ["/streaming"] },
  { label: "Entertainment", to: "/culture", tier: "all" },
  { label: "Sports", to: "/sports", tier: "all" },
  { label: "Shop", to: "/shop", tier: "all" },
  { label: "Originals", to: "/originals", tier: "all" },
  { label: "Forum", to: "/forum", tier: "all" },
];
/** The pages that live in "Discover" */
const IN_MORE = ["/trends", "/about", "/explore", "/work"];
/** Pages with the compact, one-row header */
const COMPACT = ["/news", "/news/"];

const isCurrent = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);
const isCurrentItem = (pathname: string, item: (typeof nav)[number]) => [item.to, ...(item.also ?? [])].some((to) => isCurrent(pathname, to));

/** The menu panels under the sections (src/components/site-mega-menu.tsx), as
 *  in the shop: pointing at (or focusing) a section opens its panel, leaving
 *  the header closes it after a beat, Esc and any page change close it too */
function useMenuPanel(pathname: string) {
  const [panel, setPanel] = useState<SiteMenuKey | null>(null);
  const closing = useRef(0);
  const openPanel = useCallback((key: SiteMenuKey) => { window.clearTimeout(closing.current); setPanel(key); }, []);
  const closeSoon = useCallback(() => { window.clearTimeout(closing.current); closing.current = window.setTimeout(() => setPanel(null), 140); }, []);
  const keepOpen = useCallback(() => window.clearTimeout(closing.current), []);
  const close = useCallback(() => { window.clearTimeout(closing.current); setPanel(null); }, []);
  useEffect(() => close(), [pathname, close]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel, close]);
  return { panel, openPanel, closeSoon, keepOpen, close };
}

// One menu and one search for the whole site, opened from the header’s
// buttons (and anything else that calls openMenu or openSearch).
const SiteMenuContext = createContext({ menuOpen: false, openMenu: () => {}, openSearch: () => {} });
export const useSiteMenu = () => useContext(SiteMenuContext);

/** The shop is a site of its own: every link into it from the rest of the
 *  site opens it in a new tab (not while an admin is typing in a link). */
function useShopInNewTab(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target || link.origin !== window.location.origin || !/^\/shop(\/|$)/.test(link.pathname)) return;
      if (target?.closest(".site-t.is-active, [contenteditable='true'], [contenteditable='plaintext-only']")) return;
      event.preventDefault();
      event.stopPropagation();
      // A real link with target _blank, so the browser opens a new tab as for any link
      const open = document.createElement("a");
      open.href = link.href;
      open.target = "_blank";
      open.rel = "noopener";
      document.body.appendChild(open);
      open.click();
      open.remove();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled]);
}

/** `header` replaces the site header, menu and search (the shop brings its own) */
export function SiteShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const siteHeader = useRef<HTMLElement>(null);
  useShopInNewTab(!header);
  const { panel, openPanel, closeSoon, keepOpen, close: closePanel } = useMenuPanel(pathname);
  // Trends, About, Explore and the info pages live in Discover
  const moreActive = IN_MORE.some((to) => isCurrent(pathname, to)) || pathname.startsWith("/info/");
  const currentTier = nav.find((item) => isCurrentItem(pathname, item))?.tier;
  const compact = COMPACT.includes(pathname);

  const navLink = (item: NavItem) => {
    const key = item.to.slice(1) as SiteMenuKey;
    return (
      <Link
        key={item.to}
        to={item.to}
        {...(item.to === "/shop" ? { target: "_blank" } : {})}
        className={`nav-link nav-link-tier-${item.tier} ${isCurrentItem(pathname, item) ? "nav-link-active" : ""}`}
        aria-current={isCurrentItem(pathname, item) ? "page" : undefined}
        aria-expanded={panel === key}
        data-open={panel === key || undefined}
        onMouseEnter={() => openPanel(key)}
        onFocus={() => openPanel(key)}
      >
        <T k={`nav.${item.to.slice(1)}`}>{item.label}</T>
      </Link>
    );
  };
  const discover = (
    <button
      type="button"
      className={`nav-link nav-more-button ${moreActive ? "nav-link-active" : ""} ${currentTier && currentTier !== "all" ? `nav-more-${currentTier}-active` : ""}`}
      aria-expanded={panel === "more"}
      data-open={panel === "more" || undefined}
      onMouseEnter={() => openPanel("more")}
      onFocus={() => openPanel("more")}
      onClick={() => (panel === "more" ? closePanel() : openPanel("more"))}
    >
      <T k="nav.more">Discover</T>
    </button>
  );

  // The header starts tall (the logo big in the middle, the sections in a row
  // under it) and shrinks as the page scrolls, until it is the usual slim bar
  // by the first section after the hero (or after 160px on other pages):
  // --hp runs from 0 (tall) to 1 (slim) and the CSS does the rest.
  useEffect(() => {
    const el = siteHeader.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      const hero = [...document.querySelectorAll<HTMLElement>(".impact, .cover, .gallery, .gallery2")].find((item) => item.offsetHeight > 0);
      const distance = hero ? Math.max(120, hero.getBoundingClientRect().bottom + window.scrollY - 56 - 122) : 160;
      const p = Math.min(1, Math.max(0, window.scrollY / distance));
      el.style.setProperty("--hp", p.toFixed(3));
      el.classList.toggle("is-slim", p >= 1);
      // The hero drifts gently out of focus as it leaves: it starts slowly
      // (eased) and only reaches its faint full softness as it scrolls away
      if (hero) {
        const out = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
        hero.style.setProperty("--hero-out", (out * out).toFixed(3));
      }
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [pathname]);

  return (
    <SiteMenuContext.Provider value={{ menuOpen, openMenu, openSearch }}>
      <div className={`site-root min-h-screen bg-background text-foreground${header ? " site-root-shop" : ""}`}>
        {/* The site's background glow, on every page (the shop's too, so its footer looks the same) */}
        <BackgroundGradientGlow />
        {header ?? (<>
        <EditSection name="Navigation bar">
        {/* Holds the header's place: the header itself is fixed and shrinks on scroll */}
        <div className={`site-header-space${compact ? " is-compact" : ""}`} aria-hidden="true" />
        <header ref={siteHeader} className={`site-header fixed inset-x-0 top-0 z-50${compact ? " is-compact" : ""}`} data-menu={panel ?? undefined} onMouseLeave={closeSoon}>
          <div className="site-header-row mx-auto grid max-w-none grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-[4vw]">
            {/* The menu button on the left; the logo starts big in the middle and moves beside it as the header shrinks
                (compact: the logo stays small in the middle, the first five sections sit beside the menu button) */}
            <div className="flex items-center gap-3 justify-self-start">
              <button type="button" className="icon-button grid" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
                <Menu size={18} />
              </button>
              {compact && <nav className="site-nav site-nav-left hidden items-center lg:flex" aria-label="Main navigation">{nav.slice(0, 5).map(navLink)}</nav>}
            </div>
            <Link to="/" className="site-logo" aria-label="OGCW home" data-site-logo="">OGCW</Link>
            {!compact && (
              <nav className="site-nav hidden items-center lg:flex" aria-label="Main navigation">
                {nav.map(navLink)}
                {discover}
              </nav>
            )}
            <div className="col-start-3 flex items-center gap-2 justify-self-end">
              {compact && <nav className="site-nav site-nav-right hidden items-center lg:flex" aria-label="More navigation">{nav.slice(5).map(navLink)}{discover}</nav>}
              {pathname === "/" && <HeroSwitcher />}
              <ThemeSwitcher />
              <button type="button" className="icon-button grid" aria-label="Search" aria-haspopup="dialog" aria-expanded={searchOpen} onClick={openSearch}><Search size={16} /></button>
              <AccountButton />
            </div>
          </div>
          {panel && <div className="smm-wrap" onMouseEnter={keepOpen}><SiteMegaPanel section={panel} onClose={closePanel} /></div>}
        </header>
        {panel && <div className="mm-dim smm-dim" aria-hidden="true" onMouseEnter={closeSoon} onClick={closePanel} />}
        </EditSection>
        </>)}
        {/* Texts on the page itself are filed under the page, unless a part says otherwise */}
        <EditSection name={pageSection(pathname)}>{children}</EditSection>
        <EditSection name="Footer"><Footer2 /></EditSection>
        {!header && <EditSection name="Menu"><NavDrawer open={menuOpen} onClose={closeMenu} onSearch={openSearch} /></EditSection>}
        {!header && <EditSection name="Search"><SearchOverlay open={searchOpen} onClose={closeSearch} /></EditSection>}
        <EditSection name="Cookie panel"><CookieConsent /></EditSection>
      </div>
    </SiteMenuContext.Provider>
  );
}

/** Page opener: kicker, sentence-case serif title and a short intro. `compact`
 *  for the small info pages, where a poster-size title would dwarf the text. */
export function PageIntro({ kicker, title, copy, compact = false, id }: { kicker: string; title: string; copy: string; compact?: boolean; id?: string }) {
  // Editable by admins, named after the page (or `id`): "intro.about.title"…
  const key = `intro.${id ?? kicker.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return (
    <section className={`page-wrap page-intro ${compact ? "page-intro-compact" : ""}`}>
      <p className="section-kicker"><T k={`${key}.kicker`}>{kicker}</T></p>
      <div className="page-intro-grid">
        <h1 className="page-intro-title"><T k={`${key}.title`}>{title}</T></h1>
        <p className="page-intro-copy"><T k={`${key}.copy`}>{copy}</T></p>
      </div>
    </section>
  );
}

export function StoryLink({ to = "/news", children }: { to?: "/news" | "/trends" | "/blog" | "/about"; children: ReactNode }) {
  return <Link to={to} className="story-cta">{children}<ArrowRight size={16} /></Link>;
}
