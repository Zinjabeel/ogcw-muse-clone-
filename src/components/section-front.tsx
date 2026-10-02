import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageIntro } from "./ogcw-layout";
import { EpisodeCard, Img, SECTION_PATH, SongCard, StoryCard, StoryRow, WatchNext } from "./cards";
import { ContentOfTheMonth } from "./content-of-the-month";
import { EPISODES, formatDate, LIVE, SECTION_IDS, SECTIONS, SONGS, type SectionId } from "@/data/content";
import { useStories } from "@/lib/stories";
import { StoryMeta } from "./story-meta";
import { T } from "./site-text";

// Front page for a section (/music, /games, /streaming, /culture): a lead
// story beside a numbered list, the rest as a grid, related OGCW Originals and
// a pointer to the next section. Music also carries the live listing and the
// songs to check out; Streaming carries Content of the month.

export function SectionFront({ section }: { section: SectionId }) {
  const live = useStories();
  const stories = live.inSection(section);
  const [lead, ...rest] = stories;
  const next = SECTION_IDS[(SECTION_IDS.indexOf(section) + 1) % SECTION_IDS.length]!;
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
              <StoryMeta story={lead} className="og-meta" />
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
          <a className="og-live" href={LIVE.url} target="_blank" rel="noopener noreferrer">
            <Img photo={LIVE.photo} className="og-live-photo" />
            <span className="og-live-text">
              <span className="og-kicker">{LIVE.kicker}</span>
              <span className="og-live-title">{LIVE.title}</span>
              <span className="og-meta">{LIVE.meta}</span>
            </span>
            <span className="og-live-cta"><T k="section.tour">Tour dates</T> <ArrowUpRight size={16} aria-hidden="true" /></span>
          </a>
        )}

        {section === "music" && (
          <section className="og-block" aria-labelledby="music-songs">
            <div className="og-section-head">
              <h2 id="music-songs" className="og-section-title"><T k="section.songs">Songs to check out</T></h2>
              <span className="og-more-link"><T k="section.spotify">Listen on Spotify</T></span>
            </div>
            <ul className="og-songs">
              {SONGS.map((song) => <li key={song.spotify}><SongCard song={song} /></li>)}
            </ul>
          </section>
        )}

        {section === "streaming" && (
          <div className="og-block og-cotm">
            <ContentOfTheMonth headingLevel="h2" />
          </div>
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
              <h2 id={`${section}-originals`} className="og-section-title"><T k="section.originals">From OGCW Originals</T></h2>
              <Link to="/originals" className="og-more-link"><T k="section.originals.all">All originals</T></Link>
            </div>
            <div className="og-grid-3">
              {more.map((episode) => <EpisodeCard key={episode.slug} episode={episode} />)}
            </div>
          </section>
        )}

        <section className="og-next" aria-labelledby="keep-reading">
          <div>
            <p id="keep-reading" className="og-kicker"><T k="section.keep">Keep reading</T></p>
            <Link to={SECTION_PATH[next]} className="og-next-link">
              <span className="og-next-name">{SECTIONS[next].label} <ArrowRight className="og-next-arrow" aria-hidden="true" /></span>
              <span className="og-next-intro">{SECTIONS[next].intro}</span>
            </Link>
          </div>
          <ol className="og-aside-list og-next-list">
            {live.inSection(next).slice(0, 3).map((story) => <li key={story.slug}><StoryRow story={story} /></li>)}
          </ol>
        </section>
      </main>
    </>
  );
}
