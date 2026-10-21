import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSiteText } from "@/lib/site-text";
import { EditableImage, T } from "./site-text";
import { CARDS } from "./hero-gallery";
import tourMaViePoster from "@/assets/hero/tour-ma-vie.webp";
import newsletterImage from "@/assets/hero/ogcw-newsletter.webp";

// Impact grid hero (the default in the hero switcher), rebuilt 21 Oct 2026
// after Complex and Moncler (owner: "simple, effective… colours, pictures
// and text all look actually good"). Complex's front: one big lead and a
// mosaic of covers beside it. Moncler's finish: the pictures run edge to
// edge with hairline seams and no frames, the words never sit on a picture
// (they sit on black beside or under it), few of them, in small spaced
// capitals, a serif headline and thin underlined links.
//  - The lead: Doja Cat's Tour Ma Vie. The poster's artwork stands the full
//    height on the right (its own printed frame cropped off), the words on
//    black to its left.
//  - Beside it: the OGCW newsletter campaign picture, wide, and under it two
//    smaller covers, News and Shop (release dates).
// Every word and picture can still be changed on the page by an admin (the
// same keys as before). Nothing moves on scroll; the pictures fade in once
// and push in slowly under the pointer.

// Tour Ma Vie, North American leg: 1 Oct (Detroit) to 1 Dec 2026 (Madison
// Square Garden), 31 dates (Live for Live Music, mxdwn, Sept 2025)
const TOUR_URL = "https://dojacat.com";

const NEWS = CARDS.find((card) => card.id === "news")!;
const SHOP = CARDS.find((card) => card.id === "shop")!;

/** A cover: its picture, then its words on black under it, the whole thing one link */
function Door({ k, photo, alt, label, title, fade, cta, to, hash, wide = false }: {
  k: string; photo: string; alt: string; label: string; title: string; fade?: string; cta: string; to: "/news" | "/shop/drops" | "/"; hash?: string; wide?: boolean;
}) {
  const body = (
    <>
      <span className="imx-door-photo">
        <EditableImage k={k} src={photo} alt={alt} loading="eager" draggable={false} />
      </span>
      <span className="imx-door-words">
        <span className="imx-label"><T k={`${k}.label`}>{label}</T></span>
        <span className="imx-door-title"><T k={`${k}.title`}>{title}</T>{fade && <span className="imx-door-fade"><T k={`${k}.title-fade`}>{fade}</T></span>}</span>
        <span className="imx-link"><T k={`${k}.cta`}>{cta}</T> <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></span>
      </span>
    </>
  );
  const className = `imx-door${wide ? " imx-door-wide" : ""}`;
  return hash ? <Link to="/" hash={hash} className={className}>{body}</Link> : <Link to={to} className={className}>{body}</Link>;
}

export function HeroImpact() {
  const site = useSiteText();
  // The poster's own printed frame is cropped off, unless an admin has put another picture there
  const ownPoster = Boolean(site.image("hero.tour.poster"));

  return (
    <section className="impact imx" aria-labelledby="impact-title">
      <h1 id="impact-title" className="sr-only">OGCW, One Great Culture World</h1>

      <div className="imx-grid">
        {/* The lead: Tour Ma Vie */}
        <article className="imx-lead">
          <div className="imx-lead-words">
            <p className="imx-label imx-lead-label"><T k="hero.tour.stamp">On tour now · Music</T></p>
            <div className="imx-lead-foot">
              <h2 className="imx-lead-title"><T k="hero.tour.title">Tour Ma Vie</T></h2>
              <p className="imx-lead-deck"><T k="hero.tour.copy">Doja Cat takes her album Vie around the world. The North American leg opened in Detroit on 1 October and runs 31 nights, ending at Madison Square Garden in New York on 1 December.</T></p>
              <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className="imx-link imx-lead-link">
                <T k="hero.tour.cta">Tour dates & tickets</T>
                <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </div>
          <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className={`imx-poster${ownPoster ? " is-own" : ""}`} tabIndex={-1} aria-hidden="true">
            <EditableImage k="hero.tour.poster" className="imx-poster-img" src={tourMaViePoster} alt="The Tour Ma Vie poster: the title in red and white over a collage portrait, “concludes in NY city, 1 December”" loading="eager" draggable={false} width={1414} height={2000} />
          </a>
        </article>

        {/* Beside it: the newsletter wide, News and Shop under it */}
        <div className="imx-doors">
          <Door
            k="hero.impact.subscribe"
            photo={newsletterImage}
            alt="The OGCW newsletter campaign: a woman in red sunglasses biting a gold-ringed finger, OGCW across the top"
            label="Newsletter"
            title="The week in culture, straight to your inbox"
            cta="Sign up free"
            to="/"
            hash="newsletter-title"
            wide
          />
          <Door k="hero.card.news" photo={NEWS.photo} alt={NEWS.alt} label={NEWS.label} title={NEWS.title} cta={NEWS.cta} to="/news" />
          <Door k="hero.impact.shop" photo={SHOP.photo} alt={SHOP.alt} label="Shop · Release dates" title="Jordan release dates: the Air Jor" fade="dan 1 High" cta="See the drops" to="/shop/drops" />
        </div>
      </div>
    </section>
  );
}
