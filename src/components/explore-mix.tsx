import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Play } from "lucide-react";
import { formatPrice, SHOPS, SONGS, spotifyTrack, STREAMERS, youtubeThumb, youtubeUrl } from "@/data/content";
import { useStories } from "@/lib/stories";
import { SOCIALS, SocialIcon } from "./socials";
import { SpotifyIcon } from "./spotify";
import { Img } from "./cards";
import { T } from "./site-text";

// Explore: a bit of everything on OGCW in one grid. An editor's pick, what's
// trending, where to follow OGCW, a streamer and a song to press play on,
// two pieces from the shop and a reading list. Used at the end of the news
// front and on /explore.

const streamer = STREAMERS.find((s) => s.name === "TheBurntPeanut")!;
const song = SONGS[1]!;
const shopPicks = [SHOPS[0]!, SHOPS[2]!].map((shop) => ({ shop, product: shop.products[0]! }));

export function ExploreMix({ title = "Explore", idPrefix = "explore" }: { title?: string; idPrefix?: string }) {
  const stories = useStories();
  // The editor's pick and Trending are chosen in the studio (src/data/placements.ts)
  const [pick = stories.pick("tokyo-game-show-2026-typhoon")] = stories.slot("explore-pick");
  const list = stories.readingLists[1]!;
  return (
    <section className="bs-explore mix" aria-labelledby={`${idPrefix}-title`}>
      <div className="bs-section-head">
        <h3 id={`${idPrefix}-title`} className="bs-eyebrow"><T k={`${idPrefix}.title`}>{title}</T></h3>
        <Link to="/explore" className="bs-more"><T k="explore.search">Search everything</T></Link>
      </div>

      <div className="mix-grid">
        <Link to="/news/$slug" params={{ slug: pick.slug }} className="mix-tile mix-pick">
          <Img photo={pick.photo} className="mix-pick-photo" />
          <span className="mix-pick-text">
            <span className="mix-label">Editor’s pick · {pick.kicker}</span>
            <span className="mix-pick-title">{pick.title}</span>
            <span className="mix-pick-deck">{pick.deck}</span>
          </span>
        </Link>

        <div className="mix-tile mix-trending">
          <p className="mix-label"><T k="explore.trending">Trending now</T></p>
          <ol>
            {stories.trending.map((story, index) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="mix-trend">
                  <span className="mix-trend-num">{index + 1}</span>
                  <span className="mix-trend-title">{story.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="mix-tile mix-follow">
          <p className="mix-label"><T k="explore.follow">Follow OGCW</T></p>
          <p className="mix-follow-copy"><T k="explore.follow.copy">The day’s stories, clips and drops, wherever you scroll.</T></p>
          <ul>
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className="mix-social">
                  <SocialIcon path={social.path} size={18} />
                  <span>{social.name}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <a className="mix-tile mix-media" href={youtubeUrl(streamer.video)} target="_blank" rel="noopener noreferrer">
          <span className="mix-label"><T k="explore.streamer">Streamer to watch</T></span>
          <span className="mix-media-thumb">
            <img src={youtubeThumb(streamer.video)} alt="" loading="lazy" />
            <span className="bs-song-play" aria-hidden="true"><Play size={15} fill="currentColor" strokeWidth={0} /></span>
          </span>
          <span className="mix-media-title">{streamer.name}</span>
          <span className="mix-media-note">{streamer.note}</span>
        </a>

        <a className="mix-tile mix-media mix-song" href={spotifyTrack(song.spotify)} target="_blank" rel="noopener noreferrer" aria-label={`${song.title} by ${song.artist}, on Spotify`}>
          <span className="mix-label"><T k="explore.song">Song to check out</T></span>
          <span className="mix-song-row">
            <span className="mix-song-cover"><img src={song.cover} alt="" loading="lazy" /></span>
            <span className="mix-song-text">
              <span className="mix-media-title">{song.title}</span>
              <span className="mix-song-artist">{song.artist} · {song.album}</span>
            </span>
          </span>
          <span className="mix-media-note">{song.note}</span>
          <span className="bs-spotify"><SpotifyIcon size={15} /> Play on Spotify <ArrowUpRight size={13} aria-hidden="true" /></span>
        </a>

        {shopPicks.map(({ shop, product }) => (
          <a key={shop.slug} className="mix-tile mix-product" href={product.url} target="_blank" rel="noopener noreferrer">
            <span className="mix-product-photo"><img src={product.image} alt={`${product.name}, ${product.detail}`} loading="lazy" /></span>
            <span className="mix-label">From the shop · {shop.name}</span>
            <span className="mix-media-title">{product.name}</span>
            <span className="mix-product-foot"><span>{formatPrice(product.price)}</span><span>Shop at {shop.name} <ArrowUpRight size={13} aria-hidden="true" /></span></span>
          </a>
        ))}

        <div className="mix-tile mix-list">
          <p className="mix-label"><T k="explore.reading-list">Reading list</T></p>
          <p className="mix-list-title">{list.title}</p>
          <p className="mix-follow-copy">{list.note}</p>
          <ol>
            {list.items.map((story) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="mix-list-link">{story.title}</Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
