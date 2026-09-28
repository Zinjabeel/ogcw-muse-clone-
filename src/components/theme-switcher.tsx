import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Colour-theme switcher in the header. "Night" is the original black and
// yellow; "Gold" is white and gold; "Navy" is navy, off-white and creamy
// yellow. A theme is just <html data-theme="..."> swapping the six --ogcw-*
// colour tokens in styles.css. The choice is remembered in this browser
// (localStorage) and applied before the page paints by themeInitScript.

const THEMES = [
  { id: "night", name: "Night", note: "Black & yellow", swatch: ["#0d0d0d", "#ffe600", "#f5f5f5"] },
  { id: "gold", name: "Gold", note: "White & gold", swatch: ["#ffffff", "#94701b", "#15130f"] },
  { id: "navy", name: "Navy", note: "Navy, off-white & cream", swatch: ["#0e1a33", "#f2dc8c", "#f5f1e6"] },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "ogcw-theme";
const isTheme = (value: unknown): value is ThemeId => THEMES.some((t) => t.id === value);

// Runs in <head> before first paint so a saved theme never flashes the default.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="gold"||t==="navy"){document.documentElement.dataset.theme=t}}catch(e){}})();`;

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), 500);
  }
  if (id === "night") delete root.dataset["theme"];
  else root.dataset["theme"] = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // private mode or storage blocked: the theme still applies for this visit
  }
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
