import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Play } from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { BsPhoto } from "../components/broadsheet";
import { useStories } from "../lib/stories";
import { youtubeThumb, youtubeUrl, type Article } from "../data/content";
import { TREND_BUYS, TREND_TOPICS, TREND_VIDEOS, TRENDS_GONE_WRONG } from "../data/trends";
import { mail } from "@/lib/contact";
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

// The Trends page (owner, 19 Oct 2026: "the same for Trends, make it more
// exciting and much better"), in the About page's Moncler-inspired language
// with more energy: a full-screen opener on the top trend's photo; the six
// trends as an index you pick from (its photo, blurred backdrop and words
// change); trends gone wrong as a black chapter carried by the real quotes;
// what people are buying as four tall pictures; a video player whose
// featured video changes as you pick; and a last word for the forum. Content
// is in src/data/trends.ts; nothing moves on scroll.

const PARTS = [
  { id: "trending-topics", label: "Trending topics" },
  { id: "gone-wrong", label: "Gone wrong" },
  { id: "buying", label: "What people buy" },
  { id: "videos", label: "Videos" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** The page's one kind of link: uppercase with a chevron */
function More({ href, to, story, external = false, children }: { href?: string; to?: "/forum"; story?: Article; external?: boolean; children: ReactNode }) {
  const inner = <>{children}<ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" /></>;
  if (story) return <Link to="/news/$slug" params={{ slug: story.slug }} className="tx-more">{inner}</Link>;
  if (to) return <Link to={to} className="tx-more">{inner}</Link>;
  return <a href={href} className="tx-more" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>;
}

// ------------------------------------------------------------ The opener

function Opener({ story }: { story: Article }) {
  return (
    <section className="tx-hero" aria-labelledby="trends-title">
      <BsPhoto photo={story.photo} className="tx-hero-photo" eager />
      <div className="tx-hero-text">
        <p className="tx-hero-kicker"><T k="intro.culture-index-october-2026.kicker">Culture index · October 2026</T></p>
        <h1 id="trends-title" className="tx-hero-title"><T k="intro.culture-index-october-2026.title">Trend report</T></h1>
        <p className="tx-hero-copy"><T k="intro.culture-index-october-2026.copy">What everyone is talking about, the trends that went wrong, what people are buying and the videos behind it all, compiled by the OGCW desk.</T></p>
        <nav className="tx-hero-parts" aria-label="Parts of the trend report">
          {PARTS.map((part) => <More key={part.id} href={`#${part.id}`}><T k={`trends.jump.${part.id}`}>{part.label}</T></More>)}
        </nav>
      </div>
      {story.photo.credit && <p className="tx-credit">Photo: {story.photo.credit}</p>}
    </section>
  );
}

// ------------------------------------------------------------ The index: pick a trend

function TrendIndex() {
  const stories = useStories();
  const trends = useMemo(() => TREND_TOPICS.map((trend) => ({ ...trend, story: stories.pick(trend.slug) })), [stories]);
  const [on, setOn] = useState(0);
  const trend = trends[on]!;
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (on + step + trends.length) % trends.length;
    setOn(next);
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
  };
  return (
    <section className="tx-index" id="trending-topics" aria-labelledby="trending-topics-title">
      <span className="tx-index-bg" aria-hidden="true"><img key={trend.story.photo.src} src={trend.story.photo.src} alt="" loading="lazy" /></span>
      <div className="tx-grid tx-index-grid">
        <div className="tx-index-nav">
          <h2 id="trending-topics-title" className="tx-index-heading"><T k="trends.trending-topics.title">What everyone is talking about</T></h2>
          <div className="tx-index-list" role="tablist" aria-labelledby="trending-topics-title" onKeyDown={onKey}>
            {trends.map((item, index) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                id={`trend-tab-${index}`}
                aria-selected={index === on}
                aria-controls="trend-panel"
                tabIndex={index === on ? 0 : -1}
                className="tx-index-tab"
                onClick={() => setOn(index)}
                onPointerEnter={(event) => { if (event.pointerType === "mouse") setOn(index); }}
              >
                <span className="tx-index-no" aria-hidden="true">{pad(index + 1)}</span>
                <span><T>{item.title}</T></span>
              </button>
            ))}
          </div>
        </div>
        <div className="tx-index-panel" role="tabpanel" id="trend-panel" aria-labelledby={`trend-tab-${on}`}>
          <Link to="/news/$slug" params={{ slug: trend.story.slug }} className="tx-index-figure" key={trend.title} aria-label={trend.story.title}>
            <BsPhoto photo={trend.story.photo} className="tx-index-photo" />
          </Link>
          <div className="tx-index-text" key={`${trend.title}-text`}>
            <p className="tx-index-big" aria-hidden="true">{pad(on + 1)}</p>
            <p className="tx-body"><T>{trend.note}</T></p>
            <p className="tx-index-story"><S story={trend.story} f="title" /></p>
            <More story={trend.story}><T k="trends.read">Read the story</T></More>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ Gone wrong: the black chapter

function GoneWrong() {
  return (
    <section className="tx-wrong" id="gone-wrong" aria-labelledby="gone-wrong-title">
      <div className="tx-grid tx-head">
        <h2 id="gone-wrong-title" className="tx-h2"><T k="trends.gone-wrong.title">When the trend got out of hand</T></h2>
        <p className="tx-body tx-head-copy"><T k="trends.gone-wrong.copy">Viral moments that turned into police statements, broken mods and boxes nobody wants to buy.</T></p>
      </div>
      <ol className="tx-cases">
        {TRENDS_GONE_WRONG.map((item) => (
          <li key={item.title} className="tx-case">
            <p className="tx-case-top">
              <span className="tx-case-tag"><AlertTriangle size={14} strokeWidth={2} aria-hidden="true" /><T>{item.tag}</T></span>
              <span><T>{item.when}</T></span>
            </p>
            <h3 className="tx-case-title"><T>{item.title}</T></h3>
            {"quote" in item && <blockquote className="tx-case-quote"><T>{item.quote}</T></blockquote>}
            <p className="tx-case-note"><T>{item.note}</T></p>
            <More href={item.source.url} external>Source: {item.source.name}</More>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ------------------------------------------------------------ What people buy: four tall pictures

function Buying() {
  const stories = useStories();
  return (
    <section className="tx-paper tx-buying" id="buying" aria-labelledby="buying-title">
      <div className="tx-grid tx-head">
        <h2 id="buying-title" className="tx-h2"><T k="trends.buying.title">In the basket this season</T></h2>
        <p className="tx-body tx-head-copy"><T k="trends.buying.copy">The things people are queueing, refreshing and pre-ordering for.</T></p>
      </div>
      <ul className="tx-buys">
        {TREND_BUYS.map((item) => {
          const story = "slug" in item ? stories.pick(item.slug) : undefined;
          const photo = story?.photo ?? ("photo" in item ? item.photo : undefined);
          const picture = (
            <>
              {photo && <BsPhoto photo={photo} className="tx-buy-photo" />}
              <span className="tx-buy-tag"><T>{item.tag}</T></span>
            </>
          );
          return (
            <li key={item.title} className="tx-buy">
              {story
                ? <Link to="/news/$slug" params={{ slug: story.slug }} className="tx-buy-picture" aria-label={item.title}>{picture}</Link>
                : <a href={"link" in item ? item.link.href : undefined} target="_blank" rel="noopener noreferrer" className="tx-buy-picture" aria-label={item.title}>{picture}</a>}
              <h3 className="tx-buy-title"><T>{item.title}</T></h3>
              <p className="tx-buy-note"><T>{item.note}</T></p>
              {story
                ? <More story={story}><T k="trends.buy.story">Read our story</T></More>
                : "link" in item && <More href={item.link.href} external><T>{item.link.label}</T></More>}
              {photo?.credit && <p className="tx-buy-credit">Photo: {photo.credit}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------ Videos: pick one, it plays on YouTube

function Videos() {
  const stories = useStories();
  const [on, setOn] = useState(0);
  const video = TREND_VIDEOS[on]!;
  const story = stories.all.find((item) => item.slug === video.slug);
  return (
    <section className="tx-videos" id="videos" aria-labelledby="videos-title">
      <div className="tx-grid tx-head">
        <h2 id="videos-title" className="tx-h2"><T k="trends.videos.title">Watch the trend</T></h2>
        <p className="tx-body tx-head-copy"><T k="trends.videos.copy">The official videos behind this season’s biggest trends.</T></p>
      </div>
      <div className="tx-grid tx-player">
        <a href={youtubeUrl(video.id)} target="_blank" rel="noopener noreferrer" className="tx-screen" key={video.id}>
          <img src={youtubeThumb(video.id)} alt="" loading="lazy" />
          <span className="tx-play" aria-hidden="true"><Play size={26} fill="currentColor" strokeWidth={0} /></span>
          <span className="sr-only">Watch {video.title} on YouTube (opens a new tab)</span>
        </a>
        <div className="tx-player-side">
          <div className="tx-now" key={`${video.id}-text`}>
            <h3 className="tx-now-title"><T>{video.title}</T></h3>
            <p className="tx-body"><T>{video.note}</T></p>
            <p className="tx-more-row">
              <More href={youtubeUrl(video.id)} external><T k="trends.video.watch">Watch on YouTube</T></More>
              {story && <More story={story}><T k="trends.video.read">The story</T></More>}
            </p>
          </div>
          <ul className="tx-playlist" aria-label="More videos">
            {TREND_VIDEOS.map((item, index) => (
              <li key={item.id}>
                <button type="button" className="tx-pick" aria-pressed={index === on} onClick={() => setOn(index)}>
                  <span className="tx-pick-thumb"><img src={youtubeThumb(item.id)} alt="" loading="lazy" /></span>
                  <span className="tx-pick-title"><T>{item.title}</T></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ The last word

function LastWord() {
  return (
    <section className="tx-paper tx-last" aria-labelledby="last-title">
      <div className="tx-grid tx-head">
        <h2 id="last-title" className="tx-h2"><T k="trends.last.title">Seen a trend we missed?</T></h2>
        <div>
          <p className="tx-body"><T k="trends.last.copy">Make the case in the forum, or send it to the desk and we’ll look into it.</T></p>
          <p className="tx-more-row">
            <More to="/forum"><T k="trends.last.forum">Open the forum</T></More>
            <More href={mail("Submit a story")}><T k="trends.last.tip">Send it to the desk</T></More>
          </p>
        </div>
      </div>
    </section>
  );
}

function Trends() {
  const stories = useStories();
  // The opener: the stadium-tour trend's crowd (the index below starts on the first trend, so no photo twice in a row)
  const top = stories.pick(TREND_TOPICS[2].slug);
  return (
    <SiteShell>
      <main className="tx">
        <Opener story={top} />
        <TrendIndex />
        <GoneWrong />
        <Buying />
        <Videos />
        <LastWord />
      </main>
    </SiteShell>
  );
}
