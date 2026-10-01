import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { formatPrice, SHOPS, type Product, type Shop } from "@/data/content";

// The shop on the home page, as one ticket. The main side has the pitch,
// the four brands as links, and three strips of photos (each brand's shop
// photo and its picks) scrolling past at a tilt, in opposite directions.
// A perforated line with a notch top and bottom splits off the stub: the
// number of picks, the lowest price and the way in. The strips are
// decoration (hidden from screen readers and the Tab key); the brand links
// and the button are the real ways into the shop. The full shop lives on
// /shop.

type Tile = { kind: "brand"; shop: Shop } | { kind: "product"; shop: Shop; product: Product };

const PICKS = SHOPS.reduce((total, shop) => total + shop.products.length, 0);
const FROM = Math.min(...SHOPS.flatMap((shop) => shop.products.map((product) => product.price)));
const MOST = Math.max(...SHOPS.map((shop) => shop.products.length));
const BRANDS = new Intl.ListFormat("en-GB", { type: "conjunction" }).format(SHOPS.map((shop) => shop.name));

// The four brand photos first, then the picks a round at a time (one from
// each brand), dealt across three strips so every strip mixes all four
const TILES: Tile[] = [
  ...SHOPS.map((shop): Tile => ({ kind: "brand", shop })),
  ...Array.from({ length: MOST }, (_, round) =>
    SHOPS.flatMap((shop): Tile[] => (shop.products[round] ? [{ kind: "product", shop, product: shop.products[round]! }] : [])),
  ).flat(),
];
const STRIPS = [0, 1, 2].map((strip) => TILES.filter((_, index) => index % 3 === strip));
// Seconds for one full loop of each strip: slightly different, so they never line up
const SPEEDS = [46, 56, 50];

// Smaller copies of the images for the strips (the URLs carry their width)
const sized = (src: string, width: number) => src.replace(/([?&])w=\d+/, `$1w=${width}`);

function TileView({ tile }: { tile: Tile }) {
  if (tile.kind === "brand") {
    const crop = tile.shop.hero.crop?.pos ?? "50% 50%";
    return (
      <Link to="/shop/$slug" params={{ slug: tile.shop.slug }} className="tk-tile tk-tile-brand" tabIndex={-1}>
        <img src={sized(tile.shop.hero.src, 480)} alt="" loading="lazy" style={{ objectPosition: crop }} />
        <span className="tk-tile-name">{tile.shop.name}</span>
      </Link>
    );
  }
  return (
    <Link to="/shop/$slug" params={{ slug: tile.shop.slug }} className="tk-tile tk-tile-product" tabIndex={-1}>
      <img src={sized(tile.product.image, 360)} alt="" loading="lazy" />
      <span className="tk-tag">
        <span>{tile.shop.name}</span>
        <span>{formatPrice(tile.product.price)}</span>
      </span>
    </Link>
  );
}

export function ShopTicket() {
  return (
    <section className="tk" aria-labelledby="tk-title">
      <div className="tk-ticket">
        <div className="tk-main">
          <div className="tk-copy">
            <p className="tk-eyebrow">
              <span className="tk-dot" aria-hidden="true" />
              The OGCW Shop
              <span className="tk-open">Open now</span>
            </p>
            <h3 id="tk-title" className="tk-title">Your ticket to <em>the edit</em></h3>
            <p className="tk-text">{PICKS} picks from {BRANDS}, chosen by our style desk from the brands in our stories and bought straight from the retailer.</p>
            <p className="tk-brands-label" id="tk-brands-label">Or go straight to a brand</p>
            <ul className="tk-brands" aria-labelledby="tk-brands-label">
              {SHOPS.map((shop) => (
                <li key={shop.slug}>
                  <Link to="/shop/$slug" params={{ slug: shop.slug }} className="tk-brand">{shop.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Three strips of photos, each looping on its own; they pause under the pointer */}
          <div className="tk-reel" aria-hidden="true">
            <div className="tk-reel-tilt">
              {STRIPS.map((strip, index) => (
                <div key={index} className="tk-strip" data-reverse={index % 2 === 1 || undefined} style={{ "--speed": `${SPEEDS[index]}s` } as CSSProperties}>
                  <div className="tk-track">
                    {[0, 1].flatMap((copy) => strip.map((tile, i) => <TileView key={`${copy}-${i}`} tile={tile} />))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tk-stub">
          <p className="tk-stub-head">
            <span>Admit one</span>
            <span>All season</span>
          </p>
          {/* The four brands, as round photos */}
          <p className="tk-faces">
            <span className="tk-faces-row" aria-hidden="true">
              {SHOPS.map((shop) => (
                <img key={shop.slug} src={sized(shop.hero.src, 160)} alt="" loading="lazy" style={{ objectPosition: shop.hero.crop?.pos ?? "50% 50%" }} />
              ))}
            </span>
            <span className="tk-faces-label">{BRANDS}</span>
          </p>
          <p className="tk-stat">
            <span className="tk-num">{PICKS}</span>
            <span className="tk-num-label">picks<br />from {SHOPS.length} brands</span>
          </p>
          <p className="tk-from">Prices from <strong>{formatPrice(FROM)}</strong></p>
          <Link to="/shop" className="tk-cta">
            <span>Enter the shop</span>
            <span className="tk-cta-arrow" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.25} /></span>
          </Link>
          <div className="tk-barcode" aria-hidden="true">
            <span className="tk-bars" />
            <span className="tk-code">OGCW · SHOP · 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
