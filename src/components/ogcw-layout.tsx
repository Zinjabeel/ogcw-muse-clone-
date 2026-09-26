import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, Search } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { NavDrawer } from "./nav-drawer";
import { SearchOverlay } from "./search-overlay";
import { SOCIALS, SocialIcon } from "./socials";

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
          <div className="mx-auto grid h-14 max-w-none grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-8">
            <Link to="/" className="site-logo justify-self-start" aria-label="OGCW home">OGCW</Link>
            <nav className="hidden items-center gap-[25px] md:flex" aria-label="Main navigation">
              {nav.map((item) => (
                <Link key={item.to} to={item.to} className={`nav-link ${pathname === item.to ? "nav-link-active" : ""}`}>{item.label}</Link>
              ))}
            </nav>
            <div className="col-start-3 flex items-center gap-2 justify-self-end">
              <button type="button" className="icon-button grid" aria-label="Search" aria-haspopup="dialog" aria-expanded={searchOpen} onClick={openSearch}><Search size={16} /></button>
              <button type="button" className="icon-button grid" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>
        {children}
        <footer className="border-t border-border bg-background py-12 text-foreground">
          <div className="mx-auto flex max-w-none flex-col gap-10 px-4 lg:px-8">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div><p className="font-display text-7xl leading-none sm:text-9xl">OGCW</p><p className="mt-3 max-w-md text-sm text-muted-foreground">Independent reporting from the people shaping culture now.</p></div>
              <div className="flex flex-col gap-6 md:items-end">
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-widest">{nav.map((item) => <Link key={item.to} to={item.to} className="transition-colors hover:text-accent">{item.label}</Link>)}</div>
                <nav className="flex items-center gap-3" aria-label="Follow OGCW">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Follow OGCW</span>
                  <ul className="flex gap-1">
                    {SOCIALS.map((social) => (
                      <li key={social.name}>
                        <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`OGCW on ${social.name}`} title={social.name} className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground">
                          <SocialIcon path={social.path} size={15} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"><span>One Great Culture World</span><span>Independent / Worldwide</span></div>
          </div>
        </footer>
        <NavDrawer open={menuOpen} onClose={closeMenu} onSearch={openSearch} />
        <SearchOverlay open={searchOpen} onClose={closeSearch} />
      </div>
    </SiteMenuContext.Provider>
  );
}

export function PageIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return <section className="mx-auto max-w-none px-4 pb-12 pt-14 lg:px-8 lg:pb-16 lg:pt-20"><p className="section-kicker">{kicker}</p><div className="mt-5 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end"><h1 className="font-display text-6xl leading-[.9] sm:text-8xl lg:text-9xl">{title}</h1><p className="max-w-lg text-base leading-relaxed text-muted-foreground">{copy}</p></div></section>;
}

export function StoryLink({ to = "/news", children }: { to?: "/news" | "/trends" | "/blog" | "/about"; children: ReactNode }) {
  return <Link to={to} className="story-cta">{children}<ArrowRight size={16} /></Link>;
}
