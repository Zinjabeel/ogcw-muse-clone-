import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clapperboard, Play, ShoppingBag } from "lucide-react";
import type { MouseEvent } from "react";
import centralCeePhoto from "../assets/central-cee.jpg";
import vedanPhoto from "../assets/vedan.jpg.asset.json";
import musicHero from "../assets/ogcw-hero-music.jpg";
import { Explore } from "./explore";
import { GlowCard } from "@/components/ui/spotlight-card";

// The news front page: the broadsheet grid from the Monocle reference (design
// md monocle), with hairline rules building the grid, dressed in the OGCW brand
// system (dark page, Source Serif 4 headlines and text, Inter labels, yellow accents).

type Crop = { pos: string; zoom: number };
type Story = { tag: string; title: string; read: string; deck?: string; image: string; alt: string; crop?: Crop };

const sections = ["Music", "Style", "Art & Culture", "Design", "Film & TV", "Sport", "Nightlife"];

const lead: Story = {
  tag: "Music",
  title: "Central Cee and the global rise of UK rap",
  deck: "From “Sprinter” to “Band4Band”, how the West London rapper carried British drill from the estate to the world stage.",
  read: "7 min read",
  image: centralCeePhoto,
  alt: "Central Cee performing on an outdoor festival stage",
  crop: { pos: "50% 22%", zoom: 1 },
};

const secondary: Story[] = [
  { tag: "New voices", title: "Vedan and the reach of regional rap", read: "5 min read", image: vedanPhoto.url, alt: "Vedan performing under red stage lights" },
  { tag: "Nightlife", title: "The listening bars changing nightlife", read: "6 min read", image: musicHero, alt: "A singer under a single yellow spotlight in a packed club" },
];

const briefing = [
  { time: "Mon", title: "Drake drops “Quebec”" },
  { time: "Tue", title: "Dave takes Brussels' ING Arena" },
  { time: "Wed", title: "Inside Opium, the label Carti built" },
  { time: "Thu", title: "Why brutalism keeps returning" },
  { time: "Fri", title: "Small-run magazines are selling out again" },
];

// OGCW Originals: exclusive OGCW-made video (interviews, reportage, lists,
// analysis). The thumbnails are blank colour placeholders until the videos
// exist. TODO: link each card, and "All originals", to the OGCW Originals tab.
type Original = { kind: string; title: string; length: string; tone: "black" | "white" | "yellow" };
const originals: Original[] = [
  { kind: "Interview", title: "Inside the listening bar: one night, one record", length: "12:40", tone: "black" },
  { kind: "Reportage", title: "Made to last: in the studio with the object makers", length: "08:15", tone: "white" },
  { kind: "The list", title: "Ten records that shaped the year so far", length: "05:32", tone: "yellow" },
];
// Originals and Shop cards are clickable but go nowhere until those tabs are built.
const comingSoon = (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault();

// Shop row (was "More from OGCW"): one tile per partner shop. Photos are
// hotlinked from Unsplash (free Unsplash License), as Unsplash asks; credits
// are in the home page's photo credit line.
// TODO: link each tile, and "Visit the shop", to the OGCW shop section.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
const shops: Story[] = [
  { tag: "Nike", title: "Air Max, Dunks and the latest drops", read: "Shop Nike", image: unsplash("photo-1637844528447-aee837ccfc7f"), alt: "An orange Nike swoosh lit up on the corner of a dark building" },
  { tag: "Adidas", title: "Sambas, Gazelles and the Originals line", read: "Shop Adidas", image: unsplash("photo-1778521269710-748a3e4d5e15"), alt: "A neon Adidas trefoil in a store window, clothing rails behind" },
  { tag: "StockX", title: "Verified sneakers at live resale prices", read: "Shop StockX", image: unsplash("photo-1560769629-975ec94e6a86"), alt: "A pair of colourful sneakers on a white plinth" },
  { tag: "Uniqlo", title: "Everyday essentials, done right", read: "Shop Uniqlo", image: unsplash("photo-1602519095267-53c956c8cf74"), alt: "The red Uniqlo sign glowing on a glass building at night", crop: { pos: "50% 62%", zoom: 1 } },
];

function ReadTime({ children }: { children: string }) {
  return (
    <span className="bs-read">
      <BookOpen size={13} strokeWidth={1.5} aria-hidden="true" />
      {children}
    </span>
  );
}

function Photo({ story, className }: { story: Story; className?: string }) {
  const crop = story.crop ?? { pos: "50% 50%", zoom: 1 };
  return (
    <div className={`bs-photo ${className ?? ""}`}>
      <img
        src={story.image}
        alt={story.alt}
        loading="lazy"
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom), ["--origin" as string]: crop.pos }}
      />
    </div>
  );
}

export function NewsFront() {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <section className="broadsheet" aria-labelledby="news-front-title">
      <div className="bs-wrap">
        <header className="bs-masthead">
          <p className="bs-flag">
            <span suppressHydrationWarning>{today}</span>
            <span>Updated daily</span>
          </p>
          <h2 id="news-front-title" className="bs-wordmark">OGCW News</h2>
          <p className="bs-flag bs-flag-right">
            <span>Culture, reported</span>
            <span>from the inside</span>
          </p>
        </header>

        <nav className="bs-nav" aria-label="News sections">
          <ul>
            {sections.map((section) => (
              <li key={section}>
                <Link to="/news">{section}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bs-front">
          <article className="bs-col bs-reveal">
            <Link to="/news" className="bs-card">
              <p className="bs-eyebrow">{lead.tag}</p>
              <h3 className="bs-title bs-title-lead">{lead.title}</h3>
              <p className="bs-deck">{lead.deck}</p>
              <ReadTime>{lead.read}</ReadTime>
              <Photo story={lead} className="bs-photo-lead" />
            </Link>
          </article>

          <div className="bs-col bs-col-secondary">
            {secondary.map((story) => (
              <article key={story.title} className="bs-reveal">
                <Link to="/news" className="bs-card">
                  <Photo story={story} className="bs-photo-secondary" />
                  <p className="bs-eyebrow">{story.tag}</p>
                  <h3 className="bs-title">{story.title}</h3>
                  <ReadTime>{story.read}</ReadTime>
                </Link>
              </article>
            ))}
          </div>

          <aside className="bs-col bs-col-rail bs-reveal" aria-labelledby="briefing-title">
            <div className="bs-briefing">
              <p id="briefing-title" className="bs-briefing-head">
                <span>The OGCW Briefing</span>
                <span className="bs-dot" aria-hidden="true" />
              </p>
              <div className="bs-briefing-body">
                <p className="bs-briefing-intro">The five stories everyone was talking about this week, in the order they broke.</p>
                <Link to="/news" className="bs-button">
                  Read the briefing
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <ol className="bs-schedule">
                  {briefing.map((item) => (
                    <li key={item.title}>
                      <Link to="/news">
                        <span className="bs-schedule-day">{item.time}</span>
                        <span className="bs-schedule-title">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        </div>

        <hr className="bs-rule" />

        <section aria-labelledby="originals-title">
          <div className="bs-section-head">
            <h3 id="originals-title" className="bs-eyebrow">OGCW Originals</h3>
            <a href="#originals-title" className="bs-more" onClick={comingSoon}>All originals</a>
          </div>
          <div className="bs-opinion">
            {originals.map((video) => (
              <article key={video.title} className="bs-reveal">
                <a href="#originals-title" className="bs-card bs-video-card" onClick={comingSoon}>
                  <span className="bs-video" data-tone={video.tone}>
                    <span className="bs-play" aria-hidden="true"><Play size={22} fill="currentColor" strokeWidth={0} /></span>
                    <span className="bs-duration"><span className="sr-only">Length </span>{video.length}</span>
                  </span>
                  <p className="bs-eyebrow">{video.kind}</p>
                  <h4 className="bs-title">{video.title}</h4>
                  <span className="bs-read"><Clapperboard size={13} strokeWidth={1.5} aria-hidden="true" />OGCW Original · Video</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <hr className="bs-rule" />

        <section aria-labelledby="shop-title">
          <div className="bs-section-head">
            <h3 id="shop-title" className="bs-eyebrow">Shop</h3>
            <a href="#shop-title" className="bs-more" onClick={comingSoon}>Visit the shop</a>
          </div>
          <div className="bs-features">
            {shops.map((shop) => (
              <article key={shop.tag}>
                {/* Yellow spotlight glow on the edges that follows the pointer */}
                <GlowCard glowColor="yellow" customSize className="bs-shop-card">
                  <a href="#shop-title" className="bs-card" onClick={comingSoon}>
                    <Photo story={shop} className="bs-photo-feature" />
                    <p className="bs-eyebrow">{shop.tag}</p>
                    <h4 className="bs-title">{shop.title}</h4>
                    <span className="bs-read"><ShoppingBag size={13} strokeWidth={1.5} aria-hidden="true" />{shop.read}</span>
                  </a>
                </GlowCard>
              </article>
            ))}
          </div>
        </section>

        <hr className="bs-rule" />

        <Explore />
      </div>
    </section>
  );
}
