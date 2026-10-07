import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Play, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SECTIONS, SONGS, formatPrice, spotifyTrack, youtubeThumb, type Article, type Song } from "@/data/content";
import { DROPS, VIDEOS } from "@/data/drops";
import { brandOf, getProduct } from "@/data/shop";
import { useStories } from "@/lib/stories";
import type { SiteSection } from "@/lib/site-sections";
import { BsPhoto, StoryCard } from "./broadsheet";
import { NewsWeek } from "./news-week";
import { RapPoll } from "./rap-vote";
import { SpotifyIcon } from "./spotify";
import { StoryMeta } from "./story-meta";
import { useSiteMenu } from "./ogcw-layout";
import { EditSection, S, T } from "./site-text";

// The front page under the hero. Black and white, in turns, like a
// magazine: the masthead and This week (white), More news drifting by
// (black), a few picks from the shop (smoky grey), Explore with a little of
// everything and the music card (white), official videos (black) and
// Culture & fashion (white). The About/newsletter band and the footer follow
// (src/routes/index.tsx). Which story goes where is chosen in the studio
// (src/data/placements.ts); no story shows twice.

type Tone = "light" | "dark" | "grey";

function Band({ tone, name, id, className = "", children }: { tone: Tone; name: SiteSection; id: string; className?: string; children: ReactNode }) {
  return (
    <EditSection name={name}>
      <section className={`fx-band ${className}`} data-band={tone} aria-labelledby={`${id}-title`} id={id}>
        <div className="fx-wrap">{children}</div>
      </section>
    </EditSection>
  );
}

function Head({ id, k, kicker, title, children }: { id: string; k: string; kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="fx-head">
      <div>
        {kicker && <p className="fx-kicker"><T k={`${k}.kicker`}>{kicker}</T></p>}
        <h2 id={`${id}-title`} className="fx-title"><T k={`${k}.title`}>{title}</T></h2>
      </div>
      {children}
    </header>
  );
}

const day = (iso: string) => new Date(iso).getUTCDate();
const mon = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(iso));

/** Today in the browser (the server's day may differ), so past dates drop off */
function useToday() {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  return today;
}

/** A story as a tile: photo, label, headline, optional summary, small print */
function Tile({ story, size = "md", deck = false }: { story: Article; size?: "sm" | "md" | "lg" | "xl"; deck?: boolean }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className={`fx-tile fx-tile-${size}`}>
      <BsPhoto photo={story.photo} className="fx-photo" />
      <span className="fx-tile-text">
        <span className="fx-label"><S story={story} f="kicker" /></span>
        <span className="fx-tile-title"><S story={story} f="title" /></span>
        {deck && <span className="fx-deck"><S story={story} f="deck" /></span>}
        <StoryMeta story={story} className="fx-meta" />
      </span>
    </Link>
  );
}

// ------------------------------------------------------------ Masthead + This week

// The bar under the masthead. Each keeps its first name (`key`) so the
// wording admins gave it stays with it.
const NEWS_BAR = [
  { label: "All news", to: "/news", key: "news" },
  { label: "Socials", to: "/about", hash: "socials", key: "music" },
  { label: "Stories", to: "/originals", key: "games" },
  { label: "Stream", to: "/streaming", key: "streaming" },
  { label: "Culture", to: "/culture", key: "culture" },
  { label: "Sports", to: "/sports", key: "sports" },
  { label: "Shop", to: "/shop", key: "shop" },
  { label: "Explore", to: "/", hash: "explore", key: "explore" },
] as const;

function NewsTop() {
  const { openSearch } = useSiteMenu();
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <EditSection name="OGCW News">
      <section className="broadsheet fx-news" data-band="light" aria-labelledby="news-front-title">
        <div className="bs-wrap">
          <div className="bs-band bs-band-front">
            <header className="bs-masthead">
              <p className="bs-flag">
                <span suppressHydrationWarning>{today}</span>
                <span><T k="home.news.flag-left">Updated daily</T></span>
              </p>
              <h2 id="news-front-title" className="bs-wordmark"><T k="home.news.title">OGCW News</T></h2>
              <p className="bs-flag bs-flag-right">
                <span className="bs-certified"><BadgeCheck size={14} strokeWidth={2} aria-hidden="true" /><T k="home.news.certified">Certified news</T></span>
              </p>
            </header>
            <nav className="bs-nav fx-newsbar" aria-label="News sections">
              <ul>
                {NEWS_BAR.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} {...("hash" in item ? { hash: item.hash } : {})}><T k={`home.news.nav.${item.key}`}>{item.label}</T></Link>
                  </li>
                ))}
                <li>
                  <button type="button" className="fx-newsbar-search" onClick={openSearch} aria-label="Search the news">
                    <Search size={14} strokeWidth={2} aria-hidden="true" /> <T k="home.news.nav.search">Search</T>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          <EditSection name="This week"><NewsWeek /></EditSection>
        </div>
      </section>
    </EditSection>
  );
}

// ------------------------------------------------------------ More news

// The cards run on past both edges of the column with the arrows over them,
// drift on by themselves (and keep moving under the pointer) and loop: the
// stories are laid out three times and the scroll stays in the middle set.
const GLIDE_PX_PER_S = 24;
const GLIDE_REST_MS = 1200;
const GLIDE_AFTER_ARROW_MS = 900;

function MoreNews() {
  const stories = useStories();
  const items = stories.all.filter((a) => !stories.onFront.has(a.slug) && !stories.hidden.has(a.slug));
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section.current;
    const row = track.current;
    if (!el || !row || !items.length) return;
    const cards = () => Array.from(row.children) as HTMLElement[];
    const setWidth = () => {
      const all = cards();
      return (all[items.length]?.offsetLeft ?? 0) - (all[0]?.offsetLeft ?? 0);
    };
    const bleedLeft = () => parseFloat(getComputedStyle(row).paddingLeft) || 0;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      el.style.setProperty("--bleed-l", `${Math.round(Math.max(0, Math.min(rect.left, 160)))}px`);
      el.style.setProperty("--bleed-r", `${Math.round(Math.max(0, Math.min(viewport - rect.right, 160)))}px`);
      const card = cards()[0];
      if (card) el.style.setProperty("--photo-h", `${Math.round((card.offsetWidth * 2) / 3)}px`);
    };
    const recentre = () => {
      const width = setWidth();
      if (!width) return;
      if (row.scrollLeft < width * 0.5) row.scrollTo({ left: row.scrollLeft + width, behavior: "instant" });
      else if (row.scrollLeft > width * 1.5) row.scrollTo({ left: row.scrollLeft - width, behavior: "instant" });
    };
    measure();
    const start = requestAnimationFrame(() => {
      measure();
      const first = cards()[items.length];
      if (first) row.scrollTo({ left: first.offsetLeft - bleedLeft(), behavior: "instant" });
    });
    let settle = 0;
    const onScroll = () => {
      if (row.classList.contains("is-gliding")) return;
      window.clearTimeout(settle);
      settle = window.setTimeout(recentre, 160);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let at = 0;
    let holding = false;
    let onScreen = false;
    let restUntil = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (onScreen && !holding && now > restUntil) {
        if (!row.classList.contains("is-gliding")) {
          row.classList.add("is-gliding");
          at = row.scrollLeft;
        }
        at += (GLIDE_PX_PER_S * dt) / 1000;
        const width = setWidth();
        if (width && at > width * 1.5) at -= width;
        row.scrollLeft = at;
      }
      raf = requestAnimationFrame(frame);
    };
    const handBack = (rest = GLIDE_REST_MS) => {
      row.classList.remove("is-gliding");
      restUntil = performance.now() + rest;
    };
    const byHand = () => handBack();
    const byArrow = () => handBack(GLIDE_AFTER_ARROW_MS);
    const hold = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches(":focus-visible") && !target.closest(".bs-carousel-arrow")) holding = true;
    };
    const release = () => { holding = false; };
    const seen = new IntersectionObserver(([entry]) => { onScreen = !!entry?.isIntersecting; }, { threshold: 0.2 });
    if (!reduce) {
      seen.observe(el);
      raf = requestAnimationFrame(frame);
      row.addEventListener("pointerdown", byHand);
      row.addEventListener("wheel", byHand, { passive: true });
      row.addEventListener("touchstart", byHand, { passive: true });
      el.addEventListener("keydown", byHand);
      el.addEventListener("focusin", hold);
      el.addEventListener("focusout", release);
      el.addEventListener("ogcw-carousel-page", byArrow);
    }
    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(raf);
      seen.disconnect();
      window.clearTimeout(settle);
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("pointerdown", byHand);
      row.removeEventListener("wheel", byHand);
      row.removeEventListener("touchstart", byHand);
      el.removeEventListener("keydown", byHand);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("ogcw-carousel-page", byArrow);
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  const page = (direction: 1 | -1) => {
    const el = section.current;
    const row = track.current;
    const card = row?.children[0] as HTMLElement | undefined;
    if (!el || !row || !card) return;
    el.dispatchEvent(new Event("ogcw-carousel-page"));
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * perPage * step, behavior: reduce ? "auto" : "smooth" });
  };

  if (!items.length) return null;
  return (
    <EditSection name="More news">
      <div className="broadsheet fx-more-news" data-band="dark">
        <div className="bs-wrap">
          <section ref={section} className="bs-carousel" aria-labelledby="more-news-title" aria-roledescription="carousel">
            <h2 id="more-news-title" className="fx-more-title"><T k="home.more.title">More news</T></h2>
            <div className="bs-carousel-stage">
              <div className="bs-carousel-track" ref={track}>
                {[0, 1, 2].flatMap((copy) =>
                  items.map((story) => (
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
        </div>
      </div>
    </EditSection>
  );
}

// ------------------------------------------------------------ Shop strip

// Six picks in two rows of three, hoodies on top and sneakers below: each
// card is the photo alone, upright, leaning towards the pointer with a sheen
// that follows it (src/components/card-hover.tsx), and under it the brand
// and a link to browse that brand. The full shop is on /shop.
const SHOWCASE = [
  "nike-club-fleece-hoodie-black", "supreme-box-logo-hoodie-red", "carhartt-wip-heart-hoodie-grey",
  "jordan-4-retro-grey", "nb-2002r-brown", "converse-chuck-hi-navy",
].flatMap((id) => getProduct(id) ?? []);

function ShopStrip() {
  return (
    <Band tone="grey" name="Shop window" id="shop-strip" className="fx-shop">
      <h2 id="shop-strip-title" className="fx-shop-title"><T k="front.shop.title2">Featured drops</T></h2>
      <ul className="fx-shop-row">
        {SHOWCASE.map((product) => {
          const brand = brandOf(product);
          return (
            <li key={product.id}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="fx-shopcard" aria-label={`${brand.name} ${product.name}${product.price !== undefined ? `, ${formatPrice(product.price)}` : ""}`}>
                <img src={product.image} alt={`${brand.name} ${product.name}, ${product.colour}`} loading="lazy" />
              </Link>
              <Link to="/shop/$slug" params={{ slug: brand.slug }} className="fx-shopcard-brand">
                <span>{brand.name}</span>
                <span className="fx-shopcard-go"><T k="front.shop.card">Browse</T> <ArrowRight size={13} aria-hidden="true" /></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}

// ------------------------------------------------------------ Explore

// The music card: the song of the week, and the No. 1 rapper vote, which
// opens in place
const [SONG] = SONGS as [Song, ...Song[]];

function MusicCard() {
  const [open, setOpen] = useState(false);
  return (
    <section className="fx-music" data-band="dark" aria-labelledby="music-card-title">
      <div className="fx-music-row">
        <a className="fx-music-song" href={spotifyTrack(SONG.spotify)} target="_blank" rel="noopener noreferrer" aria-label={`${SONG.title} by ${SONG.artist}, on Spotify`}>
          <span className="fx-music-cover"><img src={SONG.cover} alt="" loading="lazy" /><span aria-hidden="true"><Play size={14} fill="currentColor" strokeWidth={0} /></span></span>
          <span>
            <span className="fx-label"><T k="home.song.title2">Song of the week</T></span>
            <span className="fx-music-title"><T>{SONG.title}</T> <span>· <T>{SONG.artist}</T></span></span>
            <span className="fx-spotify"><SpotifyIcon size={14} /> <T k="home.song.cta">Play on Spotify</T> <ArrowUpRight size={12} aria-hidden="true" /></span>
          </span>
        </a>
        <div className="fx-music-vote">
          <h3 id="music-card-title" className="fx-music-q"><T>Who’s the</T> <em><T>No. 1</T></em> <T>rapper right now?</T></h3>
          <button type="button" className="fx-btn" aria-expanded={open} aria-controls="rap-vote" onClick={() => setOpen((value) => !value)}>
            {open ? <T k="front.music.close">Close the vote</T> : <T k="front.music.vote">Cast your vote</T>} <ChevronDown size={15} aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : undefined }} />
          </button>
        </div>
        <Link to="/music" className="fx-more"><T k="front.music.more">More in Music</T> <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
      {open && <div id="rap-vote" className="fx-music-poll"><RapPoll /></div>}
    </section>
  );
}

function Desk({ label, to, k, lead, more }: { label: string; to: "/sports" | "/games" | "/streaming" | "/music"; k: string; lead: Article | undefined; more: Article[] }) {
  if (!lead) return null;
  return (
    <div className="fx-desk">
      <Link to={to} className="fx-desk-head"><T k={`${k}.label`}>{label}</T> <ArrowRight size={14} aria-hidden="true" /></Link>
      <Tile story={lead} size="sm" />
      <ul className="fx-desk-more">
        {more.map((story) => (
          <li key={story.slug}><Link to="/news/$slug" params={{ slug: story.slug }}><S story={story} f="title" /></Link></li>
        ))}
      </ul>
    </div>
  );
}

function Explore() {
  const stories = useStories();
  const today = useToday();
  const [lead = stories.pick("vmas-2026-winners")] = stories.slot("front-lead");
  const latest = stories.slot("wire-latest");
  const ranked = stories.slot("ranking");
  const more = stories.slot("explore-more");
  const drops = DROPS.filter((drop) => drop.date >= today).slice(0, 5);
  return (
    <Band tone="light" name="Explore" id="explore" className="fx-explore">
      <Head id="explore" k="front.explore" kicker="Explore" title="A little of everything" />

      <div className="fx-ex-top">
        <Link to="/news/$slug" params={{ slug: lead.slug }} className="fx-lead">
          <BsPhoto photo={lead.photo} className="fx-photo fx-lead-photo" />
          <span className="fx-label"><S story={lead} f="kicker" /></span>
          <span className="fx-lead-title"><S story={lead} f="title" /></span>
          <span className="fx-deck"><S story={lead} f="deck" /></span>
          <StoryMeta story={lead} className="fx-meta" />
        </Link>
        <div className="fx-ex-latest">
          <p className="fx-col-head"><T k="front.wire.latest">Just in</T></p>
          <ol className="fx-latest">
            {latest.map((story, index) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="fx-latest-item">
                  <span className="fx-num" aria-hidden="true">{index + 1}</span>
                  <span>
                    <span className="fx-label">{SECTIONS[story.section].label}</span>
                    <span className="fx-latest-title"><S story={story} f="title" /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="fx-desks">
        <Desk label="Sports" to="/sports" k="front.ex.sports" lead={stories.slot("sports-lead")[0]} more={stories.slot("sports-more")} />
        <Desk label="Rap" to="/music" k="front.ex.rap" lead={stories.slot("rap-spotlight")[0]} more={stories.slot("rap-beat")} />
        <Desk label="Games" to="/games" k="front.ex.games" lead={stories.slot("games-lead")[0]} more={stories.slot("games-more")} />
        <Desk label="Streaming" to="/streaming" k="front.ex.streaming" lead={stories.slot("streaming-lead")[0]} more={stories.slot("streaming-more")} />
      </div>

      {more.length > 0 && (
        <section className="fx-ex-more" aria-labelledby="explore-more-title">
          <p id="explore-more-title" className="fx-col-head"><T k="front.ex.more">More stories</T></p>
          <ul className="fx-ex-more-row">
            {more.map((story) => <li key={story.slug}><Tile story={story} size="sm" /></li>)}
          </ul>
        </section>
      )}

      <EditSection name="Rap desk"><MusicCard /></EditSection>

      <div className="fx-ex-lists">
        <section aria-labelledby="ogcw10-title">
          <p id="ogcw10-title" className="fx-col-head"><T k="front.ranking.kicker">The OGCW 10</T></p>
          <ol className="fx-rank">
            {ranked.map((story, index) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="fx-rank-item">
                  <span className="fx-rank-num" aria-hidden="true">{index + 1}</span>
                  <span className="fx-rank-title"><S story={story} f="title" /></span>
                  <BsPhoto photo={story.photo} className="fx-rank-thumb" />
                </Link>
              </li>
            ))}
          </ol>
          <Link to="/forum/$room" params={{ room: "ogcw-10" }} className="fx-more fx-more-block"><T k="front.ranking.argue">Argue the ranking in the forum</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </section>
        <section aria-labelledby="dates-title">
          <p id="dates-title" className="fx-col-head"><T k="front.drops.title2">Release dates</T></p>
          <ol className="fx-dates">
            {drops.map((drop) => (
              <li key={drop.date + drop.name} className="fx-date">
                <span className="fx-date-day"><b>{day(drop.date)}</b>{mon(drop.date)}</span>
                <span>
                  <span className="fx-label">{drop.kind}</span>
                  <span className="fx-date-name"><T>{drop.name}</T></span>
                </span>
                <span className="fx-date-detail"><T>{drop.detail}</T></span>
              </li>
            ))}
          </ol>
          <Link to="/shop/drops" className="fx-more fx-more-block"><T k="front.drops.all">Every release date</T> <ArrowRight size={14} aria-hidden="true" /></Link>
        </section>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Official videos

const CLIPS = VIDEOS.slice(0, 4);

function Watch() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const video = CLIPS[current]!;
  return (
    <Band tone="dark" name="Watch" id="watch" className="fx-watch">
      <Head id="watch" k="front.watch" kicker="Watch" title="Official videos" />
      <div className="fx-watch-grid">
        <div className="fx-player">
          {playing ? (
            <iframe src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <button type="button" className="fx-player-poster" onClick={() => setPlaying(true)} aria-label={`Play ${video.title}`}>
              <img src={youtubeThumb(video.id)} alt="" loading="lazy" />
              <span className="fx-play-btn" aria-hidden="true"><Play size={22} fill="currentColor" strokeWidth={0} /></span>
            </button>
          )}
        </div>
        <div className="fx-watch-side">
          <p className="fx-label">{video.kind} · {video.channel}</p>
          <p className="fx-player-title">{video.title}</p>
          <Link to="/news/$slug" params={{ slug: video.slug }} className="fx-more"><T k="front.watch.story">Read the story</T> <ArrowRight size={14} aria-hidden="true" /></Link>
          <ol className="fx-playlist" aria-label="More videos">
            {CLIPS.map((item, index) => (
              <li key={item.id}>
                <button type="button" className="fx-clip" aria-current={index === current ? "true" : undefined} onClick={() => { setCurrent(index); setPlaying(true); }}>
                  <span className="fx-clip-thumb"><img src={youtubeThumb(item.id)} alt="" loading="lazy" /></span>
                  <span className="fx-clip-title">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Culture & fashion

function CultureFashion() {
  const stories = useStories();
  const [lead] = stories.slot("culture-lead");
  const more = stories.slot("culture-more");
  if (!lead) return null;
  return (
    <Band tone="light" name="Culture & fashion" id="culture" className="fx-culture">
      <Head id="culture" k="front.culture" kicker="Culture" title="Culture & fashion">
        <Link to="/culture" className="fx-more"><T k="front.culture.link">All culture</T> <ArrowRight size={14} aria-hidden="true" /></Link>
      </Head>
      <div className="fx-culture-grid">
        <Tile story={lead} size="xl" deck />
        {more.map((story) => <Tile key={story.slug} story={story} size="sm" />)}
      </div>
    </Band>
  );
}

export function FrontPage() {
  return (
    <div className="front">
      <NewsTop />
      <MoreNews />
      <ShopStrip />
      <Explore />
      <Watch />
      <CultureFashion />
    </div>
  );
}
