import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Info, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { articlesIn, ARTICLES, EPISODES, LISTS, SHOPS, type Article, type Episode, type Photo, type Shop } from "@/data/content";
import { Poster } from "./cards";

// Site menu, modelled on complex.com’s: a 380px drawer from the left over a
// blurred, darkened page. Section rows open a sub-panel of that section’s
// stories, episodes or shops (each linking to its own page); a "Featured"
// strip and utility links sit below the list.

type Item = { kind: "article"; a: Article } | { kind: "episode"; e: Episode } | { kind: "shop"; s: Shop };
type SectionPath = "/news" | "/music" | "/culture" | "/originals" | "/shop" | "/trends" | "/blog" | "/about";
type Section = { label: string; to: SectionPath; items?: Item[] };

const stories = (list: Article[]): Item[] => list.map((a) => ({ kind: "article", a }));
const sections: Section[] = [
  { label: "News", to: "/news", items: stories(ARTICLES.slice(0, 4)) },
  { label: "Music", to: "/music", items: stories(articlesIn("music")) },
  { label: "Culture", to: "/culture", items: stories(articlesIn("culture").slice(0, 4)) },
  { label: "Originals", to: "/originals", items: EPISODES.slice(0, 4).map((e) => ({ kind: "episode", e })) },
  { label: "Shop", to: "/shop", items: SHOPS.map((s) => ({ kind: "shop", s })) },
  { label: "Trends", to: "/trends" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
];

const featured = LISTS.featured.slice(0, 4);

export function Thumb({ photo }: { photo: Photo }) {
  const crop = photo.crop ?? { pos: "50% 50%" };
  return (
    <span className="drawer-thumb">
      <img
        src={photo.src}
        alt=""
        loading="lazy"
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom ?? 1), ["--origin" as string]: crop.pos }}
      />
    </span>
  );
}

function DrawerCard({ item, onGo, large = false }: { item: Item; onGo: () => void; large?: boolean }) {
  const className = `drawer-card${large ? " drawer-card-large" : ""}`;
  if (item.kind === "article") {
    const { a } = item;
    return (
      <Link to="/news/$slug" params={{ slug: a.slug }} className={className} onClick={onGo}>
        <Thumb photo={a.photo} />
        <span className="drawer-card-title">{a.title}</span>
        <span className="drawer-card-sub">{a.kicker} / {a.read}</span>
      </Link>
    );
  }
  if (item.kind === "episode") {
    const { e } = item;
    return (
      <Link to="/originals/$slug" params={{ slug: e.slug }} className={className} onClick={onGo}>
        <span className="drawer-thumb drawer-thumb-poster"><Poster episode={e} play={false} /></span>
        <span className="drawer-card-title">{e.title}</span>
        <span className="drawer-card-sub">{e.series} / {e.length}</span>
      </Link>
    );
  }
  const { s } = item;
  return (
    <Link to="/shop/$slug" params={{ slug: s.slug }} className={className} onClick={onGo}>
      <Thumb photo={s.hero} />
      <span className="drawer-card-title">Shop {s.name}</span>
      <span className="drawer-card-sub">{s.tagline}</span>
    </Link>
  );
}

export function NavDrawer({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Section | null>(null);
  const [closing, setClosing] = useState(false);
  // The section tab for the page you’re on gets the active style
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentLabel = sections.find((s) => pathname === s.to || pathname.startsWith(`${s.to}/`))?.label;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setActive(null);
      el.showModal();
    }
  }, [open]);

  // Listen for the native close event so every way of closing reports back.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);

  const close = (then?: () => void) => {
    const el = dialog.current;
    if (!el || closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      el.close();
      setClosing(false);
      then?.();
    };
    if (reduce) return finish();
    setClosing(true);
    window.setTimeout(finish, 220);
  };

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-label="Menu"
      data-closing={closing ? "" : undefined}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div className="drawer-inner">
        <div className="drawer-top">
          <button type="button" className="drawer-close" aria-label="Close menu" onClick={() => close()}>
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-panels" data-sub={active ? "" : undefined}>
          {/* Main panel: sections, featured strip, utility links */}
          <div className="drawer-panel drawer-panel-main" inert={active !== null}>
            {/* Section list styled as "printstream" tabs (Uiverse.io by bob_3989); the current page’s tab is active */}
            <div className="cs2-printstream-ui drawer-tabs">
              <ul className="sidebar drawer-sections">
                {sections.map((section) => {
                  const current = currentLabel === section.label;
                  const inner = (
                    <>
                      <span className="vtab-label">{section.label}</span>
                      {section.items && <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />}
                      <b className="vtab-bar" aria-hidden="true" />
                      <i className="debris" aria-hidden="true" />
                      <i className="debris" aria-hidden="true" />
                      <i className="debris" aria-hidden="true" />
                    </>
                  );
                  const className = `vtab drawer-row${current ? " active" : ""}`;
                  return (
                    <li key={section.label}>
                      {section.items ? (
                        <button type="button" className={className} aria-current={current ? "page" : undefined} onClick={() => setActive(section)}>{inner}</button>
                      ) : (
                        <Link to={section.to} className={className} aria-current={current ? "page" : undefined} onClick={() => close()}>{inner}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="drawer-featured">
              <p className="drawer-label">Featured</p>
              <ul className="drawer-strip">
                {featured.map((a) => (
                  <li key={a.slug}>
                    <DrawerCard item={{ kind: "article", a }} onGo={() => close()} />
                  </li>
                ))}
              </ul>
            </div>

            <ul className="drawer-utility">
              <li>
                <button type="button" onClick={() => close(onSearch)}>
                  <Search size={16} strokeWidth={1.5} aria-hidden="true" /> Search
                </button>
              </li>
              <li>
                <Link to="/about" onClick={() => close()}>
                  <Info size={16} strokeWidth={1.5} aria-hidden="true" /> About OGCW
                </Link>
              </li>
            </ul>
          </div>

          {/* Sub panel: the chosen section’s stories, episodes or shops */}
          <div className="drawer-panel drawer-panel-sub" inert={active === null} aria-hidden={active === null}>
            {active && (
              <>
                <button type="button" className="drawer-row drawer-back" onClick={() => setActive(null)}>
                  <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
                  {active.label}
                </button>
                <ul className="drawer-stories">
                  {active.items?.map((item) => (
                    <li key={item.kind === "article" ? item.a.slug : item.kind === "episode" ? item.e.slug : item.s.slug}>
                      <DrawerCard item={item} onGo={() => close()} large />
                    </li>
                  ))}
                </ul>
                <Link to={active.to} className="drawer-row drawer-all" onClick={() => close()}>
                  All {active.label}
                  <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
