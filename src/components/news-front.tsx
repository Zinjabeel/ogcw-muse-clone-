import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clapperboard, Play } from "lucide-react";
import type { MouseEvent } from "react";
import centralCeePhoto from "../assets/central-cee.jpg";
import vedanPhoto from "../assets/vedan.jpg.asset.json";
import musicHero from "../assets/ogcw-hero-music.jpg";
import styleHero from "../assets/ogcw-hero-style.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";
import { SignupCard } from "./signup-card";

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
// Cards are clickable but go nowhere until the Originals tab is built.
const comingSoon = (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault();

const features: Story[] = [
  { tag: "Style", title: "Independent labels reclaim the runway", read: "6 min read", image: styleHero, alt: "A man in a long black coat under a bridge in the rain" },
  { tag: "Design", title: "Objects built to outlast the feed", read: "4 min read", image: designHero, alt: "A sneaker and headphones on a concrete plinth" },
  { tag: "Architecture", title: "Why brutalism keeps returning", read: "8 min read", image: editorialGrid, alt: "A brutalist concrete building against a grey sky", crop: { pos: "0% 100%", zoom: 2 } },
  { tag: "Print", title: "A new generation remakes print", read: "5 min read", image: editorialGrid, alt: "Two people working over pages in a print studio", crop: { pos: "100% 100%", zoom: 2 } },
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

        <section aria-labelledby="more-title">
          <div className="bs-section-head">
            <h3 id="more-title" className="bs-eyebrow">More from OGCW</h3>
            <Link to="/news" className="bs-more">All news</Link>
          </div>
          <div className="bs-features">
            {features.map((story) => (
              <article key={story.title} className="bs-reveal">
                <Link to="/news" className="bs-card">
                  <Photo story={story} className="bs-photo-feature" />
                  <p className="bs-eyebrow">{story.tag}</p>
                  <h4 className="bs-title">{story.title}</h4>
                  <ReadTime>{story.read}</ReadTime>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <hr className="bs-rule" />

        <section className="bs-signup" aria-labelledby="signup-title">
          <div className="bs-signup-copy">
            <p className="bs-eyebrow">Newsletter</p>
            <h3 id="signup-title" className="bs-title">The OGCW Briefing, in your inbox every Friday.</h3>
            <p className="bs-deck">Five stories, in the order they broke, from the people shaping culture now. No spam, one click to leave.</p>
          </div>
          <SignupCard />
        </section>
      </div>
    </section>
  );
}
