import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { article, ARTICLES, SECTIONS } from "@/data/content";
import { BsPhoto, ReadTime, shortDate } from "./broadsheet";

// This week: fifteen of the latest stories as a second broadsheet block
// under the OGCW News front, in the same hairline grid. A big lead (Saint
// Laurent) with the rest of fashion month threaded under it; two stories
// in the middle column, one with a connected story linked beneath it; an
// In brief column of five short items, numbered; then a connected row of
// three stories on AI and music, read in order.

const LEAD = article("saint-laurent-ss27-vaccarello");
const THREAD = ["dior-ss27-jonathan-anderson", "courreges-drew-henry-debut", "milan-fashion-week-ss27-review"].map(article);
const MIDDLE = article("lcd-soundsystem-nyc-residency-100th-show");
const MIDDLE_LINKED = article("al-doyle-hollywood-saviour");
const SECOND = article("latin-grammys-2026-nominations");
const BRIEF = ["xbox-disc-to-digital-all-players", "grasshopper-manufacture-leaves-netease", "kick-partner-program-payout-fix", "wwe-main-event-moves-to-rumble", "dennis-haskins-dies"].map(article);
const AI_MUSIC = ["qobuz-ai-music-tags", "sony-music-joins-ariam", "professional-sound-alliance-launch"].map(article);

/** The stories this block shows, so the More news row can leave them out */
export const WEEK_SLUGS = new Set([LEAD, ...THREAD, MIDDLE, MIDDLE_LINKED, SECOND, ...BRIEF, ...AI_MUSIC].map((story) => story.slug));

export function NewsWeek() {
  return (
    <section className="bs-week" aria-labelledby="week-title">
      <div className="bs-section-head">
        <h3 id="week-title" className="bs-eyebrow">This week</h3>
        <Link to="/news" className="bs-more">All {ARTICLES.length} stories</Link>
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
            <p className="bs-thread-head">More from fashion month</p>
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
          <article className="bs-reveal">
            <Link to="/news/$slug" params={{ slug: MIDDLE.slug }} className="bs-card">
              <BsPhoto photo={MIDDLE.photo} className="bs-photo-secondary" />
              <p className="bs-eyebrow">{MIDDLE.kicker}</p>
              <h4 className="bs-title">{MIDDLE.title}</h4>
              <p className="bs-deck bs-deck-sm">{MIDDLE.deck}</p>
              <ReadTime>{MIDDLE.read}</ReadTime>
            </Link>
            <Link to="/news/$slug" params={{ slug: MIDDLE_LINKED.slug }} className="bs-linked">
              <span className="bs-linked-tag">Connected</span>
              <span className="bs-linked-title">{MIDDLE_LINKED.title}</span>
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </article>
          <article className="bs-reveal">
            <Link to="/news/$slug" params={{ slug: SECOND.slug }} className="bs-card">
              <BsPhoto photo={SECOND.photo} className="bs-photo-secondary" />
              <p className="bs-eyebrow">{SECOND.kicker}</p>
              <h4 className="bs-title">{SECOND.title}</h4>
              <ReadTime>{SECOND.read}</ReadTime>
            </Link>
          </article>
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
          <p className="bs-cluster-tag">Connected · 3 stories</p>
          <h4 id="cluster-ai-title" className="bs-cluster-title">AI and music: one week, three moves</h4>
          <p className="bs-cluster-intro">A streaming service, a record label and the people who make sound for film and games all acted on AI within days of each other. Read them in order.</p>
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
