import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { LIVE_PRODUCTS, fullName, getProduct, type ShopProduct } from "@/data/shop";
import { moreLike, searchShop } from "@/lib/shop-search";
import { ProductPhoto, brandLine, dollars, firstTapShowsBack, Was } from "./shop-kit";
import { T } from "./site-text";

// The shop's search, after Moncler's: the search icon drops a panel under
// the header with one big line to type on ("Type to search"), featured
// pieces and categories while it's empty, and as you type, the pieces in a
// grid under All, Men and Women tabs. It reads typos and intent (see
// src/lib/shop-search.ts): "nike shyes" shows Nike sneakers, says so, and
// when nothing fits exactly it shows the closest. Enter opens the full list.

const FEATURED = ["aj1-royal-2026", "travis-scott-af1-ice-blue", "sp5der-pnk-hoodie", "rolex-land-dweller-36", "days-before-rodeo-hoodie", "levis-denim-tears-logo-japan-jeans"];
const CATEGORIES: { label: string; q: string }[] = [
  { label: "Jordan retros for him", q: "mens jordans" },
  { label: "Sneakers for her", q: "womens sneakers" },
  { label: "Denim, from Amiri to Ksubi", q: "jeans" },
  { label: "Hoodies and sweats", q: "hoodies" },
  { label: "Rolex, Cartier and the Geneva houses", q: "watches" },
  { label: "Caps, beanies and bags", q: "caps and bags" },
];
type Tab = "all" | "men" | "women";

export function ShopSearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState(""); // the query, a beat after the last key
  const [tab, setTab] = useState<Tab>("all");
  useEffect(() => { const timer = window.setTimeout(() => setTyped(query), 110); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => input.current?.focus());
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.documentElement.dataset["searchOpen"] = "";
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", onKey); delete document.documentElement.dataset["searchOpen"]; };
  }, [open, onClose]);
  useEffect(() => setTab("all"), [typed]);

  const result = useMemo(() => (typed.trim() ? searchShop(typed, { typing: true }) : null), [typed]);
  const shown = useMemo(() => {
    if (!result) return [];
    const list = tab === "all" ? result.results : result.results.filter((product) => product.gender === tab || product.gender === "unisex");
    return list.slice(0, 12);
  }, [result, tab]);
  const more = useMemo(() => (result && result.results.length < 4 ? moreLike(result, 8) : []), [result]);
  const featured = useMemo(() => FEATURED.map(getProduct).filter((product): product is ShopProduct => !!product && LIVE_PRODUCTS.includes(product)), []);

  const go = (q: string) => { onClose(); navigate({ to: "/shop/all", search: q.trim() ? { q: q.trim() } : {} }); };
  const onSubmit = (event: FormEvent) => { event.preventDefault(); go(query); };
  if (!open) return null;
  const intent = result?.intent;
  return (
    <>
      <div className="ss" role="dialog" aria-modal="true" aria-label="Search the shop">
        <div className="ss-in">
          <div className="ss-top">
            <p className="ss-label"><T k="shop.search.label">Search</T></p>
            <button type="button" className="ss-x" onClick={onClose} aria-label="Close the search"><X size={18} strokeWidth={1.6} aria-hidden="true" /></button>
          </div>
          <form className="ss-form" role="search" onSubmit={onSubmit} data-typed={query ? "" : undefined}>
            <label htmlFor={id} className="sr-only">Search the shop</label>
            <input ref={input} id={id} type="search" placeholder="Type to search" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" spellCheck={false} enterKeyHint="search" />
            {query && <button type="button" className="ss-clear" onClick={() => { setQuery(""); input.current?.focus(); }}><T k="shop.search.clear">Clear</T></button>}
          </form>

          {!result ? (
            <div className="ss-empty">
              <section aria-labelledby="ss-featured">
                <h2 id="ss-featured" className="ss-h"><T k="shop.search.featured">Featured items</T></h2>
                <ul className="ss-thumbs">
                  {featured.map((product) => (
                    <li key={product.id}>
                      <Link to="/shop/p/$id" params={{ id: product.id }} className="ss-thumb" onClick={onClose} aria-label={fullName(product)}>
                        <ProductPhoto product={product} className="ss-thumb-photo" hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="ss-cats">
                <h2 id="ss-cats" className="ss-h"><T k="shop.search.cats">Featured categories</T></h2>
                <ul className="ss-cats">
                  {CATEGORIES.map((item) => <li key={item.q}><button type="button" onClick={() => go(item.q)}>{item.label}</button></li>)}
                </ul>
              </section>
            </div>
          ) : (
            <div className="ss-results" aria-live="polite">
              <div className="ss-read">
                {intent?.fixed && <p className="ss-fixed">Showing results for <button type="button" onClick={() => setQuery(intent.read)}>{intent.read}</button></p>}
                <p className="ss-intent">
                  {result.exact ? <>{intent?.label || `“${typed.trim()}”`}</> : result.loosened.includes("everything") ? <>Nothing for “{typed.trim()}” yet. What’s trending instead:</> : <>No exact match for {intent?.label ? intent.label.toLowerCase() : `“${typed.trim()}”`}. The closest:</>}
                </p>
              </div>
              <div className="ss-tabs" role="tablist" aria-label="Who it’s for">
                {(["all", "men", "women"] as const).map((item) => (
                  <button key={item} type="button" role="tab" aria-selected={tab === item} className="ss-tab" onClick={() => setTab(item)}>{item === "all" ? "All" : item === "men" ? "Men" : "Women"}</button>
                ))}
              </div>
              {shown.length ? (
                <ul className="ss-grid">
                  {shown.map((product) => <li key={product.id}><ResultCard product={product} onPick={onClose} /></li>)}
                </ul>
              ) : (
                <p className="ss-none">Nothing for {tab === "men" ? "men" : "women"} here. <button type="button" onClick={() => setTab("all")}>See all</button></p>
              )}
              {more.length > 0 && (
                <>
                  <h2 className="ss-h ss-h-more"><T k="shop.search.more">More like it</T></h2>
                  <ul className="ss-grid">{more.map((product) => <li key={product.id}><ResultCard product={product} onPick={onClose} /></li>)}</ul>
                </>
              )}
              <button type="button" className="ss-all" onClick={() => go(query)}>
                <T k="shop.search.all">See the full list</T> <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <div className="ss-help">
          <p><T k="shop.search.help">Need a hand?</T></p>
          <nav aria-label="Shop help">
            <Link to="/shop/brands" onClick={onClose}><T k="shop.search.help.brands">Brands A to Z</T></Link>
            <Link to="/shop/drops" onClick={onClose}><T k="shop.search.help.upcoming">Upcoming releases</T></Link>
            <Link to="/shop/saved" onClick={onClose}><T k="shop.search.help.saved">Saved pieces</T></Link>
            <Link to="/info/$slug" params={{ slug: "faq" }} onClick={onClose}><T k="shop.search.help.faq">Questions</T></Link>
          </nav>
        </div>
      </div>
      <div className="ss-dim" aria-hidden="true" onClick={onClose} />
    </>
  );
}

function ResultCard({ product, onPick }: { product: ShopProduct; onPick: () => void }) {
  return (
    <Link to="/shop/p/$id" params={{ id: product.id }} className="ss-card" onClick={(event) => { firstTapShowsBack(event); if (!event.defaultPrevented) onPick(); }}>
      <ProductPhoto product={product} className="ss-card-photo" />
      <span className="ss-card-brand">{brandLine(product)}</span>
      <span className="ss-card-name">{product.name}</span>
      <span className="ss-card-price">{product.price ? <>{dollars(product.price)}<Was product={product} /></> : product.url ? "Sold out" : "Price at the shop"}</span>
    </Link>
  );
}
