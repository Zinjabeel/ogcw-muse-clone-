import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import centralCeePhoto from "../assets/central-cee.jpg";
import drakePhoto from "../assets/drake.jpg";
import vedanPhoto from "../assets/vedan.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";

// Home hero, set like a magazine cover rather than a carousel: one cover
// story in a large serif headline, the portrait dissolving into the black on
// the right, a faint stage-light glow and film grain for atmosphere, and an
// "Also on OGCW" rail along the bottom. Motion is kept natural: the headline
// is revealed line by line on load, and on scroll the photo drifts slower
// than the text (CSS scroll-driven animation where supported).
// TODO: the cover story and rail will come from the admin panel.

// TODO: fill in the real date, venue and ticket link once the concert is confirmed.
const DRAKE_TICKETS = "https://www.ticketmaster.com/search?q=drake";

type RailItem = { kicker: string; title: string; meta: string; image: string; pos: string; live?: boolean; slug?: string };

const rail: RailItem[] = [
  { kicker: "Live", title: "Drake, live in concert", meta: "Date TBA · Tickets", image: drakePhoto, pos: "50% 20%", live: true },
  { kicker: "New voices", title: "Vedan and the reach of regional rap", meta: "5 min read", image: vedanPhoto, pos: "50% 30%", slug: "vedan-and-the-reach-of-regional-rap" },
  { kicker: "Nightlife", title: "The listening bars changing nightlife", meta: "6 min read", image: musicHero, pos: "40% 40%", slug: "the-listening-bars-changing-nightlife" },
];

function RailEntry({ item, index }: { item: RailItem; index: number }) {
  const inner = (
    <>
      <span className="cover-rail-thumb"><img src={item.image} alt="" loading="lazy" style={{ objectPosition: item.pos }} /></span>
      <span className="cover-rail-text">
        <span className="cover-rail-kicker" data-live={item.live ? "" : undefined}>{String(index + 1).padStart(2, "0")} · {item.kicker}</span>
        <span className="cover-rail-title">{item.title}</span>
        <span className="cover-rail-meta">
          {item.meta}
          {item.live && <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />}
        </span>
      </span>
    </>
  );
  return item.live ? (
    <a className="cover-rail-item" href={DRAKE_TICKETS} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className="cover-rail-item" to="/news/$slug" params={{ slug: item.slug ?? "" }}>{inner}</Link>
  );
}

export function HeroCover() {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <section className="cover" aria-labelledby="cover-title">
      <div className="cover-glow" aria-hidden="true" />

      <figure className="cover-photo">
        <img src={centralCeePhoto} alt="Central Cee on stage in a monogrammed knit vest and a cap covered in flag patches" />
      </figure>
      <p className="cover-credit">Central Cee · Photo: 200izo, CC BY-SA 4.0</p>

      <div className="cover-inner">
        <div className="cover-top">
          <p>Welcome to One Great Culture World</p>
          <time suppressHydrationWarning>{today}</time>
        </div>

        <div className="cover-copy">
          <p className="cover-kicker">Cover story · Music</p>
          <h1 id="cover-title" className="cover-title">
            <span className="cover-line"><span>Central Cee and the</span></span>
            <span className="cover-line"><span>global <em>rise</em> of UK rap</span></span>
          </h1>
          <p className="cover-deck">From “Sprinter” to “Band4Band”, how the West London rapper carried British drill from the estate to the world stage.</p>
          <div className="cover-cta">
            <Link to="/news/$slug" params={{ slug: "central-cee-and-the-global-rise-of-uk-rap" }} className="cover-link">
              Read the cover story <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
            <span className="cover-meta">7 min read</span>
          </div>
        </div>

        <nav className="cover-rail" aria-label="Also on OGCW">
          <p className="cover-rail-label">Also on OGCW</p>
          <ol>
            {rail.map((item, index) => (
              <li key={item.title}><RailEntry item={item} index={index} /></li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
