import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, ArrowUpRight, Play, ShoppingBag } from "lucide-react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { Img, StoryRow } from "../components/cards";
import { useStories } from "../lib/stories";
import { youtubeThumb, youtubeUrl } from "../data/content";
import { TREND_BUYS, TREND_TOPICS, TREND_VIDEOS, TRENDS_GONE_WRONG } from "../data/trends";
import { S, T } from "@/components/site-text";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends — OGCW" },
      { name: "description", content: "Trending topics, trends gone wrong, what people are buying and the videos behind them." },
      { property: "og:title", content: "Trends — OGCW" },
      { property: "og:description", content: "Trending topics, trends gone wrong, what people are buying and the videos behind them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trends,
});

// The Trends page: four parts, each laid out its own way, with a bar to jump
// between them. Trending topics (from our reporting), Trends gone wrong (viral
// moments that got out of hand), What people are buying, and Videos. The
// content is in src/data/trends.ts.

const PARTS = [
  { id: "trending-topics", label: "Trending topics" },
  { id: "gone-wrong", label: "Gone wrong" },
  { id: "buying", label: "What people buy" },
  { id: "videos", label: "Videos" },
] as const;

function PartHead({ id, kicker, title, copy }: { id: string; kicker: string; title: string; copy: string }) {
  return (
    <div className="tr-head">
      <p className="og-kicker"><T k={`trends.${id}.kicker`}>{kicker}</T></p>
      <h2 id={`${id}-title`} className="tr-title"><T k={`trends.${id}.title`}>{title}</T></h2>
      <p className="tr-copy"><T k={`trends.${id}.copy`}>{copy}</T></p>
    </div>
  );
}

function Trends() {
  const stories = useStories();
  return (
    <SiteShell>
      <PageIntro kicker="Culture index · October 2026" title="Trend report" copy="What everyone is talking about, the trends that went wrong, what people are buying and the videos behind it all, compiled by the OGCW desk." />
      <main className="page-wrap pb-24">
        <nav className="tr-jump" aria-label="Parts of the trend report">
          {PARTS.map((part) => <a key={part.id} href={`#${part.id}`} className="og-chip"><T k={`trends.jump.${part.id}`}>{part.label}</T></a>)}
        </nav>

        {/* Trending topics: a numbered index, each with the story that shows it */}
        <section id="trending-topics" className="tr-part" aria-labelledby="trending-topics-title">
          <PartHead id="trending-topics" kicker="01 · Trending topics" title="What everyone is talking about" copy="The patterns the desk keeps seeing in its reporting this season." />
          <ol className="trend-list">
            {TREND_TOPICS.map((trend, index) => (
              <li key={trend.title} className="trend">
                <span className="trend-num">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="trend-title"><T>{trend.title}</T></h3>
                <p className="trend-note"><T>{trend.note}</T></p>
                <p className="trend-read"><T k="trends.read">Read the story</T></p>
                <StoryRow story={stories.pick(trend.slug)} />
              </li>
            ))}
          </ol>
        </section>

        {/* Trends gone wrong: big warning cards */}
        <section id="gone-wrong" className="tr-part" aria-labelledby="gone-wrong-title">
          <PartHead id="gone-wrong" kicker="02 · Trends gone wrong" title="When the trend got out of hand" copy="Viral moments that turned into police statements, broken mods and boxes nobody wants to buy." />
          <ol className="tr-wrong">
            {TRENDS_GONE_WRONG.map((item, index) => (
              <li key={item.title} className="tr-wrong-card">
                <p className="tr-wrong-top">
                  <span className="tr-wrong-tag"><AlertTriangle size={13} strokeWidth={2.25} aria-hidden="true" /><T>{item.tag}</T></span>
                  <span className="tr-wrong-when"><T>{item.when}</T></span>
                  <span className="tr-wrong-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                </p>
                <h3 className="tr-wrong-title"><T>{item.title}</T></h3>
                <p className="tr-wrong-note"><T>{item.note}</T></p>
                {"quote" in item && <blockquote className="tr-wrong-quote"><T>{item.quote}</T></blockquote>}
                <a className="tr-source" href={item.source.url} target="_blank" rel="noopener noreferrer">Source: {item.source.name} <ArrowUpRight size={13} aria-hidden="true" /></a>
              </li>
            ))}
          </ol>
        </section>

        {/* What people are buying: product cards, a photo each */}
        <section id="buying" className="tr-part" aria-labelledby="buying-title">
          <PartHead id="buying" kicker="03 · What people buy" title="In the basket this season" copy="The things people are queueing, refreshing and pre-ordering for." />
          <ul className="tr-buys">
            {TREND_BUYS.map((item) => {
              const story = "slug" in item ? stories.pick(item.slug) : null;
              const photo = story?.photo ?? ("photo" in item ? item.photo : null);
              const inner = (
                <>
                  {photo && <Img photo={photo} className="tr-buy-photo" />}
                  <span className="tr-buy-body">
                    <span className="tr-buy-tag"><ShoppingBag size={12} strokeWidth={2} aria-hidden="true" /><T>{item.tag}</T></span>
                    <span className="tr-buy-title"><T>{item.title}</T></span>
                    <span className="tr-buy-note"><T>{item.note}</T></span>
                    <span className="tr-buy-cta">{story ? <><T k="trends.buy.story">Read our story</T> <ArrowRight size={14} aria-hidden="true" /></> : <>{"link" in item && <T>{item.link.label}</T>} <ArrowUpRight size={14} aria-hidden="true" /></>}</span>
                  </span>
                </>
              );
              return (
                <li key={item.title}>
                  {story
                    ? <Link to="/news/$slug" params={{ slug: story.slug }} className="tr-buy">{inner}</Link>
                    : <a href={"link" in item ? item.link.href : "#"} target="_blank" rel="noopener noreferrer" className="tr-buy">{inner}</a>}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Videos: the official videos behind the trends, each opens on YouTube */}
        <section id="videos" className="tr-part" aria-labelledby="videos-title">
          <PartHead id="videos" kicker="04 · Videos" title="Watch the trend" copy="The official videos behind this season’s biggest trends." />
          <ul className="tr-videos">
            {TREND_VIDEOS.map((video) => {
              const story = stories.all.find((item) => item.slug === video.slug);
              return (
                <li key={video.id} className="tr-video">
                  <a href={youtubeUrl(video.id)} target="_blank" rel="noopener noreferrer" className="tr-video-link">
                    <span className="tr-video-thumb">
                      <img src={youtubeThumb(video.id)} alt="" loading="lazy" />
                      <span className="tr-video-play" aria-hidden="true"><Play size={18} fill="currentColor" strokeWidth={0} /></span>
                    </span>
                    <span className="tr-video-title"><T>{video.title}</T> <span className="sr-only">(opens YouTube)</span></span>
                    <span className="tr-video-note"><T>{video.note}</T></span>
                  </a>
                  {story && <Link to="/news/$slug" params={{ slug: story.slug }} className="tr-video-story"><T k="trends.video.story">The story:</T> <S story={story} f="title" /></Link>}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
