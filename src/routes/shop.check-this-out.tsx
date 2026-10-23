import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { ShopShell, dollars, firstTapShowsBack, ProductPhoto, Was } from "../components/shop-kit";
import { LIVE_PRODUCTS, brandOf, buyUrl, fullName, getProduct, retailerOf, type ShopProduct } from "../data/shop";
import { T } from "@/components/site-text";

// "Check this out": the collabs and grails, one at a time. A full-screen
// opener, then one piece per full-screen panel; each panel slides up over
// the last as you scroll (the words stay still in their panel; only the
// photo eases in), with the second photo under the pointer, its name, and
// two buttons: the piece, and the shop that sells it. Then two strips of
// small pictures, the limited pieces for women and then for men, and every
// limited piece.
export const Route = createFileRoute("/shop/check-this-out")({
  head: () => ({ meta: [{ title: "Check this out: collabs and grails, OGCW Shop" }, { name: "description", content: "Collabs and grails from the OGCW Shop, one at a time: Fragment x Travis Scott, Denim Tears, a Rolex Land-Dweller and more." }] }),
  component: CheckThisOut,
});

// Each piece, with a line saying what it is, from what the shop lists
const PIECES: { id: string; line: string; tone: "ink" | "paper" | "stone" }[] = [
  { id: "fragment-travis-aj1-low-military-blue", line: "Three names on one Air Jordan 1 Low: Hiroshi Fujiwara’s Fragment Design, Travis Scott and Jordan Brand.", tone: "ink" },
  { id: "rolex-land-dweller-36", line: "The Land-Dweller, first shown by Rolex in 2025, with its honeycomb dial.", tone: "paper" },
  { id: "levis-denim-tears-logo-japan-jeans", line: "Levi’s jeans with Denim Tears’ cotton wreaths embroidered all over.", tone: "stone" },
  { id: "days-before-rodeo-hoodie", line: "Cactus Jack and Sp5der together: “Rodeo” in red over “Atlanta”, with the web below.", tone: "ink" },
  { id: "nigel-sylvester-aj4-brick-after-brick", line: "The BMX rider’s Air Jordan 4, in sail and cinnabar.", tone: "paper" },
  { id: "omega-speedmaster-145-022", line: "The Moonwatch, vintage, from 1988.", tone: "stone" },
  { id: "kaws-fragment-tee", line: "KAWS’ Companion, Fragment’s lightning bolt and the Cactus Jack logo on one tee.", tone: "ink" },
  { id: "supreme-dickies-cordura-cargo-denim", line: "Supreme and Dickies: a cargo pant in denim and Cordura.", tone: "paper" },
];

function CheckThisOut() {
  const pieces = PIECES.flatMap((item) => {
    const product = getProduct(item.id);
    return product ? [{ ...item, product }] : [];
  });
  return (
    <ShopShell>
      <div className="co">
        <section className="co-open" aria-labelledby="co-title">
          <p className="co-kicker"><T k="shop.co.kicker">Collabs and grails</T></p>
          <h1 id="co-title" className="co-title"><T k="shop.co.title">Check this out</T></h1>
          <p className="co-sub"><T k="shop.co.sub">The pieces worth stopping for, one at a time.</T></p>
          <a href={`#co-${pieces[0]?.product.id ?? ""}`} className="co-down" aria-label="To the first piece"><ArrowDown size={18} aria-hidden="true" /></a>
        </section>

        <div className="co-stack">
          {pieces.map(({ product, line, tone }) => <Panel key={product.id} product={product} line={line} tone={tone} />)}
        </div>

        <section className="co-strips" aria-label="Limited editions for women and for men">
          <Strip gender="women" kicker="For women" title="Limited, for her" />
          <Strip gender="men" kicker="For men" title="Limited, for him" />
        </section>

        <section className="co-end" aria-labelledby="co-end-title">
          <p className="co-kicker"><T k="shop.co.end.kicker">There’s more</T></p>
          <h2 id="co-end-title" className="co-end-title"><T k="shop.co.end.title">Every limited piece in the shop</T></h2>
          <Link to="/shop/all" search={{ tag: "limited" }} className="sh-cta sh-cta-gold"><T k="shop.co.end.cta">Shop limited editions</T> <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </div>
    </ShopShell>
  );
}

/** A row of small pictures side by side: the limited pieces for women, or for
 *  men (clothes first), topped up with their collabs when there are few */
function Strip({ gender, kicker, title }: { gender: "men" | "women"; kicker: string; title: string }) {
  const theirs = LIVE_PRODUCTS.filter((product) => product.gender === gender && !PIECES.some((piece) => piece.id === product.id));
  const limited = theirs.filter((product) => product.tags?.includes("limited")).sort((a, b) => Number(b.category === "Clothing") - Number(a.category === "Clothing"));
  const collabs = theirs.filter((product) => !limited.includes(product) && / x /i.test(product.name));
  const items = [...limited, ...collabs].slice(0, 10);
  if (!items.length) return null;
  return (
    <div className="co-strip">
      <header className="co-strip-head">
        <div>
          <p className="co-kicker"><T k={`shop.co.strip.${gender}.kicker`}>{kicker}</T></p>
          <h2 className="co-strip-title"><T k={`shop.co.strip.${gender}.title`}>{title}</T></h2>
        </div>
        <Link to={gender === "men" ? "/shop/men" : "/shop/women"} className="co-textlink"><T k={`shop.co.strip.${gender}.all`}>{gender === "men" ? "The men’s shop" : "The women’s shop"}</T> <ArrowRight size={14} aria-hidden="true" /></Link>
      </header>
      <ul className="co-strip-row">
        {items.map((product) => (
          <li key={product.id}>
            <Link to="/shop/p/$id" params={{ id: product.id }} className="co-strip-item" onClick={firstTapShowsBack}>
              <ProductPhoto product={product} className="co-strip-photo" />
              <span className="co-strip-name">{product.name}</span>
              <span className="co-strip-price">{product.price ? <>{dollars(product.price)}<Was product={product} /></> : "At the shop"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ product, line, tone }: { product: ShopProduct; line: string; tone: "ink" | "paper" | "stone" }) {
  const brand = brandOf(product);
  return (
    <section id={`co-${product.id}`} className="co-panel" data-tone={tone} aria-labelledby={`co-name-${product.id}`}>
      <div className="co-panel-inner">
        <Link to="/shop/p/$id" params={{ id: product.id }} className="co-photo sh-square-link" onClick={firstTapShowsBack} aria-label={fullName(product)}>
          <ProductPhoto product={product} className="co-photo-frame" hidden />
        </Link>
        <div className="co-text">
          <p className="co-brand">{brand.store ? product.kind : `${brand.name} · ${product.kind}`}</p>
          <h2 id={`co-name-${product.id}`} className="co-name">{product.name}</h2>
          <p className="co-line">{line}</p>
          <p className="co-colour">{product.colour}{product.note ? ` · ${product.note}` : ""}</p>
          <div className="co-actions">
            <Link to="/shop/p/$id" params={{ id: product.id }} className="sh-cta co-cta"><T k="shop.co.see">See the piece</T> <ArrowRight size={16} aria-hidden="true" /></Link>
            <a href={buyUrl(product)} target="_blank" rel="noopener noreferrer sponsored" className="co-textlink"><T k="shop.buy">Shop at</T> {retailerOf(product).name} <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
