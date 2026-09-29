import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import type { ReactNode } from "react";
import { GlowCard } from "@/components/ui/spotlight-card";
import type { Article, Episode, Hit, Photo, Product, SectionId, Shop, Song, Streamer } from "@/data/content";
import { formatDate, formatPrice, SECTIONS, youtubeThumb, youtubeUrl } from "@/data/content";

/** Where each section's front lives */
export const SECTION_PATH = { music: "/music", games: "/games", streaming: "/streaming", culture: "/culture" } as const satisfies Record<SectionId, string>;

// Shared pieces for the story, Originals and shop pages.

export function Img({ photo, className, eager = false }: { photo: Photo; className?: string; eager?: boolean }) {
  const crop = photo.crop ?? { pos: "50% 50%" };
  return (
    <span className={`og-img ${className ?? ""}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading={eager ? "eager" : "lazy"}
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom ?? 1), ["--origin" as string]: crop.pos }}
      />
    </span>
  );
}

/** A story as a card: photo on top, then section, headline, deck and meta. */
export function StoryCard({ story, size = "md", showDeck = false }: { story: Article; size?: "sm" | "md" | "lg"; showDeck?: boolean }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className={`og-card og-card-${size}`}>
      <Img photo={story.photo} className="og-card-photo" />
      <span className="og-kicker">{story.kicker}</span>
      <span className="og-card-title">{story.title}</span>
      {showDeck && <span className="og-card-deck">{story.deck}</span>}
      <span className="og-meta">{story.author} · {story.read}</span>
    </Link>
  );
}

/** A story as a compact row: number, thumbnail, section, headline. */
export function StoryRow({ story, index }: { story: Article; index?: number }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className="og-row">
      {index !== undefined && <span className="og-row-num">{String(index + 1).padStart(2, "0")}</span>}
      <Img photo={story.photo} className="og-row-thumb" />
      <span className="og-row-text">
        <span className="og-kicker">{story.kicker}</span>
        <span className="og-row-title">{story.title}</span>
        <span className="og-meta">{formatDate(story.date)} · {story.read}</span>
      </span>
    </Link>
  );
}

/** Originals poster: the episode’s still, darkened, with the series and title
 *  set on it. The play pill carries the running time. */
export function Poster({ episode, size = "md", play = true }: { episode: Episode; size?: "md" | "lg"; play?: boolean }) {
  return (
    <span className={`og-poster og-poster-${size}`}>
      <Img photo={episode.still} className="og-poster-still" />
      <span className="og-poster-top">
        <span className="og-poster-mark">OGCW Originals</span>
        <span>{episode.series} · Ep. {episode.number}</span>
      </span>
      <span className="og-poster-title">{episode.title}</span>
      {play ? (
        <span className="og-poster-play">
          <Play size={size === "lg" ? 16 : 13} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          <span><span className="sr-only">Length </span>{episode.length}</span>
        </span>
      ) : (
        <span className="og-poster-length"><span className="sr-only">Length </span>{episode.length}</span>
      )}
    </span>
  );
}

/** "Series · format", without repeating a series named after its format */
export const episodeLabel = (episode: Episode) =>
  episode.series.toLowerCase() === episode.kind.toLowerCase() ? episode.series : `${episode.series} · ${episode.kind}`;

export function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <Link to="/originals/$slug" params={{ slug: episode.slug }} className="og-episode">
      <Poster episode={episode} />
      <span className="og-kicker">{episodeLabel(episode)}</span>
      <span className="og-card-title">{episode.title}</span>
      <span className="og-meta">{episode.length} · Coming soon</span>
    </Link>
  );
}

export const sectionLabel = (story: Article) => SECTIONS[story.section].label;

/** Section heading with an optional link on the right. */
export function SectionHead({ id, title, children }: { id?: string; title: string; children?: ReactNode }) {
  return (
    <div className="og-section-head">
      <h2 id={id} className="og-section-title">{title}</h2>
      {children}
    </div>
  );
}

/** Links a search hit to its page: a story, an Originals episode or a shop. */
export function HitLink({ hit, className, onClick, children }: { hit: Hit; className?: string; onClick?: () => void; children: ReactNode }) {
  const props = { className, onClick };
  if (hit.kind === "article") return <Link to="/news/$slug" params={{ slug: hit.item.slug }} {...props}>{children}</Link>;
  if (hit.kind === "episode") return <Link to="/originals/$slug" params={{ slug: hit.item.slug }} {...props}>{children}</Link>;
  return <Link to="/shop/$slug" params={{ slug: hit.item.slug }} {...props}>{children}</Link>;
}

export const hitLabel = (hit: Hit) => (hit.kind === "article" ? "Story" : hit.kind === "episode" ? "Original" : "Shop");
export const hitTitle = (hit: Hit) => (hit.kind === "shop" ? `Shop ${hit.item.name}` : hit.item.title);
export const hitSub = (hit: Hit) =>
  hit.kind === "article" ? `${hit.item.kicker} · ${hit.item.read}` : hit.kind === "episode" ? `${hit.item.series} · ${hit.item.length}` : hit.item.tagline;

/** The "Watch" block under a front page’s list: one Originals episode. */
export function WatchNext({ episode }: { episode: Episode }) {
  return (
    <div className="og-watch">
      <p className="og-aside-title">Watch</p>
      <EpisodeCard episode={episode} />
    </div>
  );
}

/** A streamer with a recent video from their own channel: the thumbnail and
 *  name open the video, the second link follows the channel. */
export function StreamerCard({ streamer }: { streamer: Streamer }) {
  return (
    <article className="og-streamer">
      <a className="og-streamer-link" href={youtubeUrl(streamer.video)} target="_blank" rel="noopener noreferrer">
        <span className="og-thumb">
          <img src={youtubeThumb(streamer.video)} alt="" loading="lazy" />
          <span className="og-thumb-play" aria-hidden="true"><Play size={14} fill="currentColor" strokeWidth={0} /></span>
        </span>
        <span className="og-kicker">{streamer.platform}</span>
        <span className="og-card-title">{streamer.name}</span>
        <span className="og-streamer-note">{streamer.note}</span>
        <span className="og-meta"><span className="sr-only">Watch: </span>{streamer.videoTitle}</span>
      </a>
      <a className="og-streamer-follow" href={streamer.channel} target="_blank" rel="noopener noreferrer">
        Follow on {streamer.channel.includes("twitch.tv") ? "Twitch" : "YouTube"} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </article>
  );
}

/** A song to check out, opening its official video on YouTube. */
export function SongCard({ song, size = "md" }: { song: Song; size?: "md" | "sm" }) {
  return (
    <a className={`og-song og-song-${size}`} href={youtubeUrl(song.video)} target="_blank" rel="noopener noreferrer">
      <span className="og-thumb">
        <img src={youtubeThumb(song.video)} alt="" loading="lazy" />
        <span className="og-thumb-play" aria-hidden="true"><Play size={14} fill="currentColor" strokeWidth={0} /></span>
      </span>
      <span className="og-song-text">
        <span className="og-song-title">{song.title}</span>
        <span className="og-song-artist">{song.artist}</span>
        {size === "md" && <span className="og-song-note">{song.note}</span>}
        <span className="og-meta">{song.kind} on YouTube <ArrowUpRight size={13} aria-hidden="true" /></span>
      </span>
    </a>
  );
}

/** A shop as a shop window: its photo with the name and number of picks,
 *  the tagline, three of the picks with prices (each opening the retailer),
 *  the lowest price and a button into the shop's page. Sits in the yellow
 *  spotlight frame (GlowCard). */
export function ShopCard({ shop }: { shop: Shop }) {
  const picks = shop.products.slice(0, 3);
  const from = Math.min(...shop.products.map((product) => product.price));
  return (
    <GlowCard glowColor="yellow" customSize className="bs-shop-card shopcard">
      <div className="shopcard-inner">
        <Link to="/shop/$slug" params={{ slug: shop.slug }} className="shopcard-hero" tabIndex={-1} aria-hidden="true">
          <Img photo={shop.hero} className="shopcard-photo" />
          <span className="shopcard-brand">{shop.name}</span>
          <span className="shopcard-count">{shop.products.length} picks</span>
        </Link>
        <p className="shopcard-title">{shop.tagline}</p>
        <ul className="shopcard-products" aria-label={`Picks from ${shop.name}`}>
          {picks.map((product) => (
            <li key={`${product.name}-${product.detail}`}>
              <a className="shopcard-product" href={product.url} target="_blank" rel="noopener noreferrer">
                <span className="shopcard-thumb"><img src={product.image} alt={`${product.name}, ${product.detail}`} loading="lazy" /></span>
                <span className="shopcard-product-name">{product.name}</span>
                <span className="shopcard-price">{formatPrice(product.price)}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="shopcard-foot">
          <span className="shopcard-from">From <strong>{formatPrice(from)}</strong></span>
          <Link to="/shop/$slug" params={{ slug: shop.slug }} className="shopcard-button">
            Shop {shop.name} <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </GlowCard>
  );
}

/** A product from a shop’s edit, linking out to the retailer. */
export function ProductCard({ product, shop, showShop = false }: { product: Product; shop: Shop; showShop?: boolean }) {
  return (
    <a className="og-product" href={product.url} target="_blank" rel="noopener noreferrer">
      <span className="og-product-photo"><img src={product.image} alt={`${product.name}, ${product.detail}`} loading="lazy" /></span>
      <span className="og-product-cat">{showShop ? `${shop.name} · ${product.category}` : product.category}</span>
      <span className="og-product-name">{product.name}</span>
      <span className="og-product-detail">{product.detail}</span>
      <span className="og-product-foot">
        <span className="og-product-price">{formatPrice(product.price)}</span>
        <span className="og-product-shop">Shop at {shop.name} <ArrowUpRight size={14} aria-hidden="true" /></span>
      </span>
    </a>
  );
}
