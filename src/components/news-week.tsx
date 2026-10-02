import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SECTIONS } from "@/data/content";
import { isDefault } from "@/data/placements";
import { useStories } from "@/lib/stories";
import { BsPhoto, Meta } from "./broadsheet";
import { StoryDate } from "./story-meta";
import { S, T } from "./site-text";

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
        <h3 id="week-title" className="bs-eyebrow"><T k="home.week.title">This week</T></h3>
        <Link to="/news" className="bs-more"><T>All</T> {stories.all.length} stories</Link>
      </div>

      <div className="bs-week-grid">
        {/* The lead, and the rest of fashion month under it */}
        <article className="bs-week-lead bs-reveal">
          <Link to="/news/$slug" params={{ slug: LEAD.slug }} className="bs-card">
            <BsPhoto photo={LEAD.photo} className="bs-photo-week" />
            <p className="bs-eyebrow"><S story={LEAD} f="kicker" /></p>
            <h4 className="bs-title bs-title-week"><S story={LEAD} f="title" /></h4>
            <p className="bs-deck"><S story={LEAD} f="deck" /></p>
            <Meta story={LEAD} />
          </Link>
          <div className="bs-thread">
            <p className="bs-thread-head">{usualThread ? <T k="home.week.thread">More from fashion month</T> : <T k="home.week.thread-other">Also this week</T>}</p>
            <ol className="bs-thread-list">
              {THREAD.map((story) => (
                <li key={story.slug}>
                  <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-thread-item">
                    <BsPhoto photo={story.photo} className="bs-thread-thumb" />
                    <span className="bs-thread-text">
                      <span className="bs-eyebrow"><S story={story} f="kicker" /></span>
                      <span className="bs-thread-title"><S story={story} f="title" /></span>
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
                <p className="bs-eyebrow"><S story={MIDDLE} f="kicker" /></p>
                <h4 className="bs-title"><S story={MIDDLE} f="title" /></h4>
                <p className="bs-deck bs-deck-sm"><S story={MIDDLE} f="deck" /></p>
                <Meta story={MIDDLE} />
              </Link>
              {MIDDLE_LINKED && MIDDLE_LINKED.slug !== MIDDLE.slug && (
                <Link to="/news/$slug" params={{ slug: MIDDLE_LINKED.slug }} className="bs-linked">
                  <span className="bs-linked-tag"><T k="home.week.connected">Connected</T></span>
                  <span className="bs-linked-title"><S story={MIDDLE_LINKED} f="title" /></span>
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              )}
            </article>
          )}
          {SECOND && (
            <article className="bs-reveal">
              <Link to="/news/$slug" params={{ slug: SECOND.slug }} className="bs-card">
                <BsPhoto photo={SECOND.photo} className="bs-photo-secondary" />
                <p className="bs-eyebrow"><S story={SECOND} f="kicker" /></p>
                <h4 className="bs-title"><S story={SECOND} f="title" /></h4>
                <Meta story={SECOND} />
              </Link>
            </article>
          )}
        </div>

        {/* In brief: five shorter stories, numbered, no photos */}
        <aside className="bs-week-brief bs-reveal" aria-labelledby="brief-title">
          <h4 id="brief-title" className="bs-brief-head"><T k="home.week.brief">In brief</T></h4>
          <ol className="bs-brief-list">
            {BRIEF.map((story, index) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-brief-item">
                  <span className="bs-brief-num" aria-hidden="true">{index + 1}</span>
                  <span className="bs-brief-text">
                    <span className="bs-brief-meta">{SECTIONS[story.section].label} · <StoryDate story={story} /></span>
                    <span className="bs-brief-title"><S story={story} f="title" /></span>
                    <span className="bs-brief-deck"><S story={story} f="deck" /></span>
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
          <p className="bs-cluster-tag"><T>Connected ·</T> {AI_MUSIC.length} stories</p>
          {usualCluster ? (
            <>
              <h4 id="cluster-ai-title" className="bs-cluster-title"><T k="home.week.cluster.title">AI and music: one week, three moves</T></h4>
              <p className="bs-cluster-intro"><T k="home.week.cluster.intro">A streaming service, a record label and the people who make sound for film and games all acted on AI within days of each other. Read them in order.</T></p>
            </>
          ) : (
            <h4 id="cluster-ai-title" className="bs-cluster-title"><T k="home.week.cluster.title-other">Read them together</T></h4>
          )}
        </div>
        <ol className="bs-cluster-row">
          {AI_MUSIC.map((story, index) => (
            <li key={story.slug} className="bs-reveal">
              <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card">
                <BsPhoto photo={story.photo} className="bs-photo-more" />
                <p className="bs-eyebrow"><span className="bs-cluster-step">{index + 1}</span> <StoryDate story={story} /></p>
                <h5 className="bs-title"><S story={story} f="title" /></h5>
                <p className="bs-deck bs-deck-sm"><S story={story} f="deck" /></p>
                <Meta story={story} date={false} />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
