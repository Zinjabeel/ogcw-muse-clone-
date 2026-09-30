import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { article, ARTICLES, formatPrice, SHOPS, SONGS, youtubeThumb, youtubeUrl, type Article, type Photo as PhotoData, type Song } from "@/data/content";
import { ExploreMix } from "./explore-mix";
import { KeepExploring, KEEP_EXPLORING_SLUGS } from "./keep-exploring";
import { ShopCard } from "./cards";
import { UpcomingEvents } from "./upcoming-events";
import { ContentOfTheMonth } from "./content-of-the-month";

// The news front page: the broadsheet grid from the Monocle reference (design
// md monocle), with hairline rules building the grid, dressed in the OGCW brand
// system (Source Serif 4 headlines and text, Inter labels, accent colour).
// Six headline stories (three down the left side, the lead, two on the
// right) beside the Upcoming events rail, then the More news carousel,
// Content of the month, the shop, and the Explore mix running on into Keep
// exploring (nine more stories and the rap desk vote).

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
const side = ["bts-arirang-world-tour-latin-america", "avengers-endgame-encore-box-office", "neuro-sama-pattern-recognition-first-concert"].map(article);
// Every other story, newest first, runs in the More news carousel (the ones
// in Keep exploring, further down, are left out)
const onFront = new Set([lead, ...secondary, ...side].map((a) => a.slug));
const moreNews = ARTICLES.filter((a) => !onFront.has(a.slug) && !KEEP_EXPLORING_SLUGS.has(a.slug));
const [song, ...nextSongs] = SONGS as [Song, ...Song[]];
// For the shop call-to-action card: one product from three of the shops
const shopThumbs = SHOPS.slice(0, 3).map((shop) => shop.products[0]!);
const pickCount = SHOPS.reduce((total, shop) => total + shop.products.length, 0);
// Six more picks for the call-to-action card: the fourth from each shop and
// the fifth from two, so none repeat the three shown on the shop cards
const alsoInEdit = [...SHOPS.map((shop) => shop.products[3]!), SHOPS[1]!.products[4]!, SHOPS[3]!.products[4]!];
const lowestPrice = Math.min(...SHOPS.flatMap((shop) => shop.products.map((product) => product.price)));

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

function StoryCard({ story, photoClass, hidden = false }: { story: Article; photoClass: string; hidden?: boolean }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card" tabIndex={hidden ? -1 : undefined}>
      <Photo photo={story.photo} className={photoClass} />
      <p className="bs-eyebrow">{story.kicker}</p>
      <h4 className="bs-title">{story.title}</h4>
      <ReadTime>{story.read}</ReadTime>
    </Link>
  );
}

// More news: the cards run on past both edges of the page column, so a
// slice of the next and the previous card shows on each side, with arrows
// that move a page of stories at a time. The row loops: the stories are
// laid out three times, the row starts on the middle set and, once a scroll
// settles in an outer set, jumps back to the same card in the middle one.
// The outer sets are hidden from screen readers and the Tab key.
function MoreNewsCarousel({ stories }: { stories: Article[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section.current;
    const row = track.current;
    if (!el || !row) return;

    const items = () => Array.from(row.children) as HTMLElement[];
    const setWidth = () => {
      const all = items();
      return (all[stories.length]?.offsetLeft ?? 0) - (all[0]?.offsetLeft ?? 0);
    };
    const bleedLeft = () => parseFloat(getComputedStyle(row).paddingLeft) || 0;

    // How far the row runs past the column: up to the screen edge, at most 160px
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      el.style.setProperty("--bleed-l", `${Math.round(Math.max(0, Math.min(rect.left, 160)))}px`);
      el.style.setProperty("--bleed-r", `${Math.round(Math.max(0, Math.min(viewport - rect.right, 160)))}px`);
      const card = items()[0];
      if (card) el.style.setProperty("--photo-h", `${Math.round((card.offsetWidth * 2) / 3)}px`);
    };

    // Keep the scroll position inside the middle set
    const recentre = () => {
      const width = setWidth();
      if (!width) return;
      if (row.scrollLeft < width * 0.5) row.scrollTo({ left: row.scrollLeft + width, behavior: "instant" });
      else if (row.scrollLeft > width * 1.5) row.scrollTo({ left: row.scrollLeft - width, behavior: "instant" });
    };

    measure();
    const start = requestAnimationFrame(() => {
      measure();
      const first = items()[stories.length];
      if (first) row.scrollTo({ left: first.offsetLeft - bleedLeft(), behavior: "instant" });
    });

    let settle = 0;
    const onScroll = () => { window.clearTimeout(settle); settle = window.setTimeout(recentre, 160); };
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(settle);
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [stories.length]);

  // Move a page: as many whole cards as fit in the column
  const page = (direction: 1 | -1) => {
    const el = section.current;
    const row = track.current;
    const card = row?.children[0] as HTMLElement | undefined;
    if (!el || !row || !card) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * perPage * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section ref={section} className="bs-carousel" aria-labelledby="more-news-title" aria-roledescription="carousel">
      <div className="bs-section-head">
        <h3 id="more-news-title" className="bs-eyebrow">More news</h3>
        <Link to="/news" className="bs-more">All stories</Link>
      </div>
      <div className="bs-carousel-stage">
        <div className="bs-carousel-track" ref={track}>
          {[0, 1, 2].flatMap((copy) =>
            stories.map((story) => (
              <article key={`${copy}-${story.slug}`} className="bs-carousel-item" aria-hidden={copy === 1 ? undefined : true}>
                <StoryCard story={story} photoClass="bs-photo-more" hidden={copy !== 1} />
              </article>
            )),
          )}
        </div>
        <button type="button" className="bs-carousel-arrow bs-carousel-prev" aria-label="Previous stories" onClick={() => page(-1)}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button type="button" className="bs-carousel-arrow bs-carousel-next" aria-label="More stories" onClick={() => page(1)}>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export function NewsFront() {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <section className="broadsheet" aria-labelledby="news-front-title">
      <div className="bs-wrap">
        {/* Sections sit in bands of different widths on wide screens: the
            front runs wider than the page column, More news and Explore fill
            the column, the streamers and the shop take 90% of it (see
            .bs-band in styles.css) */}
        <div className="bs-band bs-band-front">
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
          <article className="bs-col bs-col-lead bs-reveal">
            <Link to="/news/$slug" params={{ slug: lead.slug }} className="bs-card">
              <p className="bs-eyebrow">{lead.kicker}</p>
              <h3 className="bs-title bs-title-lead">{lead.title}</h3>
              <p className="bs-deck">{lead.deck}</p>
              <ReadTime>{lead.read}</ReadTime>
              <Photo photo={lead.photo} className="bs-photo-lead" />
            </Link>

            {/* The song to check out, then the rest of the playlist as a short list */}
            <div className="bs-song bs-song-wide">
              <p className="bs-song-head">Check out this song</p>
              <a className="bs-song-main" href={youtubeUrl(song.video)} target="_blank" rel="noopener noreferrer">
                <span className="bs-song-media">
                  <img src={youtubeThumb(song.video)} alt="" loading="lazy" />
                  <span className="bs-song-play" aria-hidden="true"><Play size={16} fill="currentColor" strokeWidth={0} /></span>
                </span>
                <span className="bs-song-info">
                  <span className="bs-song-title">{song.title}</span>
                  <span className="bs-song-artist">{song.artist}</span>
                  <span className="bs-song-note">{song.note}</span>
                  <span className="bs-read">{song.kind} on YouTube <ArrowUpRight size={13} aria-hidden="true" /></span>
                </span>
              </a>
              <p className="bs-song-sub">Up next on the playlist</p>
              <ol className="bs-song-next">
                {nextSongs.map((item, index) => (
                  <li key={item.video}>
                    <a href={youtubeUrl(item.video)} target="_blank" rel="noopener noreferrer">
                      <span className="bs-song-num" aria-hidden="true">{index + 2}</span>
                      <span className="bs-song-thumb"><img src={youtubeThumb(item.video)} alt="" loading="lazy" /></span>
                      <span className="bs-song-next-text">
                        <span className="bs-song-next-title">{item.title}</span>
                        <span className="bs-song-next-artist">{item.artist}</span>
                      </span>
                      <Play size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" className="bs-song-next-play" />
                    </a>
                  </li>
                ))}
              </ol>
            </div>
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

          {/* Three more headline stories: a column down the left on wide
              screens, a row under the lead on smaller ones */}
          <div className="bs-col bs-col-side">
            {side.map((story) => (
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

          <aside className="bs-col bs-col-rail bs-reveal" aria-labelledby="events-title">
            <UpcomingEvents />
          </aside>
        </div>
        </div>

        <hr className="bs-rule" />

        <MoreNewsCarousel stories={moreNews} />

        <hr className="bs-rule bs-band bs-band-90" />

        <div className="bs-band bs-band-90">
          <ContentOfTheMonth />
        </div>

        <hr className="bs-rule bs-band bs-band-90" />

        <section className="bs-band bs-band-90" aria-labelledby="shop-title">
          <div className="bs-section-head">
            <h3 id="shop-title" className="bs-eyebrow">Shop</h3>
            <Link to="/shop" className="bs-more">All four shops</Link>
          </div>
          {/* The four shops as shop windows (photo, three picks with prices,
              a Shop button), and beside them a call-to-action card for the
              whole shop */}
          <div className="bs-shop-grid">
            {SHOPS.map((shop) => <article key={shop.slug}><ShopCard shop={shop} /></article>)}

            <article className="bs-shop-cta-wrap">
              <Link to="/shop" className="bs-shop-cta">
                <span className="bs-shop-cta-thumbs" aria-hidden="true">
                  {shopThumbs.map((product) => <img key={product.image} src={product.image} alt="" loading="lazy" />)}
                </span>
                <span className="bs-shop-cta-label">The OGCW Shop</span>
                <span className="bs-shop-cta-title">Shop the OGCW edit</span>
                <span className="bs-shop-cta-copy">Picked by our style desk from the brands in our stories, and bought straight from the retailer.</span>
                <span className="bs-shop-cta-more">
                  <span className="bs-shop-cta-more-label">Also in the edit</span>
                  <span className="bs-shop-cta-picks">
                    {alsoInEdit.map((product) => (
                      <span key={product.image} className="bs-shop-cta-pick">
                        <img src={product.image} alt="" loading="lazy" />
                        <span>{product.name}</span>
                        <span className="bs-shop-cta-pick-price">{formatPrice(product.price)}</span>
                      </span>
                    ))}
                  </span>
                </span>
                <span className="bs-shop-cta-stat">
                  <span className="bs-shop-cta-num">{pickCount}</span>
                  <span>picks from {SHOPS.length} shops, from {formatPrice(lowestPrice)}</span>
                </span>
                <span className="bs-shop-cta-button">Visit the shop <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></span>
              </Link>
            </article>
          </div>
        </section>

        <hr className="bs-rule" />

        {/* Explore runs straight on into Keep exploring: same tiles, no rule between */}
        <ExploreMix />
        <KeepExploring />
      </div>
    </section>
  );
}
