import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { SHOPS, type Shop } from "@/data/content";
import nikeLogo from "@/assets/brands/nike.svg";
import adidasLogo from "@/assets/brands/adidas.svg";
import stockxLogo from "@/assets/brands/stockx.svg";
import uniqloLogo from "@/assets/brands/uniqlo.svg";
import niketownPhoto from "@/assets/shop/niketown-london.jpg";
import nikePortlandPhoto from "@/assets/shop/nike-store-portland.jpg";
import nikeInnovationPhoto from "@/assets/shop/nike-house-of-innovation.jpg";
import adidasStorePhoto from "@/assets/shop/adidas-store-jakarta.jpg";
import uniqloShenzhenPhoto from "@/assets/shop/uniqlo-store-shenzhen.jpg";
import uniqloTokyoPhoto from "@/assets/shop/uniqlo-store-tokyo.jpg";
import { T } from "./site-text";

// The shop on the home page: one card into the shop, in the site's own card
// style. On the left, a line about the shop, the button into it, and the
// brands as logo buttons, with a "More" button for the full shop. On the
// right, three columns of store photos and picks from every brand, always
// scrolling (they are decoration, hidden from screen readers and the Tab
// key; the buttons are the real ways in). The full shop lives on /shop.

const LOGOS: Record<string, string> = { nike: nikeLogo, adidas: adidasLogo, stockx: stockxLogo, uniqlo: uniqloLogo };
// Photos of each brand's stores, shown with its shop photo and its picks
// (StockX sells online only, so it has no store photos)
const STORES: Record<string, string[]> = {
  nike: [niketownPhoto, nikePortlandPhoto, nikeInnovationPhoto],
  adidas: [adidasStorePhoto],
  uniqlo: [uniqloShenzhenPhoto, uniqloTokyoPhoto],
};

type Tile = { shop: Shop; src: string; store: boolean };

// Smaller copies of the Unsplash images (their URLs carry the width)
const sized = (src: string, width: number) => src.replace(/([?&])w=\d+/, `$1w=${width}`);

// Per brand: its shop photo, its store photos, then three picks. Then a
// round at a time across the brands, dealt over three columns, so every
// column mixes all four.
const BY_BRAND: Tile[][] = SHOPS.map((shop) => [
  { shop, src: sized(shop.hero.src, 520), store: true },
  ...(STORES[shop.slug] ?? []).map((src) => ({ shop, src, store: true })),
  ...shop.products.slice(0, 3).map((product) => ({ shop, src: sized(product.image, 400), store: false })),
]);
const LONGEST = Math.max(...BY_BRAND.map((tiles) => tiles.length));
const TILES = Array.from({ length: LONGEST }, (_, round) => BY_BRAND.flatMap((tiles) => (tiles[round] ? [tiles[round]!] : []))).flat();
const COLUMNS = [0, 1, 2].map((column) => TILES.filter((_, index) => index % 3 === column));
// Seconds for one full loop of each column, slightly different so they never line up
const SPEEDS = [48, 58, 52];

function TileView({ tile }: { tile: Tile }) {
  return (
    <Link to="/shop/$slug" params={{ slug: tile.shop.slug }} className={`sp-tile ${tile.store ? "sp-tile-store" : ""}`} tabIndex={-1}>
      <img src={tile.src} alt="" loading="lazy" />
      <span className="sp-chip" data-brand={tile.shop.slug}><img src={LOGOS[tile.shop.slug]} alt="" /></span>
    </Link>
  );
}

export function ShopPromo() {
  return (
    <section className="sp" aria-labelledby="sp-title">
      <div className="sp-copy">
        <p className="sp-label"><T k="shop-promo.label">The OGCW Shop</T></p>
        <h3 id="sp-title" className="sp-title"><T k="shop-promo.title">Shop the OGCW edit</T></h3>
        <p className="sp-text"><T k="shop-promo.text">Our picks from the brands in our stories, bought straight from the retailer.</T></p>
        <Link to="/shop" className="sp-button">
          Visit the shop
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>

        <div className="sp-brands">
          <p id="sp-brands-title" className="sp-brands-title"><T k="shop-promo.brands">Shop by brand</T></p>
          <ul className="sp-brand-list" aria-labelledby="sp-brands-title">
            {SHOPS.map((shop) => (
              <li key={shop.slug}>
                <Link to="/shop/$slug" params={{ slug: shop.slug }} className="sp-brand">
                  <span className="sp-brand-logo" data-brand={shop.slug}><img src={LOGOS[shop.slug]} alt="" /></span>
                  <span className="sp-brand-name">{shop.name}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="sp-brand sp-brand-more">
                <span className="sp-brand-logo"><Plus size={22} strokeWidth={1.75} aria-hidden="true" /></span>
                <span className="sp-brand-name">More</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="sp-reel" aria-hidden="true">
        {COLUMNS.map((column, index) => (
          <div key={index} className="sp-column" data-reverse={index % 2 === 1 || undefined} style={{ "--speed": `${SPEEDS[index]}s` } as CSSProperties}>
            <div className="sp-track">
              {[0, 1].flatMap((copy) => column.map((tile, i) => <TileView key={`${copy}-${i}`} tile={tile} />))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
