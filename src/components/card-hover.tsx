import { useEffect } from "react";

// Card hover, kept from the redesign experiment: a soft yellow light follows
// the pointer across tiles and cards, and the big cards lean a few degrees
// towards it. (The photo zoom is plain CSS, in styles.css under "Card hover".)
// Mouse only, and nothing for reduced motion.

const SPOTLIGHT = ".mix-tile, .tr-buy, .tr-wrong-card, .about-social, .shopcard, .ev-row, .bs-linked, .impact-lead, .impact-door";
const TILT = ".gallery-card[aria-current] .gallery-card-link, .g2-card[data-pos='0'] .g2-card-link, .kx-feature, .mix-pick, .shopcard";
const MAX_TILT = 5; // degrees

export function CardHover() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tilted: HTMLElement | null = null;
    const untilt = (el: HTMLElement) => {
      el.style.removeProperty("--ch-rx");
      el.style.removeProperty("--ch-ry");
      el.removeAttribute("data-ch-tilt");
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as Element | null;
      const lit = target?.closest?.(SPOTLIGHT) as HTMLElement | null;
      if (lit) {
        const rect = lit.getBoundingClientRect();
        lit.style.setProperty("--ch-x", `${event.clientX - rect.left}px`);
        lit.style.setProperty("--ch-y", `${event.clientY - rect.top}px`);
      }
      const card = target?.closest?.(TILT) as HTMLElement | null;
      if (tilted && tilted !== card) { untilt(tilted); tilted = null; }
      if (!card) return;
      tilted = card;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.setAttribute("data-ch-tilt", "");
      card.style.setProperty("--ch-rx", `${(-y * MAX_TILT).toFixed(2)}deg`);
      card.style.setProperty("--ch-ry", `${(x * MAX_TILT).toFixed(2)}deg`);
    };
    const leave = () => { if (tilted) untilt(tilted); tilted = null; };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, []);
  return null;
}
