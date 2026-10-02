import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LIVE, SECTIONS, type Article } from "@/data/content";
import { useStories } from "@/lib/stories";

// Home hero, option 2 in the hero switcher, set like a magazine cover rather
// than a carousel: one cover story in a large serif headline, the photo
// dissolving into the page on the right, a faint stage-light glow and film
// grain for atmosphere, and an "Also on OGCW" rail along the bottom. The
// headline is revealed line by line on load, and on scroll the photo drifts
// slower than the text (CSS scroll-driven animation where supported).
// The cover story and the rail's stories come live from the studio (/admin).

// The cover story and the rail are chosen in the studio (src/data/placements.ts).
// The usual cover keeps its hand-set headline; any other story's headline is
// split over two lines for the reveal.
const USUAL_COVER = "taylor-swift-the-life-of-a-showgirl-the-encore";

function coverLines(title: string): string[] {
  const words = title.split(" ");
  if (words.length < 4) return [title];
  let best = 1;
  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(" ").length;
    const bestLeft = words.slice(0, best).join(" ").length;
    if (Math.abs(left - title.length / 2) < Math.abs(bestLeft - title.length / 2)) best = i;
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

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
  const [cover = stories.pick(USUAL_COVER)] = stories.slot("hero-cover");
  const rail: RailItem[] = [LIVE_ITEM, ...stories.slot("hero-cover-rail").map(railStory)];
  const usual = cover.slug === USUAL_COVER;
  const long = !usual && cover.title.length > 48;
  // A long headline wraps on its own, evened out (see .cover-title-long)
  const lines = usual ? ["Taylor Swift’s Showgirl", "gets an encore"] : long ? [cover.title] : coverLines(cover.title);
  return (
    <section className="cover" aria-labelledby="cover-title">
      <div className="cover-glow" aria-hidden="true" />

      <figure className="cover-photo">
        <img src={cover.photo.src} alt={cover.photo.alt} style={{ objectPosition: usual ? "50% 45%" : cover.photo.crop?.pos ?? "50% 50%" }} />
      </figure>
      {cover.photo.credit && <p className="cover-credit">{usual && "Taylor Swift, The Eras Tour · "}Photo: {cover.photo.credit}</p>}

      <div className="cover-inner">
        <div className="cover-copy">
          <p className="cover-kicker">Cover story · {SECTIONS[cover.section].label}</p>
          <h1 id="cover-title" className={`cover-title ${long ? "cover-title-long" : ""}`}>
            {lines.map((line) => <span key={line} className="cover-line"><span>{line}</span></span>)}
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
