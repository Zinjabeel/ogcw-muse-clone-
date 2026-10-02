import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { Img, ProductCard } from "../components/cards";
import { getShop, SHOPS, type Product } from "../data/content";
import { T } from "@/components/site-text";

// A dedicated page per shop: a banner, the OGCW note on the brand, the edit
// of products with guide prices (filter by category, sort by price), each
// linking out to the retailer, and the other shops.
export const Route = createFileRoute("/shop/$slug")({
  beforeLoad: ({ params }) => {
    if (!getShop(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const shop = getShop(params.slug);
    const title = shop ? `Shop ${shop.name} — OGCW` : "Shop — OGCW";
    return {
      meta: [
        { title },
        { name: "description", content: shop?.intro ?? "" },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: ShopPage,
});

type Sort = "featured" | "low" | "high";

function ShopPage() {
  const { slug } = Route.useParams();
  const shop = getShop(slug);
  const [category, setCategory] = useState<"All" | Product["category"]>("All");
  const [sort, setSort] = useState<Sort>("featured");
  if (!shop) return null;

  const categories = ["All", ...Array.from(new Set(shop.products.map((p) => p.category)))] as ("All" | Product["category"])[];
  let products = category === "All" ? shop.products : shop.products.filter((p) => p.category === category);
  if (sort !== "featured") products = [...products].sort((a, b) => (sort === "low" ? a.price - b.price : b.price - a.price));
  const others = SHOPS.filter((s) => s.slug !== shop.slug);

  return (
    <SiteShell>
      <main>
        <section className="og-shop-hero" aria-labelledby="shop-title">
          <Img photo={shop.hero} className="og-shop-hero-photo" eager />
          <div className="page-wrap og-shop-hero-text">
            <nav className="og-crumbs" aria-label="Breadcrumb">
              <Link to="/shop"><T>Shop</T></Link>
              <span aria-hidden="true">/</span>
              <span><T>{shop.name}</T></span>
            </nav>
            <h1 id="shop-title" className="og-shop-name"><T>{shop.name}</T></h1>
            <p className="og-shop-tagline"><T>{shop.tagline}</T></p>
          </div>
        </section>

        <div className="page-wrap og-shop-intro">
          <p className="og-lede">{shop.intro}</p>
          <div>
            <p className="og-aside-title"><T>Why we like it</T></p>
            <p className="og-shop-why">{shop.why}</p>
            <a className="og-cta" href={shop.site} target="_blank" rel="noopener noreferrer"><T>Visit</T> {shop.name} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>

        <section className="page-wrap og-block" aria-labelledby="the-edit">
          <div className="og-section-head">
            <h2 id="the-edit" className="og-section-title"><T>The OGCW edit</T></h2>
            <label className="og-sort">
              <span><T>Sort</T></span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
          {categories.length > 2 && (
            <div className="og-filters" role="group" aria-label="Filter by category">
              {categories.map((c) => (
                <button key={c} type="button" className="og-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          )}
          <ul className="og-products">
            {products.map((product) => (
              <li key={product.name + product.detail}><ProductCard product={product} shop={shop} /></li>
            ))}
          </ul>
          <p className="og-fine">{shop.priceNote}, shown in euros. Stock, sizes and the final price are set by {shop.name}. Product photos via Unsplash.</p>
        </section>

        <section className="page-wrap og-more" aria-labelledby="more-shops">
          <div className="og-section-head">
            <h2 id="more-shops" className="og-section-title"><T>More shops</T></h2>
            <Link to="/shop" className="og-more-link"><T>All shops</T></Link>
          </div>
          <div className="og-grid-3">
            {others.map((s) => (
              <Link key={s.slug} to="/shop/$slug" params={{ slug: s.slug }} className="og-card">
                <Img photo={s.hero} className="og-card-photo" />
                <span className="og-kicker"><T>{s.name}</T></span>
                <span className="og-card-title"><T>{s.tagline}</T></span>
              </Link>
            ))}
          </div>
          <Link to="/shop" className="og-back"><ArrowLeft size={16} aria-hidden="true" /> <T>Back to the shop</T></Link>
        </section>
      </main>
    </SiteShell>
  );
}
