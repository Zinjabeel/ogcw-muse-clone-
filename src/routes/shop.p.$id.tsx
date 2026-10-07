import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { BuyButton, Price, ProductGrid, SaveButton, ShopShell } from "../components/shop-kit";
import { DROPS } from "../data/drops";
import { PRODUCTS, SHOP_CATEGORIES, brandOf, getProduct, productsOf } from "../data/shop";
import { useStories } from "@/lib/stories";
import { T } from "@/components/site-text";

// A product: the photo, the brand and name, the guide price, "Shop at" the
// retailer and save, what it is, where the photo comes from, the story it
// belongs to, more from the brand and more like it.
export const Route = createFileRoute("/shop/p/$id")({
  beforeLoad: ({ params }) => {
    if (!getProduct(params.id)) throw notFound();
  },
  head: ({ params }) => {
    const product = getProduct(params.id);
    const title = product ? `${brandOf(product).name} ${product.name} — OGCW Shop` : "OGCW Shop";
    return { meta: [{ title }, { name: "description", content: product ? `${brandOf(product).name} ${product.name}, ${product.colour}. Picked by OGCW, bought from the retailer.` : "" }, { property: "og:title", content: title }] };
  },
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const product = getProduct(id);
  const stories = useStories();
  if (!product) return null;
  const brand = brandOf(product);
  const category = SHOP_CATEGORIES.find((item) => item.id === product.category)!;
  const story = product.story ? stories.get(product.story) : undefined;
  const fromBrand = productsOf(brand.slug).filter((item) => item.id !== product.id).slice(0, 4);
  const alike = PRODUCTS.filter((item) => item.id !== product.id && item.brand !== brand.slug && (item.kind === product.kind || item.category === product.category)).slice(0, 8);
  // A Jordan on the release calendar
  const drop = product.tags?.includes("drops") ? DROPS.find((item) => item.kind === "Sneakers" && item.name.includes(product.name.replace("Retro ", "").split(" ").slice(0, 4).join(" "))) : undefined;

  return (
    <ShopShell>
      <div className="sx-wrap">
        <nav className="sx-crumbs" aria-label="Breadcrumb">
          <Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span>
          <Link to="/shop/all" search={{ cat: category.slug }}>{category.id}</Link> <span aria-hidden="true">/</span>
          <Link to="/shop/$slug" params={{ slug: brand.slug }}>{brand.name}</Link>
        </nav>
        <div className="sx-pdp">
          <figure className="sx-pdp-photo">
            <img src={product.image} alt={`${brand.name} ${product.name}, ${product.colour}`} />
            <figcaption>
              Photo: {product.photoPage ? <a href={product.photoPage} target="_blank" rel="noopener noreferrer">{product.credit}</a> : product.credit}
            </figcaption>
          </figure>
          <div className="sx-pdp-info">
            <Link to="/shop/$slug" params={{ slug: brand.slug }} className="sx-pdp-brand">{brand.name}</Link>
            <h1 className="sx-pdp-name">{product.name}</h1>
            <p className="sx-pdp-colour">{product.colour}</p>
            <p className="sx-pdp-price"><Price product={product} /> {product.price !== undefined && <small><T k="shop.pdp.guide">guide price</T></small>}</p>
            <div className="sx-pdp-actions">
              <BuyButton product={product} />
              <SaveButton product={product} big />
            </div>
            <ul className="sx-pdp-points">
              <li><Check size={15} aria-hidden="true" /> <T k="shop.pdp.p1">Sizes, stock and delivery from the retailer</T></li>
              <li><Check size={15} aria-hidden="true" /> <T k="shop.pdp.p2">Picked by the OGCW style desk</T></li>
              <li><Check size={15} aria-hidden="true" /> <T k="shop.pdp.p3">No account needed</T></li>
            </ul>
            <dl className="sx-pdp-facts">
              <div><dt><T k="shop.pdp.brand">Brand</T></dt><dd>{brand.name}</dd></div>
              <div><dt><T k="shop.pdp.dept">Department</T></dt><dd>{product.category}</dd></div>
              <div><dt><T k="shop.pdp.type">Type</T></dt><dd>{product.kind}</dd></div>
              <div><dt><T k="shop.pdp.colour">Colour</T></dt><dd>{product.colour}</dd></div>
            </dl>
            <p className="sx-pdp-about">{brand.blurb}</p>
            {drop && (
              <Link to="/shop/drops" className="sx-pdp-drop">
                <span className="sx-kicker"><T k="shop.pdp.drop">On the calendar</T></span>
                <span>{drop.name}: {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(drop.date))}, {drop.detail}</span>
              </Link>
            )}
            {story && (
              <Link to="/news/$slug" params={{ slug: story.slug }} className="sx-pdp-story">
                <img src={story.photo.src} alt="" style={{ objectPosition: story.photo.crop?.pos }} />
                <span>
                  <span className="sx-kicker"><T k="shop.pdp.story">In the story</T></span>
                  <span className="sx-pdp-story-title">{story.title}</span>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {fromBrand.length > 0 && (
          <section className="sx-section" aria-labelledby="from-brand">
            <header className="sx-head"><div><p className="sx-kicker"><T k="shop.pdp.more">More from</T></p><h2 id="from-brand" className="sx-title">{brand.name}</h2></div><Link to="/shop/$slug" params={{ slug: brand.slug }} className="sx-link"><T k="shop.pdp.brandall">The brand shop</T> <ArrowRight size={14} aria-hidden="true" /></Link></header>
            <ProductGrid products={fromBrand} cols={4} />
          </section>
        )}
        {alike.length > 0 && (
          <section className="sx-section" aria-labelledby="alike">
            <header className="sx-head"><div><p className="sx-kicker"><T k="shop.pdp.alike.kicker">You might also like</T></p><h2 id="alike" className="sx-title"><T k="shop.pdp.alike">More like this</T></h2></div></header>
            <ProductGrid products={alike} cols={4} />
          </section>
        )}
      </div>
    </ShopShell>
  );
}
