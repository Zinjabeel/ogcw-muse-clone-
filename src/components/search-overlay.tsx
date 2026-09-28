import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LISTS, searchSite, type Hit } from "@/data/content";
import { Thumb } from "./nav-drawer";
import { HitLink, hitLabel, hitSub, hitTitle, Poster } from "./cards";

// Full-screen search, opened from the header and the menu. Matches stories,
// Originals and shops as you type; each result opens its own page. Shows the
// most-read stories before you type.

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setQuery("");
      el.showModal();
      input.current?.focus();
    }
  }, [open]);

  // Every way of closing (Esc, the X, picking a result) goes through the native close event.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);

  const close = () => dialog.current?.close();
  const term = query.trim().toLowerCase();
  const results: Hit[] = term ? searchSite(term) : LISTS.mostRead.slice(0, 4).map((item) => ({ kind: "article", item }));

  return (
    <dialog ref={dialog} className="search" aria-label="Search OGCW">
      <div className="search-inner">
        <div className="search-bar">
          <Search size={22} strokeWidth={1.5} aria-hidden="true" />
          <label htmlFor="site-search" className="sr-only">Search OGCW</label>
          <input
            ref={input}
            id="site-search"
            type="search"
            placeholder="Search stories, Originals and shops"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // A search field eats the first Esc to clear itself; close straight away instead.
            onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); close(); } }}
          />
          <button type="button" className="search-close" aria-label="Close search" onClick={close}>
            <X size={22} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="search-label" aria-live="polite">
          {term ? (results.length ? `${results.length} ${results.length === 1 ? "result" : "results"}` : `Nothing matches “${query.trim()}” yet`) : "Most read"}
        </p>
        <ul className="search-results">
          {results.map((hit) => (
            <li key={hit.kind + hit.item.slug}>
              <HitLink hit={hit} className="search-result" onClick={close}>
                {hit.kind === "episode" ? (
                  <span className="drawer-thumb drawer-thumb-poster"><Poster episode={hit.item} play={false} /></span>
                ) : (
                  <Thumb photo={hit.kind === "article" ? hit.item.photo : hit.item.hero} />
                )}
                <span>
                  <span className="search-result-title">{hitTitle(hit)}</span>
                  <span className="search-result-sub">{hitLabel(hit)} · {hitSub(hit)}</span>
                </span>
              </HitLink>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
