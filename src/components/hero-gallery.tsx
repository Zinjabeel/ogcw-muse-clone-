import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { article, formatDate } from "@/data/content";

// Gallery hero (the second option in the hero switcher): news pictures hung
// like a gallery wall, each with a museum-style caption. The row scrolls
// sideways (swipe, trackpad or the arrows) and moves on by itself: the line
// in the "01 — 03" counter fills up, then the next picture slides in. Behind
// it all, a blurred copy of the current picture washed in the theme colour,
// which crossfades as the pictures change. Pauses while the pointer is on the
// pictures, when off screen, and on the pause button; no autoplay for
// reduced motion.

const SLIDES = [
  { story: article("central-cee-and-the-global-rise-of-uk-rap"), shape: "wide" },
  { story: article("playboi-carti-at-clout-festival"), shape: "tall" },
  { story: article("dave-and-the-art-of-the-long-verse"), shape: "wide" },
] as const;

const DURATION = 6000; // ms per picture
const pad = (n: number) => String(n).padStart(2, "0");

export function HeroGallery() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
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

  // Only run while the hero is on screen (it is display: none when the cover hero is chosen)
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The active picture is the one closest to the row’s left edge
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const start = el.getBoundingClientRect().left + (parseFloat(getComputedStyle(el).paddingLeft) || 0);
      let best = 0, bestDistance = Infinity;
      Array.from(el.children).forEach((slide, index) => {
        const distance = Math.abs(slide.getBoundingClientRect().left - start);
        if (distance < bestDistance) { best = index; bestDistance = distance; }
      });
      setActive(best);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  const goTo = useCallback((index: number) => {
    const el = track.current;
    const slide = el?.children[index] as HTMLElement | undefined;
    if (!el || !slide) return;
    const start = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    el.scrollTo({ left: slide.offsetLeft - start, behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  const next = () => goTo((active + 1) % SLIDES.length);
  const previous = () => goTo((active - 1 + SLIDES.length) % SLIDES.length);
  const running = !paused && !hold && inView && !reduce;

  return (
    <section
      ref={section}
      className="gallery"
      aria-roledescription="carousel"
      aria-label="Top stories"
    >
      <div className="gallery-bg" aria-hidden="true">
        {SLIDES.map(({ story }, index) => (
          <img key={story.slug} src={story.photo.src} alt="" className={index === active ? "is-on" : undefined} />
        ))}
      </div>

      <div className="gallery-top">
        <p>Welcome to One Great Culture World</p>
        <p>Top stories</p>
      </div>

      <ol className="gallery-track" ref={track} onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
        {SLIDES.map(({ story, shape }, index) => (
          <li
            key={story.slug}
            className={`gallery-slide gallery-${shape}`}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}`}
            aria-current={index === active ? "true" : undefined}
          >
            <Link
              to="/news/$slug"
              params={{ slug: story.slug }}
              className="gallery-link"
              // A picture that isn’t in front yet slides into place first
              onClick={(event) => { if (index !== active) { event.preventDefault(); goTo(index); } }}
            >
              <span className="gallery-frame">
                <span className="gallery-mount" aria-hidden="true" />
                <img src={story.photo.src} alt={story.photo.alt} style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} loading={index === 0 ? "eager" : "lazy"} />
              </span>
              <span className="gallery-caption">
                <span className="gallery-label">{pad(index + 1)} / {story.kicker}</span>
                <span className="gallery-title">{story.title}</span>
                <span className="gallery-meta">By {story.author}, {formatDate(story.date)}.</span>
                <span className="gallery-meta">{story.read}.</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="gallery-foot">
        <p className="gallery-foot-label">Culture, reported from the inside</p>
        <p className="gallery-count" aria-live={running ? "off" : "polite"}>
          <span className="sr-only">Story </span>
          <span>{pad(active + 1)}</span>
          <span className="gallery-line" aria-hidden="true">
            {!reduce && (
              <i
                key={active}
                style={{ "--dur": `${DURATION}ms` } as CSSProperties}
                data-run={running}
                onAnimationEnd={next}
              />
            )}
          </span>
          <span className="sr-only"> of </span>
          <span>{pad(SLIDES.length)}</span>
        </p>
        <div className="gallery-controls">
          <button type="button" aria-label="Previous story" onClick={previous}><ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" /></button>
          {!reduce && (
            <button type="button" aria-label={paused ? "Play the slideshow" : "Pause the slideshow"} onClick={() => setPaused((value) => !value)}>
              {paused ? <Play size={15} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={15} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          )}
          <button type="button" aria-label="Next story" onClick={next}><ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
