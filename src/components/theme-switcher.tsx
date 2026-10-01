import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { storePreference } from "@/lib/consent";

// Colour-theme switcher in the header. "Night" is the original black and
// yellow; "Gold" is soft white and gold (a dimmed white, never bright); "Navy" is navy, off-white and creamy
// yellow; "Aurora" is a pastel glow behind the page with plum text and a
// violet accent. A theme is just <html data-theme="..."> swapping the
// --ogcw-* colour tokens in styles.css. The choice is remembered in this
// browser (localStorage) and applied before the page paints by themeInitScript.

const THEMES = [
  { id: "night", name: "Night", note: "Black & yellow", swatch: ["#0d0d0d", "#ffe600", "#e4e1da"] },
  { id: "gold", name: "Gold", note: "Soft white & gold", swatch: ["#efefed", "#86600e", "#121212"] },
  { id: "navy", name: "Navy", note: "Navy, off-white & cream", swatch: ["#0e1a33", "#f2dc8c", "#e8e2d4"] },
  { id: "aurora", name: "Aurora", note: "Pastel glow & violet", swatch: ["#f7eaff", "#7a3fd6", "#1d1426"] },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "ogcw-theme";
const isTheme = (value: unknown): value is ThemeId => THEMES.some((t) => t.id === value);

// Runs in <head> before first paint so a saved theme never flashes the default.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="gold"||t==="navy"||t==="aurora"){document.documentElement.dataset.theme=t}}catch(e){}})();`;

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), 500);
  }
  if (id === "night") delete root.dataset["theme"];
  else root.dataset["theme"] = id;
  storePreference(STORAGE_KEY, id); // remembered only if the reader allows preferences
}

function Swatch({ colors, size = 18 }: { colors: readonly string[]; size?: number }) {
  // A little disc: background colour with the accent as a slice
  return (
    <span
      className="theme-disc"
      aria-hidden="true"
      style={{ width: size, height: size, background: `conic-gradient(${colors[1]} 0 35%, ${colors[0]} 35% 100%)`, boxShadow: `inset 0 0 0 1.5px ${colors[2]}` }}
    />
  );
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("night");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Pick up the theme the head script already applied
  useEffect(() => {
    const current = document.documentElement.dataset["theme"];
    if (isTheme(current)) setTheme(current);
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

  const current = THEMES.find((t) => t.id === theme)!;

  const choose = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div className="theme-switch" ref={wrap}>
      <button
        ref={button}
        type="button"
        className="icon-button grid theme-switch-button"
        aria-label={`Colour theme: ${current.name}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="theme-menu"
        title="Colour theme"
        onClick={() => setOpen((value) => !value)}
      >
        <Swatch colors={current.swatch} />
      </button>
      {open && (
        <div id="theme-menu" className="theme-menu" role="group" aria-label="Colour theme">
          <p className="theme-menu-label">Colour theme</p>
          {THEMES.map((t, index) => (
            <button
              key={t.id}
              type="button"
              className="theme-option"
              aria-pressed={t.id === theme}
              autoFocus={t.id === theme}
              onClick={() => choose(t.id)}
            >
              <span className="theme-option-num">{index + 1}</span>
              <Swatch colors={t.swatch} size={26} />
              <span className="theme-option-text">
                <span className="theme-option-name">{t.name}</span>
                <span className="theme-option-note">{t.note}</span>
              </span>
              {t.id === theme && <Check size={16} strokeWidth={2} className="theme-option-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
