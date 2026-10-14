import { createFileRoute } from "@tanstack/react-router";
import { GenderShop, type GenderPage } from "../components/shop-gender";

// The men's shop (src/components/shop-gender.tsx). Photos: Unsplash
// (behrouz sasani, Babak Eshaghian, Vladyslav Lytvyshchenko), free licence.
const PAGE: GenderPage = {
  gender: "men",
  title: "Men",
  hero: {
    image: "/shop/looks/fw-men.webp", pos: "50% 30%", kicker: "Fall/Winter 2026", title: "Built for the Cold", credit: "behrouz sasani",
    links: [{ label: "Shop jackets", kind: "Jackets" }, { label: "Shop sneakers", kind: "Basketball" }],
  },
  looks: [
    { image: "/shop/looks/fw-men-night.webp", kicker: "After dark", title: "Shearling, leather and a heavy hoodie", to: { kind: "Jackets" }, credit: "Babak Eshaghian, Unsplash" },
    { image: "/shop/looks/season-men.webp", kicker: "Layer up", title: "Hoodies and knits for under the puffer", to: { kind: "Hoodies & sweats" }, credit: "Vladyslav Lytvyshchenko, Unsplash" },
    { image: "/shop/looks/spot-watch.webp", kicker: "On the wrist", title: "Rolex to Audemars Piguet, pre-owned", to: { kind: "Watches" }, credit: "Gilles De Muynck, Unsplash" },
  ],
};

export const Route = createFileRoute("/shop/men")({
  head: () => ({ meta: [{ title: "Men: OGCW Shop" }, { name: "description", content: "The men’s shop: jackets, hoodies, Jordans and New Balance, denim and watches for fall and winter 2026." }] }),
  component: () => <GenderShop page={PAGE} />,
});
