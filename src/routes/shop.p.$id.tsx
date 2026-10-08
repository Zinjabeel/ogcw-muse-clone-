import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AddToCart, BuyButton, Price, ProductGrid, SaveButton, ShopShell, brandLine } from "../components/shop-kit";
import { DROPS } from "../data/drops";
import { PRODUCTS, SHOP_CATEGORIES, brandOf, fullName, getProduct, productsIn, productsOf, retailerOf } from "../data/shop";
import { useStories } from "@/lib/stories";
import { T } from "@/components/site-text";

// A product, on a dark stage like a watchmaker's page: the product big on
// black, its name in wide capitals, the guide price, Add to cart and "Shop
// at" its shop, save, then arrows and dots through the rest of its aisle,
// with the next piece peeking in from the right on a yellow panel. Under
// it: the facts, the story it's in, more from the brand and more like it.
export const Route = createFileRoute("/shop/p/$id")({
  beforeLoad: ({ params }) => {
    if (!getProduct(params.id)) throw notFound();
  },
  head: ({ params }) => {
    const product = getProduct(params.id);
    const title = product ? `${fullName(product)}: OGCW Shop` : "OGCW Shop";
    return { meta: [{ title }, { name: "description", content: product ? `${fullName(product)}, ${product.colour}. Picked by OGCW, bought from ${retailerOf(product).name}.` : "" }, { property: "og:title", content: title }] };
  },
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const product = getProduct(id);
  const stories = useStories();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const aisle = product ? productsIn(product.category) : [];
  const at = aisle.findIndex((item) => item.id === id);
  const prev = aisle[(at - 1 + aisle.length) % aisle.length];
  const next = aisle[(at + 1) % aisle.length];

  // The arrow keys step through the aisle (not while typing)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.altKey || event.ctrlKey || event.metaKey || target.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (event.key === "ArrowLeft" && prev) navigate({ to: "/shop/p/$id", params: { id: prev.id } });
      if (event.key === "ArrowRight" && next) navigate({ to: "/shop/p/$id", params: { id: next.id } });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, prev, next]);
  useEffect(() => setCopied(false), [id]);

  if (!product || !prev || !next) return null;
  const brand = brandOf(product);
  const shop = retailerOf(product);
  const category = SHOP_CATEGORIES.find((item) => item.id === product.category)!;
  const story = product.story ? stories.get(product.story) : undefined;
  const fromBrand = productsOf(brand.slug).filter((item) => item.id !== product.id).slice(0, 4);
  const alike = PRODUCTS.filter((item) => item.id !== product.id && item.brand !== brand.slug && (item.kind === product.kind || item.category === product.category)).slice(0, 8);
  // A pair on the release calendar
  const drop = product.tags?.includes("drops") ? DROPS.find((item) => item.kind === "Sneakers" && item.name.includes(product.name.replace("Retro ", "").split(" ").slice(0, 4).join(" "))) : undefined;
  // Seven dots around this piece, so a long aisle still fits
  const around = Array.from({ length: Math.min(7, aisle.length) }, (_, i) => aisle[(at - Math.min(3, Math.floor(aisle.length / 2)) + i + aisle.length) % aisle.length]!);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // clipboard blocked: nothing to do
    }
  };

  return (
    <ShopShell>
      <div className="sx-wrap">
        <nav className="sx-crumbs" aria-label="Breadcrumb">
          <Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span>
          <Link to="/shop/all" search={{ cat: category.slug }}>{category.label}</Link> <span aria-hidden="true">/</span>
          <Link to="/shop/$slug" params={{ slug: brand.slug }}>{brand.name}</Link>
        </nav>
      </div>

      <section className="px-stage" aria-labelledby="px-name">
        <div className="px-main" key={product.id}>
          <button type="button" className="px-share" onClick={share} aria-label="Copy the link to this product">
            {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
          </button>
          {copied && <span className="px-copied" role="status">Link copied</span>}
          <figure className="px-photo">
            <img src={product.image} alt={`${fullName(product)}, ${product.colour}`} />
          </figure>
          <div className="px-info">
            <Link to="/shop/$slug" params={{ slug: brand.slug }} className="px-brand">{brandLine(product)}</Link>
            <h1 id="px-name" className="px-name">{product.name}</h1>
            <p className="px-colour">{product.colour}</p>
            <div className="px-rule" />
            <p className="px-price"><Price product={product} /> {product.price !== undefined && <small><T k="shop.pdp.guide">guide price</T></small>}</p>
            <div className="px-actions">
              <AddToCart product={product} full />
              <SaveButton product={product} big />
            </div>
            <BuyButton product={product} />
            <p className="px-kind">{product.kind} · {category.label}{shop.slug !== brand.slug ? ` · sold by ${shop.name}` : ""}</p>
            <p className="px-about">{shop.slug !== brand.slug && !brand.store ? shop.blurb : brand.blurb}</p>
            <Link to="/shop/$slug" params={{ slug: brand.slug }} className="px-discover">
              <T k="shop.pdp.discover">Discover</T> {brand.name}
              <span className="px-discover-line" aria-hidden="true" />
              <span className="px-circle"><ArrowRight size={14} aria-hidden="true" /></span>
            </Link>
          </div>
        </div>

        <div className="px-nav">
          <ol className="px-dots" aria-label={`${category.label}: ${at + 1} of ${aisle.length}`}>
            {around.map((item) => (
              <li key={item.id}>
                <Link to="/shop/p/$id" params={{ id: item.id }} aria-label={fullName(item)} aria-current={item.id === product.id ? "page" : undefined} />
              </li>
            ))}
          </ol>
          <span className="px-count">{String(at + 1).padStart(2, "0")} / {String(aisle.length).padStart(2, "0")}</span>
          <div className="px-arrows">
            <Link to="/shop/p/$id" params={{ id: prev.id }} className="px-arrow" aria-label={`Previous: ${fullName(prev)}`}><ArrowLeft size={18} aria-hidden="true" /></Link>
            <span className="px-arrows-rule" aria-hidden="true" />
            <Link to="/shop/p/$id" params={{ id: next.id }} className="px-arrow" aria-label={`Next: ${fullName(next)}`}><ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>

        <Link to="/shop/p/$id" params={{ id: next.id }} className="px-peek" aria-label={`Next: ${fullName(next)}`} key={next.id}>
          <img src={next.image} alt="" />
          <span className="px-peek-label"><T k="shop.pdp.next">Next</T> <ArrowRight size={14} aria-hidden="true" /></span>
        </Link>
      </section>

      <div className="sx-wrap">
        <dl className="px-facts">
          <div><dt><T k="shop.pdp.brand">Brand</T></dt><dd>{brand.name}</dd></div>
          <div><dt><T k="shop.pdp.type">Type</T></dt><dd>{product.kind}</dd></div>
          <div><dt><T k="shop.pdp.colour">Colour</T></dt><dd>{product.colour}</dd></div>
          <div><dt><T k="shop.pdp.shop">Bought from</T></dt><dd><a href={shop.site} target="_blank" rel="noopener noreferrer">{shop.name} <ArrowUpRight size={13} aria-hidden="true" /></a></dd></div>
          <div><dt><T k="shop.pdp.photo">Photo</T></dt><dd>{product.photoPage ? <a href={product.photoPage} target="_blank" rel="noopener noreferrer">{product.credit}</a> : product.credit}</dd></div>
        </dl>

        {(drop || story) && (
          <div className="px-links">
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
        )}

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
