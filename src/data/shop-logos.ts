// The brand logos in public/shop/logos: Simple Icons (CC0) and Wikimedia
// Commons, trademarks of their owners. Brands without one are set in type.
const FILES: Record<string, "svg" | "png"> = {
  "acne-studios": "svg", adidas: "svg", amiri: "svg", asics: "svg", "bell-ross": "svg", blancpain: "svg", "cactus-jack": "svg", "grand-seiko": "png",
  hublot: "svg", jordan: "svg", levis: "svg", "new-balance": "svg", nike: "svg", nomos: "png", omega: "svg", panerai: "svg", rolex: "svg",
  supreme: "svg", "tag-heuer": "svg", tudor: "png", "vacheron-constantin": "png",
};
export const logoOf = (slug: string) => (FILES[slug] ? `/shop/logos/${slug}.${FILES[slug]}` : undefined);
export const LOGO_SLUGS = Object.keys(FILES);
