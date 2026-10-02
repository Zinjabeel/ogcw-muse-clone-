import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bell, Play } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { EpisodeCard, Poster, StoryRow } from "../components/cards";
import { EPISODES, getEpisode, type Episode } from "../data/content";
import { useStories } from "../lib/stories";
import { T } from "@/components/site-text";

// One OGCW Originals episode: the player, then the episode text, chapters and
// credits, related stories, and "Latest episodes" to keep watching.
export const Route = createFileRoute("/originals/$slug")({
  beforeLoad: ({ params }) => {
    if (!getEpisode(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const episode = getEpisode(params.slug);
    const title = episode ? `${episode.title} — OGCW Originals` : "OGCW Originals";
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

// No episodes are online yet, so the player shows a premiere notice rather
// than pretending to play. TODO: embed the real video once it exists.
function Player({ episode }: { episode: Episode }) {
  const [notice, setNotice] = useState(false);
  return (
    <div className="og-player">
      <button type="button" className="og-player-button" onClick={() => setNotice(true)} aria-label={`Play ${episode.title}`}>
        <Poster episode={episode} size="lg" play={false} />
        <span className="og-player-play" aria-hidden="true"><Play size={30} fill="currentColor" strokeWidth={0} /></span>
      </button>
      {notice && (
        <div className="og-player-notice" role="status">
          <Bell size={22} aria-hidden="true" />
          <p className="og-player-notice-title"><T>This episode premieres soon</T></p>
          <p className="og-player-notice-copy"><T>Sign up to the newsletter and we’ll tell you the moment it’s live.</T></p>
          <div className="og-player-notice-actions">
            <Link to="/" hash="newsletter-title" className="og-cta"><T>Get notified</T></Link>
            <button type="button" className="og-text-button" onClick={() => setNotice(false)}>Close</button>
          </div>
        </div>
      )}
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

  return (
    <SiteShell>
      <main>
        <div className="page-wrap og-episode-page">
          <nav className="og-crumbs" aria-label="Breadcrumb">
            <Link to="/originals"><T>OGCW Originals</T></Link>
            <span aria-hidden="true">/</span>
            <span><T>{episode.series}</T></span>
          </nav>

          <Player episode={episode} />

          <div className="og-episode-layout">
            <div>
              <p className="og-kicker">{episode.series} · Episode {episode.number}</p>
              <h1 className="og-article-title og-episode-title"><T>{episode.title}</T></h1>
              <p className="og-meta og-episode-meta">{episode.kind} · {episode.length} · Coming soon</p>
              <div className="og-prose">
                <p className="og-lede"><T>{episode.summary}</T></p>
                {episode.body.map((text, index) => <p key={index}>{text}</p>)}
              </div>
            </div>
            <aside className="og-episode-aside">
              <p className="og-aside-title"><T>Chapters</T></p>
              <ol className="og-chapters">
                {episode.chapters.map(([time, label]) => (
                  <li key={time}><span className="og-chapter-time">{time}</span>{label}</li>
                ))}
              </ol>
              <p className="og-aside-title"><T>Credits</T></p>
              <dl className="og-credits">
                {episode.credits.map(([term, value]) => (
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
