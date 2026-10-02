import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { RAP_POLL, RAP_POLL_CHOICES, SECTIONS, type Article, type RapPollChoice } from "@/data/content";
import { useStories } from "@/lib/stories";
import { getRapPoll, voteRapPoll, type RapPollCounts } from "@/lib/rap-poll";
import { storePreference } from "@/lib/consent";
import { Img } from "./cards";
import { StoryMeta } from "./story-meta";

// Keep exploring: the Explore grid carries straight on into more stories,
// in the same tiles. A big feature and four stories, then the rap desk
// across the full width: a vote on who is the No. 1 rapper right now, with
// four stories from the rap beat beside it. After voting you see how
// everyone has voted so far, as bars behind the five names.
// Then More to explore, ten newer stories in the same pattern: the Switch 2
// season as a feature with four games stories, then a Screens & streams
// list beside two more games stories.

// The stories in each spot are chosen in the studio (src/data/placements.ts)
const USUAL_MORE_FEATURE = "monster-hunter-wilds-switch-2";

const STORAGE_KEY = "ogcw-vote-no1-rapper";

// Whole-number shares that add up to 100 (largest remainder)
function shares(counts: RapPollCounts, total: number): RapPollCounts {
  const exact = RAP_POLL_CHOICES.map((choice) => ({ choice, value: total ? (counts[choice] * 100) / total : 0 }));
  const result = Object.fromEntries(exact.map(({ choice, value }) => [choice, Math.floor(value)])) as RapPollCounts;
  if (!total) return result;
  let left = 100 - Object.values(result).reduce((sum, value) => sum + value, 0);
  for (const { choice } of [...exact].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (left <= 0) break;
    result[choice] += 1;
    left -= 1;
  }
  return result;
}

function RapPoll() {
  const [mine, setMine] = useState<RapPollChoice | null>(null);
  const [counts, setCounts] = useState<RapPollCounts | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  // A browser that has already voted goes straight to the results
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked: this visit starts with a fresh ballot
    }
    const choice = RAP_POLL_CHOICES.find((id) => id === saved);
    if (!choice) return;
    getRapPoll()
      .then((result) => {
        // The count has started again since that vote: vote afresh
        if (result[choice] === 0) return;
        setMine(choice);
        setCounts(result);
      })
      .catch(() => {});
  }, []);

  const vote = async (choice: RapPollChoice) => {
    if (mine || status === "sending") return;
    setStatus("sending");
    try {
      const result = await voteRapPoll({ data: choice });
      setMine(choice);
      setCounts(result);
      setStatus("idle");
      storePreference(STORAGE_KEY, choice); // remembered only if the reader allows preferences
    } catch {
      setStatus("error");
    }
  };

  const total = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : 0;
  const share = counts ? shares(counts, total) : null;
  const leader = counts ? RAP_POLL_CHOICES.reduce((best, choice) => (counts[choice] > counts[best] ? choice : best)) : null;
  const picked = RAP_POLL.contenders.find((c) => c.id === mine);

  return (
    <div className="poll">
      <ol className="poll-list" aria-label="The five names on the ballot">
        {RAP_POLL.contenders.map((contender, index) => {
          const crop = contender.photo.crop ?? { pos: "50% 30%" };
          const inner = (
            <>
              {share && <span className="poll-bar" aria-hidden="true" />}
              <span className="poll-num" aria-hidden="true">{index + 1}</span>
              <span className="poll-face"><img src={contender.photo.src} alt="" loading="lazy" style={{ objectPosition: crop.pos }} /></span>
              <span className="poll-text">
                <span className="poll-name">
                  {contender.name}
                  {mine === contender.id && <span className="poll-mine"><Check size={12} strokeWidth={2.5} aria-hidden="true" /> Your vote</span>}
                </span>
                <span className="poll-case">{contender.case}</span>
              </span>
              {share ? (
                <span className="poll-share">{share[contender.id]}<small>%</small></span>
              ) : (
                <span className="poll-cta" aria-hidden="true">Vote</span>
              )}
            </>
          );
          const style = { "--share": `${share?.[contender.id] ?? 0}%`, "--i": index } as CSSProperties;
          return (
            <li key={contender.id}>
              {share ? (
                <div className="poll-option is-result" data-mine={mine === contender.id || undefined} data-lead={leader === contender.id || undefined} style={style}>
                  {inner}
                  <span className="sr-only">: {share[contender.id]}% of {total} votes</span>
                </div>
              ) : (
                <button type="button" className="poll-option" style={style} disabled={status === "sending"} onClick={() => vote(contender.id)} aria-label={`Vote for ${contender.name}. ${contender.case}`}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="poll-foot" aria-live="polite">
        {status === "sending" && "Counting your vote…"}
        {status === "error" && "Your vote didn’t go through. Try again."}
        {status === "idle" && !share && "Pick a name to vote. You’ll see how everyone else voted straight after."}
        {status === "idle" && share && picked && (
          <>
            <strong>{total.toLocaleString("en-GB")} {total === 1 ? "vote" : "votes"}</strong> so far. You picked {picked.name}.
          </>
        )}
      </p>
    </div>
  );
}

// A story tile. `tall` tiles sit beside the Screens & streams list, and their
// photo grows to fill the extra height on wide screens.
function Tile({ story, tall = false }: { story: Article; tall?: boolean }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className={`mix-tile kx-tile ${tall ? "kx-tile-tall" : ""}`}>
      <Img photo={story.photo} className="kx-tile-photo" />
      <span className="mix-label">{story.kicker} · {SECTIONS[story.section].label}</span>
      <span className="kx-tile-title">{story.title}</span>
      <StoryMeta story={story} className="kx-meta" />
    </Link>
  );
}

// A big story: its photo full-bleed under the words, with a button
function Feature({ story, label }: { story: Article; label?: string }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className="mix-tile mix-pick kx-feature">
      <Img photo={story.photo} className="mix-pick-photo" />
      <span className="mix-pick-text">
        <span className="mix-label">{label ?? story.kicker} · {SECTIONS[story.section].label}</span>
        <span className="mix-pick-title">{story.title}</span>
        <span className="mix-pick-deck">{story.deck}</span>
        <span className="kx-feature-cta">Read the story <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></span>
      </span>
    </Link>
  );
}

function RapStory({ story }: { story: Article }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className="kx-rap-story">
      <Img photo={story.photo} className="kx-rap-thumb" />
      <span className="kx-rap-text">
        <span className="mix-label">{story.kicker}</span>
        <span className="kx-rap-title">{story.title}</span>
        <StoryMeta story={story} className="kx-meta" />
      </span>
    </Link>
  );
}

export function KeepExploring() {
  const stories = useStories();
  const [FEATURE = stories.pick("witcher-3-remastered-launch")] = stories.slot("kx-feature");
  const TILES = stories.slot("kx-tiles");
  const RAP_STORIES = stories.slot("kx-rap");
  const [MORE_FEATURE = stories.pick(USUAL_MORE_FEATURE)] = stories.slot("kx-more-feature");
  const MORE_TILES = stories.slot("kx-more-tiles");
  const SCREENS = stories.slot("kx-screens");
  const MORE_END = stories.slot("kx-more-end");
  const FIRST_COUNT = 1 + TILES.length + RAP_STORIES.length;
  const MORE_COUNT = 1 + MORE_TILES.length + SCREENS.length + MORE_END.length;

  return (
    <section className="kx" aria-labelledby="kx-title">
      <div className="kx-head">
        <h3 id="kx-title" className="kx-label">Keep exploring</h3>
        <span className="kx-rule" aria-hidden="true" />
        <span className="kx-count">{FIRST_COUNT} more stories</span>
      </div>

      <div className="kx-grid">
        <Feature story={FEATURE} />

        {TILES.map((story) => <Tile key={story.slug} story={story} />)}

        {/* The rap desk: the vote, and the rap beat beside it */}
        <section className="mix-tile kx-rap" aria-labelledby="rap-desk-title">
          <div className="kx-rap-poll">
            <p className="mix-label">The rap desk · Vote</p>
            <h4 id="rap-desk-title" className="kx-rap-question">Who’s the <em>No. 1</em> rapper right now?</h4>
            <p className="kx-rap-intro">
              Five names, five cases from 2026 so far.{" "}
              <Link to="/news/$slug" params={{ slug: RAP_POLL.story }} className="kx-rap-intro-link">Read the case for each</Link>
            </p>
            <RapPoll />
          </div>
          <div className="kx-rap-side">
            <p className="kx-rap-side-head">On the rap beat</p>
            <ol className="kx-rap-list">
              {RAP_STORIES.map((story) => <li key={story.slug}><RapStory story={story} /></li>)}
            </ol>
            <Link to="/music" className="kx-rap-more">More in Music <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></Link>
          </div>
        </section>
      </div>

      <div className="kx-head">
        <h3 id="kx-more-title" className="kx-label">More to explore</h3>
        <span className="kx-rule" aria-hidden="true" />
        <span className="kx-count">{MORE_COUNT} more stories</span>
      </div>

      <div className="kx-grid">
        <Feature story={MORE_FEATURE} {...(MORE_FEATURE.slug === USUAL_MORE_FEATURE ? { label: "Switch 2 season" } : {})} />

        {MORE_TILES.map((story) => <Tile key={story.slug} story={story} />)}

        {/* Screens & streams: three quick reads in a list, like the rap beat */}
        <section className="mix-tile kx-screens" aria-labelledby="kx-screens-title">
          <p id="kx-screens-title" className="kx-rap-side-head">Screens &amp; streams</p>
          <ol className="kx-rap-list">
            {SCREENS.map((story) => <li key={story.slug}><RapStory story={story} /></li>)}
          </ol>
          <Link to="/streaming" className="kx-rap-more">More in Streaming <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></Link>
        </section>

        {MORE_END.map((story) => <Tile key={story.slug} story={story} tall />)}
      </div>
    </section>
  );
}
