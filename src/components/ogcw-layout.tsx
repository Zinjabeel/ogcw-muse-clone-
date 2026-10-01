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

// Header navigation. The sections always show; Originals and Shop join them
// from 1280px ("mid"), Trends, Blog and About from 1680px ("wide"). Below
// those widths they sit in "More".
type Tier = "all" | "mid" | "wide";
const nav: { label: string; to: "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/originals" | "/shop" | "/trends" | "/blog" | "/about"; tier: Tier }[] = [
  { label: "News", to: "/news", tier: "all" },
  { label: "Music", to: "/music", tier: "all" },
  { label: "Games", to: "/games", tier: "all" },
  { label: "Streaming", to: "/streaming", tier: "all" },
  { label: "Culture", to: "/culture", tier: "all" },
  { label: "Originals", to: "/originals", tier: "mid" },
  { label: "Shop", to: "/shop", tier: "mid" },
  { label: "Trends", to: "/trends", tier: "wide" },
  { label: "Blog", to: "/blog", tier: "wide" },
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
        More <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div id="nav-more-menu" className="nav-more-menu">
          <ul className="nav-more-wide">
            {nav.filter((item) => item.tier !== "all").map((item) => (
              <li key={item.to} className={`nav-more-tier-${item.tier}`}><Link to={item.to} className="nav-more-link">{item.label}</Link></li>
            ))}
          </ul>
          <ul>
            {more.map((item) => (
              <li key={item.label}>
                {"to" in item ? (
                  <Link to={item.to} className="nav-more-link">{item.label}<span>{item.note}</span></Link>
                ) : (
                  <Link to="/info/$slug" params={{ slug: item.info }} className="nav-more-link">{item.label}<span>{item.note}</span></Link>
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

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <SiteMenuContext.Provider value={{ menuOpen, openMenu, openSearch }}>
      <div className="site-root min-h-screen bg-background text-foreground">
        <BackgroundGradientGlow />
        <header className="site-header sticky top-0 z-50">
          <div className="mx-auto grid h-14 max-w-none grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-[4vw]">
            {/* Menu button sits with the logo on the left */}
            <div className="flex items-center gap-3 justify-self-start">
              <button type="button" className="icon-button grid" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
                <Menu size={18} />
              </button>
              <Link to="/" className="site-logo" aria-label="OGCW home">OGCW</Link>
            </div>
            <nav className="site-nav hidden items-center lg:flex" aria-label="Main navigation">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-link nav-link-tier-${item.tier} ${isCurrent(pathname, item.to) ? "nav-link-active" : ""}`}
                  aria-current={isCurrent(pathname, item.to) ? "page" : undefined}
                >
                  {item.label}
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
        {children}
        <Footer2 />
        <NavDrawer open={menuOpen} onClose={closeMenu} onSearch={openSearch} />
        <SearchOverlay open={searchOpen} onClose={closeSearch} />
        <CookieConsent />
      </div>
    </SiteMenuContext.Provider>
  );
}

/** Page opener: kicker, sentence-case serif title and a short intro. `compact`
 *  for the small info pages, where a poster-size title would dwarf the text. */
export function PageIntro({ kicker, title, copy, compact = false }: { kicker: string; title: string; copy: string; compact?: boolean }) {
  return (
    <section className={`page-wrap page-intro ${compact ? "page-intro-compact" : ""}`}>
      <p className="section-kicker">{kicker}</p>
      <div className="page-intro-grid">
        <h1 className="page-intro-title">{title}</h1>
        <p className="page-intro-copy">{copy}</p>
      </div>
    </section>
  );
}

export function StoryLink({ to = "/news", children }: { to?: "/news" | "/trends" | "/blog" | "/about"; children: ReactNode }) {
  return <Link to={to} className="story-cta">{children}<ArrowRight size={16} /></Link>;
}
