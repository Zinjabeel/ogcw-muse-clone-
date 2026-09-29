import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// "Culture that moves with you": the last block of the OGCW News front,
// imported from a Variant design (a dark glass hero with floating icon
// tiles). Nine frosted tiles float, lean towards the pointer and animate
// their icon on hover; each one opens a part of the site. Colours come from
// the theme tokens, so it works in every colour theme.

type Dest =
  | { kind: "page"; to: "/news" | "/music" | "/culture" | "/originals" | "/shop" | "/explore" }
  | { kind: "home"; hash: string }
  | { kind: "mail"; href: string };

type Tile = { icon: keyof typeof ICONS; label: string; dest: Dest; x: string; y: string; rot: string };

const ICONS = {
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  latest: <><path className="deck-arrow" d="M12 3v12M12 15l-4-4M12 15l4-4" /><path d="M5 20h14" opacity=".5" /></>,
  star: <path d="M12 3l1.91 5.82L21 10.74l-5.14 3.73L17.78 21 12 17.27 6.22 21l1.92-6.53L3 10.74l7.09-1.92L12 3z" />,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle className="deck-pupil" cx="12" cy="12" r="3" fill="currentColor" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  shop: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><g className="deck-arrow"><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></g></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path className="deck-flap" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
} satisfies Record<string, ReactNode>;

// Positions follow the original layout: two loose rows, each tile slightly turned
const TILES: Tile[] = [
  { icon: "heart", label: "Most read", dest: { kind: "page", to: "/explore" }, x: "10%", y: "0px", rot: "-8deg" },
  { icon: "bell", label: "Newsletter", dest: { kind: "home", hash: "newsletter-title" }, x: "25%", y: "60px", rot: "4deg" },
  { icon: "latest", label: "Latest", dest: { kind: "page", to: "/news" }, x: "45%", y: "-20px", rot: "-2deg" },
  { icon: "star", label: "Culture", dest: { kind: "page", to: "/culture" }, x: "65%", y: "80px", rot: "6deg" },
  { icon: "eye", label: "Originals", dest: { kind: "page", to: "/originals" }, x: "82%", y: "10px", rot: "-5deg" },
  { icon: "plus", label: "Submit a story", dest: { kind: "mail", href: mail("Submit a story") }, x: "15%", y: "220px", rot: "3deg" },
  { icon: "shop", label: "Shop", dest: { kind: "page", to: "/shop" }, x: "38%", y: "180px", rot: "-6deg" },
  { icon: "music", label: "Music", dest: { kind: "page", to: "/music" }, x: "55%", y: "240px", rot: "2deg" },
  { icon: "mail", label: "Contact", dest: { kind: "mail", href: `mailto:${BUSINESS_EMAIL}` }, x: "78%", y: "200px", rot: "-8deg" },
];

function TileLink({ dest, className, children }: { dest: Dest; className: string; children: ReactNode }) {
  if (dest.kind === "page") return <Link to={dest.to} className={className}>{children}</Link>;
  if (dest.kind === "home") return <Link to="/" hash={dest.hash} className={className}>{children}</Link>;
  return <a href={dest.href} className={className}>{children}</a>;
}

export function CultureDeck() {
  const section = useRef<HTMLElement>(null);

  // Tiles within 300px of the pointer lean towards it (mouse and trackpad only)
  useEffect(() => {
    const el = section.current;
    if (!el || !window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    const slots = Array.from(el.querySelectorAll<HTMLElement>(".deck-slot"));
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const apply = () => {
      frame = 0;
      if (!pointer) return;
      for (const slot of slots) {
        const r = slot.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2);
        const power = Math.max(0, (300 - Math.hypot(dx, dy)) / 300);
        slot.style.setProperty("--mx", `${(dx / 10) * power}px`);
        slot.style.setProperty("--my", `${(dy / 10) * power}px`);
      }
    };
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      pointer = null;
      for (const slot of slots) { slot.style.removeProperty("--mx"); slot.style.removeProperty("--my"); }
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={section} className="deck" aria-labelledby="deck-title">
      <p className="deck-badge">News · Music · Games · Streaming · Culture · Shop</p>
      <h3 id="deck-title" className="deck-title">Culture that<br /><em>moves with you.</em></h3>
      <p className="deck-sub">Stories, streams and drops from across music, games and culture. Pick a door below and start anywhere.</p>
      <div className="deck-cta">
        <Link to="/news" className="deck-btn deck-btn-primary">Browse the news <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" /></Link>
        <Link to="/explore" className="deck-btn deck-btn-secondary">Explore OGCW</Link>
      </div>
      <ul className="deck-field">
        {TILES.map((tile) => (
          <li key={tile.label} className="deck-slot" style={{ "--x": tile.x, "--y": tile.y, "--rot": tile.rot } as CSSProperties}>
            <div className="deck-float">
              <TileLink dest={tile.dest} className="deck-card">
                <svg className={`deck-icon deck-${tile.icon}`} viewBox="0 0 24 24" aria-hidden="true">{ICONS[tile.icon]}</svg>
                <span className="deck-label">{tile.label}</span>
              </TileLink>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
