import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const nav = [
  { label: "News", to: "/news" as const },
  { label: "Trends", to: "/trends" as const },
  { label: "Blog", to: "/blog" as const },
  { label: "About", to: "/about" as const },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:flex sm:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-10">
            <Link to="/" className="shrink-0 font-display text-[2.6rem] leading-none" aria-label="OGCW home">OGCW</Link>
            <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
              {nav.map((item) => (
                <Link key={item.to} to={item.to} className={`nav-link ${pathname === item.to ? "nav-link-active" : ""}`}>{item.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="icon-button hidden sm:grid" aria-label="Search"><Search size={18} /></button>
            <button className="icon-button md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid border-t border-border bg-background px-4 py-3 md:hidden" aria-label="Mobile navigation">
            {nav.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="border-b border-border py-3 font-display text-2xl">{item.label}</Link>)}
          </nav>
        )}
      </header>
      {children}
      <footer className="border-t border-border bg-foreground py-12 text-background">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="font-display text-7xl leading-none sm:text-9xl">OGCW</p><p className="mt-3 max-w-md text-sm text-background/60">Independent reporting from the people shaping culture now.</p></div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-widest">{nav.map((item) => <Link key={item.to} to={item.to} className="hover:text-accent">{item.label}</Link>)}</div>
          </div>
          <div className="flex items-center justify-between border-t border-background/20 pt-5 text-[10px] font-semibold uppercase tracking-widest text-background/50"><span>OG Culture World</span><span>Independent / Worldwide</span></div>
        </div>
      </footer>
    </div>
  );
}

export function PageIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return <section className="mx-auto max-w-[1440px] px-4 pb-12 pt-14 lg:px-8 lg:pb-16 lg:pt-20"><p className="section-kicker">{kicker}</p><div className="mt-5 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end"><h1 className="font-display text-6xl leading-[.9] sm:text-8xl lg:text-9xl">{title}</h1><p className="max-w-lg text-base leading-relaxed text-muted-foreground">{copy}</p></div></section>;
}

export function StoryLink({ to = "/news", children }: { to?: "/news" | "/trends" | "/blog" | "/about"; children: ReactNode }) {
  return <Link to={to} className="story-cta">{children}<ArrowRight size={16} /></Link>;
}
