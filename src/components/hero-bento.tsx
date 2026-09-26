import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useSiteMenu } from "./ogcw-layout";
import { SOCIALS, SocialIcon } from "./socials";
import styleHero from "../assets/ogcw-hero-style.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";
import vedanPhoto from "../assets/vedan.jpg.asset.json";

// Hero, built on the "hero section model 1" layout (a bento dashboard in a
// dark frame): a three-story cover that crossfades every 5 seconds, in the
// OGCW brand system (Source Serif 4 headlines, Inter labels, --ogcw-* colours).

type Crop = { pos: string; zoom: number };

// Cover stories, one per slide. Will come from the admin panel later.
// pos/posLg set the photo's focal point on mobile and desktop.
const coverStories = [
  { kicker: "Style", title: "Independent labels reclaim the runway", date: "25 September 2026", datetime: "2026-09-25", image: styleHero, pos: "64% 50%", posLg: "68% 45%" },
  { kicker: "Music", title: "Small rooms, big sound: the live nights to know", date: "24 September 2026", datetime: "2026-09-24", image: musicHero, pos: "40% 45%", posLg: "40% 40%" },
  { kicker: "Design", title: "Streetwear's new object makers", date: "23 September 2026", datetime: "2026-09-23", image: designHero, pos: "50% 55%", posLg: "50% 55%" },
];
const SLIDE_MS = 5000;

// Top three, stacked: 03 sits at the back, 01 at the front.
const topStories = [
  { n: "03", title: "Objects built to outlast the feed", image: designHero, crop: { pos: "50% 55%", zoom: 1 } },
  { n: "02", title: "Vedan and the reach of regional rap", image: vedanPhoto.url, crop: { pos: "50% 30%", zoom: 1 } },
  { n: "01", title: "The listening bars changing nightlife", image: musicHero, crop: { pos: "40% 40%", zoom: 1 } },
];

const inspiration: Crop[] = [
  { pos: "0% 0%", zoom: 2 },
  { pos: "100% 0%", zoom: 2 },
  { pos: "0% 100%", zoom: 2 },
];

function Photo({ src, crop, alt = "" }: { src: string; crop: Crop; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom), ["--origin" as string]: crop.pos }}
    />
  );
}

// Advances the cover every SLIDE_MS. Holds still while the reader hovers or
// focuses the cover, while the tab is hidden, and for reduced-motion users.
function useCoverSlides(count: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const hold = { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false) };
  return { active, hold };
}

export function HeroBento() {
  const { menuOpen, openMenu } = useSiteMenu();
  const { active, hold } = useCoverSlides(coverStories.length);
  const prev = (active - 1 + coverStories.length) % coverStories.length;

  return (
    <section className="hero-bento" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">OGCW: culture, unfiltered</h1>

      <div className="bento-frame">
        <div className="bento-main">
          <Link to="/news" className="bento-cover" {...hold}>
            {coverStories.map((story, index) => (
              <span
                key={story.title}
                className="bento-slide"
                data-state={index === active ? "active" : index === prev ? "prev" : undefined}
                aria-hidden={index === active ? undefined : true}
              >
                <img
                  src={story.image}
                  alt=""
                  loading={index === 0 ? "eager" : "lazy"}
                  style={{ ["--pos" as string]: story.pos, ["--pos-lg" as string]: story.posLg }}
                />
                <span className="bento-lead">
                  <span className="bento-lead-kicker">{story.kicker}</span>
                  <span className="bento-lead-title">{story.title}</span>
                  <time className="bento-lead-date" dateTime={story.datetime}>{story.date}</time>
                </span>
              </span>
            ))}
          </Link>

          {/* Menu button, set into a notch in the cover's top-left corner. Hidden on
              phones, where the header's menu button does the job. */}
          <div className="bento-burger-wrap">
            <button type="button" className="bento-burger" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Socials, where the Search pill used to be: the doc wants them easy to find */}
        <nav className="bento-socials" aria-label="Follow OGCW">
          <span className="bento-socials-label">Follow OGCW</span>
          <ul>
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`OGCW on ${social.name}`} title={social.name}>
                  <SocialIcon path={social.path} />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bento-right">
          <div className="bento-deck-wrap">
            <p className="bento-deck-label">Most read</p>
            <ol className="bento-deck" aria-label="Most read">
              {topStories.map((story) => (
                <li key={story.n} className="bento-deck-card">
                  <Link to="/news">
                    <Photo src={story.image} crop={story.crop} />
                    <span className="bento-deck-num" aria-hidden="true">{story.n}</span>
                    <span className="bento-deck-title">{story.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <Link to="/news" className="bento-inspired">
            <span className="bento-eyebrow">OGCW Originals</span>
            <span className="bento-ring" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.6} /></span>
            <span className="bento-fan" aria-hidden="true">
              {inspiration.map((crop, index) => (
                <span key={index} className="bento-fan-card" style={{ ["--n" as string]: index }}>
                  <Photo src={editorialGrid} crop={crop} />
                </span>
              ))}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
