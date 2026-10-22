import { Link } from "@tanstack/react-router";
import { useSiteText } from "@/lib/site-text";
import { EditableImage, T } from "./site-text";
import { CARDS } from "./hero-gallery";
import { Slideshow, type Slide } from "./hero-gallery-2";
import tourMaViePoster from "@/assets/hero/tour-ma-vie.webp";

// Impact grid hero (the default in the hero switcher), rebuilt 23 Oct 2026
// to look exactly like Gallery 2, the Complex-style hero (owner: "make the
// impact grid look exactly like the gallery 2 but 3 cards, the news, shop
// and Tour Ma Vie, beside each other, a clear line between them and some
// kind of shadow on them"; the newsletter card is gone). Each card is the
// same Complex card as Gallery 2's (hero-gallery-2.tsx: the photo filling
// it, the shade, the headline, the summary, the outlined button), with one
// slide, so no dots or controls. Thin light lines run between the three, and
// the cards cast soft shadows onto them and onto the page below
// (src/styles/hero-impact.css). Every word and photo keeps its earlier key,
// so an admin's edits stay.

// Tour Ma Vie, North American leg: 1 Oct (Detroit) to 1 Dec 2026 (Madison
// Square Garden), 31 dates (Live for Live Music, mxdwn, Sept 2025)
const TOUR_URL = "https://dojacat.com";

const NEWS = CARDS.find((card) => card.id === "news")!;
const SHOP = CARDS.find((card) => card.id === "shop")!;

export function HeroImpact() {
  const site = useSiteText();
  // The poster's own printed frame is cropped off, unless an admin has put another picture there
  const ownPoster = Boolean(site.image("hero.tour.poster"));

  const news: Slide = {
    key: "news",
    picture: <EditableImage k="hero.card.news" src={NEWS.photo} alt={NEWS.alt} loading="eager" draggable={false} />,
    title: <T k="hero.card.news.title">{NEWS.title}</T>,
    deck: <T k="hero.card.news.copy">{NEWS.copy}</T>,
    cta: <T k="hero.card.news.cta">{NEWS.cta}</T>,
    link: ({ className, tabIndex, children }) => <Link to="/news" className={className} tabIndex={tabIndex}>{children}</Link>,
  };
  const shop: Slide = {
    key: "shop",
    picture: <EditableImage k="hero.impact.shop" src={SHOP.photo} alt={SHOP.alt} loading="eager" draggable={false} />,
    title: <><T k="hero.impact.shop.title">Jordan release dates: the Air Jor</T><T k="hero.impact.shop.title-fade">dan 1 High</T></>,
    deck: <T k="hero.impact.shop.copy">Every sneaker on the calendar, with a live countdown to the next drop: dates, colourways and where to find each pair.</T>,
    cta: <T k="hero.impact.shop.cta">See the drops</T>,
    link: ({ className, tabIndex, children }) => <Link to="/shop/drops" className={className} tabIndex={tabIndex}>{children}</Link>,
  };
  const tour: Slide = {
    key: "tour",
    picture: (
      <span className={`cxi-poster${ownPoster ? " is-own" : ""}`}>
        <EditableImage k="hero.tour.poster" src={tourMaViePoster} alt="The Tour Ma Vie poster: the title in red and white over a collage portrait, “concludes in NY city, 1 December”" loading="eager" draggable={false} width={1414} height={2000} />
      </span>
    ),
    title: <T k="hero.tour.title">Tour Ma Vie</T>,
    deck: <T k="hero.tour.copy">Doja Cat takes her album Vie around the world. The North American leg opened in Detroit on 1 October and runs 31 nights, ending at Madison Square Garden in New York on 1 December.</T>,
    cta: <T k="hero.tour.cta">Tour dates & tickets</T>,
    link: ({ className, tabIndex, children }) => <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className={className} tabIndex={tabIndex}>{children}</a>,
  };

  return (
    <section className="impact cxi" aria-labelledby="impact-title">
      <h1 id="impact-title" className="sr-only">OGCW, One Great Culture World</h1>
      <div className="cxi-grid">
        <Slideshow label="News" slides={[news]} />
        <Slideshow label="Shop" slides={[shop]} />
        <Slideshow label="Tour Ma Vie" slides={[tour]} />
      </div>
    </section>
  );
}
