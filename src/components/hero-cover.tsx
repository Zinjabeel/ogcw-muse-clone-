import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LIVE, type Article } from "@/data/content";
import { useStories } from "@/lib/stories";

// Home hero, option 2 in the hero switcher, set like a magazine cover rather
// than a carousel: one cover story in a large serif headline, the photo
// dissolving into the page on the right, a faint stage-light glow and film
// grain for atmosphere, and an "Also on OGCW" rail along the bottom. The
// headline is revealed line by line on load, and on scroll the photo drifts
// slower than the text (CSS scroll-driven animation where supported).
// The cover story and the rail's stories come live from the studio (/admin).

const COVER_SLUG = "taylor-swift-the-life-of-a-showgirl-the-encore";
const RAIL_SLUGS = ["gta-vi-countdown", "z-event-2026-final-edition"];

type RailItem = { kicker: string; title: string; meta: string; image: string; pos: string; live?: boolean; slug?: string };

const railStory = (story: Article): RailItem => ({ kicker: story.kicker, title: story.title, meta: story.read, image: story.photo.src, pos: story.photo.crop?.pos ?? "50% 50%", slug: story.slug });
const LIVE_ITEM: RailItem = { kicker: "Live", title: LIVE.title, meta: "Bogotá, 2–3 October · Tour dates", image: LIVE.photo.src, pos: LIVE.photo.crop.pos, live: true };

function RailEntry({ item, index }: { item: RailItem; index: number }) {
  const inner = (
    <>
      <span className="cover-rail-thumb"><img src={item.image} alt="" loading="lazy" style={{ objectPosition: item.pos }} /></span>
      <span className="cover-rail-text">
        <span className="cover-rail-kicker" data-live={item.live ? "" : undefined}>{String(index + 1).padStart(2, "0")} · {item.kicker}</span>
        <span className="cover-rail-title">{item.title}</span>
        <span className="cover-rail-meta">
          {item.meta}
          {item.live && <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />}
        </span>
      </span>
    </>
  );
  return item.live ? (
    <a className="cover-rail-item" href={LIVE.url} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className="cover-rail-item" to="/news/$slug" params={{ slug: item.slug ?? "" }}>{inner}</Link>
  );
}

export function HeroCover() {
  const stories = useStories();
  const cover = stories.pick(COVER_SLUG);
  const rail: RailItem[] = [LIVE_ITEM, ...RAIL_SLUGS.map((slug) => railStory(stories.pick(slug)))];
  return (
    <section className="cover" aria-labelledby="cover-title">
      <div className="cover-glow" aria-hidden="true" />

      <figure className="cover-photo">
        <img src={cover.photo.src} alt={cover.photo.alt} style={{ objectPosition: "50% 45%" }} />
      </figure>
      <p className="cover-credit">Taylor Swift, The Eras Tour · Photo: {cover.photo.credit}</p>

      <div className="cover-inner">
        <div className="cover-copy">
          <p className="cover-kicker">Cover story · Music</p>
          <h1 id="cover-title" className="cover-title">
            <span className="cover-line"><span>Taylor Swift’s Showgirl</span></span>
            <span className="cover-line"><span>gets an encore</span></span>
          </h1>
          <p className="cover-deck">{cover.deck}</p>
          <div className="cover-cta">
            <Link to="/news/$slug" params={{ slug: cover.slug }} className="cover-link">
              Read the cover story <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
            <span className="cover-meta">{cover.read}</span>
          </div>
        </div>

        <nav className="cover-rail" aria-label="Also on OGCW">
          <p className="cover-rail-label">Also on OGCW</p>
          <ol>
            {rail.map((item, index) => (
              <li key={item.title}><RailEntry item={item} index={index} /></li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
