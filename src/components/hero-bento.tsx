import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Sparkle } from "lucide-react";
import { useState } from "react";
import { NavDrawer } from "./nav-drawer";
import { SOCIALS, SocialIcon } from "./socials";
import styleHero from "../assets/ogcw-hero-style.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";
import vedanPhoto from "../assets/vedan.jpg.asset.json";

// Hero, built on the "hero section model 1" layout (a bento dashboard in a
// dark frame): Anybody for the headline, Space Grotesk for labels and inputs,
// cream panels on a #0D0D0D frame, and yellow only for hot and active states.

type Crop = { pos: string; zoom: number };

// The lead story shown on the cover. Will come from the admin panel later.
const lead = {
  kicker: "Style",
  title: "Independent labels reclaim the runway",
  date: "25 September 2026",
  datetime: "2026-09-25",
};

// Trending topics strip (from the requirements doc): hashtags the team updates
// from the admin panel. The first two are marked hot.
const trending = [
  { label: "#NewMusicFriday", hot: true },
  { label: "#ComplexCon", hot: true },
  { label: "#ParisFashionWeek", hot: false },
  { label: "#ChampionsLeague", hot: false },
  { label: "#UKRap", hot: false },
  { label: "#Sneakers", hot: false },
  { label: "#GRAMMYs", hot: false },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const focusAsk = () => document.getElementById("ask-ogcw")?.focus();

  return (
    <section className="hero-bento" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">OGCW: culture, unfiltered</h1>

      <div className="bento-frame">
        <div className="bento-main">
          <Link to="/news" className="bento-cover">
            <img src={styleHero} alt="" />
            <span className="bento-lead">
              <span className="bento-lead-kicker">{lead.kicker}</span>
              <span className="bento-lead-title">{lead.title}</span>
              <time className="bento-lead-date" dateTime={lead.datetime}>{lead.date}</time>
            </span>
          </Link>

          {/* Menu button, set into a notch in the cover's top-left corner */}
          <div className="bento-burger-wrap">
            <button type="button" className="bento-burger" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
            </button>
          </div>

          <a href="#news-front-title" className="bento-notch" aria-label="Latest news">
            <ArrowDown size={20} strokeWidth={1.6} aria-hidden="true" />
            <span className="bento-notch-tip" aria-hidden="true">Latest news</span>
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
            <h2 id="topics-title" className="bento-eyebrow">Trending now</h2>
            <ul className="bento-chips">
              {trending.map((topic) => (
                <li key={topic.label}>
                  <Link to="/news" className="bento-chip" data-hot={topic.hot ? "" : undefined}>{topic.label}</Link>
                </li>
              ))}
            </ul>
          </section>
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

      <NavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onAsk={focusAsk} />
    </section>
  );
}
