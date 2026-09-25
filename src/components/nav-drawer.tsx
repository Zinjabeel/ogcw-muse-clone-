import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Info, Search, Sparkle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import centralCeePhoto from "../assets/central-cee.jpg";
import vedanPhoto from "../assets/vedan.jpg.asset.json";
import musicHero from "../assets/ogcw-hero-music.jpg";
import styleHero from "../assets/ogcw-hero-style.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";

// Site menu, modelled on complex.com's: a 380px black drawer from the left
// over a blurred, darkened page. Section rows open a sub-panel of featured
// stories; a "Featured" strip and utility links sit below the list.

type Crop = { pos: string; zoom: number };
type Story = { title: string; sub: string; image: string; crop?: Crop };
type Section = { label: string; to: "/" | "/news" | "/trends" | "/blog" | "/about"; stories?: Story[] };

const s = {
  cee: { title: "Central Cee and the global rise of UK rap", sub: "Music / 7 min read", image: centralCeePhoto, crop: { pos: "50% 22%", zoom: 1 } },
  vedan: { title: "Vedan and the reach of regional rap", sub: "New voices / 5 min read", image: vedanPhoto.url },
  bars: { title: "The listening bars changing nightlife", sub: "Nightlife / 6 min read", image: musicHero },
  labels: { title: "Independent labels reclaim the runway", sub: "Style / 6 min read", image: styleHero, crop: { pos: "68% 45%", zoom: 1 } },
  objects: { title: "Objects built to outlast the feed", sub: "Design / 4 min read", image: designHero },
  brutalism: { title: "Why brutalism keeps returning", sub: "Architecture / 8 min read", image: editorialGrid, crop: { pos: "0% 100%", zoom: 2 } },
  print: { title: "A new generation remakes print", sub: "Print / 5 min read", image: editorialGrid, crop: { pos: "100% 100%", zoom: 2 } },
  scenes: { title: "Four scenes, one shared language", sub: "Culture / 6 min read", image: editorialGrid },
} satisfies Record<string, Story>;

const sections: Section[] = [
  { label: "News", to: "/news", stories: [s.cee, s.vedan, s.bars] },
  { label: "Music", to: "/news", stories: [s.cee, s.vedan, s.bars] },
  { label: "Style", to: "/news", stories: [s.labels, s.objects] },
  { label: "Art & Culture", to: "/news", stories: [s.scenes, s.print] },
  { label: "Design", to: "/news", stories: [s.objects, s.brutalism] },
  { label: "Nightlife", to: "/news", stories: [s.bars] },
  { label: "Trends", to: "/trends", stories: [s.labels, s.brutalism] },
  { label: "Blog", to: "/blog", stories: [s.print, s.scenes] },
  { label: "About", to: "/about" },
];

const featured = [s.cee, s.labels, s.objects, s.bars];

function Thumb({ story }: { story: Story }) {
  const crop = story.crop ?? { pos: "50% 50%", zoom: 1 };
  return (
    <span className="drawer-thumb">
      <img
        src={story.image}
        alt=""
        loading="lazy"
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom), ["--origin" as string]: crop.pos }}
      />
    </span>
  );
}

export function NavDrawer({ open, onClose, onAsk }: { open: boolean; onClose: () => void; onAsk: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Section | null>(null);
  const [closing, setClosing] = useState(false);

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
          <button type="button" className="drawer-top-link" onClick={() => close(onAsk)}>
            Ask OGCW <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="drawer-close" aria-label="Close menu" onClick={() => close()}>
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-panels" data-sub={active ? "" : undefined}>
          {/* Main panel: sections, featured strip, utility links */}
          <div className="drawer-panel drawer-panel-main" inert={active !== null}>
            <ul className="drawer-sections">
              {sections.map((section) => (
                <li key={section.label}>
                  {section.stories ? (
                    <button type="button" className="drawer-row" onClick={() => setActive(section)}>
                      {section.label}
                      <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  ) : (
                    <Link to={section.to} className="drawer-row" onClick={() => close()}>{section.label}</Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="drawer-featured">
              <p className="drawer-label">Featured</p>
              <ul className="drawer-strip">
                {featured.map((story) => (
                  <li key={story.title}>
                    <Link to="/news" className="drawer-card" onClick={() => close()}>
                      <Thumb story={story} />
                      <span className="drawer-card-title">{story.title}</span>
                      <span className="drawer-card-sub">{story.sub}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="drawer-utility">
              <li>
                <button type="button" onClick={() => close(onAsk)}>
                  <Sparkle size={16} strokeWidth={1.5} aria-hidden="true" /> Ask OGCW
                </button>
              </li>
              <li>
                <Link to="/news" onClick={() => close()}>
                  <Search size={16} strokeWidth={1.5} aria-hidden="true" /> Search
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={() => close()}>
                  <Info size={16} strokeWidth={1.5} aria-hidden="true" /> About OGCW
                </Link>
              </li>
            </ul>
          </div>

          {/* Sub panel: the chosen section's featured stories */}
          <div className="drawer-panel drawer-panel-sub" inert={active === null} aria-hidden={active === null}>
            {active && (
              <>
                <button type="button" className="drawer-row drawer-back" onClick={() => setActive(null)}>
                  <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
                  {active.label}
                </button>
                <ul className="drawer-stories">
                  {active.stories?.map((story) => (
                    <li key={story.title}>
                      <Link to={active.to} className="drawer-card drawer-card-large" onClick={() => close()}>
                        <Thumb story={story} />
                        <span className="drawer-card-title">{story.title}</span>
                        <span className="drawer-card-sub">{story.sub}</span>
                      </Link>
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
