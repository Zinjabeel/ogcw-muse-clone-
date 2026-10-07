import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductGrid, ProductTile, ShopHead, ShopShell } from "../components/shop-kit";
import { BRANDS, GIFT_BANDS, PRODUCTS, SHOP_CATEGORIES, SNEAKER_DROPS, getProduct, productsOf } from "../data/shop";
import { useStories } from "@/lib/stories";
import { T } from "@/components/site-text";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "The OGCW Shop — sneakers, streetwear and the things in our stories" },
      { name: "description", content: "Shop sneakers, jackets, caps, watches and tech from 27 brands, picked by the OGCW style desk and bought straight from the retailer." },
      { property: "og:title", content: "The OGCW Shop" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShopHome,
});

const HERO = ["jordan-4-retro-grey", "nb-550-white-burgundy", "nintendo-switch-2"].map((id) => getProduct(id)!);
const day = (iso: string) => new Date(iso).getUTCDate();
const mon = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(iso));

function ShopHome() {
  const stories = useStories();
  const today = new Date().toISOString().slice(0, 10);
  const trending = PRODUCTS.filter((product) => product.tags?.includes("trending")).slice(0, 10);
  const fresh = PRODUCTS.filter((product) => product.tags?.includes("new")).slice(0, 5);
  const drops = SNEAKER_DROPS.filter((drop) => drop.date >= today).slice(0, 6);
  // Shop the story: stories with products tied to them
  const storySlugs = [...new Set(PRODUCTS.flatMap((product) => (product.story ? [product.story] : [])))];
  const shopStories = storySlugs.flatMap((slug) => {
    const story = stories.get(slug);
    return story ? [{ story, products: PRODUCTS.filter((product) => product.story === slug).slice(0, 2) }] : [];
  }).slice(0, 4);

  return (
    <ShopShell>
      {/* Hero */}
      <section className="sx-hero" data-band="dark" aria-labelledby="shop-hero-title">
        <div className="sx-wrap sx-hero-grid">
          <div className="sx-hero-copy">
            <p className="sx-kicker"><T k="shop.home.kicker">The OGCW Shop</T></p>
            <h1 id="shop-hero-title" className="sx-hero-title"><T k="shop.home.title">Wear the culture.</T></h1>
            <p className="sx-hero-text"><T k="shop.home.text">Sneakers, jackets, caps, watches and tech from 27 brands: the things in our stories, picked by the style desk and bought straight from the retailer.</T></p>
            <div className="sx-hero-ctas">
              <Link to="/shop/all" search={{ cat: "sneakers" }} className="sx-btn"><T k="shop.home.cta">Shop sneakers</T> <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to="/shop/all" search={{ tag: "new" }} className="sx-btn sx-btn-line"><T k="shop.home.cta2">New in</T></Link>
            </div>
            <dl className="sx-stats">
              <div><dt>{PRODUCTS.length}</dt><dd><T k="shop.home.stat1">products</T></dd></div>
              <div><dt>{BRANDS.length}</dt><dd><T k="shop.home.stat2">brands</T></dd></div>
              <div><dt>{SNEAKER_DROPS.filter((drop) => drop.date >= today).length}</dt><dd><T k="shop.home.stat3">release dates</T></dd></div>
            </dl>
          </div>
          <div className="sx-hero-art">
            {HERO.map((product, index) => (
              <Link key={product.id} to="/shop/p/$id" params={{ id: product.id }} className={`sx-hero-card sx-hero-card-${index + 1}`}>
                <img src={product.image} alt={product.name} />
                <span>{product.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="sx-wrap sx-section" aria-labelledby="depts-title">
        <ShopHead k="shop.home.depts" kicker="Departments" title="Shop by department" />
        <h2 id="depts-title" className="sr-only">Departments</h2>
        <ul className="sx-cats">
          {SHOP_CATEGORIES.map((category) => {
            const items = PRODUCTS.filter((product) => product.category === category.id);
            return (
              <li key={category.id}>
                <Link to="/shop/all" search={{ cat: category.slug }} className="sx-cat">
                  <img src={items[0]?.image} alt="" loading="lazy" />
                  <span className="sx-cat-text">
                    <span className="sx-cat-name"><T>{category.id}</T></span>
                    <span className="sx-cat-blurb"><T>{category.blurb}</T></span>
                    <span className="sx-cat-count">{items.length} products <ArrowRight size={14} aria-hidden="true" /></span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Trending */}
      <section className="sx-wrap sx-section" aria-label="Trending now">
        <ShopHead k="shop.home.trending" kicker="Right now" title="Trending in the shop">
          <Link to="/shop/all" search={{ tag: "trending" }} className="sx-link"><T k="shop.home.trending.all">See all</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </ShopHead>
        <ProductGrid products={trending} cols={5} />
      </section>

      {/* Release dates */}
      <section className="sx-drops" data-band="dark" aria-label="Sneaker release dates">
        <div className="sx-wrap">
          <ShopHead k="shop.home.drops" kicker="Release dates" title="Coming soon to the calendar">
            <Link to="/shop/drops" className="sx-link"><T k="shop.home.drops.all">Every date</T> <ArrowRight size={14} aria-hidden="true" /></Link>
          </ShopHead>
          <ol className="sx-drop-row">
            {drops.map((drop) => (
              <li key={drop.date + drop.name}>
                <span className="sx-drop-date"><span>{day(drop.date)}</span>{mon(drop.date)}</span>
                <span className="sx-drop-name">{drop.name}</span>
                <span className="sx-drop-price">{drop.detail}</span>
              </li>
            ))}
          </ol>
          <p className="sx-fine"><T k="shop.home.drops.fine">Dates and retail prices from Just Fresh Kicks; brands can move a date at short notice.</T></p>
        </div>
      </section>

      {/* New in */}
      <section className="sx-wrap sx-section" aria-label="New in">
        <ShopHead k="shop.home.new" kicker="Just landed" title="New in">
          <Link to="/shop/all" search={{ tag: "new" }} className="sx-link"><T k="shop.home.new.all">See all</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </ShopHead>
        <div className="sx-new">
          {fresh[0] && <ProductTile product={fresh[0]} size="lg" />}
          <ProductGrid products={fresh.slice(1)} cols={4} />
        </div>
      </section>

      {/* Shop the story */}
      {shopStories.length > 0 && (
        <section className="sx-wrap sx-section" aria-label="Shop the story">
          <ShopHead k="shop.home.story" kicker="Shop the story" title="From our stories to your shelf" />
          <ul className="sx-stories">
            {shopStories.map(({ story, products }) => (
              <li key={story.slug} className="sx-story">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="sx-story-head">
                  <img src={story.photo.src} alt="" loading="lazy" style={{ objectPosition: story.photo.crop?.pos }} />
                  <span className="sx-story-kicker">{story.kicker}</span>
                  <span className="sx-story-title">{story.title}</span>
                </Link>
                <ul className="sx-story-products">
                  {products.map((product) => (
                    <li key={product.id}>
                      <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-mini">
                        <img src={product.image} alt="" loading="lazy" />
                        <span>{product.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Gift guide */}
      <section className="sx-gifts" data-band="gold" aria-label="Gift guide">
        <div className="sx-wrap">
          <ShopHead k="shop.home.gifts" kicker="Gift guide" title="Gifts for every budget">
            <Link to="/shop/gifts" className="sx-link"><T k="shop.home.gifts.all">The full guide</T> <ArrowRight size={14} aria-hidden="true" /></Link>
          </ShopHead>
          <ul className="sx-bands">
            {GIFT_BANDS.map((band) => {
              const items = PRODUCTS.filter((product) => band.test(product.price));
              return (
                <li key={band.id}>
                  <Link to="/shop/gifts" hash={band.id} className="sx-band-card">
                    <span className="sx-band-imgs">{items.slice(0, 3).map((product) => <img key={product.id} src={product.image} alt="" loading="lazy" />)}</span>
                    <span className="sx-band-label"><T>{band.label}</T></span>
                    <span className="sx-band-count">{items.length} ideas</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Brands */}
      <section className="sx-wrap sx-section" aria-label="Brands">
        <ShopHead k="shop.home.brands" kicker="Brands" title={`${BRANDS.length} brands, one edit`}>
          <Link to="/shop/brands" className="sx-link"><T k="shop.home.brands.all">All brands</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </ShopHead>
        <ul className="sx-brand-wall">
          {BRANDS.map((brand) => (
            <li key={brand.slug}>
              <Link to="/shop/$slug" params={{ slug: brand.slug }} className="sx-brand-tile">
                <span className="sx-brand-name">{brand.name}</span>
                <span className="sx-brand-count">{productsOf(brand.slug).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </ShopShell>
  );
}
