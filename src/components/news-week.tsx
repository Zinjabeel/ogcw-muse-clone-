import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SECTIONS } from "@/data/content";
import { isDefault } from "@/data/placements";
import { useStories } from "@/lib/stories";
import { BsPhoto, ReadTime, shortDate } from "./broadsheet";

// This week: fifteen of the latest stories as a second broadsheet block
// under the OGCW News front, in the same hairline grid. A big lead (Saint
// Laurent) with the rest of fashion month threaded under it; two stories
// in the middle column, one with a connected story linked beneath it; an
// In brief column of five short items, numbered; then a connected row of
// three stories on AI and music, read in order.

// The stories in each spot are chosen in the studio (src/data/placements.ts).
// The headings written for the usual stories (fashion month, AI and music)
// give way to plain ones when other stories take those spots.
export function NewsWeek() {
  const stories = useStories();
  const [LEAD = stories.pick("saint-laurent-ss27-vaccarello")] = stories.slot("week-lead");
  const THREAD = stories.slot("week-thread");
  const [MIDDLE, SECOND] = stories.slot("week-middle");
  const [MIDDLE_LINKED] = stories.slot("week-connected");
  const BRIEF = stories.slot("week-brief");
  const AI_MUSIC = stories.slot("week-cluster");
  const usualThread = isDefault("week-thread", THREAD);
  const usualCluster = isDefault("week-cluster", AI_MUSIC);

  return (
    <section className="bs-week" aria-labelledby="week-title">
      <div className="bs-section-head">
        <h3 id="week-title" className="bs-eyebrow">This week</h3>
        <Link to="/news" className="bs-more">All {stories.all.length} stories</Link>
      </div>

      <div className="bs-week-grid">
        {/* The lead, and the rest of fashion month under it */}
        <article className="bs-week-lead bs-reveal">
          <Link to="/news/$slug" params={{ slug: LEAD.slug }} className="bs-card">
            <BsPhoto photo={LEAD.photo} className="bs-photo-week" />
            <p className="bs-eyebrow">{LEAD.kicker}</p>
            <h4 className="bs-title bs-title-week">{LEAD.title}</h4>
            <p className="bs-deck">{LEAD.deck}</p>
            <ReadTime>{LEAD.read}</ReadTime>
          </Link>
          <div className="bs-thread">
            <p className="bs-thread-head">{usualThread ? "More from fashion month" : "Also this week"}</p>
            <ol className="bs-thread-list">
              {THREAD.map((story) => (
                <li key={story.slug}>
                  <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-thread-item">
                    <BsPhoto photo={story.photo} className="bs-thread-thumb" />
                    <span className="bs-thread-text">
                      <span className="bs-eyebrow">{story.kicker}</span>
                      <span className="bs-thread-title">{story.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </article>

        {/* Two stories, the first with its connected story underneath */}
        <div className="bs-week-mid">
          {MIDDLE && (
            <article className="bs-reveal">
              <Link to="/news/$slug" params={{ slug: MIDDLE.slug }} className="bs-card">
                <BsPhoto photo={MIDDLE.photo} className="bs-photo-secondary" />
                <p className="bs-eyebrow">{MIDDLE.kicker}</p>
                <h4 className="bs-title">{MIDDLE.title}</h4>
                <p className="bs-deck bs-deck-sm">{MIDDLE.deck}</p>
                <ReadTime>{MIDDLE.read}</ReadTime>
              </Link>
              {MIDDLE_LINKED && MIDDLE_LINKED.slug !== MIDDLE.slug && (
                <Link to="/news/$slug" params={{ slug: MIDDLE_LINKED.slug }} className="bs-linked">
                  <span className="bs-linked-tag">Connected</span>
                  <span className="bs-linked-title">{MIDDLE_LINKED.title}</span>
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              )}
            </article>
          )}
          {SECOND && (
            <article className="bs-reveal">
              <Link to="/news/$slug" params={{ slug: SECOND.slug }} className="bs-card">
                <BsPhoto photo={SECOND.photo} className="bs-photo-secondary" />
                <p className="bs-eyebrow">{SECOND.kicker}</p>
                <h4 className="bs-title">{SECOND.title}</h4>
                <ReadTime>{SECOND.read}</ReadTime>
              </Link>
            </article>
          )}
        </div>

        {/* In brief: five shorter stories, numbered, no photos */}
        <aside className="bs-week-brief bs-reveal" aria-labelledby="brief-title">
          <h4 id="brief-title" className="bs-brief-head">In brief</h4>
          <ol className="bs-brief-list">
            {BRIEF.map((story, index) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-brief-item">
                  <span className="bs-brief-num" aria-hidden="true">{index + 1}</span>
                  <span className="bs-brief-text">
                    <span className="bs-brief-meta">{SECTIONS[story.section].label} · <time dateTime={story.date}>{shortDate(story.date)}</time></span>
                    <span className="bs-brief-title">{story.title}</span>
                    <span className="bs-brief-deck">{story.deck}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {/* Connected: three stories on AI and music from the same week, in order */}
      <section className="bs-cluster" aria-labelledby="cluster-ai-title">
        <div className="bs-cluster-head">
          <p className="bs-cluster-tag">Connected · {AI_MUSIC.length} stories</p>
          {usualCluster ? (
            <>
              <h4 id="cluster-ai-title" className="bs-cluster-title">AI and music: one week, three moves</h4>
              <p className="bs-cluster-intro">A streaming service, a record label and the people who make sound for film and games all acted on AI within days of each other. Read them in order.</p>
            </>
          ) : (
            <h4 id="cluster-ai-title" className="bs-cluster-title">Read them together</h4>
          )}
        </div>
        <ol className="bs-cluster-row">
          {AI_MUSIC.map((story, index) => (
            <li key={story.slug} className="bs-reveal">
              <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                <BsPhoto photo={story.photo} className="bs-photo-more" />
                <p className="bs-eyebrow"><span className="bs-cluster-step">{index + 1}</span> {shortDate(story.date)}</p>
                <h5 className="bs-title">{story.title}</h5>
                <p className="bs-deck bs-deck-sm">{story.deck}</p>
                <ReadTime>{story.read}</ReadTime>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
