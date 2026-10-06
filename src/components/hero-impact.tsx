import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSiteText } from "@/lib/site-text";
import { EditableImage, T } from "./site-text";
import { CARDS } from "./hero-gallery";
import tourMaViePoster from "@/assets/hero/tour-ma-vie.webp";

// Impact grid hero (the default in the hero switcher): the Complex-style
// front. The lead is Doja Cat's Tour Ma Vie: a short note and a block CTA
// on the left, the tour poster standing full height on the right (on black,
// so it never looks squeezed) — and three doors (Newsletter, News, Shop)
// stand in a column beside it, like secondary covers. The doors keep their
// texts from the gallery hero, so edits carry across. Admins can change the
// words and the poster on the page. Entry: the pieces rise in sequence
// once, held still for reduced motion.

// Tour Ma Vie, North American leg: 1 Oct (Detroit) to 1 Dec 2026 (Madison
// Square Garden), 31 dates (Live for Live Music, mxdwn, Sept 2025)
const TOUR_URL = "https://dojacat.com";

const DOORS = CARDS.filter((card) => card.id === "subscribe" || card.id === "news" || card.id === "shop");

export function HeroImpact() {
  const site = useSiteText();

  return (
    <section className="impact" aria-labelledby="impact-title">
      <h1 id="impact-title" className="sr-only">OGCW, One Great Culture World</h1>

      {/* The huge OGCW behind the frame */}
      <span className="impact-watermark" aria-hidden="true">OGCW</span>

      <div className="impact-frame">
        {/* The lead: Tour Ma Vie, the note on the left and the poster on the right */}
        <article className="impact-lead impact-tour">
          <div className="impact-lead-body">
            <p className="impact-stamp"><T k="hero.tour.stamp">On tour now · Music</T></p>
            <h2 className="impact-lead-title"><T k="hero.tour.title">Tour Ma Vie</T></h2>
            <p className="impact-lead-deck"><T k="hero.tour.copy">Doja Cat takes her album Vie around the world. The North American leg opened in Detroit on 1 October and runs 31 nights, ending at Madison Square Garden in New York on 1 December.</T></p>
            <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className="impact-lead-cta">
              <T k="hero.tour.cta">Tour dates & tickets</T>
              <ArrowUpRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </a>
          </div>
          <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className="impact-poster" tabIndex={-1} aria-hidden="true">
            <EditableImage k="hero.tour.poster" className="impact-poster-img" src={tourMaViePoster} alt="The Tour Ma Vie poster: the title in red and white over a collage portrait, “concludes in NY city, 1 December”" loading="eager" draggable={false} width={1414} height={2000} />
          </a>
        </article>

        {/* The three doors beside it */}
        <div className="impact-doors">
          {DOORS.map((door) => {
            const inner = (
              <>
                <span className="impact-door-photo">
                  <img src={site.image(`hero.card.${door.id}`)?.src ?? door.photo} alt="" loading="lazy" />
                </span>
                <span className="impact-door-body">
                  <span className="impact-door-label"><T k={`hero.card.${door.id}.label`}>{door.label}</T></span>
                  <span className="impact-door-title"><T k={`hero.card.${door.id}.title`}>{door.title}</T></span>
                  <span className="impact-door-go"><T k={`hero.card.${door.id}.cta`}>{door.cta}</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></span>
                </span>
              </>
            );
            return "to" in door.dest ? (
              <Link key={door.id} to={door.dest.to} className="impact-door">{inner}</Link>
            ) : (
              <Link key={door.id} to="/" hash={door.dest.hash} className="impact-door">{inner}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
