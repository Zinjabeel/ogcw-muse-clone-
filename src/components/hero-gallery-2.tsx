import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent } from "react";
import type { SectionId } from "@/data/content";
import { useStories } from "@/lib/stories";
import { StoryMeta } from "./story-meta";
import { CARDS, CardLink } from "./hero-gallery";
import { EditableImage, S, T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// Gallery 2, rebuilt 21 Oct 2026 after Dazed's front page: the top story's
// picture on the left melts into a panel of its own colour, and the
// headline sits on that colour on the right. Under it the three top stories
// are numbered side by side, each with a line that fills while it is on
// show (click one to jump; pause beside them), and under those the five
// doors into OGCW stand still in a row, a small picture and a name each.
// The stories move on every 7 seconds, cross-fading; the whole hero eases
// into the colour of the story on show. They stop under the pointer, on
// focus, off screen and while an admin edits, and hold still for reduced
// motion. Nothing moves on scroll, and nothing glides along.

// The top stories are chosen in the studio (src/data/placements.ts). The
// usual three have their own tab name, colour and button; any other story
// uses its label, its section's colour and "Read the story".
const USUAL: Record<string, { tab: string; tone: string; cta: string }> = {
  "gta-vi-countdown": { tab: "GTA VI", tone: "#4f7f96", cta: "Read the countdown" },
  "paris-fashion-week-ss27": { tab: "Paris Fashion Week", tone: "#6b3a3a", cta: "See the shows to watch" },
  "taylor-swift-the-life-of-a-showgirl-the-encore": { tab: "Taylor Swift", tone: "#6e3320", cta: "Read the story" },
};
const SECTION_TONE: Record<SectionId, string> = { music: "#6e3320", games: "#4f7f96", streaming: "#5a4a8a", culture: "#6b3a3a", sports: "#2f5d46" };

const FEATURE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

export function HeroGallery2() {
  const stories = useStories();
  const FEATURES = stories.slot("hero-top").map((story) => ({ story, ...(USUAL[story.slug] ?? { tab: story.kicker, tone: SECTION_TONE[story.section], cta: "Read the story" }) }));
  const section = useRef<HTMLElement>(null);
  const [feature, setFeature] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Only run while the hero is on screen (it is display: none unless chosen)
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { busy } = useSiteText();
  const running = !paused && !hold && inView && !reduce && !busy;
  // The studio can change how many top stories there are while the page is open
  useEffect(() => { if (feature >= FEATURES.length) setFeature(0); }, [feature, FEATURES.length]);
  const current = FEATURES[feature] ?? FEATURES[0];
  if (!current) return null;

  // The story and its tabs hold still under the pointer and while focused
  const holdOn = {
    onPointerEnter: (event: PointerEvent) => { if (event.pointerType === "mouse") setHold(true); },
    onPointerLeave: () => setHold(false),
    onFocus: () => setHold(true),
    onBlur: (event: FocusEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); },
  };

  return (
    <section ref={section} className="gallery2 g2x" style={{ "--tone": current.tone } as CSSProperties} aria-labelledby="g2-title">
      <h1 id="g2-title" className="sr-only"><T>OGCW, One Great Culture World</T></h1>

      <div className="g2x-wrap">
        <div className="g2x-top" {...holdOn}>
          {/* The top story: its picture melting into its own colour, the words on that colour */}
          <div className="g2x-band" aria-roledescription="carousel" aria-label="Top stories">
            {FEATURES.map((item, index) => (
              <article
                key={item.story.slug}
                className="g2x-slide"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${FEATURES.length}`}
                aria-hidden={index === feature ? undefined : true}
                data-on={index === feature}
              >
                <Link to="/news/$slug" params={{ slug: item.story.slug }} className="g2x-photo" tabIndex={-1} aria-hidden="true">
                  <img src={item.story.photo.src} alt="" style={{ objectPosition: item.story.photo.crop?.pos ?? "50% 50%" }} loading="lazy" />
                </Link>
                <div className="g2x-words">
                  <p className="g2x-kicker"><T k="hero.top.kicker">Top story</T> · <S story={item.story} f="kicker" /></p>
                  <h2 className={`g2x-title${item.story.title.length > 48 ? " is-long" : ""}`}>
                    <Link to="/news/$slug" params={{ slug: item.story.slug }} tabIndex={index === feature ? undefined : -1}><S story={item.story} f="title" /></Link>
                  </h2>
                  <p className="g2x-deck"><S story={item.story} f="deck" /></p>
                  <div className="g2x-actions">
                    <Link to="/news/$slug" params={{ slug: item.story.slug }} className="g2x-cta" tabIndex={index === feature ? undefined : -1}>
                      <T>{item.cta}</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                    </Link>
                    <StoryMeta story={item.story} className="g2x-meta" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* The three top stories, numbered; the line fills while one is on show */}
          <div className="g2x-tabs" role="group" aria-label="Choose a top story">
            {FEATURES.map((item, index) => (
              <button key={item.story.slug} type="button" className="g2x-tab" aria-pressed={index === feature} onClick={() => setFeature(index)}>
                <span className="g2x-tab-line" aria-hidden="true">
                  {index === feature && !reduce && (
                    <i key={feature} style={{ "--dur": `${FEATURE_MS}ms` } as CSSProperties} data-run={running} onAnimationEnd={() => setFeature((value) => (value + 1) % FEATURES.length)} />
                  )}
                </span>
                <span className="g2x-tab-num" aria-hidden="true">{pad(index + 1)}</span>
                <span className="g2x-tab-text">
                  <span className="g2x-tab-name">{item.tab}</span>
                  <span className="g2x-tab-title"><S story={item.story} f="title" /></span>
                </span>
              </button>
            ))}
            {!reduce && (
              <button type="button" className="g2x-pause" aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((value) => !value)}>
                {paused ? <Play size={14} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={14} strokeWidth={1.75} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        {/* The five doors into OGCW, standing still */}
        <nav className="g2x-doors" aria-label="Explore OGCW">
          <ol>
            {CARDS.map((item) => (
              <li key={item.id}>
                <CardLink dest={item.dest} className="g2x-door" tabIndex={undefined} onClick={() => {}}>
                  <span className="g2x-door-photo"><EditableImage k={`hero.card.${item.id}`} src={item.photo} alt="" loading="lazy" draggable={false} /></span>
                  <span className="g2x-door-text">
                    <span className="g2x-door-label"><T k={`hero.card.${item.id}.label`}>{item.label}</T></span>
                    <span className="g2x-door-title"><T k={`hero.card.${item.id}.title`}>{item.title}</T></span>
                  </span>
                  <ArrowUpRight className="g2x-door-arrow" size={15} strokeWidth={2} aria-hidden="true" />
                </CardLink>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
