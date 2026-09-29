import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BookOpen, Play, ShoppingBag } from "lucide-react";
import { article, ARTICLES, SHOPS, SONGS, STREAMERS, youtubeThumb, youtubeUrl, type Photo as PhotoData } from "@/data/content";
import { ExploreMix } from "./explore-mix";
import { CultureDeck } from "./culture-deck";
import { GlowCard } from "@/components/ui/spotlight-card";

// The news front page: the broadsheet grid from the Monocle reference (design
// md monocle), with hairline rules building the grid, dressed in the OGCW brand
// system (Source Serif 4 headlines and text, Inter labels, accent colour).
// Lead | two secondary stories | the Briefing rail and a song to check out,
// then more news, the trendiest streamers, the shop and the Explore mix.

const sections = [
  { label: "All news", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Games", to: "/games" },
  { label: "Streaming", to: "/streaming" },
  { label: "Culture", to: "/culture" },
  { label: "Originals", to: "/originals" },
  { label: "Shop", to: "/shop" },
  { label: "Explore", to: "/explore" },
] as const;

const lead = article("vmas-2026-winners");
const secondary = [article("gta-vi-countdown"), article("paris-fashion-week-ss27")];
const moreNews = ["bts-arirang-world-tour-latin-america", "taylor-swift-the-life-of-a-showgirl-the-encore", "marvels-wolverine-sales", "emmys-2026-winners"].map(article);
// The OGCW Briefing: every other story, newest first
const onFront = new Set([lead, ...secondary, ...moreNews].map((a) => a.slug));
const briefing = ARTICLES.filter((a) => !onFront.has(a.slug));
const song = SONGS[0]!;

const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

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
            <span>{ARTICLES.length} stories this month</span>
            <span>Every source linked</span>
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

            <a className="bs-song bs-song-wide" href={youtubeUrl(song.video)} target="_blank" rel="noopener noreferrer">
              <span className="bs-song-head">Check out this song</span>
              <span className="bs-song-media">
                <img src={youtubeThumb(song.video)} alt="" loading="lazy" />
                <span className="bs-song-play" aria-hidden="true"><Play size={16} fill="currentColor" strokeWidth={0} /></span>
              </span>
              <span className="bs-song-title">{song.title}</span>
              <span className="bs-song-artist">{song.artist}</span>
              <span className="bs-song-note">{song.note}</span>
              <span className="bs-read">{song.kind} on YouTube <ArrowUpRight size={13} aria-hidden="true" /></span>
            </a>
          </article>

          <div className="bs-col bs-col-secondary">
            {secondary.map((story) => (
              <article key={story.slug} className="bs-reveal">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                  <Photo photo={story.photo} className="bs-photo-secondary" />
                  <p className="bs-eyebrow">{story.kicker}</p>
                  <h3 className="bs-title">{story.title}</h3>
                  <p className="bs-deck bs-deck-sm">{story.deck}</p>
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
                <p className="bs-briefing-intro">Everything else worth knowing this week, newest first.</p>
                <ol className="bs-schedule">
                  {briefing.map((item) => (
                    <li key={item.slug}>
                      <Link to="/news/$slug" params={{ slug: item.slug }}>
                        <span className="bs-schedule-day">{shortDate(item.date)}</span>
                        <span>
                          <span className="bs-schedule-kicker">{item.kicker}</span>
                          <span className="bs-schedule-title">{item.title}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <Link to="/news" className="bs-button">
                  All the news
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <hr className="bs-rule" />

        <section aria-labelledby="more-news-title">
          <div className="bs-section-head">
            <h3 id="more-news-title" className="bs-eyebrow">More news</h3>
            <Link to="/news" className="bs-more">All stories</Link>
          </div>
          <div className="bs-more-news">
            {moreNews.map((story) => (
              <article key={story.slug} className="bs-reveal">
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                  <Photo photo={story.photo} className="bs-photo-more" />
                  <p className="bs-eyebrow">{story.kicker}</p>
                  <h4 className="bs-title">{story.title}</h4>
                  <ReadTime>{story.read}</ReadTime>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <hr className="bs-rule" />

        <section aria-labelledby="streamers-title">
          <div className="bs-section-head">
            <h3 id="streamers-title" className="bs-eyebrow">Trendiest streamers</h3>
            <Link to="/streaming" className="bs-more">More streaming</Link>
          </div>
          <div className="bs-opinion bs-streamers">
            {STREAMERS.map((streamer) => (
              <article key={streamer.name} className="bs-reveal">
                <a className="bs-card bs-video-card" href={youtubeUrl(streamer.video)} target="_blank" rel="noopener noreferrer">
                  <span className="bs-video-thumb">
                    <img src={youtubeThumb(streamer.video)} alt="" loading="lazy" />
                    <span className="bs-song-play" aria-hidden="true"><Play size={16} fill="currentColor" strokeWidth={0} /></span>
                    <span className="bs-video-platform">{streamer.platform}</span>
                  </span>
                  <h4 className="bs-title">{streamer.name}</h4>
                  <p className="bs-deck bs-deck-sm">{streamer.note}</p>
                  <span className="bs-read"><span className="sr-only">Watch: </span>{streamer.videoTitle} <ArrowUpRight size={13} aria-hidden="true" /></span>
                </a>
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

        <ExploreMix />

        <hr className="bs-rule" />

        <CultureDeck />
      </div>
    </section>
  );
}
