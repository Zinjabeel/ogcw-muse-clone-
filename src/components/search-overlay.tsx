import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { allStories, Thumb } from "./nav-drawer";

// Full-screen black search, opened from the header and the menu. Filters the
// stories the site knows about as you type. Swap allStories for a real search
// endpoint once articles come from the admin panel.

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
  const results = term
    ? allStories.filter((story) => `${story.title} ${story.sub}`.toLowerCase().includes(term))
    : allStories.slice(0, 4);

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
            placeholder="Search stories, artists, scenes"
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
          {term ? (results.length ? `${results.length} ${results.length === 1 ? "story" : "stories"}` : `Nothing matches “${query.trim()}” yet`) : "Popular now"}
        </p>
        <ul className="search-results">
          {results.map((story) => (
            <li key={story.title}>
              <Link to="/news" className="search-result" onClick={close}>
                <Thumb story={story} />
                <span>
                  <span className="search-result-title">{story.title}</span>
                  <span className="search-result-sub">{story.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
