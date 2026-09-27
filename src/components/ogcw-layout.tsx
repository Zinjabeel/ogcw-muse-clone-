import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, Search } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { NavDrawer } from "./nav-drawer";
import { SearchOverlay } from "./search-overlay";
import { Footer2 } from "@/components/ui/footer-2";

const nav = [
  { label: "News", to: "/news" as const },
  { label: "Trends", to: "/trends" as const },
  { label: "Blog", to: "/blog" as const },
  { label: "About", to: "/about" as const },
] as const;

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
      <div className="min-h-screen bg-background text-foreground">
        <header className="site-header sticky top-0 z-50">
          <div className="mx-auto grid h-14 max-w-none grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-[4vw]">
            {/* Menu button sits with the logo on the left */}
            <div className="flex items-center gap-3 justify-self-start">
              <button type="button" className="icon-button grid" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
                <Menu size={18} />
              </button>
              <Link to="/" className="site-logo" aria-label="OGCW home">OGCW</Link>
            </div>
            <nav className="hidden items-center gap-[25px] md:flex" aria-label="Main navigation">
              {nav.map((item) => (
                <Link key={item.to} to={item.to} className={`nav-link ${pathname === item.to ? "nav-link-active" : ""}`}>{item.label}</Link>
              ))}
            </nav>
            <div className="col-start-3 flex items-center gap-2 justify-self-end">
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
