import { Check, GalleryHorizontal, LayoutPanelTop, PanelsTopLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { storePreference } from "@/lib/consent";
import { T } from "./site-text";

// Hero switcher in the header, beside the colour switcher and built the same
// way: "Gallery" (the default, hero-gallery.tsx) is five cards into OGCW,
// "Gallery 2" (hero-gallery-2.tsx) the top news with the cards below it,
// "Cover story" (hero-cover.tsx) one big photo and headline. The choice is
// <html data-hero="gallery2|cover"> (no attribute means the gallery), remembered in
// this browser and applied before first paint by heroInitScript.

const HEROES = [
  { id: "gallery", name: "Gallery", note: "Five cards into OGCW", Icon: GalleryHorizontal },
  { id: "gallery2", name: "Gallery 2", note: "Top news, with the cards below", Icon: PanelsTopLeft },
  { id: "cover", name: "Cover story", note: "One big photo and headline", Icon: LayoutPanelTop },
] as const;
type HeroId = (typeof HEROES)[number]["id"];

const STORAGE_KEY = "ogcw-hero";
const isHero = (value: unknown): value is HeroId => HEROES.some((h) => h.id === value);

// Runs in <head> before first paint so a saved hero never flashes the default.
export const heroInitScript = `(function(){try{var h=localStorage.getItem("${STORAGE_KEY}");if(h==="cover"||h==="gallery2"){document.documentElement.dataset.hero=h}}catch(e){}})();`;

function applyHero(id: HeroId) {
  const root = document.documentElement;
  if (id === "gallery") delete root.dataset["hero"];
  else root.dataset["hero"] = id;
  storePreference(STORAGE_KEY, id); // remembered only if the reader allows preferences
}

export function HeroSwitcher() {
  const [hero, setHero] = useState<HeroId>("gallery");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Pick up the hero the head script already applied
  useEffect(() => {
    const current = document.documentElement.dataset["hero"];
    if (isHero(current)) setHero(current);
  }, []);

  // Close on a click outside or on Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = HEROES.find((h) => h.id === hero)!;

  const choose = (id: HeroId) => {
    setHero(id);
    applyHero(id);
    setOpen(false);
    button.current?.focus();
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="theme-switch" ref={wrap}>
      <button
        ref={button}
        type="button"
        className="icon-button grid theme-switch-button"
        aria-label={`Hero section: ${current.name}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="hero-menu"
        title="Hero section"
        onClick={() => setOpen((value) => !value)}
      >
        <current.Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open && (
        <div id="hero-menu" className="theme-menu" role="group" aria-label="Hero section">
          <p className="theme-menu-label"><T>Hero section</T></p>
          {HEROES.map((h, index) => (
            <button
              key={h.id}
              type="button"
              className="theme-option"
              aria-pressed={h.id === hero}
              autoFocus={h.id === hero}
              onClick={() => choose(h.id)}
            >
              <span className="theme-option-num">{index + 1}</span>
              <span className="hero-glyph" aria-hidden="true"><h.Icon size={15} strokeWidth={1.75} /></span>
              <span className="theme-option-text">
                <span className="theme-option-name"><T>{h.name}</T></span>
                <span className="theme-option-note"><T>{h.note}</T></span>
              </span>
              {h.id === hero && <Check size={16} strokeWidth={2} className="theme-option-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
