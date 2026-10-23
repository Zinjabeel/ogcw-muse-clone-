import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, Copy, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductPhoto, ShopShell, dollars, guideTotal, PRICES_ON, Was } from "../components/shop-kit";
import { LIVE_PRODUCTS, buyUrl, fullName, retailerOf } from "../data/shop";
import { logoOf } from "../data/shop-logos";
import { cart, useCart, type CartLine } from "@/lib/shop-cart";
import { T } from "@/components/site-text";

// Checkout. OGCW sells nothing itself, so checkout is honest about it: the
// bag is split by shop, one card each, and every piece has its own "Buy at"
// button to its page at the shop, where you confirm the size and pay. On the
// right, the summary: the subtotal at the shops' prices (14 Oct 2026), how
// many pieces you've opened, the promo code to copy, and what each shop
// promises. When every piece is open, the page says you're done.
export const Route = createFileRoute("/shop/checkout")({
  head: () => ({ meta: [{ title: "Checkout: OGCW Shop" }, { name: "description", content: "Check out what’s in your OGCW Shop bag." }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

const key = (line: { id: string; size?: string | undefined }) => `${line.id}|${line.size ?? ""}`;
// What each shop says about itself (from its own pages)
const PROMISE: Record<string, { icon: "check" | "shield"; line: string }> = {
  goat: { icon: "check", line: "GOAT checks every pair and piece before it ships." },
  watchfinder: { icon: "shield", line: "Watchfinder & Co. services each watch and gives a 24-month warranty." },
  "stadium-goods": { icon: "check", line: "Stadium Goods checks every piece before it ships." },
};

function Checkout() {
  const { items, count, code, subtotal, unpriced } = useCart();
  const [opened, setOpened] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(code);
  const [undo, setUndo] = useState<CartLine[] | null>(null);
  useEffect(() => setDraft(code), [code]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const groups = [...new Set(items.map((item) => retailerOf(item.product).slug))].map((slug) => {
    const lines = items.filter((item) => retailerOf(item.product).slug === slug);
    return { shop: retailerOf(lines[0]!.product), lines, total: lines.reduce((sum, item) => sum + (item.product.price ?? 0) * item.qty, 0), open: lines.some((item) => item.product.price === undefined) };
  });
  const done = items.length > 0 && items.every((item) => opened.includes(key(item)));
  const openedCount = items.filter((item) => opened.includes(key(item))).length;
  const step = items.length === 0 ? 1 : done ? 3 : 2;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // clipboard blocked: the code is still on the screen
    }
  };
  const clear = () => {
    setUndo(items.map(({ id, qty, size }) => ({ id, qty, ...(size ? { size } : {}) })));
    cart.clear();
  };
  const suggestions = LIVE_PRODUCTS.filter((product) => product.tags?.includes("trending")).slice(0, 4);

  return (
    <ShopShell>
      <div className="sx-wrap ck">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T k="shop.co.crumb">Checkout</T></span></nav>
        <header className="ck-head">
          <h1 className="ck-title"><T k="shop.co.title">Checkout</T></h1>
          <ol className="ck-steps" aria-label="Steps">
            {["Your bag", "Buy at each shop", "Done"].map((label, i) => (
              <li key={label} data-state={i + 1 < step ? "done" : i + 1 === step ? "on" : undefined}>
                <span className="ck-dot">{i + 1 < step ? <Check size={13} aria-hidden="true" /> : i + 1}</span>
                <T k={`shop.co.step${i + 1}`}>{label}</T>
              </li>
            ))}
          </ol>
        </header>

        {items.length === 0 ? (
          <div className="ck-empty">
            <span className="ck-empty-icon" aria-hidden="true"><ShoppingBag size={34} strokeWidth={1.5} /></span>
            {undo ? (
              <>
                <h2 className="ck-empty-title"><T k="shop.co.cleared">Bag cleared.</T></h2>
                <button type="button" className="sx-ghost" onClick={() => { cart.restore(undo); setUndo(null); }}><T k="shop.co.undo">Undo</T></button>
              </>
            ) : (
              <>
                <h2 className="ck-empty-title"><T k="shop.co.empty">Your bag is empty</T></h2>
                <p className="ck-empty-text"><T k="shop.co.empty.text">Add a few pieces and they’ll wait here, split by the shop that sells them.</T></p>
              </>
            )}
            <Link to="/shop" className="sx-gold"><T k="shop.cart.continue">Continue shopping</T> <ArrowRight size={15} aria-hidden="true" /></Link>
            <ul className="ck-suggest" aria-label="Trending now">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <Link to="/shop/p/$id" params={{ id: product.id }} className="ck-suggest-item">
                    <ProductPhoto product={product} className="ck-suggest-photo" hidden />
                    <span>{product.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="ck-grid">
            <div className="ck-main">
              {done && (
                <div className="ck-done" role="status">
                  <span className="ck-done-icon" aria-hidden="true"><Check size={22} /></span>
                  <div>
                    <p className="ck-done-title"><T k="shop.co.done">All set</T></p>
                    <p className="ck-done-text"><T k="shop.co.done.text">Every piece is open at its shop. Finish paying there; each shop sends its own confirmation.</T></p>
                  </div>
                </div>
              )}
              <p className="ck-lead">
                {count} {count === 1 ? "piece" : "pieces"} from {groups.length} {groups.length === 1 ? "shop" : "shops"}. <T k="shop.co.lead2">OGCW doesn’t take payment: open each piece at its shop, confirm your size and pay there.</T>
              </p>
              {groups.map((group, index) => {
                const logo = logoOf(group.shop.slug);
                const promise = PROMISE[group.shop.slug];
                return (
                  <section key={group.shop.slug} className="ck-shop" aria-labelledby={`ck-shop-${group.shop.slug}`}>
                    <header className="ck-shop-head">
                      <span className="ck-shop-num">{index + 1}</span>
                      {logo ? <img className="ck-shop-logo" src={logo} alt="" /> : null}
                      <h2 id={`ck-shop-${group.shop.slug}`} className="ck-shop-name">{group.shop.name}</h2>
                      <span className="ck-shop-total">{group.total > 0 ? `${dollars(group.total)}${group.open ? " +" : ""}` : "At the shop"}</span>
                    </header>
                    <ul className="ck-items">
                      {group.lines.map((line) => {
                        const { product, qty, size } = line;
                        const isOpen = opened.includes(key(line));
                        return (
                          <li key={key(line)} className="ck-item" data-open={isOpen || undefined}>
                            <Link to="/shop/p/$id" params={{ id: product.id }} className="ck-item-photo-link" aria-label={fullName(product)}>
                              <ProductPhoto product={product} className="ck-item-photo" hidden />
                            </Link>
                            <div className="ck-item-info">
                              <Link to="/shop/p/$id" params={{ id: product.id }} className="ck-item-name">{fullName(product)}</Link>
                              <p className="ck-item-meta">{product.colour}</p>
                              <div className="ck-item-chips">
                                {size && <span className="ck-chip">{product.sizeLabel === "Waist" ? "Waist" : product.sizeLabel === "Case" ? "Case" : "Size"} {size}</span>}
                                {!size && product.sizes && product.sizes.length > 1 && <Link to="/shop/p/$id" params={{ id: product.id }} className="ck-chip ck-chip-ask">Pick a size</Link>}
                                <div className="ck-qty" role="group" aria-label={`Quantity of ${fullName(product)}`}>
                                  <button type="button" onClick={() => cart.set(product.id, qty - 1, size)} aria-label="One less"><Minus size={13} aria-hidden="true" /></button>
                                  <span aria-live="polite">{qty}</span>
                                  <button type="button" onClick={() => cart.set(product.id, qty + 1, size)} aria-label="One more" disabled={qty >= 9}><Plus size={13} aria-hidden="true" /></button>
                                </div>
                                <button type="button" className="ck-remove" onClick={() => cart.remove(product.id, size)} aria-label={`Remove ${fullName(product)}`}><Trash2 size={14} aria-hidden="true" /> <span>Remove</span></button>
                              </div>
                            </div>
                            <div className="ck-item-end">
                              <span className="ck-item-price">{product.price ? <>{dollars(product.price * qty)}<Was product={product} qty={qty} /></> : product.url ? "Sold out" : "At the shop"}</span>
                              <a className={isOpen ? "sx-ghost ck-buy" : "sx-gold ck-buy"} href={buyUrl(product)} target="_blank" rel="noopener noreferrer sponsored" onClick={() => setOpened((list) => (list.includes(key(line)) ? list : [...list, key(line)]))}>
                                {isOpen ? <><Check size={15} aria-hidden="true" /> <T k="shop.co.opened">Opened</T></> : <><T k="shop.co.buy">Buy at</T> {group.shop.name} <ArrowUpRight size={15} aria-hidden="true" /></>}
                              </a>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {promise && (
                      <p className="ck-shop-promise">{promise.icon === "check" ? <BadgeCheck size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />} {promise.line}</p>
                    )}
                  </section>
                );
              })}
              <div className="ck-main-foot">
                <Link to="/shop" className="sx-link"><T k="shop.cart.continue">Continue shopping</T> <ArrowRight size={14} aria-hidden="true" /></Link>
                <button type="button" className="sx-textbtn" onClick={clear}><T k="shop.co.clear2">Clear the bag</T></button>
              </div>
            </div>

            <aside className="ck-sum" aria-labelledby="ck-sum-title">
              <h2 id="ck-sum-title" className="ck-sum-title"><T k="shop.co.summary">Summary</T></h2>
              <dl className="ck-lines">
                <div><dt>{count} {count === 1 ? "piece" : "pieces"}</dt><dd>{guideTotal(subtotal, unpriced)}</dd></div>
                <div><dt><Truck size={14} aria-hidden="true" /> <T k="shop.cart.shipping">Shipping</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
                <div><dt><T k="shop.cart.tax">Tax</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
              </dl>
              <div className="ck-total">
                <span><T k="shop.co.total">Estimated total</T></span>
                <strong>{guideTotal(subtotal, unpriced)}</strong>
              </div>
              <p className="ck-total-note">At the shops’ prices on {PRICES_ON}, in US dollars{unpriced > 0 ? `; ${unpriced} ${unpriced === 1 ? "piece is" : "pieces are"} priced at the shop` : ""}.</p>

              <div className="ck-progress" aria-live="polite">
                <div className="ck-progress-row"><span><T k="shop.co.progress">Opened at the shops</T></span><span>{openedCount} of {items.length}</span></div>
                <span className="ck-bar" aria-hidden="true"><span style={{ width: `${(openedCount / Math.max(1, items.length)) * 100}%` }} /></span>
              </div>

              <form className="ck-code" onSubmit={(event) => { event.preventDefault(); cart.setCode(draft); }}>
                <label htmlFor="ck-code" className="ck-code-label"><T k="shop.co.code">Promo code</T></label>
                <div className="ck-code-row">
                  <input id="ck-code" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a code" autoComplete="off" />
                  {code && draft === code
                    ? <button type="button" className="sx-ghost" onClick={copy}>{copied ? <><Check size={14} aria-hidden="true" /> Copied</> : <><Copy size={14} aria-hidden="true" /> Copy</>}</button>
                    : <button type="submit" className="sx-ghost"><T k="shop.cart.apply">Save</T></button>}
                </div>
                <p className="ck-code-note"><T k="shop.co.code.note">Paste it at the shop’s checkout. A code only works at a shop that offers it.</T></p>
              </form>
            </aside>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
