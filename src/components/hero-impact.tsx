import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/data/content";
import { CARDS } from "./hero-gallery";
import { EditableImage, S, T } from "./site-text";
import { useSiteText } from "@/lib/site-text";

// Impact grid hero: the Complex-style front. One lead story fills most of
// the frame — its photo, a "Featured story" stamp, a very large headline,
// one line of copy and a block CTA — and three doors (Newsletter, News,
// Shop) stand in a column beside it, like secondary covers. A huge OGCW
// watermark sits faintly behind the frame. The lead story is chosen in the
// studio (the same pool as the cover hero); the doors keep their texts from
// the gallery hero, so edits carry across. Entry: the frame's pieces rise
// in sequence once; held still for reduced motion.

const DOORS = CARDS.filter((card) => card.id === "subscribe" || card.id === "news" || card.id === "shop");

export function HeroImpact() {
  const section = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const site = useSiteText();

  // Only run the entrance when the hero is on screen (it is display: none
  // while another hero is chosen)
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stories = useStories();
  const pool = stories.slot("hero-cover");
  const lead = pool[0] ?? stories.latest[0] ?? stories.all[0];
  if (!lead) return null;
  const deck = site.story(lead.slug, "deck") ?? lead.deck;

  return (
    <section ref={section} className={`impact${inView ? " is-in" : ""}`} aria-labelledby="impact-title">
      <h1 id="impact-title" className="sr-only">OGCW, One Great Culture World</h1>

      {/* The huge OGCW behind the frame */}
      <span className="impact-watermark" aria-hidden="true">OGCW</span>

      <div className="impact-frame">
        {/* The lead story */}
        <article className="impact-lead">
          <Link to="/news/$slug" params={{ slug: lead.slug }} className="impact-lead-photo">
            <EditableImage k={`hero.impact.lead`} src={lead.photo.src} alt={lead.photo.alt} loading="eager" draggable={false} style={{ objectPosition: lead.photo.crop?.pos ?? "50% 40%" }} />
          </Link>
          <div className="impact-lead-body">
            <p className="impact-stamp"><T k="hero.impact.stamp">Featured story</T> · <T>{SECTIONS[lead.section].label}</T></p>
            <h2 className="impact-lead-title"><S story={lead} f="title" /></h2>
            <p className="impact-lead-deck"><S story={lead} f="deck">{deck}</S></p>
            <Link to="/news/$slug" params={{ slug: lead.slug }} className="impact-lead-cta">
              <T k="hero.impact.cta">Read the story</T>
              <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
          {lead.photo.credit && <p className="impact-credit">Photo: {lead.photo.credit}</p>}
        </article>

        {/* The three doors beside it */}
        <div className="impact-doors">
          {DOORS.map((door) => (
            <Link
              key={door.id}
              to={"to" in door.dest ? door.dest.to : "/"}
              hash={"hash" in door.dest ? door.dest.hash : undefined}
              className="impact-door"
            >
              <span className="impact-door-photo">
                <img src={site.image(`hero.card.${door.id}`)?.src ?? door.photo} alt="" loading="lazy" />
              </span>
              <span className="impact-door-body">
                <span className="impact-door-label"><T k={`hero.card.${door.id}.label`}>{door.label}</T></span>
                <span className="impact-door-title"><T k={`hero.card.${door.id}.title`}>{door.title}</T></span>
                <span className="impact-door-go"><T k={`hero.card.${door.id}.cta`}>{door.cta}</T> <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
