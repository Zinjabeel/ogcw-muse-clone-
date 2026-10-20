import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SECTIONS, type Article } from "@/data/content";
import { useStories } from "@/lib/stories";
import { BsPhoto, Meta } from "./broadsheet";
import { StoryDate } from "./story-meta";
import { S, T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// This week: fifteen of the latest stories as a second broadsheet block
// under the OGCW News front, in the same hairline grid. A big lead (Saint
// story) with three more threaded under it; two stories
// in the middle column, one with a connected story linked beneath it; an
// In brief column of five short items, numbered; then a connected row of
// Big news: three places, each fading on to another story every few seconds.
// The News page (src/routes/news.index.tsx) uses the same layout, WeekLayout,
// filled with the newest stories of the section picked there.

/** The stories for each spot of the layout */
export type WeekStories = { lead: Article; thread: Article[]; middle?: Article | undefined; connected?: Article | undefined; second?: Article | undefined; brief: Article[]; big: Article[] };
/** The layout's own words (each an editable text) */
export type WeekLabels = { head: ReactNode; thread: ReactNode; connected: ReactNode; brief: ReactNode; bigTag: ReactNode; bigTitle: ReactNode };

// The stories in each spot are chosen in the studio (src/data/placements.ts).
export function NewsWeek() {
  const stories = useStories();
  const [LEAD = stories.pick("lil-baby-new-album-november-6")] = stories.slot("week-lead");
  const [MIDDLE, SECOND] = stories.slot("week-middle");
  return (
    <WeekLayout
      id="week"
      stories={{ lead: LEAD, thread: stories.slot("week-thread"), middle: MIDDLE, connected: stories.slot("week-connected")[0], second: SECOND, brief: stories.slot("week-brief"), big: stories.slot("week-cluster") }}
      labels={{
        head: (
          <>
            <h3 id="week-title" className="bs-eyebrow"><T k="home.week.title">This week</T></h3>
            <Link to="/news" className="bs-more"><T k="home.week.all">All stories</T></Link>
          </>
        ),
        thread: <T k="home.week.thread-other">Also this week</T>,
        connected: <T k="home.week.connected">Connected</T>,
        brief: <T k="home.week.brief">In brief</T>,
        bigTag: <T k="home.week.big.tag">Big news</T>,
        bigTitle: <T k="home.week.big.title">The stories everyone is talking about</T>,
      }}
    />
  );
}

export function WeekLayout({ id, stories, labels }: { id: string; stories: WeekStories; labels: WeekLabels }) {
  const { lead: LEAD, thread: THREAD, middle: MIDDLE, connected: MIDDLE_LINKED, second: SECOND, brief: BRIEF, big: BIG } = stories;
  return (
    <section className="bs-week" aria-labelledby={`${id}-title`}>
      <div className="bs-section-head">{labels.head}</div>

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
            <p className="bs-thread-head">{labels.thread}</p>
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
                  <span className="bs-linked-tag">{labels.connected}</span>
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
        <aside className="bs-week-brief bs-reveal" aria-labelledby={`${id}-brief-title`}>
          <h4 id={`${id}-brief-title`} className="bs-brief-head">{labels.brief}</h4>
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

      <BigNews id={id} stories={BIG} tag={labels.bigTag} title={labels.bigTitle} />
    </section>
  );
}

// Big news: three places in a row, with two stories each (up to six in all,
// chosen in the studio). Every 4 seconds the places move on, one at a time
// and a second apart: the first fades into its next story, a second later
// the second, then the third. Each story keeps exactly the same size and
// place. The story under the pointer holds still while the other two carry
// on; everything holds on keyboard focus, off screen, while an admin edits,
// and for reduced motion.
const PLACES = 3;
const TICK_MS = 1000; // one place changes per tick: 0, 1, 2, then a rest

function BigNews({ id, stories, tag, title }: { id: string; stories: Article[]; tag: ReactNode; title: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const { busy } = useSiteText();
  const [turns, setTurns] = useState<number[]>(() => Array(PLACES).fill(0));
  const [hold, setHold] = useState(false);
  const pointed = useRef<number | null>(null);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const places = Array.from({ length: PLACES }, (_, place) => stories.filter((_, index) => index % PLACES === place));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const running = !hold && inView && !reduce && !busy && stories.length > PLACES;
  useEffect(() => {
    if (!running) return;
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      // Ticks 4, 5, 6 change places 1, 2, 3; tick 7 rests; then again from 8
      const place = tick % (PLACES + 1);
      if (tick <= PLACES || place === PLACES || place === pointed.current) return;
      setTurns((all) => all.map((turn, index) => (index === place ? turn + 1 : turn)));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!stories.length) return null;
  return (
    <section
      ref={section}
      className="bs-cluster bs-bignews"
      aria-labelledby={`${id}-big-title`}
      onFocus={(event) => { if (event.target.matches(":focus-visible")) setHold(true); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
    >
      <div className="bs-cluster-head">
        <p className="bs-cluster-tag">{tag}</p>
        <h4 id={`${id}-big-title`} className="bs-cluster-title">{title}</h4>
      </div>
      <ol className="bs-cluster-row">
        {places.map((queue, place) => {
          const on = queue.length ? turns[place]! % queue.length : 0;
          return (
            <li key={place} className="bs-reveal bs-bignews-place" onPointerEnter={() => { pointed.current = place; }} onPointerLeave={() => { pointed.current = null; }}>
              <div className="bs-bignews-stack">
                {queue.map((story, index) => {
                  const shown = index === on;
                  return (
                    <Link
                      key={story.slug}
                      to="/news/$slug"
                      params={{ slug: story.slug }}
                      className={`bs-card bs-bignews-card${shown ? " is-on" : ""}`}
                      aria-hidden={shown ? undefined : true}
                      tabIndex={shown ? undefined : -1}
                    >
                      <BsPhoto photo={story.photo} className="bs-photo-more" />
                      <p className="bs-eyebrow"><span className="bs-cluster-step">{place + 1}</span> <S story={story} f="kicker" /> · <StoryDate story={story} /></p>
                      <h5 className="bs-title"><S story={story} f="title" /></h5>
                      <p className="bs-deck bs-deck-sm"><S story={story} f="deck" /></p>
                      <Meta story={story} date={false} />
                    </Link>
                  );
                })}
              </div>
              {queue.length > 1 && (
                <span className="bs-bignews-dots" aria-hidden="true">
                  {queue.map((story, index) => <i key={story.slug} className={index === on ? "is-on" : undefined} />)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
