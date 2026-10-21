import { Palette, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

// The shop's background (owner, 21 Oct 2026): React Bits' AeroShards, glass
// or chrome shards flowing in ribbons, on a fixed layer behind every shop
// page, with the shop's panels turned to frosted glass so the shards show
// through (src/styles/shop-backdrop.css). A few colour sets are ready (black
// and gold, black and white, white and gold…), switched with the small
// "Background" button at the bottom left; the choice is kept on this browser.
// Browsers without WebGPU get a still picture in the same colours; with
// reduced motion the shards stand still.

const AeroShards = lazy(() => import("./aero-shards"));

export type Backdrop = {
  id: string;
  name: string;
  /** dark: the shop's words turn light; light: they stay dark */
  tone: "dark" | "light";
  background: string;
  shard: string;
  accent: string;
  material: "glass" | "chrome";
  /** The shop's own highlight colour (buttons, the page you're on) with this set */
  ui: string;
};

export const BACKDROPS: Backdrop[] = [
  { id: "black-gold", name: "Black and gold", tone: "dark", background: "#0b0b0b", shard: "#7a5d17", accent: "#ffd447", material: "glass", ui: "#f2d36b" },
  { id: "black-white", name: "Black and white", tone: "dark", background: "#0a0a0a", shard: "#a1a1aa", accent: "#e4e4e7", material: "chrome", ui: "#ffffff" },
  { id: "ogcw-yellow", name: "OGCW yellow", tone: "dark", background: "#0d0d0d", shard: "#ffe600", accent: "#fff6a8", material: "glass", ui: "#ffe600" },
  // On white the glass is nearly invisible, so the light sets are chrome, in deeper colours
  { id: "white-gold", name: "White and gold", tone: "light", background: "#f7f6f1", shard: "#a8771c", accent: "#5c4208", material: "chrome", ui: "#86600e" },
  { id: "white-black", name: "White and black", tone: "light", background: "#f7f8f3", shard: "#2a2a2e", accent: "#0d0d0d", material: "chrome", ui: "#000000" },
];
const DEFAULT_ID = "black-gold";
const KEY = "ogcw-shop-backdrop";

function useBackdropChoice() {
  const [id, setId] = useState<string>(DEFAULT_ID);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && (saved === "off" || BACKDROPS.some((item) => item.id === saved))) setId(saved);
    } catch {
      // not kept: the usual one
    }
  }, []);
  const choose = (next: string) => {
    setId(next);
    try { localStorage.setItem(KEY, next); } catch { /* not kept */ }
  };
  return { id, choose };
}

export function ShopBackdrop() {
  const { id, choose } = useBackdropChoice();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // Drawn in the browser only, after the page is up
  useEffect(() => { setReady(true); }, []);
  const backdrop = BACKDROPS.find((item) => item.id === id);
  const style = backdrop ? { ["--bd-bg" as string]: backdrop.background, ["--bd-shard" as string]: backdrop.shard, ["--bd-accent" as string]: backdrop.accent } : undefined;

  return (
    <>
      {backdrop && (
        <div className="shop-bd" data-tone={backdrop.tone} data-set={backdrop.id} style={style} aria-hidden="true">
          {/* A still picture in the same colours, under the shards (and instead of them without WebGPU) */}
          <span className="shop-bd-still" />
          {ready && !failed && (
            <Suspense fallback={null}>
              <AeroShards
                key={backdrop.id}
                shardColor={backdrop.shard}
                accentColor={backdrop.accent}
                backgroundColor="transparent"
                lightMode={backdrop.tone === "light"}
                placement="full"
                material={backdrop.material}
                markers="plus"
                count={1800}
                depthOfField={0.75}
                vignette={0.3}
                mouseInteraction
                pulseOnClick
                holdToGather
                shardSize={0.5}
                billow={0.7}
                speed={0.25}
                scale={0.6}
                glow={0.25}
                grain={0.13}
                mouseStrength={0.64}
                parallax={0.42}
                dpr={1.5}
                style={{}}
                onError={() => setFailed(true)}
              />
            </Suspense>
          )}
        </div>
      )}

      <div className="shop-bd-pick">
        {open && (
          <div className="shop-bd-menu" role="dialog" aria-label="Shop background">
            <p className="shop-bd-menu-title">Shop background</p>
            {BACKDROPS.map((item) => (
              <button key={item.id} type="button" className="shop-bd-option" aria-pressed={id === item.id} onClick={() => choose(item.id)}>
                <span className="shop-bd-swatch" style={{ background: `linear-gradient(135deg, ${item.background} 0 50%, ${item.accent} 50% 100%)` }} />
                {item.name}
              </button>
            ))}
            <button type="button" className="shop-bd-option" aria-pressed={id === "off"} onClick={() => choose("off")}>
              <span className="shop-bd-swatch shop-bd-swatch-off" />
              Off (the plain shop)
            </button>
            {failed && <p className="shop-bd-note">This browser can’t draw the shards (it has no WebGPU), so it shows a still version.</p>}
          </div>
        )}
        <button type="button" className="shop-bd-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={15} aria-hidden="true" /> : <Palette size={15} aria-hidden="true" />}
          Background{backdrop ? `: ${backdrop.name}` : ": off"}
        </button>
      </div>
    </>
  );
}
