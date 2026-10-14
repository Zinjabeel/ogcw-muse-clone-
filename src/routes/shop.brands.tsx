import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { ShopShell } from "../components/shop-kit";
import { BRANDS, isLive, productsOf, type ShopBrand } from "../data/shop";
import { T } from "@/components/site-text";

// Brands A to Z, after Complex Shop's brand directory: an A to Z bar in the
// middle (it stays in view and lights the letter you've reached; letters
// with no brand are greyed out), then each letter with its brands as logo
// tiles. Pointing at a tile lifts it, a soft light follows the pointer and
// three of the brand's pieces slide up from the bottom. Only brands with
// pieces in the shop are listed; the shops we buy from close the page.
// Logos: Simple Icons (CC0) and Wikimedia Commons, trademarks of their
// owners; brands without one there are set in type.
export const Route = createFileRoute("/shop/brands")({
  head: () => ({ meta: [{ title: "Brands A to Z: OGCW Shop" }, { name: "description", content: "Every brand in the OGCW Shop, A to Z: sneakers, denim, streetwear and watches." }] }),
  component: Brands,
});

const LOGOS: Record<string, string> = {
  "acne-studios": "svg", adidas: "svg", amiri: "svg", asics: "svg", "bell-ross": "svg", blancpain: "svg", "cactus-jack": "svg", "grand-seiko": "png",
  hublot: "svg", jordan: "svg", levis: "svg", "new-balance": "svg", nike: "svg", nomos: "png", omega: "svg", panerai: "svg", rolex: "svg",
  supreme: "svg", "tag-heuer": "svg", tudor: "png", "vacheron-constantin": "png",
};
const logoOf = (slug: string) => (LOGOS[slug] ? `/shop/logos/${slug}.${LOGOS[slug]}` : undefined);
const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const letterOf = (brand: ShopBrand) => brand.name[0]!.toUpperCase();

function Brands() {
  const { brands, shops } = useMemo(() => {
    const live = BRANDS.filter((brand) => productsOf(brand.slug).some(isLive)).sort((a, b) => a.name.localeCompare(b.name));
    return { brands: live.filter((brand) => !brand.store), shops: live.filter((brand) => brand.store) };
  }, []);
  const letters = useMemo(() => new Set(brands.map(letterOf)), [brands]);
  const [current, setCurrent] = useState<string>("");

  // The letter you've scrolled to lights up in the bar
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-letter]")];
    const seen = new IntersectionObserver((entries) => {
      const top = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setCurrent(top.target.getAttribute("data-letter") ?? "");
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach((section) => seen.observe(section));
    return () => seen.disconnect();
  }, []);

  return (
    <ShopShell>
      <header className="az-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Brands</T></span></nav>
        <h1 className="az-title"><T k="shop.brands.title">Brands A to Z</T></h1>
        <p className="az-blurb"><T k="shop.brands.blurb">From the sneaker giants to the Geneva watchmakers: every brand with pieces in the shop.</T></p>
      </header>

      <nav className="az-bar" aria-label="Jump to a letter">
        <div className="az-bar-inner">
          {ALPHABET.map((letter) => letters.has(letter)
            ? <a key={letter} href={`#brands-${letter}`} className="az-key" aria-current={current === letter ? "true" : undefined}>{letter}</a>
            : <span key={letter} className="az-key" aria-disabled="true">{letter}</span>)}
        </div>
      </nav>

      <div className="az-list">
        {ALPHABET.filter((letter) => letters.has(letter)).map((letter) => (
          <section key={letter} id={`brands-${letter}`} data-letter={letter} className="az-letter" aria-label={letter}>
            <p className="az-big" aria-hidden="true">{letter}</p>
            <ul className="az-grid">
              {brands.filter((brand) => letterOf(brand) === letter).map((brand) => <li key={brand.slug}><BrandTile brand={brand} /></li>)}
            </ul>
          </section>
        ))}
        {shops.length > 0 && (
          <section className="az-letter az-shops" aria-labelledby="az-shops-title">
            <p className="az-big az-big-word" id="az-shops-title"><T k="shop.brands.shops">Where it’s bought</T></p>
            <ul className="az-grid">{shops.map((brand) => <li key={brand.slug}><BrandTile brand={brand} /></li>)}</ul>
          </section>
        )}
      </div>
    </ShopShell>
  );
}

/** A brand: its logo (or its name set in type), and three of its pieces under the pointer */
function BrandTile({ brand }: { brand: ShopBrand }) {
  const logo = logoOf(brand.slug);
  const pieces = productsOf(brand.slug).filter(isLive).slice(0, 3);
  const follow = (event: PointerEvent<HTMLAnchorElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${((event.clientX - box.left) / box.width) * 100}%`);
    event.currentTarget.style.setProperty("--my", `${((event.clientY - box.top) / box.height) * 100}%`);
  };
  return (
    <Link to="/shop/$slug" params={{ slug: brand.slug }} className="az-tile" onPointerMove={follow} aria-label={`${brand.name}: ${brand.blurb}`}>
      <span className="az-tile-mark">
        {logo ? <img src={logo} alt="" loading="lazy" /> : <span className="az-word">{brand.name}</span>}
      </span>
      <span className="az-tile-foot">
        <span className="az-tile-name">{brand.name}</span>
        <ArrowRight size={15} aria-hidden="true" />
      </span>
      {pieces.length > 0 && (
        <span className="az-peek" aria-hidden="true">
          {pieces.map((piece) => <img key={piece.id} src={piece.image} alt="" loading="lazy" />)}
        </span>
      )}
    </Link>
  );
}
