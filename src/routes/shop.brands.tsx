import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ShopShell } from "../components/shop-kit";
import { BRANDS, productsOf } from "../data/shop";
import { T } from "@/components/site-text";

// Every brand in the shop, A to Z, each with a photo of one of its products
export const Route = createFileRoute("/shop/brands")({
  head: () => ({ meta: [{ title: "Brands — OGCW Shop" }, { name: "description", content: "Every brand in the OGCW Shop, A to Z." }] }),
  component: Brands,
});

function Brands() {
  const sorted = [...BRANDS].sort((a, b) => a.name.localeCompare(b.name));
  const letters = [...new Set(sorted.map((brand) => brand.name[0]!.toUpperCase()))];
  return (
    <ShopShell>
      <div className="sx-wrap sx-list-head">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T>Brands</T></span></nav>
        <h1 className="sx-page-title"><T k="shop.brands.title">Brands A–Z</T></h1>
        <p className="sx-page-blurb">{BRANDS.length} brands, from the sneaker giants to the workwear and tech in our stories.</p>
        <nav className="sx-letters" aria-label="Jump to a letter">{letters.map((letter) => <a key={letter} href={`#brands-${letter}`}>{letter}</a>)}</nav>
      </div>
      <div className="sx-wrap sx-section">
        {letters.map((letter) => (
          <section key={letter} id={`brands-${letter}`} className="sx-letter" aria-label={letter}>
            <p className="sx-letter-big" aria-hidden="true">{letter}</p>
            <ul className="sx-brand-cards">
              {sorted.filter((brand) => brand.name[0]!.toUpperCase() === letter).map((brand) => {
                const products = productsOf(brand.slug);
                return (
                  <li key={brand.slug}>
                    <Link to="/shop/$slug" params={{ slug: brand.slug }} className="sx-brand-card">
                      <span className="sx-brand-card-img">{products[0] && <img src={products[0].image} alt="" loading="lazy" />}</span>
                      <span className="sx-brand-card-name">{brand.name}</span>
                      <span className="sx-brand-card-blurb">{brand.blurb}</span>
                      <span className="sx-link">{products.length} products <ArrowRight size={14} aria-hidden="true" /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </ShopShell>
  );
}
