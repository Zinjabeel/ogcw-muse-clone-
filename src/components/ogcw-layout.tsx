import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, Search } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NavDrawer } from "./nav-drawer";
import { SearchOverlay } from "./search-overlay";
import { Footer2 } from "@/components/ui/footer-2";
import { BackgroundGradientGlow } from "@/components/ui/background-gradient-glow";
import { ThemeSwitcher } from "./theme-switcher";
import { HeroSwitcher } from "./hero-switcher";

// Header navigation. Between 1024 and 1279px there isn't room for all eight,
// so Trends, Blog and About move into "More" (wide: true marks them).
const nav = [
  { label: "News", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Culture", to: "/culture" },
  { label: "Originals", to: "/originals" },
  { label: "Shop", to: "/shop" },
  { label: "Trends", to: "/trends", wide: true },
  { label: "Blog", to: "/blog", wide: true },
  { label: "About", to: "/about", wide: true },
] as const;

const more = [
  { label: "Explore", note: "Search, trending and reading lists", to: "/explore" },
  { label: "Press", note: "News and assets for journalists", info: "press" },
  { label: "Brand", note: "Logo, colours and type", info: "brand" },
  { label: "FAQ", note: "Common questions", info: "faq" },
  { label: "Help", note: "Account, newsletter and contact", info: "help" },
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

  const active = isCurrent(pathname, "/explore") || pathname.startsWith("/info/") || nav.some((item) => "wide" in item && isCurrent(pathname, item.to));

  return (
    <div ref={root} className="nav-more">
      <button type="button" className={`nav-link nav-more-button ${active ? "nav-link-active" : ""}`} aria-expanded={open} aria-controls="nav-more-menu" onClick={() => setOpen((value) => !value)}>
        More <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div id="nav-more-menu" className="nav-more-menu">
          <ul className="nav-more-wide">
            {nav.filter((item) => "wide" in item).map((item) => (
              <li key={item.to}><Link to={item.to} className="nav-more-link">{item.label}</Link></li>
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

// One menu for the whole site, opened from the header's menu button (and
// anything else that calls openMenu).
const SiteMenuContext = createContext({ menuOpen: false, openMenu: () => {} });
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
    <SiteMenuContext.Provider value={{ menuOpen, openMenu }}>
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
                  className={`nav-link ${"wide" in item ? "nav-link-wide" : ""} ${isCurrent(pathname, item.to) ? "nav-link-active" : ""}`}
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
            </div>
          </div>
        </header>
        {children}
        <Footer2 />
        <NavDrawer open={menuOpen} onClose={closeMenu} onSearch={openSearch} />
        <SearchOverlay open={searchOpen} onClose={closeSearch} />
      </div>
    </SiteMenuContext.Provider>
  );
}

export function PageIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return <section className="page-wrap pb-12 pt-14 lg:pb-16 lg:pt-20"><p className="section-kicker">{kicker}</p><div className="mt-5 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end"><h1 className="font-display text-6xl leading-[.9] sm:text-8xl lg:text-9xl">{title}</h1><p className="max-w-lg text-base leading-relaxed text-muted-foreground">{copy}</p></div></section>;
}

export function StoryLink({ to = "/news", children }: { to?: "/news" | "/trends" | "/blog" | "/about"; children: ReactNode }) {
  return <Link to={to} className="story-cta">{children}<ArrowRight size={16} /></Link>;
}
