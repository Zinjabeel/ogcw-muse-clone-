import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Link2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { LabelBadge, RatingBadge, StoryDate } from "../components/story-meta";
import { myRating, rateStory } from "../lib/ratings";
import { SiteShell } from "../components/ogcw-layout";
import { Img, SECTION_PATH, StoryCard, StoryRow } from "../components/cards";
import { ArticleFeedback } from "../components/article-feedback";
import { formatDate, getArticle, SECTIONS, type Article, type Block } from "../data/content";
import { getSanityStory } from "../lib/sanity-stories";
import { useStories } from "../lib/stories";

// A single story, text first: headline, summary and byline beside a
// modest lead photo, then the story in a reading column with subheads, pull
// quotes, photos (single or in pairs), lists, a key-facts box, checklists
// and questions and answers. At the end, a yes/no question for readers, the
// sources, and more news. "In this story" and "Most read" sit in the rail.
// A thin yellow line tracks reading progress.
// The story comes live from the Sanity studio (/admin); only when Sanity
// can't be reached does the copy in the code stand in.
export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const live = await getSanityStory({ data: params.slug }).catch(() => ({ reachable: false, story: null }));
    const story = live.reachable ? live.story : getArticle(params.slug) ?? null;
    if (!story) throw notFound();
    return { story };
  },
  head: ({ loaderData }) => {
    const story = loaderData?.story;
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

// Anchor for a subhead, so "In this story" can link to it
const anchor = (text: string) => text.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
      return <h2 id={anchor(block.text)}>{block.text}</h2>;
    case "quote":
      return (
        <blockquote className="og-pull">
          <p>{block.text}</p>
        </blockquote>
      );
    case "image":
      return (
        <figure className={`og-inline ${block.size && block.size !== "inline" ? `og-inline-${block.size}` : ""}`}>
          <Img photo={block.photo} className="og-inline-photo" />
          <figcaption>{block.caption}{block.photo.credit && ` Photo: ${block.photo.credit}.`}</figcaption>
        </figure>
      );
    case "questions":
      return (
        <aside className="og-questions" aria-label={block.title}>
          <p className="og-questions-title">{block.title}</p>
          <ol>{block.items.map((item) => <li key={item}>{item}</li>)}</ol>
        </aside>
      );
    case "summary":
      return (
        <aside className="og-summary" aria-label={block.title}>
          <p className="og-summary-title">{block.title}</p>
          <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      );
    case "timeline":
      return (
        <section className="og-timeline" aria-label={block.title}>
          <p className="og-timeline-title">{block.title}</p>
          <ol>
            {block.items.map(([when, what]) => (
              <li key={`${when}-${what}`}><span className="og-timeline-when">{when}</span><p>{what}</p></li>
            ))}
          </ol>
        </section>
      );
    case "related":
      return <RelatedStories title={block.title} slugs={block.slugs} />;
    case "images":
      return (
        <figure className="og-inline og-pair">
          <span className="og-pair-photos">
            {block.photos.map((photo) => <Img key={photo.src} photo={photo} className="og-pair-photo" />)}
          </span>
          <figcaption>{block.caption} Photos: {block.photos.map((photo) => photo.credit).filter(Boolean).join("; ")}.</figcaption>
        </figure>
      );
    case "list":
      return <ul className="og-list">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    case "facts":
      return (
        <aside className="og-facts" aria-label={block.title}>
          <p className="og-facts-title">{block.title}</p>
          <dl>
            {block.items.map(([term, value]) => (
              <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </aside>
      );
    case "checklist":
      return (
        <aside className="og-check" aria-label={block.title}>
          <p className="og-check-title">{block.title}</p>
          <ul>
            {block.items.map((item) => (
              <li key={item}><Check size={16} strokeWidth={2.5} aria-hidden="true" /><span>{item}</span></li>
            ))}
          </ul>
        </aside>
      );
    case "link":
      return (
        <p className="og-cta-line">
          <a href={block.href} className="og-cta">{block.label} <ArrowRight size={16} aria-hidden="true" /></a>
        </p>
      );
    case "faq":
      return (
        <div className="og-faq">
          {block.items.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      );
  }
}

/** "Don't forget to check out these": linked stories, numbered, with their photos */
function RelatedStories({ title, slugs }: { title: string; slugs: string[] }) {
  const stories = useStories();
  const items = slugs.flatMap((slug) => stories.get(slug) ?? []);
  if (!items.length) return null;
  return (
    <section className="og-related" aria-label={title}>
      <p className="og-related-title">{title}</p>
      <ol className="og-related-list">
        {items.map((item, index) => (
          <li key={item.slug}>
            <Link to="/news/$slug" params={{ slug: item.slug }} className="og-related-item">
              <span className="og-related-num">{index + 1}</span>
              <Img photo={item.photo} className="og-related-thumb" />
              <span className="og-related-text">
                <span className="og-kicker">{item.kicker}</span>
                <span className="og-related-name">{item.title}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Rate this story, 1 to 5 stars: real readers' ratings (src/lib/ratings.ts) */
function RateStory({ slug }: { slug: string }) {
  const rating = useStories().rating(slug);
  const [mine, setMine] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  useEffect(() => setMine(myRating(slug)), [slug]);
  const rate = async (stars: number) => {
    setStatus("saving");
    try {
      await rateStory(slug, stars);
      setMine(stars);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };
  const lit = hover || mine || 0;
  return (
    <section className="og-rate" aria-labelledby={`rate-${slug}`}>
      <p id={`rate-${slug}`} className="fb-kicker">Rate this story</p>
      <div className="og-stars" role="radiogroup" aria-labelledby={`rate-${slug}`} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={mine === stars}
            aria-label={`${stars} ${stars === 1 ? "star" : "stars"}`}
            data-lit={stars <= lit || undefined}
            disabled={status === "saving"}
            onMouseEnter={() => setHover(stars)}
            onFocus={() => setHover(stars)}
            onBlur={() => setHover(0)}
            onClick={() => void rate(stars)}
          >
            <Star size={26} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="og-rate-note" aria-live="polite">
        {status === "saving" ? "Saving your rating…" : status === "error" ? "Your rating didn’t go through. Try again." : mine ? `You gave it ${mine}/5. Thanks. ` : ""}
        {status !== "saving" && (rating ? `Readers: ${rating.average.toFixed(1)}/5 from ${rating.count} ratings.` : "The readers’ score shows here once a few people have rated it.")}
      </p>
    </section>
  );
}

function SectionLink({ story }: { story: Article }) {
  return <Link to={SECTION_PATH[story.section]}>{SECTIONS[story.section].label}</Link>;
}

function ArticlePage() {
  const { story } = Route.useLoaderData();
  const stories = useStories();
  const firstParagraph = story.body.findIndex((b) => b.type === "p");
  const contents = story.body.flatMap((b) => (b.type === "h2" ? [b.text] : []));
  const others = stories.all.filter((a) => a.slug !== story.slug);
  const more = [...others.filter((a) => a.section === story.section), ...others.filter((a) => a.section !== story.section)].slice(0, 4);
  const mostRead = stories.mostRead.filter((a) => a.slug !== story.slug).slice(0, 4);

  return (
    <SiteShell>
      <div className="og-progress" aria-hidden="true" />
      <main>
        <article className="og-article">
          <header className="page-wrap og-article-head">
            <div className="og-article-top">
              <div>
                <nav className="og-crumbs" aria-label="Breadcrumb">
                  <Link to="/news">News</Link>
                  <span aria-hidden="true">/</span>
                  <SectionLink story={story} />
                </nav>
                <p className="og-kicker og-kicker-row"><LabelBadge label={stories.label(story)} />{story.kicker}</p>
                <h1 className="og-article-title">{story.title}</h1>
                <p className="og-article-deck">{story.deck}</p>
              </div>
              <figure className="og-article-lead">
                <Img photo={story.photo} className="og-article-lead-photo" eager />
                {story.photo.credit && <figcaption>Photo: {story.photo.credit}</figcaption>}
              </figure>
            </div>
            <div className="og-byline">
              {/* The real source of the news, or OGCW for our own reporting: never a made-up name */}
              <span>{story.credit === "OGCW" ? "By" : "Source:"} <strong>{story.credit}</strong></span>
              <StoryDate story={story} long />
              {story.updated && <span>First reported {formatDate(story.date)}</span>}
              <RatingBadge story={story} count />
              <CopyLink />
            </div>
          </header>

          <div className="page-wrap og-article-layout">
            <div className="og-prose">
              {story.body.map((block, index) => (
                <BodyBlock key={index} block={block} first={index === firstParagraph} />
              ))}
              <RateStory slug={story.slug} />
              <ArticleFeedback slug={story.slug} question={story.ask ?? "Was this helpful?"} />
              <p className="og-signoff">{story.credit === "OGCW" ? "Reported by OGCW" : `OGCW, from ${story.credit}`}</p>
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
            <aside className="og-article-aside">
              {contents.length > 2 && (
                <nav className="og-toc" aria-labelledby="toc-title">
                  <p id="toc-title" className="og-aside-title">In this story</p>
                  <ol>
                    {contents.map((heading) => <li key={heading}><a href={`#${anchor(heading)}`}>{heading}</a></li>)}
                  </ol>
                </nav>
              )}
              <p className="og-aside-title">Most read</p>
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
