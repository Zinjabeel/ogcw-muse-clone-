import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditSection, T } from "./site-text";

// 404 (owner, 15 Oct 2026, from a pasted spec): one full-screen orange page
// with its own small nav, a giant white "404" stretched to the screen height
// behind a white oval, a looping video in the middle and "Back to Home" at the
// foot. The spec's brand ("TinyTrails") is OGCW here, and its nav links go to
// the site's own sections. The shop shows this page to everyone but the admin.

const LINKS = [
  { label: "News", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Games", to: "/games" },
  { label: "Culture", to: "/culture" },
  { label: "Sports", to: "/sports" },
] as const;
const MENU = [...LINKS, { label: "Streaming", to: "/streaming" }, { label: "About", to: "/about" }] as const;

const VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4";
const ACCENT = "#F16524";

// useLayoutEffect warns on the server; the scale is only measured in the browser
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function Logo() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3].map((dot) => <span key={dot} className="h-2.5 w-2.5 rounded-full bg-white sm:h-3 sm:w-3" />)}
      </span>
      <span className="ml-1 text-lg font-bold text-white sm:text-xl">OGCW</span>
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
      <div className="relative flex h-screen w-full flex-col overflow-hidden font-[Inter,sans-serif] antialiased" style={{ background: "linear-gradient(to bottom, #FF8233, #FDAC55)" }}>
        {/* The giant 404 and the oval over it, fading out towards the foot */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ opacity: 0.8, maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)", WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 95%)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              ref={text}
              className="whitespace-nowrap font-black leading-none tracking-tighter"
              style={{ color: "#FFFFFF", fontSize: "clamp(200px, 48vw, 800px)", transform: `scale(1.15, ${scaleY * 1.4})` }}
            >
              404
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[22vh] rounded-full sm:h-[26vh] md:h-[50vh]" style={{ background: "#FFFFFF", width: "clamp(120px, 20vw, 400px)", transform: `scaleY(${scaleY})`, transformOrigin: "center" }} />
          </div>
        </div>

        <nav className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-12" aria-label="Main">
          <Link to="/" aria-label="OGCW, back to the front page"><Logo /></Link>
          <div className="hidden gap-1 md:flex">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-90" style={{ color: ACCENT }}>
                {link.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="nf-menu"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-white transition-colors hover:opacity-90 sm:px-5 sm:py-2.5"
            style={{ background: ACCENT }}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-sm font-medium sm:inline">Menu</span>
          </button>
        </nav>

        {/* The video, a little above the middle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ marginTop: "calc(-6vh - 40px)" }}>
          <div className="h-[85vh] w-[120vw] sm:h-[70vh] sm:w-[70vw] md:h-[78vh] md:w-[62vw]">
            <video className="pointer-events-none h-full w-full object-contain mix-blend-darken" src={VIDEO} autoPlay loop muted playsInline aria-hidden="true" />
          </div>
        </div>

        <main className="relative z-30 mt-auto flex flex-col items-center px-4 pb-8 text-center sm:pb-16">
          <h1 className="mb-3 text-lg font-medium text-white sm:mb-4 sm:text-xl md:text-2xl"><T k="404.oops">Oops, something went wrong!</T></h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg sm:px-8 sm:py-4 sm:text-base"
            style={{ background: ACCENT }}
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
            style={{ background: "linear-gradient(135deg, #FF6B1A 0%, #FF9642 100%)" }}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30" aria-label="Close the menu">
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
                  <Link to={item.to} onClick={() => setOpen(false)} className="block rounded-2xl bg-white/10 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/20">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={`absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: open ? "450ms" : "0ms" }}>
              <Link to="/" onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-base font-semibold transition-transform hover:scale-[1.02]" style={{ color: ACCENT }}>
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
