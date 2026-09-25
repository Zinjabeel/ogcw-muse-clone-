import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, BookOpen, Home, Info, Mail, Newspaper, Search, Sparkle, TrendingUp } from "lucide-react";
import styleHero from "../assets/ogcw-hero-style.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";
import vedanPhoto from "../assets/vedan.jpg.asset.json";

// Hero, built on the "hero section model 1" layout (a bento dashboard in a
// dark frame) and dressed in the OGCW News look: the Monocle tokens, Source
// Serif for editorial labels, Inter only for inputs, cream page, white panels,
// hairlines, and a single yellow accent.

type Crop = { pos: string; zoom: number };

const sections = [
  { label: "Home", to: "/" as const, icon: Home },
  { label: "News", to: "/news" as const, icon: Newspaper },
  { label: "Trends", to: "/trends" as const, icon: TrendingUp },
  { label: "Blog", to: "/blog" as const, icon: BookOpen },
  { label: "About", to: "/about" as const, icon: Info },
];

const topics = [
  { label: "Music", hot: true },
  { label: "Style", hot: false },
  { label: "Art & Culture", hot: false },
  { label: "Design", hot: false },
  { label: "Film & TV", hot: false },
  { label: "Sport", hot: true },
  { label: "Nightlife", hot: false },
];

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

export function HeroBento() {
  return (
    <section className="hero-bento" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">OGCW: culture, unfiltered</h1>

      <div className="bento-frame">
        <Link to="/" className="bento-logo" aria-label="OGCW home">
          <Sparkle size={30} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        </Link>

        <nav className="bento-side" aria-label="Sections">
          <ul>
            {sections.map(({ label, to, icon: Icon }, index) => (
              <li key={to}>
                <Link to={to} className="bento-side-link" aria-label={label} title={label} data-active={index === 0 ? "" : undefined}>
                  <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="bento-side-foot">
            <Link to="/news" className="bento-side-link" aria-label="Newsletter" title="Newsletter">
              <Mail size={17} strokeWidth={1.6} aria-hidden="true" />
            </Link>
            <span className="bento-avatar" aria-hidden="true">OG</span>
          </div>
        </nav>

        <div className="bento-main">
          <Link to="/news" className="bento-cover" aria-label="Independent labels reclaim the runway">
            <img src={styleHero} alt="" />
          </Link>

          <a href="#news-front-title" className="bento-notch" aria-label="Jump to the news">
            <ArrowDown size={20} strokeWidth={1.6} aria-hidden="true" />
          </a>

          <form className="bento-prompt" action="/news" method="get" role="search">
            <span className="bento-prompt-icon" aria-hidden="true">
              <Sparkle size={14} fill="currentColor" strokeWidth={0} />
            </span>
            <label htmlFor="ask-ogcw" className="sr-only">Ask OGCW</label>
            <input id="ask-ogcw" name="q" type="text" placeholder="Ask OGCW anything" autoComplete="off" />
          </form>

          <section className="bento-topics" aria-labelledby="topics-title">
            <span className="bento-corner bento-corner-top" aria-hidden="true" />
            <span className="bento-corner bento-corner-left" aria-hidden="true" />
            <h2 id="topics-title" className="bento-eyebrow">Choose your topics</h2>
            <ul className="bento-chips">
              {topics.map((topic) => (
                <li key={topic.label}>
                  <Link to="/news" className="bento-chip" data-hot={topic.hot ? "" : undefined}>{topic.label}</Link>
                </li>
              ))}
            </ul>
            <span className="bento-pager" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          </section>
        </div>

        <form className="bento-search" action="/news" method="get" role="search">
          <Search size={17} strokeWidth={1.6} aria-hidden="true" />
          <label htmlFor="search-ogcw" className="sr-only">Search OGCW</label>
          <input id="search-ogcw" name="q" type="search" placeholder="Search" autoComplete="off" />
        </form>

        <div className="bento-right">
          <ol className="bento-deck" aria-label="Most read">
            {topStories.map((story) => (
              <li key={story.n} className="bento-deck-card">
                <Link to="/news" aria-label={`${story.n}: ${story.title}`}>
                  <Photo src={story.image} crop={story.crop} />
                  <span className="bento-deck-num" aria-hidden="true">{story.n}</span>
                </Link>
              </li>
            ))}
          </ol>

          <Link to="/trends" className="bento-inspired">
            <span className="bento-eyebrow">Get inspired</span>
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
