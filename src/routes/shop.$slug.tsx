import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { ProductGrid, ShopShell } from "../components/shop-kit";
import { BRANDS, getBrand, isLive, productsOf, type ShopCategory } from "../data/shop";
import { T } from "@/components/site-text";

// A brand's own shop: its name big, the OGCW note on it, its products
// (filter by department, sort by price) and the other brands.
export const Route = createFileRoute("/shop/$slug")({
  beforeLoad: ({ params }) => {
    if (!getBrand(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const brand = getBrand(params.slug);
    const title = brand ? `Shop ${brand.name} — OGCW Shop` : "OGCW Shop";
    return { meta: [{ title }, { name: "description", content: brand?.blurb ?? "" }, { property: "og:title", content: title }, { property: "og:type", content: "website" }] };
  },
  component: BrandPage,
});

type Sort = "featured" | "low" | "high";

function BrandPage() {
  const { slug } = Route.useParams();
  const brand = getBrand(slug);
  const [dept, setDept] = useState<"All" | ShopCategory>("All");
  const [sort, setSort] = useState<Sort>("featured");
  if (!brand) return null;
  const all = productsOf(brand.slug);
  const depts = ["All", ...new Set(all.map((product) => product.category))] as ("All" | ShopCategory)[];
  let products = dept === "All" ? all : all.filter((product) => product.category === dept);
  if (sort !== "featured") products = [...products].sort((a, b) => ((a.price ?? 1e9) - (b.price ?? 1e9)) * (sort === "low" ? 1 : -1));
  const others = BRANDS.filter((item) => item.slug !== brand.slug);

  return (
    <ShopShell>
      <section className="sx-brand-hero" data-band="dark" aria-labelledby="brand-title">
        <div className="sx-wrap sx-brand-hero-grid">
          <div>
            <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <Link to="/shop/brands"><T>Brands</T></Link></nav>
            <h1 id="brand-title" className="sx-brand-big">{brand.name}</h1>
            <p className="sx-hero-text">{brand.blurb}</p>
            <a className="sx-btn sx-btn-line" href={brand.site} target="_blank" rel="noopener noreferrer"><T>Visit</T> {brand.name} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="sx-brand-hero-art">
            {all.slice(0, 3).map((product) => (isLive(product) ? <img key={product.id} src={product.image} alt="" /> : <span key={product.id} className="sx-blank-photo" />))}
          </div>
        </div>
      </section>

      <section className="sx-wrap sx-section" aria-label={`${brand.name} products`}>
        <div className="sx-toolbar">
          <div className="sx-tabs" role="group" aria-label="Department">
            {depts.map((item) => <button key={item} type="button" className="sx-opt" aria-pressed={dept === item} onClick={() => setDept(item)}>{item}</button>)}
          </div>
          <span className="sx-count-line" />
          <label className="sx-sort">
            <span><T k="shop.sort">Sort</T></span>
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
            </select>
          </label>
        </div>
        <ProductGrid products={products} cols={4} />
      </section>

      <section className="sx-wrap sx-section" aria-labelledby="other-brands">
        <header className="sx-head"><div><p className="sx-kicker"><T k="shop.brand.more.kicker">Keep shopping</T></p><h2 id="other-brands" className="sx-title"><T k="shop.brand.more">More brands</T></h2></div></header>
        <ul className="sx-brand-wall">
          {others.map((item) => (
            <li key={item.slug}><Link to="/shop/$slug" params={{ slug: item.slug }} className="sx-brand-tile"><span className="sx-brand-name">{item.name}</span></Link></li>
          ))}
        </ul>
      </section>
    </ShopShell>
  );
}
