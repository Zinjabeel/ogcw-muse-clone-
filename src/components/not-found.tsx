import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Arcade } from "./not-found-arcade";
import { EditSection, T } from "./site-text";

// 404 (owner, 15 Oct 2026, from a pasted spec): one full-screen black page
// with its own bold gold-and-white nav, a giant "404" (white 4s, a yellow 0)
// stretched to the screen height with a black oval in the 0, the arcade in the
// middle (one game at a time in a glass card: Snake, Dino Jump, Brick Breaker,
// Sky Hop; src/components/not-found-arcade.tsx) and "Back to Home" at the foot.
// The owner swapped the spec's orange for this, and its fox video for the games. The spec's brand ("TinyTrails") is
// OGCW here, and its nav links go to the site's own sections. The shop shows
// this page to everyone but the admin.

const LINKS = [
  { label: "News for you", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Gaming", to: "/games" },
  { label: "Entertainment", to: "/culture" },
  { label: "Sports", to: "/sports" },
] as const;
const MENU = [...LINKS, { label: "Streaming", to: "/streaming" }, { label: "About", to: "/about" }] as const;

const GOLD = "#F4B921";
const YELLOW = "#FFE600";

// useLayoutEffect warns on the server; the scale is only measured in the browser
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function Logo() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3].map((dot) => <span key={dot} className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: GOLD }} />)}
      </span>
      <span className="ml-1 text-xl font-black tracking-tight sm:text-2xl" style={{ color: "#FFFFFF" }}>OGCW</span>
    </span>
  );
}

export function NotFoundPage() {
  const text = useRef<HTMLSpanElement>(null);
  const [scaleY, setScaleY] = useState(1);
  const [open, setOpen] = useState(false);

  // The "404" fills the screen's height: the window height over the text's own
  useIsoLayoutEffect(() => {
    const measure = () => {
      const height = text.current?.offsetHeight;
      if (height) setScaleY(window.innerHeight / height);
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const before = document.title;
    document.title = "404 - Page Not Found";
    return () => { document.title = before; };
  }, []);

  // The open menu locks the page and closes on Escape
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <EditSection name="Error page">
      <div className="relative flex h-screen w-full flex-col overflow-hidden font-[Inter,sans-serif] antialiased" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 42%, #1b1b1b 0%, #070707 70%)" }}>
        {/* The giant 404 and the oval over it, fading out towards the foot */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ opacity: 0.6, maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)", WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 95%)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              ref={text}
              className="whitespace-nowrap font-black leading-none tracking-tighter"
              style={{ color: "#FFFFFF", fontSize: "clamp(200px, 48vw, 800px)", transform: `scale(1.15, ${scaleY * 1.4})` }}
            >
              4<span style={{ color: YELLOW }}>0</span>4
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[22vh] rounded-full sm:h-[26vh] md:h-[50vh]" style={{ background: "#070707", width: "clamp(120px, 20vw, 400px)", transform: `scaleY(${scaleY})`, transformOrigin: "center" }} />
          </div>
        </div>

        <nav className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-12" aria-label="Main">
          <Link to="/" aria-label="OGCW, back to the front page"><Logo /></Link>
          <div className="hidden gap-1 md:flex">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="rounded-full px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.08em] text-black shadow-[0_4px_0_#9C7F02] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_5px_0_#9a9a9a]" style={{ background: GOLD }}>
                {link.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="nf-menu"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-black shadow-[0_4px_0_#9a9a9a] transition hover:-translate-y-0.5 hover:bg-[#F4B921] hover:shadow-[0_5px_0_#9C7F02] sm:px-5"
          >
            <Menu className="h-4 w-4" strokeWidth={2.75} aria-hidden="true" />
            <span className="hidden text-[13px] font-black uppercase tracking-[0.08em] sm:inline">Menu</span>
          </button>
        </nav>

        {/* The arcade, between the nav and the way home */}
        <div className="relative z-20 flex min-h-0 flex-1 items-center justify-center px-4 py-3">
          <Arcade paused={open} />
        </div>

        <main className="relative z-30 flex flex-col items-center px-4 pb-6 text-center sm:pb-10">
          <h1 className="mb-3 text-lg font-bold text-white sm:mb-4 sm:text-xl md:text-2xl"><T k="404.oops">Oops, something went wrong!</T></h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.06em] text-black shadow-[0_5px_0_#9C7F02] transition-all hover:scale-105 hover:bg-white hover:shadow-[0_5px_0_#9a9a9a] sm:px-8 sm:py-4"
            style={{ background: GOLD }}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <T k="404.home">Back to Home</T>
          </Link>
        </main>

        {/* The menu: a panel sliding in from the right over a blurred backdrop */}
        <div
          id="nf-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          aria-hidden={!open}
          inert={!open}
          className={`fixed inset-0 z-50 transition-[visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "visible" : "invisible"}`}
        >
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 top-0 h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[380px] ${open ? "translate-x-0" : "translate-x-full"}`}
            style={{ background: "linear-gradient(135deg, #0d0d0d 0%, #1f1f1f 100%)" }}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close the menu">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ul className="flex flex-col gap-2 px-6 pt-4">
              {MENU.map((item, index) => (
                <li
                  key={item.to}
                  className={`transition-all duration-300 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                  style={{ transitionDelay: open ? `${150 + index * 60}ms` : "0ms" }}
                >
                  <Link to={item.to} onClick={() => setOpen(false)} className="block rounded-2xl bg-white/[0.06] px-6 py-4 text-lg font-extrabold uppercase tracking-[0.06em] text-white transition-all duration-300 hover:bg-[#F4B921] hover:text-black">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={`absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: open ? "450ms" : "0ms" }}>
              <Link to="/" onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-extrabold uppercase tracking-[0.06em] text-black transition-transform hover:scale-[1.02]" style={{ background: GOLD }}>
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                <T k="404.home">Back to Home</T>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </EditSection>
  );
}
