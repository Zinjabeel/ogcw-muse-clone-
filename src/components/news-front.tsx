import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clapperboard, ShoppingBag } from "lucide-react";
import { article, EPISODES, SHOPS, type Photo as PhotoData } from "@/data/content";
import { Explore } from "./explore";
import { Poster } from "./cards";
import { GlowCard } from "@/components/ui/spotlight-card";

// The news front page: the broadsheet grid from the Monocle reference (design
// md monocle), with hairline rules building the grid, dressed in the OGCW brand
// system (dark page, Source Serif 4 headlines and text, Inter labels, yellow accents).
// Every card opens its own story, episode or shop page.

const sections = [
  { label: "All news", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Culture", to: "/culture" },
  { label: "Originals", to: "/originals" },
  { label: "Shop", to: "/shop" },
  { label: "Trends", to: "/trends" },
  { label: "Explore", to: "/explore" },
] as const;

// The hero already leads with Central Cee, so the front opens on Dave.
const lead = article("dave-and-the-art-of-the-long-verse");
const secondary = [article("playboi-carti-at-clout-festival"), article("congolese-rumbas-second-life")];

// The OGCW Briefing: five stories in the order they broke.
const briefing = [
  "a-new-generation-remakes-print",
  "why-brutalism-keeps-returning",
  "objects-built-to-outlast-the-feed",
  "independent-labels-reclaim-the-runway",
  "the-listening-bars-changing-nightlife",
].map(article);
const weekday = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(iso));

const originals = EPISODES.slice(0, 3);
function ReadTime({ children }: { children: string }) {
  return (
    <span className="bs-read">
      <BookOpen size={13} strokeWidth={1.5} aria-hidden="true" />
      {children}
    </span>
  );
}

function Photo({ photo, className }: { photo: PhotoData; className?: string }) {
  const crop = photo.crop ?? { pos: "50% 50%" };
  return (
    <div className={`bs-photo ${className ?? ""}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom ?? 1), ["--origin" as string]: crop.pos }}
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
              <li key={section.label}>
                <Link to={section.to}>{section.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bs-front">
          <article className="bs-col bs-reveal">
            <Link to="/news/$slug" params={{ slug: lead.slug }} className="bs-card">
              <p className="bs-eyebrow">{lead.kicker}</p>
              <h3 className="bs-title bs-title-lead">{lead.title}</h3>
              <p className="bs-deck">{lead.deck}</p>
              <ReadTime>{lead.read}</ReadTime>
              <Photo photo={lead.photo} className="bs-photo-lead" />
            </Link>
          </article>

          <div className="bs-col bs-col-secondary">
            {secondary.map((story) => (
              <article key={story.slug} className="bs-reveal">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                  <Photo photo={story.photo} className="bs-photo-secondary" />
                  <p className="bs-eyebrow">{story.kicker}</p>
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
                <p className="bs-briefing-intro">Five stories worth your time, in the order they broke.</p>
                <Link to="/news" className="bs-button">
                  All the news
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <ol className="bs-schedule">
                  {briefing.map((item) => (
                    <li key={item.slug}>
                      <Link to="/news/$slug" params={{ slug: item.slug }}>
                        <span className="bs-schedule-day">{weekday(item.date)}</span>
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
            <Link to="/originals" className="bs-more">All originals</Link>
          </div>
          <div className="bs-opinion">
            {originals.map((video) => (
              <article key={video.slug} className="bs-reveal">
                <Link to="/originals/$slug" params={{ slug: video.slug }} className="bs-card bs-video-card">
                  <Poster episode={video} />
                  <p className="bs-eyebrow">{video.kind}</p>
                  <h4 className="bs-title">{video.title}</h4>
                  <span className="bs-read"><Clapperboard size={13} strokeWidth={1.5} aria-hidden="true" />{video.series} · {video.length}</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <hr className="bs-rule" />

        <section aria-labelledby="shop-title">
          <div className="bs-section-head">
            <h3 id="shop-title" className="bs-eyebrow">Shop</h3>
            <Link to="/shop" className="bs-more">Visit the shop</Link>
          </div>
          <div className="bs-features">
            {SHOPS.map((shop) => (
              <article key={shop.slug}>
                {/* Yellow spotlight glow on the edges that follows the pointer */}
                <GlowCard glowColor="yellow" customSize className="bs-shop-card">
                  <Link to="/shop/$slug" params={{ slug: shop.slug }} className="bs-card">
                    <Photo photo={shop.hero} className="bs-photo-feature" />
                    <p className="bs-eyebrow">{shop.name}</p>
                    <h4 className="bs-title">{shop.tagline}</h4>
                    <span className="bs-read"><ShoppingBag size={13} strokeWidth={1.5} aria-hidden="true" />Shop {shop.name}</span>
                  </Link>
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
