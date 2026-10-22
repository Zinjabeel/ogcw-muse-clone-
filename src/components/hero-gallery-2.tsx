import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useStories } from "@/lib/stories";
import { CARDS, CardLink, type Card } from "./hero-gallery";
import { EditableImage, S, T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// Gallery 2, rebuilt 22 Oct 2026 as Complex's front-page hero (owner: "an
// exact copy of the Complex hero, 2 cards that are big with images, the
// design and look 100% the same"), measured from complex.com at 1440px:
// each card is a Complex hero slide: the photo filling it, a shade rising
// from the foot (black 85% → 50% at 35% → 10% at 60% → clear at 80%), the
// headline in Inter 44/52 semibold at -1px, the summary in Inter 14/18 at
// 75% white, 16px apart, and 28px under them an outlined button (44px tall,
// 1px white border, 4px corners, 12px bold capitals). The words sit 68px from
// the left and 80px from the right and the foot; the dots (8px, 8px apart,
// white and half-white) sit centred 28px from the foot; the controls (a
// pause button ringed by the slide's time running out, and square back and
// next buttons with a 30% white border) 16px from the foot and 80px from
// the right. Slides cross-fade in 500ms.
// Complex shows one such slideshow across the page; here there are two,
// side by side: the top stories on the left (chosen in the studio, slot
// "hero-top"), OGCW's own doors on the right (Shop, Newsletter, Forum,
// About). Each runs on its own and stops under the pointer, on focus, off
// screen and while an admin edits; nothing runs for reduced motion.

const SLIDE_MS = 6000;
const RING = 2 * Math.PI * 13;

type Slide = { key: string; picture: ReactNode; title: ReactNode; deck: ReactNode; cta: ReactNode; link: (props: { className: string; tabIndex: number | undefined; children: ReactNode }) => ReactNode };

function Slideshow({ label, slides }: { label: string; slides: Slide[] }) {
  const box = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
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
  // Only run while on screen (the hero is display: none unless chosen)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (index >= slides.length) setIndex(0); }, [index, slides.length]);

  const count = slides.length;
  const go = (step: number) => setIndex((value) => (((value + step) % count) + count) % count);
  const running = !paused && !hold && inView && !reduce && !busy && count > 1;

  return (
    <section
      ref={box}
      className="cxh-card"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHold(true); }}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHold(false); }}
    >
      {/* The photos, cross-fading */}
      {slides.map((slide, i) => (
        <div key={`p-${slide.key}`} className="cxh-photo" data-on={i === index} aria-hidden="true">{slide.picture}</div>
      ))}
      <div className="cxh-shade" aria-hidden="true" />

      {/* The words */}
      {slides.map((slide, i) => {
        const on = i === index;
        return (
          <div key={slide.key} className="cxh-slide" data-on={on} aria-hidden={!on} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
            <div className="cxh-content">
              <div className="cxh-words">
                <div className="cxh-text">
                  <h2 className="cxh-title">{slide.link({ className: "cxh-title-link", tabIndex: on ? undefined : -1, children: slide.title })}</h2>
                  <p className="cxh-deck">{slide.deck}</p>
                </div>
                <div className="cxh-action">{slide.link({ className: "cxh-btn", tabIndex: on ? undefined : -1, children: slide.cta })}</div>
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="cxh-dots" role="group" aria-label={`${label}: choose a slide`}>
            {slides.map((slide, i) => (
              <button key={slide.key} type="button" className="cxh-dot" data-on={i === index} aria-label={`Go to slide ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)} />
            ))}
          </div>
          <div className="cxh-controls">
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
                    style={{ "--ring": RING, "--dur": `${SLIDE_MS}ms` } as CSSProperties}
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
        </>
      )}
    </section>
  );
}

// The doors on the right, in this order: the shop first (Complex leads with its shop too)
const DOORS = ["shop", "subscribe", "blog", "about"].map((id) => CARDS.find((card) => card.id === id)).filter((card): card is Card => !!card);

export function HeroGallery2() {
  const stories = useStories();
  const top = stories.slot("hero-top");

  const storySlides: Slide[] = top.map((story) => ({
    key: story.slug,
    picture: <img src={story.photo.src} alt="" loading="lazy" style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} />,
    title: <S story={story} f="title" />,
    deck: <S story={story} f="deck" />,
    cta: <T k="hero.top.cta">Read more</T>,
    link: ({ className, tabIndex, children }) => <Link to="/news/$slug" params={{ slug: story.slug }} className={className} tabIndex={tabIndex}>{children}</Link>,
  }));

  const doorSlides: Slide[] = DOORS.map((card) => ({
    key: card.id,
    picture: <EditableImage k={`hero.card.${card.id}`} src={card.photo} alt={card.alt} loading="lazy" draggable={false} />,
    title: <T k={`hero.card.${card.id}.title`}>{card.title}</T>,
    deck: <T k={`hero.card.${card.id}.copy`}>{card.copy}</T>,
    cta: <T k={`hero.card.${card.id}.cta`}>{card.cta}</T>,
    link: ({ className, tabIndex, children }) => <CardLink dest={card.dest} className={className} tabIndex={tabIndex} onClick={() => {}}>{children}</CardLink>,
  }));

  return (
    <section className="gallery2 cxh" aria-labelledby="g2-title">
      <h1 id="g2-title" className="sr-only"><T>OGCW, One Great Culture World</T></h1>
      <div className="cxh-grid">
        {storySlides.length > 0 && <Slideshow label="Top stories" slides={storySlides} />}
        <Slideshow label="Explore OGCW" slides={doorSlides} />
      </div>
    </section>
  );
}
