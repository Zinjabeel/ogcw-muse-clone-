import { Link } from "@tanstack/react-router";
import { EPISODES, LIVE } from "@/data/content";
import { useSiteText } from "@/lib/site-text";
import { useStories } from "@/lib/stories";
import { EditableImage, S, T } from "./site-text";
import { CARDS } from "./hero-gallery";
import { Slideshow, type Slide } from "./hero-gallery-2";
import tourMaViePoster from "@/assets/hero/tour-ma-vie.webp";

// Impact grid hero (the default in the hero switcher), rebuilt 23 Oct 2026
// to look exactly like Gallery 2, the Complex-style hero (owner: "make the
// impact grid look exactly like the gallery 2 but 3 cards, the news, shop
// and Tour Ma Vie, beside each other, a clear line between them and some
// kind of shadow on them"; the newsletter card is gone). Then (owner, same
// day): each card turns through three slides, with Gallery 2's dots and
// controls ("3 cards per card"):
//   News   Today's news, then the first two top stories (chosen in the
//          studio: slot "hero-top", the same as Gallery 2's)
//   Shop   Jordan release dates, Featured drops, the OGCW Shop
//   Tours  Tour Ma Vie, BTS's Arirang World Tour, the latest OGCW Original
// Each card is the same Complex card as Gallery 2's (hero-gallery-2.tsx:
// the photo filling it, the shade, the headline, the summary, the outlined
// button, the dots and controls). The three turn 2 seconds apart, so they
// never all change at once. Thin light lines run between them, and the
// cards cast soft shadows onto them and onto the page below
// (src/styles/hero-impact.css). Every word and photo can be changed on the
// page by an admin; the earlier keys are kept, so earlier edits stay.

// Tour Ma Vie, North American leg: 1 Oct (Detroit) to 1 Dec 2026 (Madison
// Square Garden), 31 dates (Live for Live Music, mxdwn, Sept 2025)
const TOUR_URL = "https://dojacat.com";

const NEWS = CARDS.find((card) => card.id === "news")!;
const SHOP = CARDS.find((card) => card.id === "shop")!;
const ORIGINAL = EPISODES[0]!;

/** A slide's link to a page on the site */
const to = (path: "/news" | "/shop" | "/shop/drops" | "/shop/featured-drops" | "/tour/bts-arirang"): Slide["link"] =>
  ({ className, tabIndex, children }) => <Link to={path} className={className} tabIndex={tabIndex}>{children}</Link>;

export function HeroImpact() {
  const site = useSiteText();
  const stories = useStories();
  // The poster's own printed frame is cropped off, unless an admin has put another picture there
  const ownPoster = Boolean(site.image("hero.tour.poster"));

  // ---------------------------------------------------------------- News
  const news: Slide[] = [
    {
      key: "news",
      picture: <EditableImage k="hero.card.news" src={NEWS.photo} alt={NEWS.alt} loading="eager" draggable={false} />,
      title: <T k="hero.card.news.title">{NEWS.title}</T>,
      deck: <T k="hero.card.news.copy">{NEWS.copy}</T>,
      cta: <T k="hero.card.news.cta">{NEWS.cta}</T>,
      link: to("/news"),
    },
    ...stories.slot("hero-top").slice(0, 2).map((story): Slide => ({
      key: story.slug,
      picture: <img src={story.photo.src} alt="" loading="lazy" style={{ objectPosition: story.photo.crop?.pos ?? "50% 50%" }} />,
      title: <S story={story} f="title" />,
      deck: <S story={story} f="deck" />,
      cta: <T k="hero.top.cta">Read more</T>,
      link: ({ className, tabIndex, children }) => <Link to="/news/$slug" params={{ slug: story.slug }} className={className} tabIndex={tabIndex}>{children}</Link>,
    })),
  ];

  // ---------------------------------------------------------------- Shop
  const shop: Slide[] = [
    {
      key: "drops",
      picture: <EditableImage k="hero.impact.shop" src={SHOP.photo} alt={SHOP.alt} loading="eager" draggable={false} />,
      title: <><T k="hero.impact.shop.title">Jordan release dates: the Air Jor</T><T k="hero.impact.shop.title-fade">dan 1 High</T></>,
      deck: <T k="hero.impact.shop.copy">Every sneaker on the calendar, with a live countdown to the next drop: dates, colourways and where to find each pair.</T>,
      cta: <T k="hero.impact.shop.cta">See the drops</T>,
      link: to("/shop/drops"),
    },
    {
      key: "featured",
      picture: <EditableImage k="hero.impact.featured" src="/shop/looks/hero-sneaker.webp" alt="An Air Jordan 1 Low in white, blue, tan and black, floating against a blue wall" loading="lazy" draggable={false} />,
      title: <T k="hero.impact.featured.title">Featured drops</T>,
      deck: <T k="hero.impact.featured.copy">The collabs that matter: Travis Scott, Fragment, Awake NY, Denim Tears and more, with the next dates on the calendar.</T>,
      cta: <T k="hero.impact.featured.cta">See the collabs</T>,
      link: to("/shop/featured-drops"),
    },
    {
      key: "store",
      picture: <EditableImage k="hero.impact.store" src="/shop/looks/hero-store.webp" alt="A wall of sneakers on lit shelves behind a shop window, a passer-by blurred in front" loading="lazy" draggable={false} />,
      title: <T k="hero.card.shop.title">{SHOP.title}</T>,
      deck: <T k="hero.card.shop.copy">{SHOP.copy}</T>,
      cta: <T k="hero.card.shop.cta">{SHOP.cta}</T>,
      link: to("/shop"),
    },
  ];

  // ---------------------------------------------------------------- Tours and Originals
  const tours: Slide[] = [
    {
      key: "tour-ma-vie",
      picture: (
        <span className={`cxi-poster${ownPoster ? " is-own" : ""}`}>
          <EditableImage k="hero.tour.poster" src={tourMaViePoster} alt="The Tour Ma Vie poster: the title in red and white over a collage portrait, “concludes in NY city, 1 December”" loading="eager" draggable={false} width={1414} height={2000} />
        </span>
      ),
      title: <T k="hero.tour.title">Tour Ma Vie</T>,
      deck: <T k="hero.tour.copy">Doja Cat takes her album Vie around the world. The North American leg opened in Detroit on 1 October and runs 31 nights, ending at Madison Square Garden in New York on 1 December.</T>,
      cta: <T k="hero.tour.cta">Tour dates & tickets</T>,
      link: ({ className, tabIndex, children }) => <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className={className} tabIndex={tabIndex}>{children}</a>,
    },
    {
      key: "bts",
      picture: <EditableImage k="hero.impact.bts" src={LIVE.photo.src} alt={LIVE.photo.alt} loading="lazy" draggable={false} style={{ objectPosition: LIVE.photo.crop.pos }} />,
      title: <T k="hero.impact.bts.title">{LIVE.title}</T>,
      deck: <T k="hero.impact.bts.copy">Every date on BTS’s Arirang World Tour: 88 stadium shows in 34 cities, with venues, the setlist and what to know before you go.</T>,
      cta: <T k="hero.impact.bts.cta">See the dates</T>,
      link: to("/tour/bts-arirang"),
    },
    {
      key: "original",
      picture: <EditableImage k="hero.impact.original" src={ORIGINAL.still.src} alt={ORIGINAL.still.alt} loading="lazy" draggable={false} style={{ objectPosition: ORIGINAL.still.crop?.pos ?? "50% 50%" }} />,
      // A shorter headline than the episode's own, to fit the card (the interview: why he walked away, and why he is coming back)
      title: <T k="hero.impact.original.title">Kai Cenat on quitting streaming, and coming back</T>,
      deck: <T k="hero.impact.original.copy">{ORIGINAL.summary}</T>,
      cta: <T k="hero.impact.original.cta">Watch the interview</T>,
      link: ({ className, tabIndex, children }) => <Link to="/originals/$slug" params={{ slug: ORIGINAL.slug }} className={className} tabIndex={tabIndex}>{children}</Link>,
    },
  ];

  return (
    <section className="impact cxi" aria-labelledby="impact-title">
      <h1 id="impact-title" className="sr-only">OGCW, One Great Culture World</h1>
      <div className="cxi-grid">
        <Slideshow label="News" slides={news} />
        <Slideshow label="Shop" slides={shop} lead={2000} />
        <Slideshow label="Tours and Originals" slides={tours} lead={4000} />
      </div>
    </section>
  );
}
