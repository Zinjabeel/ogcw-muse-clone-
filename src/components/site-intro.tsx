import { useEffect, useRef, useState } from "react";
import { adminAccess } from "@/lib/work";

// The intro when you enter the shop (and only the shop), after Cypher
// Capital's loader: on a full-screen layer in the page colour "One Great
// Culture World" rises in, the letters after each initial fold away until
// only "OGCW" is left, and that mark glides up into the shop header's logo
// while the layer clears. Once per tab, never with reduced motion, and not
// on phones (narrower than 768px go straight into the shop; tablets and
// computers keep it); a click or a key skips it. The shop is admin-only for
// now (owner, 15 Oct 2026), so the intro waits for the admin check and only
// plays for an admin; everyone else goes straight to the shop's 404.

const KEY = "ogcw-shop-intro-seen";

/** Runs before the page paints: marks <html data-entry> when the intro should play */
export const introInitScript = `(function(){try{if(!/^\\/shop(\\/|$)/.test(location.pathname)||sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches||matchMedia("(max-width: 767px)").matches)return;document.documentElement.setAttribute("data-entry","")}catch(e){}})();`;

const WORDS = ["One", "Great", "Culture", "World"];
const REVEAL = 1500; // rise in, then hold
const FOLD = 900; // the letters fold away
const TRAVEL = 1100; // the mark glides to the logo
const CLEAR = 450; // the layer fades out

export function SiteIntro() {
  const [stage, setStage] = useState<"wait" | "show" | "fold" | "travel" | "clear" | "done">("wait");
  const mark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-entry")) { setStage("done"); return; }
    const timers: number[] = [];
    let live = true;
    const finish = () => { timers.forEach((timer) => window.clearTimeout(timer)); root.removeAttribute("data-entry"); root.removeAttribute("data-entry-swap"); setStage("done"); };
    void adminAccess().catch(() => false).then((admin) => {
      if (!live) return;
      if (!admin) { finish(); return; }
      setStage("show");
      play();
    });
    window.addEventListener("keydown", finish, { once: true });
    return () => { live = false; timers.forEach((timer) => window.clearTimeout(timer)); window.removeEventListener("keydown", finish); };

    function play() {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* storage blocked: it plays again next time */ }
    // Fold: give each hidden part its measured width, so it can shrink to nothing
    timers.push(window.setTimeout(() => {
      mark.current?.querySelectorAll<HTMLElement>(".site-intro-rest, .site-intro-space").forEach((part) => { part.style.width = `${part.getBoundingClientRect().width}px`; });
      requestAnimationFrame(() => requestAnimationFrame(() => setStage("fold")));
    }, REVEAL));
    // Travel: move the folded mark onto the header logo, matching its size
    timers.push(window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>("[data-site-logo]");
      const el = mark.current;
      if (target && el) {
        const from = el.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const scale = Math.max(0.15, Math.min(1.5, to.height / from.height));
        el.style.setProperty("--to-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
        el.style.setProperty("--to-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
        el.style.setProperty("--to-s", String(scale));
      }
      setStage("travel");
    }, REVEAL + FOLD + 100));
    timers.push(window.setTimeout(() => { root.setAttribute("data-entry-swap", ""); setStage("clear"); }, REVEAL + FOLD + 100 + TRAVEL));
    timers.push(window.setTimeout(finish, REVEAL + FOLD + 100 + TRAVEL + CLEAR));
    }
  }, []);

  if (stage === "done") return null;
  return (
    <div className="site-intro" data-stage={stage} aria-hidden="true" role="presentation" onClick={() => { document.documentElement.removeAttribute("data-entry"); setStage("done"); }}>
      {stage !== "wait" && <div className="site-intro-mark" ref={mark}>
        {WORDS.map((word, i) => (
          <span key={word} className="site-intro-word">
            {i > 0 && <span className="site-intro-space">&nbsp;</span>}
            <span className="site-intro-initial">{word[0]}</span>
            <span className="site-intro-rest">{word.slice(1)}</span>
          </span>
        ))}
      </div>}
    </div>
  );
}
