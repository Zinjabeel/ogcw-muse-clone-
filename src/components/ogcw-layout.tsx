import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, Search } from "lucide-react";
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
import { pageSection } from "@/lib/site-sections";

// Header navigation. The sections always show; Originals and Shop join them
// from 1280px ("mid"), Trends, Blog and About from 1680px ("wide"). Below
// those widths they sit in "More".
type Tier = "all" | "mid" | "wide";
const nav: { label: string; to: "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/sports" | "/originals" | "/shop" | "/trends" | "/forum" | "/about"; tier: Tier }[] = [
  { label: "News", to: "/news", tier: "all" },
  { label: "Music", to: "/music", tier: "all" },
  { label: "Games", to: "/games", tier: "all" },
  { label: "Streaming", to: "/streaming", tier: "all" },
  { label: "Culture", to: "/culture", tier: "all" },
  { label: "Sports", to: "/sports", tier: "all" },
  { label: "Originals", to: "/originals", tier: "wide" },
  { label: "Shop", to: "/shop", tier: "mid" },
  { label: "Trends", to: "/trends", tier: "wide" },
  { label: "Forum", to: "/forum", tier: "wide" },
  { label: "About", to: "/about", tier: "wide" },
];

const more = [
  { label: "Explore", note: "Search, trending and reading lists", to: "/explore" },
  { label: "Press", note: "News and assets for journalists", info: "press" },
  { label: "Brand", note: "Logo, colours and type", info: "brand" },
  { label: "FAQ", note: "Common questions", info: "faq" },
  { label: "Help", note: "Newsletter, submissions and contact", info: "help" },
] as const;

const isCurrent = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on navigation, outside click and Esc
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>(".nav-more-button")?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // Explore and the info pages always live in More; the mid and wide links
  // only on narrower screens, so they light More up only there
  const active = isCurrent(pathname, "/explore") || pathname.startsWith("/info/");
  const currentTier = nav.find((item) => isCurrent(pathname, item.to))?.tier;

  return (
    <div ref={root} className="nav-more">
      <button type="button" className={`nav-link nav-more-button ${active ? "nav-link-active" : ""} ${currentTier && currentTier !== "all" ? `nav-more-${currentTier}-active` : ""}`} aria-expanded={open} aria-controls="nav-more-menu" onClick={() => setOpen((value) => !value)}>
        <T k="nav.more">More</T> <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div id="nav-more-menu" className="nav-more-menu">
          <ul className="nav-more-wide">
            {nav.filter((item) => item.tier !== "all").map((item) => (
              <li key={item.to} className={`nav-more-tier-${item.tier}`}><Link to={item.to} {...(item.to === "/shop" ? { target: "_blank" } : {})} className="nav-more-link"><T k={`nav.${item.to.slice(1)}`}>{item.label}</T></Link></li>
            ))}
          </ul>
          <ul>
            {more.map((item) => (
              <li key={item.label}>
                {"to" in item ? (
                  <Link to={item.to} className="nav-more-link"><T k={`more.${item.label.toLowerCase()}`}>{item.label}</T><span><T k={`more.${item.label.toLowerCase()}.note`}>{item.note}</T></span></Link>
                ) : (
                  <Link to="/info/$slug" params={{ slug: item.info }} className="nav-more-link"><T k={`more.${item.info}`}>{item.label}</T><span><T k={`more.${item.info}.note`}>{item.note}</T></span></Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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
      window.open(link.href, "_blank", "noopener");
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
        {header ?? (<>
        <BackgroundGradientGlow />
        <EditSection name="Navigation bar">
        {/* Holds the header's place: the header itself is fixed and shrinks on scroll */}
        <div className="site-header-space" aria-hidden="true" />
        <header ref={siteHeader} className="site-header fixed inset-x-0 top-0 z-50">
          <div className="site-header-row mx-auto grid max-w-none grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-[4vw]">
            {/* The menu button on the left; the logo starts big in the middle and moves beside it as the header shrinks */}
            <div className="flex items-center gap-3 justify-self-start">
              <button type="button" className="icon-button grid" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
                <Menu size={18} />
              </button>
            </div>
            <Link to="/" className="site-logo" aria-label="OGCW home" data-site-logo="">OGCW</Link>
            <nav className="site-nav hidden items-center lg:flex" aria-label="Main navigation">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  {...(item.to === "/shop" ? { target: "_blank" } : {})}
                  className={`nav-link nav-link-tier-${item.tier} ${isCurrent(pathname, item.to) ? "nav-link-active" : ""}`}
                  aria-current={isCurrent(pathname, item.to) ? "page" : undefined}
                >
                  <T k={`nav.${item.to.slice(1)}`}>{item.label}</T>
                </Link>
              ))}
              <MoreMenu pathname={pathname} />
            </nav>
            <div className="col-start-3 flex items-center gap-2 justify-self-end">
              {pathname === "/" && <HeroSwitcher />}
              <ThemeSwitcher />
              <button type="button" className="icon-button grid" aria-label="Search" aria-haspopup="dialog" aria-expanded={searchOpen} onClick={openSearch}><Search size={16} /></button>
              <AccountButton />
            </div>
          </div>
        </header>
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
