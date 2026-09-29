import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageIntro } from "./ogcw-layout";
import { EpisodeCard, Img, StoryCard, StoryRow, WatchNext } from "./cards";
import { articlesIn, drakePhoto, EPISODES, formatDate, SECTIONS, TICKETS, type SectionId } from "@/data/content";

// Front page for a section (/music, /culture): a lead story beside a
// numbered list, the rest as a grid, related OGCW Originals and a pointer to
// the other section. Music also carries the Drake live listing.

export function SectionFront({ section }: { section: SectionId }) {
  const stories = articlesIn(section);
  const [lead, ...rest] = stories;
  const other: SectionId = section === "music" ? "culture" : "music";
  // Originals tied to this section’s stories first, then the newest others
  const tied = EPISODES.filter((e) => e.related.some((slug) => stories.some((s) => s.slug === slug)));
  const related = [...tied, ...EPISODES.filter((e) => !tied.includes(e))].slice(0, 4);
  const [watch, ...more] = related;
  if (!lead) return null;

  return (
    <>
      <PageIntro kicker={`The ${SECTIONS[section].label.toLowerCase()} desk`} title={SECTIONS[section].label} copy={SECTIONS[section].intro} />
      <main className="page-wrap pb-24">
        <div className="og-news-top">
          <Link to="/news/$slug" params={{ slug: lead.slug }} className="og-lead">
            <Img photo={lead.photo} className="og-lead-photo" eager />
            <span className="og-lead-text">
              <span className="og-kicker">{lead.kicker}</span>
              <span className="og-lead-title">{lead.title}</span>
              <span className="og-lead-deck">{lead.deck}</span>
              <span className="og-meta">By {lead.author} · {formatDate(lead.date)} · {lead.read}</span>
            </span>
          </Link>
          <aside className="og-news-aside" aria-labelledby={`${section}-list`}>
            <p id={`${section}-list`} className="og-aside-title">In {SECTIONS[section].label}</p>
            <ol className="og-aside-list">
              {rest.slice(0, 4).map((item, index) => <li key={item.slug}><StoryRow story={item} index={index} /></li>)}
            </ol>
            {watch && <WatchNext episode={watch} />}
          </aside>
        </div>

        {section === "music" && (
          <a className="og-live" href={TICKETS.drake} target="_blank" rel="noopener noreferrer">
            <Img photo={{ src: drakePhoto, alt: "Drake on stage, pointing to the crowd", crop: { pos: "30% 20%", zoom: 1.35 } }} className="og-live-photo" />
            <span className="og-live-text">
              <span className="og-kicker">Live · Tickets</span>
              <span className="og-live-title">Drake, live in concert</span>
              <span className="og-meta">Date TBA · Venue TBA</span>
            </span>
            <span className="og-live-cta">Buy tickets <ArrowUpRight size={16} aria-hidden="true" /></span>
          </a>
        )}

        {rest.length > 0 && (
          <section className="og-block" aria-labelledby={`${section}-all`}>
            <div className="og-section-head">
              <h2 id={`${section}-all`} className="og-section-title">All {SECTIONS[section].label.toLowerCase()} stories</h2>
            </div>
            <div className="og-grid-3">
              {rest.map((story) => <StoryCard key={story.slug} story={story} showDeck />)}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="og-block" aria-labelledby={`${section}-originals`}>
            <div className="og-section-head">
              <h2 id={`${section}-originals`} className="og-section-title">From OGCW Originals</h2>
              <Link to="/originals" className="og-more-link">All originals</Link>
            </div>
            <div className="og-grid-3">
              {more.map((episode) => <EpisodeCard key={episode.slug} episode={episode} />)}
            </div>
          </section>
        )}

        <section className="og-next" aria-labelledby="keep-reading">
          <div>
            <p id="keep-reading" className="og-kicker">Keep reading</p>
            <Link to={other === "music" ? "/music" : "/culture"} className="og-next-link">
              <span className="og-next-name">{SECTIONS[other].label} <ArrowRight className="og-next-arrow" aria-hidden="true" /></span>
              <span className="og-next-intro">{SECTIONS[other].intro}</span>
            </Link>
          </div>
          <ol className="og-aside-list og-next-list">
            {articlesIn(other).slice(0, 3).map((story) => <li key={story.slug}><StoryRow story={story} /></li>)}
          </ol>
        </section>
      </main>
    </>
  );
}
