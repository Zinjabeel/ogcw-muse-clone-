import { createFileRoute } from "@tanstack/react-router";
import { GenderShop, type GenderPage } from "../components/shop-gender";

// The women's shop (src/components/shop-gender.tsx). Photos: Unsplash
// (Howen, Collins Lesulie, NS, Teslariu Mihai), free licence.
const PAGE: GenderPage = {
  gender: "women",
  title: "Women",
  cards: [
    { key: "jackets", label: "Jackets", image: "/shop/looks/fw-women.webp", pos: "50% 30%", alt: "A woman in a navy puffer jacket leaning on a green Land Rover", credit: "Howen, Unsplash", to: { kind: "Jackets" } },
    { key: "sneakers", label: "Sneakers", image: "/shop/looks/sneakers-women.webp", pos: "50% 86%", alt: "A woman in a long black coat crouching on a street in orange and black Nike Air Max Plus", credit: "Collins Lesulie, Unsplash", to: { cat: "Sneakers" } },
  ],
  looks: [
    { image: "/shop/looks/fw-women-night.webp", kicker: "City lights", title: "A white puffer and the night out", to: { kind: "Jackets" }, credit: "NS, Unsplash" },
    { image: "/shop/looks/season-women.webp", kicker: "Neutral ground", title: "Sand, cream and grey for the cold months", to: { kind: "Hoodies & sweats" }, credit: "Teslariu Mihai, Unsplash" },
    { image: "/shop/looks/spot-watch.webp", kicker: "Small cases", title: "Lady-Datejust, Reverso and the Cartier classics", to: { kind: "Watches" }, credit: "Gilles De Muynck, Unsplash" },
  ],
};

export const Route = createFileRoute("/shop/women")({
  head: () => ({ meta: [{ title: "Women: OGCW Shop" }, { name: "description", content: "The women’s shop: Wmns Jordans, Sambas and ASICS, knits from Acne Studios and Amiri, and ladies’ watches." }] }),
  component: () => <GenderShop page={PAGE} />,
});
