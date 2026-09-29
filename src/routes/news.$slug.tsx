import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Link2 } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { Img, StoryCard, StoryRow } from "../components/cards";
import { ARTICLES, formatDate, getArticle, LISTS, SECTIONS, type Article, type Block } from "../data/content";

// A single story: headline, byline, lead photo with credit, the body (with a
// drop cap, subheads, pull quotes and inline photos), a "Most read" rail and
// "More news" at the end. A thin yellow line tracks reading progress.
export const Route = createFileRoute("/news/$slug")({
  beforeLoad: ({ params }) => {
    if (!getArticle(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const story = getArticle(params.slug);
    const title = story ? `${story.title} — OGCW` : "OGCW";
    return {
      meta: [
        { title },
        { name: "description", content: story?.deck ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: story?.deck ?? "" },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArticlePage,
});

function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="og-share"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard blocked: nothing to do
        }
      }}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}

function BodyBlock({ block, first }: { block: Block; first: boolean }) {
  switch (block.type) {
    case "p":
      return <p className={first ? "og-dropcap" : undefined}>{block.text}</p>;
    case "h2":
      return <h2>{block.text}</h2>;
    case "quote":
      return (
        <blockquote className="og-pull">
          <p>{block.text}</p>
        </blockquote>
      );
    case "image":
      return (
        <figure className="og-inline">
          <Img photo={block.photo} className="og-inline-photo" />
          <figcaption>{block.caption}{block.photo.credit && ` Photo: ${block.photo.credit}.`}</figcaption>
        </figure>
      );
  }
}

function SectionLink({ story }: { story: Article }) {
  const label = SECTIONS[story.section].label;
  return story.section === "music" ? <Link to="/music">{label}</Link> : <Link to="/culture">{label}</Link>;
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const story = getArticle(slug);
  if (!story) return null;
  const firstParagraph = story.body.findIndex((b) => b.type === "p");
  const others = ARTICLES.filter((a) => a.slug !== story.slug);
  const more = [...others.filter((a) => a.section === story.section), ...others.filter((a) => a.section !== story.section)].slice(0, 4);
  const mostRead = LISTS.mostRead.filter((a) => a.slug !== story.slug).slice(0, 4);

  return (
    <SiteShell>
      <div className="og-progress" aria-hidden="true" />
      <main>
        <article className="og-article">
          <header className="page-wrap og-article-head">
            <nav className="og-crumbs" aria-label="Breadcrumb">
              <Link to="/news">News</Link>
              <span aria-hidden="true">/</span>
              <SectionLink story={story} />
            </nav>
            <p className="og-kicker">{story.kicker}</p>
            <h1 className="og-article-title">{story.title}</h1>
            <p className="og-article-deck">{story.deck}</p>
            <div className="og-byline">
              <span>By <strong>{story.author}</strong></span>
              <time dateTime={story.date}>{formatDate(story.date)}</time>
              <span>{story.read}</span>
              <CopyLink />
            </div>
          </header>

          <figure className="page-wrap og-article-hero">
            <Img photo={story.photo} className="og-article-hero-photo" eager />
            {story.photo.credit && <figcaption>Photo: {story.photo.credit}</figcaption>}
          </figure>

          <div className="page-wrap og-article-layout">
            <div className="og-prose">
              {story.body.map((block, index) => (
                <BodyBlock key={index} block={block} first={index === firstParagraph} />
              ))}
              <p className="og-signoff">{story.author} for OGCW</p>
              {story.sources.length > 0 && (
                <div className="og-sources">
                  <h2 className="og-sources-title">Sources</h2>
                  <ul>
                    {story.sources.map((source) => (
                      <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <aside className="og-article-aside" aria-labelledby="aside-title">
              <p id="aside-title" className="og-aside-title">Most read</p>
              <ol className="og-aside-list">
                {mostRead.map((item, index) => (
                  <li key={item.slug}><StoryRow story={item} index={index} /></li>
                ))}
              </ol>
            </aside>
          </div>
        </article>

        <section className="page-wrap og-more" aria-labelledby="more-news">
          <div className="og-section-head">
            <h2 id="more-news" className="og-section-title">More news</h2>
            <Link to="/news" className="og-more-link">All news</Link>
          </div>
          <div className="og-grid-4">
            {more.map((item) => <StoryCard key={item.slug} story={item} />)}
          </div>
          <Link to="/news" className="og-back"><ArrowLeft size={16} aria-hidden="true" /> Back to all news</Link>
        </section>
      </main>
    </SiteShell>
  );
}
