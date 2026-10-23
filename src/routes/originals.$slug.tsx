import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { EpisodeCard, episodeLabel, Poster, StoryRow } from "../components/cards";
import { EPISODES, formatDate, getEpisode, youtubeUrl, type Episode } from "../data/content";
import { useStories } from "../lib/stories";
import { T } from "@/components/site-text";

// One Originals episode: the player, then our note on why it is worth your
// time, its chapters and credits, related stories, and more to watch.
export const Route = createFileRoute("/originals/$slug")({
  beforeLoad: ({ params }) => {
    if (!getEpisode(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const episode = getEpisode(params.slug);
    const title = episode ? `${episode.title} — ${episode.series} | OGCW Originals` : "OGCW Originals";
    return {
      meta: [
        { title },
        { name: "description", content: episode?.summary ?? "" },
        { property: "og:title", content: title },
        { property: "og:type", content: "video.episode" },
      ],
    };
  },
  component: EpisodePage,
});

// The show's thumbnail until you press play, then the creator's own YouTube
// player (the privacy-enhanced embed, which sets no cookies until it plays).
function Player({ episode }: { episode: Episode }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="og-player">
      {playing ? (
        <div className="og-player-frame">
          <iframe src={`https://www.youtube-nocookie.com/embed/${episode.youtube}?autoplay=1&rel=0`} title={`${episode.title} (${episode.series})`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      ) : (
        <button type="button" className="og-player-button" onClick={() => setPlaying(true)} aria-label={`Play ${episode.title}`}>
          <Poster episode={episode} size="lg" play={false} />
          <span className="og-player-play" aria-hidden="true"><Play size={30} fill="currentColor" strokeWidth={0} /></span>
        </button>
      )}
      <p className="og-player-source">
        <T>Plays from</T> {episode.channel} <T>on YouTube</T> ·{" "}
        <a href={youtubeUrl(episode.youtube)} target="_blank" rel="noopener noreferrer"><T>Watch on YouTube</T> <ArrowUpRight size={13} aria-hidden="true" /></a>
      </p>
    </div>
  );
}

function EpisodePage() {
  const { slug } = Route.useParams();
  const stories = useStories();
  const episode = getEpisode(slug);
  if (!episode) return null;
  const more = EPISODES.filter((e) => e.slug !== episode.slug);
  const related = episode.related.map(stories.get).filter((a) => a !== undefined);
  const credits: [string, string][] = [["Show", episode.series], ["Channel", episode.channel], ["Host", episode.host], ["Guest", episode.guest], ["First published", formatDate(episode.date)]];

  return (
    <SiteShell>
      <main>
        <div className="page-wrap og-episode-page">
          <nav className="og-crumbs" aria-label="Breadcrumb">
            <Link to="/originals"><T>Originals</T></Link>
            <span aria-hidden="true">/</span>
            <span><T>{episode.series}</T></span>
          </nav>

          <Player episode={episode} />

          <div className="og-episode-layout">
            <div>
              <p className="og-kicker">{episodeLabel(episode)}</p>
              <h1 className="og-article-title og-episode-title"><T>{episode.title}</T></h1>
              <p className="og-meta og-episode-meta">{episode.kind} · {episode.length} · {formatDate(episode.date)}</p>
              <div className="og-prose">
                <p className="og-lede"><T>{episode.summary}</T></p>
                {episode.body.map((text, index) => <p key={index}>{text}</p>)}
              </div>
            </div>
            <aside className="og-episode-aside">
              {episode.chapters.length > 0 && (
                <>
                  <p className="og-aside-title"><T>Chapters</T></p>
                  <ol className="og-chapters">
                    {episode.chapters.map(([time, label]) => (
                      <li key={time}><span className="og-chapter-time">{time}</span>{label}</li>
                    ))}
                  </ol>
                </>
              )}
              <p className="og-aside-title"><T>Credits</T></p>
              <dl className="og-credits">
                {credits.map(([term, value]) => (
                  <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
                ))}
              </dl>
              {related.length > 0 && (
                <>
                  <p className="og-aside-title"><T>Read the story</T></p>
                  <ol className="og-aside-list">
                    {related.map((story) => <li key={story.slug}><StoryRow story={story} /></li>)}
                  </ol>
                </>
              )}
            </aside>
          </div>
        </div>

        <section className="page-wrap og-more" aria-labelledby="latest-episodes">
          <div className="og-section-head">
            <h2 id="latest-episodes" className="og-section-title"><T>Latest episodes</T></h2>
            <Link to="/originals" className="og-more-link"><T>All originals</T></Link>
          </div>
          <div className="og-grid-3">
            {more.slice(0, 3).map((item) => <EpisodeCard key={item.slug} episode={item} />)}
          </div>
          <Link to="/originals" className="og-back"><ArrowLeft size={16} aria-hidden="true" /> <T>Back to all originals</T></Link>
        </section>
      </main>
    </SiteShell>
  );
}
