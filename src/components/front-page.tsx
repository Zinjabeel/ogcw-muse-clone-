import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BadgeCheck, ChevronLeft, ChevronRight, Play, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SECTIONS, SHOPS, SONGS, formatPrice, spotifyTrack, youtubeThumb, type Article, type Song } from "@/data/content";
import { DROPS, NIGHTS, VIDEOS, type DropKind } from "@/data/drops";
import { BRANDS, PRODUCTS, brandOf } from "@/data/shop";
import { useStories } from "@/lib/stories";
import { currentRound, myRankingVote, rankingTotals, voteRanking } from "@/lib/ranking-votes";
import type { SiteSection } from "@/lib/site-sections";
import { BsPhoto, StoryCard } from "./broadsheet";
import { NewsWeek } from "./news-week";
import { RapPoll } from "./rap-vote";
import { NewsletterForm } from "./connect-section";
import { SpotifyIcon } from "./spotify";
import { StoryMeta } from "./story-meta";
import { EditSection, S, T } from "./site-text";
import nikeLogo from "@/assets/brands/nike.svg";
import adidasLogo from "@/assets/brands/adidas.svg";
import stockxLogo from "@/assets/brands/stockx.svg";
import uniqloLogo from "@/assets/brands/uniqlo.svg";

// The front page under the hero, as bands that take turns being white and
// black (in the Gold theme; in the others they keep the theme's colours),
// with gold for labels, numbers and buttons:
//   The Wire (white): the main story, the newest stories, what's coming up
//   More news (black): every story not placed elsewhere, drifting by
//   The week (white): the week's block, with Big news
//   Rap desk (black): the spotlight, the rap beat, the No. 1 vote, the song
//   Drops (white): the release calendar: sneakers, music, games, film
//   Shop window (black): picks from the shop
//   The OGCW 10 (white): ten stories, ranked
//   Sports desk (black)
//   Games & streaming (white)
//   Watch (black): official videos from the people in our stories
//   Culture & fashion (white)
//   Stay in the culture (gold): the newsletter and the forum
// Which story goes where is chosen in the studio (src/data/placements.ts);
// no story shows twice.

type Tone = "light" | "dark" | "gold";
type BandPath = "/news" | "/music" | "/games" | "/streaming" | "/culture" | "/sports" | "/shop";

function Band({ tone, name, id, className = "", children }: { tone: Tone; name: SiteSection; id: string; className?: string; children: ReactNode }) {
  return (
    <EditSection name={name}>
      <section className={`fx-band ${className}`} data-band={tone} aria-labelledby={`${id}-title`} id={id}>
        <div className="fx-wrap">{children}</div>
      </section>
    </EditSection>
  );
}

function Head({ id, k, kicker, title, link, to, hash }: { id: string; k: string; kicker: string; title: string; link?: string; to?: BandPath; hash?: string }) {
  return (
    <header className="fx-head">
      <div>
        <p className="fx-kicker"><span className="fx-tick" aria-hidden="true" /><T k={`${k}.kicker`}>{kicker}</T></p>
        <h2 id={`${id}-title`} className="fx-title"><T k={`${k}.title`}>{title}</T></h2>
      </div>
      {link && to && (
        <Link to={to} {...(hash ? { hash } : {})} className="fx-more"><T k={`${k}.link`}>{link}</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></Link>
      )}
    </header>
  );
}

const day = (iso: string) => new Date(iso).getUTCDate();
const mon = (iso: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(iso));
const wday = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(iso));

/** Today in the browser (the server's day may differ), so past dates drop off */
function useToday() {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  return today;
}

/** A story as a tile: photo, label, headline, optional summary, small print */
function Tile({ story, size = "md", deck = false, eager = false }: { story: Article; size?: "sm" | "md" | "lg" | "xl"; deck?: boolean; eager?: boolean }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className={`fx-tile fx-tile-${size}`}>
      <BsPhoto photo={story.photo} className="fx-photo" eager={eager} />
      <span className="fx-tile-text">
        <span className="fx-label"><S story={story} f="kicker" /></span>
        <span className="fx-tile-title"><S story={story} f="title" /></span>
        {deck && <span className="fx-deck"><S story={story} f="deck" /></span>}
        <StoryMeta story={story} className="fx-meta" />
      </span>
    </Link>
  );
}

/** A story as a line: a small photo beside its headline */
function Row({ story, num }: { story: Article; num?: number }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className="fx-row">
      {num !== undefined && <span className="fx-num" aria-hidden="true">{String(num).padStart(2, "0")}</span>}
      <span className="fx-row-text">
        <span className="fx-label">{SECTIONS[story.section].label} · <S story={story} f="kicker" /></span>
        <span className="fx-row-title"><S story={story} f="title" /></span>
        <StoryMeta story={story} className="fx-meta" />
      </span>
      <BsPhoto photo={story.photo} className="fx-row-thumb" />
    </Link>
  );
}

// ------------------------------------------------------------ The Wire

const WIRE_LINKS = [
  { label: "All news", to: "/news" },
  { label: "Music", to: "/music" },
  { label: "Games", to: "/games" },
  { label: "Streaming", to: "/streaming" },
  { label: "Culture", to: "/culture" },
  { label: "Sports", to: "/sports" },
  { label: "Shop", to: "/shop" },
] as const;

function Wire() {
  const stories = useStories();
  const today = useToday();
  const [lead = stories.pick("vmas-2026-winners")] = stories.slot("front-lead");
  const latest = stories.slot("wire-latest");
  const nights = NIGHTS.filter((night) => (night.end ?? night.date) >= today).slice(0, 5);
  const date = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <Band tone="light" name="The Wire" id="wire" className="fx-wire">
      <div className="fx-strip">
        <p className="fx-strip-flag">
          <span className="fx-certified"><BadgeCheck size={15} strokeWidth={2} aria-hidden="true" /><T k="front.wire.certified">Certified news</T></span>
          <span suppressHydrationWarning>{date}</span>
        </p>
        <nav aria-label="News sections">
          <ul className="fx-strip-links">
            {WIRE_LINKS.map((item) => <li key={item.to}><Link to={item.to}><T k={`front.wire.nav.${item.to.slice(1)}`}>{item.label}</T></Link></li>)}
          </ul>
        </nav>
      </div>

      <h2 id="wire-title" className="sr-only"><T k="front.wire.title">Top stories</T></h2>
      <div className="fx-wire-grid">
        <Link to="/news/$slug" params={{ slug: lead.slug }} className="fx-lead">
          <BsPhoto photo={lead.photo} className="fx-photo fx-lead-photo" eager />
          <span className="fx-label"><S story={lead} f="kicker" /></span>
          <span className="fx-lead-title"><S story={lead} f="title" /></span>
          <span className="fx-deck fx-deck-lg"><S story={lead} f="deck" /></span>
          <StoryMeta story={lead} className="fx-meta" />
        </Link>

        <div className="fx-wire-latest">
          <p className="fx-col-head"><T k="front.wire.latest">Just in</T></p>
          <ol className="fx-list">
            {latest.map((story, index) => <li key={story.slug}><Row story={story} num={index + 1} /></li>)}
          </ol>
          <Link to="/news" className="fx-more fx-more-block"><T k="front.wire.all">Every story, newest first</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>

        <aside className="fx-wire-rail" aria-labelledby="coming-up-title">
          <p id="coming-up-title" className="fx-col-head"><T k="front.wire.coming">Coming up</T></p>
          <ol className="fx-nights">
            {nights.map((night) => {
              const inner = (
                <>
                  <span className="fx-cal" aria-hidden="true">
                    <span className="fx-cal-wd">{wday(night.date)}</span>
                    <span className="fx-cal-d">{day(night.date)}</span>
                    <span className="fx-cal-m">{mon(night.date)}</span>
                  </span>
                  <span className="fx-night-text">
                    <span className="fx-label">{night.tag}</span>
                    <span className="fx-night-name"><T>{night.name}</T></span>
                    <span className="fx-night-detail"><T>{night.detail}</T></span>
                  </span>
                </>
              );
              return (
                <li key={night.date + night.name}>
                  {night.slug ? <Link to="/news/$slug" params={{ slug: night.slug }} className="fx-night">{inner}</Link> : <div className="fx-night">{inner}</div>}
                </li>
              );
            })}
          </ol>
          <Link to="/" hash="drops" className="fx-more fx-more-block"><T k="front.wire.drops">The release calendar</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </aside>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ More news

// The cards drift on by themselves (and keep moving under the pointer),
// with arrows for a page at a time. The row loops: the stories are laid out
// three times and the scroll is kept inside the middle set.
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
    const recentre = () => {
      const width = setWidth();
      if (!width) return;
      if (row.scrollLeft < width * 0.5) row.scrollTo({ left: row.scrollLeft + width, behavior: "instant" });
      else if (row.scrollLeft > width * 1.5) row.scrollTo({ left: row.scrollLeft - width, behavior: "instant" });
    };
    const start = requestAnimationFrame(() => {
      const first = cards()[items.length];
      if (first) row.scrollTo({ left: first.offsetLeft - row.offsetLeft, behavior: "instant" });
    });
    let settle = 0;
    const onScroll = () => {
      if (row.classList.contains("is-gliding")) return;
      window.clearTimeout(settle);
      settle = window.setTimeout(recentre, 160);
    };
    row.addEventListener("scroll", onScroll, { passive: true });

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
      if (target.matches(":focus-visible") && !target.closest(".fx-arrow")) holding = true;
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
    const perPage = Math.max(1, Math.floor((row.clientWidth + gap) / step));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * perPage * step, behavior: reduce ? "auto" : "smooth" });
  };

  if (!items.length) return null;
  return (
    <EditSection name="More news">
      <section ref={section} className="fx-band fx-more-news" data-band="dark" aria-labelledby="more-news-title" aria-roledescription="carousel">
        <div className="fx-wrap">
          <header className="fx-head">
            <div>
              <p className="fx-kicker"><span className="fx-tick" aria-hidden="true" /><T k="home.more.kicker">Keep reading</T></p>
              <h2 id="more-news-title" className="fx-title"><T k="home.more.title">More news</T></h2>
            </div>
            <div className="fx-arrows">
              <button type="button" className="fx-arrow" aria-label="Previous stories" onClick={() => page(-1)}><ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /></button>
              <button type="button" className="fx-arrow" aria-label="More stories" onClick={() => page(1)}><ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" /></button>
              <Link to="/news" className="fx-more"><T k="home.more.link">All stories</T> <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </header>
        </div>
        <div className="fx-track" ref={track}>
          {[0, 1, 2].flatMap((copy) =>
            items.map((story) => (
              <article key={`${copy}-${story.slug}`} className="fx-track-item" aria-hidden={copy === 1 ? undefined : true}>
                <StoryCard story={story} photoClass="bs-photo-more" hidden={copy !== 1} />
              </article>
            )),
          )}
        </div>
      </section>
    </EditSection>
  );
}

// ------------------------------------------------------------ Rap desk

const [SONG, ...MORE_SONGS] = SONGS as [Song, ...Song[]];

function RapDesk() {
  const stories = useStories();
  const [spotlight] = stories.slot("rap-spotlight");
  const beat = stories.slot("rap-beat");
  return (
    <Band tone="dark" name="Rap desk" id="rap" className="fx-rap">
      <Head id="rap" k="front.rap" kicker="The rap desk" title="Rap, right now" link="More in Music" to="/music" />
      <div className="fx-rap-grid">
        <div className="fx-rap-main">
          {spotlight && (
            <Link to="/news/$slug" params={{ slug: spotlight.slug }} className="fx-spot">
              <BsPhoto photo={spotlight.photo} className="fx-photo fx-spot-photo" />
              <span className="fx-spot-text">
                <span className="fx-pill"><T k="front.rap.spot">Spotlight</T> · <S story={spotlight} f="kicker" /></span>
                <span className="fx-spot-title"><S story={spotlight} f="title" /></span>
                <span className="fx-deck"><S story={spotlight} f="deck" /></span>
              </span>
            </Link>
          )}
          <p className="fx-col-head"><T k="front.rap.beat">On the rap beat</T></p>
          <ol className="fx-list fx-list-2">
            {beat.map((story) => <li key={story.slug}><Row story={story} /></li>)}
          </ol>
        </div>

        <div className="fx-rap-vote">
          <p className="fx-col-head"><T k="front.rap.vote">Vote</T></p>
          <h3 className="fx-vote-q"><T>Who’s the</T> <em><T>No. 1</T></em> <T>rapper right now?</T></h3>
          <RapPoll />
        </div>

        <div className="fx-rap-song">
          <p className="fx-col-head"><T k="home.song.title">Song of the week</T></p>
          <a className="fx-song" href={spotifyTrack(SONG.spotify)} target="_blank" rel="noopener noreferrer" aria-label={`${SONG.title} by ${SONG.artist}, on Spotify`}>
            <span className="fx-song-cover"><img src={SONG.cover} alt="" loading="lazy" /><span className="fx-song-play" aria-hidden="true"><Play size={18} fill="currentColor" strokeWidth={0} /></span></span>
            <span className="fx-song-title"><T>{SONG.title}</T></span>
            <span className="fx-song-artist"><T>{SONG.artist}</T> · {SONG.album}</span>
            <span className="fx-song-note"><T>{SONG.note}</T></span>
            <span className="fx-spotify"><SpotifyIcon size={15} /> <T k="home.song.cta">Play on Spotify</T> <ArrowUpRight size={13} aria-hidden="true" /></span>
          </a>
          <ol className="fx-songs">
            {MORE_SONGS.map((song, index) => (
              <li key={song.spotify}>
                <a href={spotifyTrack(song.spotify)} target="_blank" rel="noopener noreferrer" aria-label={`${song.title} by ${song.artist}, on Spotify`}>
                  <span className="fx-num" aria-hidden="true">{index + 2}</span>
                  <img src={song.cover} alt="" loading="lazy" />
                  <span><span className="fx-songs-title"><T>{song.title}</T></span><span className="fx-songs-artist"><T>{song.artist}</T></span></span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Drops

const KINDS: ("All" | DropKind)[] = ["All", "Sneakers", "Music", "Games", "Film"];
const DROPS_SHOWN = 12;

function Drops() {
  const today = useToday();
  const [kind, setKind] = useState<"All" | DropKind>("All");
  const [all, setAll] = useState(false);
  const upcoming = DROPS.filter((drop) => drop.date >= today && (kind === "All" || drop.kind === kind));
  const shown = all ? upcoming : upcoming.slice(0, DROPS_SHOWN);
  return (
    <Band tone="light" name="Drops" id="drops" className="fx-drops">
      <Head id="drops" k="front.drops" kicker="Drops" title="The release calendar" link="Shop the drops" to="/shop" />
      <div className="fx-tabs" role="group" aria-label="Show releases">
        {KINDS.map((item) => (
          <button key={item} type="button" className="fx-tab" aria-pressed={kind === item} onClick={() => { setKind(item); setAll(false); }}>
            <T k={`front.drops.kind.${item.toLowerCase()}`}>{item}</T>
          </button>
        ))}
      </div>
      <ol className="fx-drop-grid">
        {shown.map((drop) => {
          const inner = (
            <>
              <span className="fx-drop-date">
                <span className="fx-drop-d">{day(drop.date)}</span>
                <span className="fx-drop-m">{mon(drop.date)} · {wday(drop.date)}</span>
              </span>
              <span className="fx-drop-kind" data-kind={drop.kind}>{drop.kind}</span>
              <span className="fx-drop-name"><T>{drop.name}</T></span>
              <span className="fx-drop-detail"><T>{drop.detail}</T></span>
              {drop.slug && <span className="fx-drop-cta"><T k="front.drops.read">Read the story</T> <ArrowRight size={13} aria-hidden="true" /></span>}
              {!drop.slug && drop.source && <span className="fx-drop-src"><T k="front.drops.source">Date via</T> {drop.source.name.split(":")[0]}</span>}
            </>
          );
          return (
            <li key={drop.date + drop.name}>
              {drop.slug ? <Link to="/news/$slug" params={{ slug: drop.slug }} className="fx-drop">{inner}</Link>
                : drop.source ? <a href={drop.source.url} target="_blank" rel="noopener noreferrer" className="fx-drop">{inner}</a>
                : <div className="fx-drop">{inner}</div>}
            </li>
          );
        })}
      </ol>
      {upcoming.length > DROPS_SHOWN && (
        <button type="button" className="fx-btn fx-btn-ghost" aria-expanded={all} onClick={() => setAll((value) => !value)}>
          {all ? "Show fewer" : `Show all ${upcoming.length} dates`}
        </button>
      )}
    </Band>
  );
}

// ------------------------------------------------------------ Shop window

const LOGOS: Record<string, string> = { nike: nikeLogo, adidas: adidasLogo, stockx: stockxLogo, uniqlo: uniqloLogo };
// Eight picks from the shop: what's trending, one per brand
const PICKS = PRODUCTS.filter((product, index, all) => product.tags?.includes("trending") && all.findIndex((other) => other.brand === product.brand && other.tags?.includes("trending")) === index).slice(0, 8);

function ShopWindow() {
  return (
    <Band tone="dark" name="Shop window" id="shop-window" className="fx-shop">
      <Head id="shop-window" k="front.shop" kicker="The OGCW Shop" title="Shop the edit" link="Enter the shop" to="/shop" />
      <div className="fx-shop-grid">
        <Link to="/shop" className="fx-shop-hero">
          <img src={SHOPS[0]!.hero.src} alt="" loading="lazy" />
          <span className="fx-shop-hero-text">
            <span className="fx-pill"><ShoppingBag size={13} aria-hidden="true" /> <T k="front.shop.label">New in the shop</T></span>
            <span className="fx-shop-hero-title"><T k="front.shop.hero">The pairs and pieces in our stories, picked by the style desk</T></span>
            <span className="fx-btn"><T k="front.shop.cta">Shop now</T> <ArrowRight size={15} aria-hidden="true" /></span>
          </span>
        </Link>
        <ul className="fx-products">
          {PICKS.map((product) => (
            <li key={product.id}>
              <Link to="/shop/p/$id" params={{ id: product.id }} className="fx-product">
                <span className="fx-product-photo"><img src={product.image} alt={`${brandOf(product).name} ${product.name}`} loading="lazy" /></span>
                <span className="fx-product-brand">{brandOf(product).name}</span>
                <span className="fx-product-name">{product.name}</span>
                <span className="fx-product-price">{product.price !== undefined ? formatPrice(product.price) : "Price at the retailer"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <ul className="fx-brands" aria-label="Shop by brand">
        {SHOPS.map((shop) => (
          <li key={shop.slug}><Link to="/shop/$slug" params={{ slug: shop.slug }} className="fx-brand" data-brand={shop.slug}><img src={LOGOS[shop.slug]} alt={shop.name} /></Link></li>
        ))}
        {BRANDS.filter((brand) => !LOGOS[brand.slug]).slice(0, 8).map((brand) => (
          <li key={brand.slug}><Link to="/shop/$slug" params={{ slug: brand.slug }} className="fx-brand">{brand.name}</Link></li>
        ))}
        <li><Link to="/shop" className="fx-brand fx-brand-all"><T k="front.shop.brands">All 27 brands</T></Link></li>
      </ul>
    </Band>
  );
}

// ------------------------------------------------------------ The OGCW 10

function Ranking() {
  const ranked = useStories().slot("ranking");
  const [first, second, third, ...rest] = ranked;
  return (
    <Band tone="light" name="The OGCW 10" id="ranking" className="fx-ranking">
      <Head id="ranking" k="front.ranking" kicker="The OGCW 10" title="The ten biggest stories right now" link="All news" to="/news" />
      <p className="fx-intro"><T k="front.ranking.intro">Ranked by the OGCW desk: what moved culture most, from one to ten.</T></p>
      <div className="fx-podium">
        {[first, second, third].map((story, index) => story && (
          <Link key={story.slug} to="/news/$slug" params={{ slug: story.slug }} className={`fx-podium-item fx-podium-${index + 1}`}>
            <span className="fx-rank" aria-label={`Number ${index + 1}`}>{index + 1}</span>
            <BsPhoto photo={story.photo} className="fx-photo" />
            <span className="fx-label">{SECTIONS[story.section].label} · <S story={story} f="kicker" /></span>
            <span className="fx-tile-title"><S story={story} f="title" /></span>
            {index === 0 && <span className="fx-deck"><S story={story} f="deck" /></span>}
          </Link>
        ))}
      </div>
      <ol className="fx-rank-list" start={4}>
        {rest.map((story, index) => (
          <li key={story.slug}>
            <Link to="/news/$slug" params={{ slug: story.slug }} className="fx-rank-row">
              <span className="fx-rank fx-rank-sm" aria-hidden="true">{index + 4}</span>
              <span className="fx-row-text">
                <span className="fx-label">{SECTIONS[story.section].label}</span>
                <span className="fx-row-title"><S story={story} f="title" /></span>
              </span>
              <BsPhoto photo={story.photo} className="fx-row-thumb" />
            </Link>
          </li>
        ))}
      </ol>
      <RankingVote stories={ranked} />
    </Band>
  );
}

// Readers' vote under the ranking: which of the ten should be No. 1? Bars
// show the share of votes this week; counts come from Supabase as they are.
function RankingVote({ stories }: { stories: Article[] }) {
  const [round, setRound] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<string, number> | null>(null);
  const [mine, setMine] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  useEffect(() => {
    const now = currentRound();
    setRound(now);
    setMine(myRankingVote(now));
    rankingTotals(now).then(setTotals).catch(() => setTotals({}));
  }, []);
  const vote = async (slug: string) => {
    if (!round || status === "sending") return;
    setStatus("sending");
    try {
      await voteRanking(round, slug);
      setMine(slug);
      setTotals(await rankingTotals(round));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };
  const total = totals ? stories.reduce((sum, story) => sum + (totals[story.slug] ?? 0), 0) : 0;
  const show = !!mine && total > 0;
  return (
    <div className="fx-vote">
      <div className="fx-vote-head">
        <p className="fx-col-head"><T k="front.ranking.vote.kicker">Readers’ vote</T></p>
        <h3 className="fx-vote-title"><T k="front.ranking.vote.title">Which one should be No. 1?</T></h3>
        <p className="fx-vote-note" aria-live="polite">
          {status === "error" ? "Your vote didn’t go through. Try again." : show ? `${total.toLocaleString("en-GB")} ${total === 1 ? "vote" : "votes"} this week. You can change yours.` : "One vote a week. You’ll see how everyone voted straight after."}
        </p>
      </div>
      <ol className="fx-vote-list">
        {stories.map((story, index) => {
          const share = show ? Math.round(((totals?.[story.slug] ?? 0) * 100) / total) : 0;
          return (
            <li key={story.slug}>
              <button type="button" className="fx-vote-opt" aria-pressed={mine === story.slug} disabled={status === "sending"} onClick={() => vote(story.slug)} style={{ ["--share" as string]: `${share}%` }}>
                {show && <span className="fx-vote-bar" aria-hidden="true" />}
                <span className="fx-vote-rank">{index + 1}</span>
                <span className="fx-vote-name"><S story={story} f="title" /></span>
                <span className="fx-vote-share">{show ? `${share}%` : mine === story.slug ? "Your vote" : "Vote"}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
// ------------------------------------------------------------ Sports desk

const FIXTURES = NIGHTS.filter((night) => night.tag === "Sports");

function SportsDesk() {
  const stories = useStories();
  const today = useToday();
  const [lead] = stories.slot("sports-lead");
  const more = stories.slot("sports-more");
  if (!lead) return null;
  return (
    <Band tone="dark" name="Sports desk" id="sports" className="fx-sports">
      <Head id="sports" k="front.sports" kicker="Sports" title="The sports desk" link="All sports" to="/sports" />
      <div className="fx-sports-grid">
        <Tile story={lead} size="xl" deck />
        <div className="fx-sports-side">
          {more.map((story) => <Tile key={story.slug} story={story} size="sm" />)}
        </div>
        <aside className="fx-fixtures" aria-labelledby="fixtures-title">
          <p id="fixtures-title" className="fx-col-head"><T k="front.sports.fixtures">Fixtures & big nights</T></p>
          <ol>
            {FIXTURES.filter((night) => night.date >= today).map((night) => (
              <li key={night.date + night.name}>
                <span className="fx-fix-date">{day(night.date)} {mon(night.date)}</span>
                <span className="fx-fix-name"><T>{night.name}</T></span>
                <span className="fx-fix-detail"><T>{night.detail}</T></span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Games & streaming

function Desk({ title, k, to, lead, more }: { title: string; k: string; to: "/games" | "/streaming"; lead: Article | undefined; more: Article[] }) {
  if (!lead) return null;
  return (
    <div className="fx-desk">
      <div className="fx-desk-head">
        <h3 className="fx-desk-title"><T k={`${k}.title`}>{title}</T></h3>
        <Link to={to} className="fx-more"><T k={`${k}.link`}>See all</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      <Tile story={lead} size="lg" deck />
      <ol className="fx-list">
        {more.map((story) => <li key={story.slug}><Row story={story} /></li>)}
      </ol>
    </div>
  );
}

function GamesStreaming() {
  const stories = useStories();
  return (
    <Band tone="light" name="Games & streaming" id="play" className="fx-play">
      <Head id="play" k="front.play" kicker="Play" title="Games & streaming" />
      <div className="fx-desks">
        <Desk title="Games" k="front.play.games" to="/games" lead={stories.slot("games-lead")[0]} more={stories.slot("games-more")} />
        <Desk title="Streaming" k="front.play.streaming" to="/streaming" lead={stories.slot("streaming-lead")[0]} more={stories.slot("streaming-more")} />
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Watch

function Watch() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const video = VIDEOS[current]!;
  const choose = (index: number) => { setCurrent(index); setPlaying(true); };
  return (
    <Band tone="dark" name="Watch" id="watch" className="fx-watch">
      <Head id="watch" k="front.watch" kicker="Watch" title="Official videos" />
      <div className="fx-watch-grid">
        <div className="fx-player">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button type="button" className="fx-player-poster" onClick={() => setPlaying(true)} aria-label={`Play ${video.title}`}>
              <img src={youtubeThumb(video.id)} alt="" />
              <span className="fx-play-btn" aria-hidden="true"><Play size={26} fill="currentColor" strokeWidth={0} /></span>
            </button>
          )}
          <div className="fx-player-info">
            <span className="fx-label">{video.kind} · {video.channel}</span>
            <span className="fx-player-title">{video.title}</span>
            <Link to="/news/$slug" params={{ slug: video.slug }} className="fx-more"><T k="front.watch.story">Read the story</T> <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
        <ol className="fx-playlist" aria-label="More videos">
          {VIDEOS.map((item, index) => (
            <li key={item.id}>
              <button type="button" className="fx-clip" aria-current={index === current ? "true" : undefined} onClick={() => choose(index)}>
                <span className="fx-clip-thumb"><img src={youtubeThumb(item.id)} alt="" loading="lazy" /><Play size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /></span>
                <span className="fx-clip-text">
                  <span className="fx-label">{item.kind}</span>
                  <span className="fx-clip-title">{item.title}</span>
                  <span className="fx-clip-channel">{item.channel}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="fx-note"><T k="front.watch.note">Videos from the official channels of the artists, studios and creators in our stories, played from YouTube.</T></p>
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
      <Head id="culture" k="front.culture" kicker="Culture" title="Culture & fashion" link="All culture" to="/culture" />
      <div className="fx-culture-grid">
        <Tile story={lead} size="xl" deck />
        {more.map((story) => <Tile key={story.slug} story={story} size="sm" />)}
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Stay in the culture

const TOPICS = ["The week’s biggest stories", "New music", "Release dates", "Sneakers & fashion", "Games", "Sports"];
const ROOMS = ["Rap & R&B", "Sneakers", "Games", "Sports", "Fashion", "Streaming"];

function Stay() {
  return (
    <Band tone="gold" name="Stay in the culture" id="stay" className="fx-stay">
      <div className="fx-stay-grid">
        <div>
          <p className="fx-kicker"><span className="fx-tick" aria-hidden="true" /><T k="connect.newsletter.label">Newsletter</T></p>
          <h2 id="stay-title" className="fx-stay-title"><T k="connect.newsletter.title">Stay in the culture.</T></h2>
          <p className="fx-stay-copy"><T k="connect.newsletter.copy">Get the biggest stories from OGCW directly to your inbox.</T></p>
          <ul className="fx-chips" aria-label="What’s in it">{TOPICS.map((topic) => <li key={topic}><T>{topic}</T></li>)}</ul>
          <NewsletterForm />
        </div>
        <div className="fx-forum">
          <p className="fx-kicker"><T k="front.stay.forum.kicker">Coming soon</T></p>
          <h3 className="fx-forum-title"><T k="front.stay.forum.title">The OGCW Forum</T></h3>
          <p className="fx-stay-copy"><T k="front.stay.forum.copy">A place to argue the rankings, swap release-day stories and vote on the week. Rooms opening first:</T></p>
          <ul className="fx-rooms">{ROOMS.map((room) => <li key={room}># <T>{room}</T></li>)}</ul>
          <Link to="/blog" className="fx-btn fx-btn-dark"><T k="front.stay.forum.cta">Read the blog meanwhile</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </Band>
  );
}

export function FrontPage() {
  return (
    <div className="front">
      <Wire />
      <MoreNews />
      <EditSection name="This week">
        <section className="fx-band fx-week" data-band="light" aria-label="The week">
          <div className="fx-wrap broadsheet fx-week-inner"><NewsWeek /></div>
        </section>
      </EditSection>
      <RapDesk />
      <Drops />
      <ShopWindow />
      <Ranking />
      <SportsDesk />
      <GamesStreaming />
      <Watch />
      <CultureFashion />
      <Stay />
    </div>
  );
}
