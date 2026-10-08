import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Copy, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { ShopShell, euro, guideTotal } from "../components/shop-kit";
import { buyUrl, fullName, retailerOf } from "../data/shop";
import { cart, useCart, type CartLine } from "@/lib/shop-cart";
import { T } from "@/components/site-text";

// Checkout. OGCW sells nothing itself, so checkout is honest about it: the
// cart is split by shop, and each item has its own "Buy at …" link to the
// shop that sells it, where you pick the size and pay. The promo code from
// the cart is here to copy; the guide total is only a guide.
export const Route = createFileRoute("/shop/checkout")({
  head: () => ({ meta: [{ title: "Checkout: OGCW Shop" }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

function Checkout() {
  const { items, count, subtotal, unpriced, code } = useCart();
  const [opened, setOpened] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [undo, setUndo] = useState<CartLine[] | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const groups = [...new Set(items.map((item) => retailerOf(item.product).slug))].map((slug) => {
    const lines = items.filter((item) => retailerOf(item.product).slug === slug);
    return { shop: retailerOf(lines[0]!.product), lines, total: lines.reduce((sum, item) => sum + (item.product.price ?? 0) * item.qty, 0), open: lines.some((item) => item.product.price === undefined) };
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // clipboard blocked: the code is still on the screen
    }
  };
  const clear = () => {
    setUndo(items.map(({ id, qty }) => ({ id, qty })));
    cart.clear();
  };

  return (
    <ShopShell>
      <div className="sx-wrap sx-co">
        <nav className="sx-crumbs" aria-label="Breadcrumb"><Link to="/shop"><T>Shop</T></Link> <span aria-hidden="true">/</span> <span><T k="shop.co.crumb">Checkout</T></span></nav>
        <h1 className="sx-page-title"><T k="shop.co.title">Checkout</T></h1>
        <ol className="sx-co-steps" aria-label="Steps">
          <li data-done><span><Check size={13} aria-hidden="true" /></span> <T k="shop.co.step1">Your cart</T></li>
          <li data-on><span>2</span> <T k="shop.co.step2">Buy at each shop</T></li>
          <li data-done={(items.length > 0 && opened.length >= items.length) || undefined}><span>3</span> <T k="shop.co.step3">Done</T></li>
        </ol>

        {items.length === 0 ? (
          <div className="sx-cart-empty sx-co-empty">
            <ShoppingCart size={56} strokeWidth={1.4} aria-hidden="true" />
            {undo ? (
              <>
                <p><T k="shop.co.cleared">Cart cleared.</T></p>
                <button type="button" className="sx-ghost" onClick={() => { cart.restore(undo); setUndo(null); }}><T k="shop.co.undo">Undo</T></button>
              </>
            ) : <p><T k="shop.cart.empty">Your cart is empty</T></p>}
            <Link to="/shop" className="sx-gold"><T k="shop.cart.continue">Continue shopping</T></Link>
          </div>
        ) : (
          <div className="sx-co-grid">
            <div>
              <p className="sx-co-lead">
                {count} {count === 1 ? "item" : "items"} from {groups.length} {groups.length === 1 ? "shop" : "shops"}. <T k="shop.co.lead">OGCW doesn’t take payment: open each item at its shop, pick your size and pay there. Each shop handles stock, delivery and returns.</T>
              </p>
              <ol className="sx-co-shops">
                {groups.map((group, index) => (
                  <li key={group.shop.slug} className="sx-co-shop">
                    <header className="sx-co-shop-head">
                      <span className="sx-co-num">{index + 1}</span>
                      <h2>{group.shop.name}</h2>
                      <span className="sx-co-shop-sum">{group.lines.length} {group.lines.length === 1 ? "item" : "items"}{group.total > 0 ? ` · ${euro(group.total)}${group.open ? "+" : ""} guide` : ""}</span>
                    </header>
                    <ul className="sx-co-items">
                      {group.lines.map(({ product, qty }) => {
                        const done = opened.includes(product.id);
                        return (
                          <li key={product.id} className="sx-co-item" data-done={done || undefined}>
                            <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-cart-img"><img src={product.image} alt="" /></Link>
                            <div className="sx-cart-info">
                              <Link to="/shop/p/$id" params={{ id: product.id }} className="sx-cart-name">{fullName(product)}</Link>
                              <span className="sx-cart-sub">{product.colour} · {qty} × {product.price !== undefined ? euro(product.price) : "price at the shop"}</span>
                            </div>
                            <a className={done ? "sx-ghost" : "sx-gold"} href={buyUrl(product)} target="_blank" rel="noopener noreferrer sponsored" onClick={() => setOpened((list) => (list.includes(product.id) ? list : [...list, product.id]))}>
                              {done ? <><Check size={15} aria-hidden="true" /> <T k="shop.co.opened">Opened</T></> : <><T k="shop.co.buy">Buy at</T> {group.shop.name} <ArrowUpRight size={15} aria-hidden="true" /></>}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="sx-co-sum" aria-labelledby="co-sum">
              <h2 id="co-sum"><T k="shop.co.summary">Summary</T></h2>
              <dl className="sx-sum">
                <div><dt><T k="shop.cart.subtotal">Subtotal (guide)</T></dt><dd>{euro(subtotal)}</dd></div>
                {unpriced > 0 && <div><dt><T k="shop.cart.unpriced">Priced at the shop</T></dt><dd>{unpriced} {unpriced === 1 ? "item" : "items"}</dd></div>}
                <div><dt><T k="shop.cart.shipping">Shipping</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
                <div><dt><T k="shop.cart.tax">Tax</T></dt><dd><T k="shop.cart.byshop">Set by each shop</T></dd></div>
                <div className="sx-sum-total"><dt><T k="shop.cart.total">Total</T></dt><dd>{guideTotal(subtotal, unpriced)}</dd></div>
              </dl>
              {code && (
                <div className="sx-co-code">
                  <span className="sx-kicker"><T k="shop.co.code">Your promo code</T></span>
                  <div className="sx-co-code-row">
                    <strong>{code}</strong>
                    <button type="button" className="sx-ghost" onClick={copy}>{copied ? <><Check size={14} aria-hidden="true" /> Copied</> : <><Copy size={14} aria-hidden="true" /> Copy</>}</button>
                  </div>
                  <p><T k="shop.co.code.note">Paste it at the shop’s checkout. A code only works at a shop that offers it.</T></p>
                </div>
              )}
              <p className="sx-co-progress" aria-live="polite">{opened.length} of {items.length} shop {items.length === 1 ? "link" : "links"} opened</p>
              <div className="sx-co-actions">
                <Link to="/shop" className="sx-ghost"><T k="shop.cart.continue">Continue shopping</T></Link>
                <button type="button" className="sx-textbtn" onClick={clear}><T k="shop.co.clear">Clear the cart</T></button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
