import { useEffect, useRef, useState } from "react";

// The intro when you enter the site, rebuilt from Cypher Capital's loader:
// on a full-screen layer in the page colour, "One Great" and "Culture World"
// slide in from the middle (0.8 s), then spread apart (1.5 s) around the
// OGCW mark. The mark then docks into the header's logo (0.8 s,
// cubic-bezier(.5, 0, 0, 1)) while the words fade, swaps for the real logo,
// and the layer clears. The same spread wordmark sits at the foot of every
// page (footer-2.tsx). Once per tab, and never with reduced motion.

const KEY = "ogcw-intro-seen";

/** Runs before the page paints: marks <html data-entry> when the intro should play */
export const introInitScript = `(function(){try{if(sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.setAttribute("data-entry","")}catch(e){}})();`;

const DELAY = 120;
const REVEAL = 800;
const SPREAD = 1500;
const DOCK = 800;
const SWAP = 200;
const BG = 400;

export function SiteIntro() {
  const [stage, setStage] = useState<"idle" | "live" | "docking" | "leaving" | "done">("idle");
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-entry")) { setStage("done"); return; }
    try { sessionStorage.setItem(KEY, "1"); } catch { /* storage blocked: it plays again next time */ }
    setStage("live");
    const timers: number[] = [];
    timers.push(window.setTimeout(() => {
      // Dock: move the mark onto the header logo, matching its height
      const target = document.querySelector<HTMLElement>("[data-site-logo]");
      const el = mark.current;
      if (target && el) {
        const from = el.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const scale = Math.max(0.2, Math.min(1.4, to.height / from.height));
        el.style.setProperty("--dock-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
        el.style.setProperty("--dock-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
        el.style.setProperty("--dock-scale", String(scale));
      }
      setStage("docking");
    }, DELAY + REVEAL + SPREAD));
    timers.push(window.setTimeout(() => { root.setAttribute("data-entry-swap", ""); setStage("leaving"); }, DELAY + REVEAL + SPREAD + DOCK));
    timers.push(window.setTimeout(() => {
      root.removeAttribute("data-entry");
      root.removeAttribute("data-entry-swap");
      setStage("done");
    }, DELAY + REVEAL + SPREAD + DOCK + Math.max(SWAP, BG) + 60));
    // Leaving early (a click or a key) skips straight to the page
    const skip = () => { timers.forEach((timer) => window.clearTimeout(timer)); root.removeAttribute("data-entry"); root.removeAttribute("data-entry-swap"); setStage("done"); };
    window.addEventListener("keydown", skip, { once: true });
    return () => { timers.forEach((timer) => window.clearTimeout(timer)); window.removeEventListener("keydown", skip); };
  }, []);

  if (stage === "done") return null;
  return (
    <div
      className="site-intro"
      data-live={stage !== "idle" || undefined}
      data-docking={stage === "docking" || stage === "leaving" || undefined}
      data-leaving={stage === "leaving" || undefined}
      aria-hidden="true"
      role="presentation"
      onClick={() => { document.documentElement.removeAttribute("data-entry"); setStage("done"); }}
    >
      <div className="site-intro-mark">
        <span className="site-intro-word">One Great</span>
        <span className="site-intro-dock" ref={mark}>OGCW</span>
        <span className="site-intro-word">Culture World</span>
      </div>
    </div>
  );
}
