// Aurora background: soft pastel glows in the corners (lilac, cream, pink,
// sky blue) over a lilac-to-blush wash. It sits fixed behind the whole page
// and only shows in the "Aurora" colour theme; the colours live with the
// other theme tokens in styles.css (--ogcw-aurora).
export function BackgroundGradientGlow() {
  return <div className="bg-glow" aria-hidden="true" />;
}
