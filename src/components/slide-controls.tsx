import { useEffect, useState, type CSSProperties } from "react";
import { useSiteText } from "@/lib/site-text";

// The hero's slideshow controls (Complex's: a pause button ringed by the
// slide's time running out, and square back and next buttons), shared so
// every slideshow on the site works the same way: the Gallery 2 and Impact
// heroes (hero-gallery-2.tsx) and the Trends page's pictures (owner, 23 Oct
// 2026: "a slideshow arrow with a pause button exactly like the hero
// section, for all pictures in the whole page, and make the pictures fade").
// A slideshow runs only while on screen, keeps running under the mouse and
// after a click on its arrows (owner, 23 Oct 2026: "it keeps playing"),
// stops for someone moving through it with the keyboard and while an admin
// edits, and never runs for reduced motion. The look is
// in src/styles/hero-gallery-2.css (.cxh-controls); the photos cross-fade
// with .slide-fade (data-on="true" is the one showing).

export const SLIDE_MS = 6000;
const RING = 2 * Math.PI * 13;

export type Slides = ReturnType<typeof useSlides>;

/**
 * A slideshow's state. `lead` starts the first slide's time part-way
 * through, so slideshows side by side don't all turn at the same moment.
 * Put `box` on the element around it (its ref and pointer and focus events).
 */
export function useSlides(count: number, { lead = 0, ms = SLIDE_MS }: { lead?: number; ms?: number } = {}) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [moved, setMoved] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const { busy } = useSiteText();

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  // Only run while on screen (a hero is display: none unless chosen)
  useEffect(() => {
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(!!entry?.isIntersecting);
      // Hidden (another hero chosen): back to the first slide, so slideshows start apart again when shown
      if (entry && !entry.isIntersecting && entry.boundingClientRect.width === 0) {
        setIndex(0);
        setMoved(false);
      }
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  useEffect(() => { if (index >= count && count > 0) setIndex(0); }, [index, count]);

  const go = (step: number) => {
    setMoved(true);
    setIndex((value) => (((value + step) % count) + count) % count);
  };
  const show = (to: number) => {
    setMoved(true);
    setIndex(to);
  };
  const running = !paused && !hold && inView && !reduce && !busy && count > 1;
  const box = {
    ref: setEl,
    // Only keyboard focus holds it still (a mouse click on an arrow doesn't)
    onFocus: (event: { target: EventTarget }) => { if (event.target instanceof Element && event.target.matches(":focus-visible")) setHold(true); },
    onBlur: (event: { currentTarget: EventTarget & Element; relatedTarget: EventTarget | null }) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); },
  };
  return { index, count, go, show, running, paused, setPaused, reduce, moved, lead, ms, box };
}

/** The pause button with its ring, and back and next */
export function SlideControls({ slides, className = "" }: { slides: Slides; className?: string }) {
  const { index, count, go, running, paused, setPaused, reduce, moved, lead, ms } = slides;
  if (count < 2) return null;
  return (
    <div className={`cxh-controls ${className}`}>
      {!reduce && (
        <button type="button" className="cxh-pause" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((value) => !value)}>
          <svg width="32" height="32" viewBox="0 0 32 32" className="cxh-ring" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle
              key={index}
              cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray={RING}
              className="cxh-ring-time"
              data-run={running}
              style={{ "--ring": RING, "--dur": `${ms}ms`, ...(moved ? {} : { animationDelay: `-${lead}ms` }) } as CSSProperties}
              onAnimationEnd={() => go(1)}
            />
          </svg>
          {paused ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="white" aria-hidden="true"><path d="M1 0.6v10.8a.6.6 0 0 0 .9.5l8.6-5.4a.6.6 0 0 0 0-1L1.9.1A.6.6 0 0 0 1 .6Z" /></svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="white" aria-hidden="true"><rect x="0" y="0" width="3.5" height="12" rx="1" /><rect x="6.5" y="0" width="3.5" height="12" rx="1" /></svg>
          )}
        </button>
      )}
      <button type="button" className="cxh-arrow" aria-label="Previous slide" onClick={() => go(-1)}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" className="cxh-arrow" aria-label="Next slide" onClick={() => go(1)}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 5L12.5 10L7.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

/** The dots under a slideshow */
export function SlideDots({ slides, label, className = "" }: { slides: Slides; label: string; className?: string }) {
  if (slides.count < 2) return null;
  return (
    <div className={`cxh-dots ${className}`} role="group" aria-label={`${label}: choose a slide`}>
      {Array.from({ length: slides.count }, (_, i) => (
        <button key={i} type="button" className="cxh-dot" data-on={i === slides.index} aria-label={`Go to slide ${i + 1}`} aria-current={i === slides.index ? "true" : undefined} onClick={() => slides.show(i)} />
      ))}
    </div>
  );
}
