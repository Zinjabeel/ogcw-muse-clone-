// The living background: a fixed layer behind the whole page with two pools
// of light drifting slowly in the current theme's colours (and Aurora's
// pastel wash). The colours live with the theme tokens in styles.css
// (--amb-*), so every theme gets its own; it holds still for reduced motion.
export function BackgroundGradientGlow() {
  return <div className="bg-glow" aria-hidden="true" />;
}
