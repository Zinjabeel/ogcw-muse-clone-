import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { Img, ProductCard } from "../components/cards";
import { getShop, SHOPS, type Product } from "../data/content";

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
              <Link to="/shop">Shop</Link>
              <span aria-hidden="true">/</span>
              <span>{shop.name}</span>
            </nav>
            <h1 id="shop-title" className="og-shop-name">{shop.name}</h1>
            <p className="og-shop-tagline">{shop.tagline}</p>
          </div>
        </section>

        <div className="page-wrap og-shop-intro">
          <p className="og-lede">{shop.intro}</p>
          <div>
            <p className="og-aside-title">Why we like it</p>
            <p className="og-shop-why">{shop.why}</p>
            <a className="og-cta" href={shop.site} target="_blank" rel="noopener noreferrer">Visit {shop.name} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>

        <section className="page-wrap og-block" aria-labelledby="the-edit">
          <div className="og-section-head">
            <h2 id="the-edit" className="og-section-title">The OGCW edit</h2>
            <label className="og-sort">
              <span>Sort</span>
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
            <h2 id="more-shops" className="og-section-title">More shops</h2>
            <Link to="/shop" className="og-more-link">All shops</Link>
          </div>
          <div className="og-grid-3">
            {others.map((s) => (
              <Link key={s.slug} to="/shop/$slug" params={{ slug: s.slug }} className="og-card">
                <Img photo={s.hero} className="og-card-photo" />
                <span className="og-kicker">{s.name}</span>
                <span className="og-card-title">{s.tagline}</span>
              </Link>
            ))}
          </div>
          <Link to="/shop" className="og-back"><ArrowLeft size={16} aria-hidden="true" /> Back to the shop</Link>
        </section>
      </main>
    </SiteShell>
  );
}
