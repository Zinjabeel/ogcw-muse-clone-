import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useStories } from "@/lib/stories";
import { CARDS, CardLink, type Card } from "./hero-gallery";
import { EditableImage, S, T } from "./site-text";
import { SlideControls, SlideDots, useSlides } from "./slide-controls";

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

export type Slide = { key: string; picture: ReactNode; title: ReactNode; deck: ReactNode; cta: ReactNode; link: (props: { className: string; tabIndex: number | undefined; children: ReactNode }) => ReactNode };

/**
 * One Complex card: a slideshow (with dots and controls), or a single slide
 * (none). Also used by the Impact grid (hero-impact.tsx). `lead` starts the
 * first slide's time part-way through, so cards side by side don't all turn
 * at the same moment.
 */
export function Slideshow({ label, slides, lead = 0 }: { label: string; slides: Slide[]; lead?: number }) {
  const show = useSlides(slides.length, { lead });
  const { index, count } = show;

  return (
    <section {...show.box} className="cxh-card" aria-roledescription="carousel" aria-label={label}>
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

      <SlideDots slides={show} label={label} />
      <SlideControls slides={show} />
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
        <Slideshow label="Explore OGCW" slides={doorSlides} lead={3000} />
      </div>
    </section>
  );
}
