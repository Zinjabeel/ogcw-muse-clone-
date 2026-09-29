import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { Img, SectionHead } from "../components/cards";
import { ARTICLES, articlesIn, EPISODES, SHOPS } from "../data/content";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — OGCW" },
      { name: "description", content: "Meet One Great Culture World, an independent publication documenting culture before it becomes content." },
      { property: "og:title", content: "About — OGCW" },
      { property: "og:description", content: "An independent publication documenting culture before it becomes content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

// What OGCW covers, with live counts from the content library
const DESKS = [
  { to: "/music", name: "Music", note: "Rap, rumba and live, from the artists moving it", count: `${articlesIn("music").length} stories` },
  { to: "/culture", name: "Culture", note: "Style, design, nightlife, architecture and print", count: `${articlesIn("culture").length} stories` },
  { to: "/originals", name: "Originals", note: "Our own interviews, reportage and short docs", count: `${EPISODES.length} episodes` },
  { to: "/shop", name: "Shop", note: "The pieces behind the stories, picked by our desk", count: `${SHOPS.length} shops` },
] as const;

// The writers, with the beats and stories they have filed
const WRITERS = [...new Set(ARTICLES.map((a) => a.author))].map((name) => {
  const stories = ARTICLES.filter((a) => a.author === name);
  return { name, stories, beats: [...new Set(stories.map((s) => s.kicker))].slice(0, 3) };
});

const ENQUIRIES = ["Submit a story", "Music submissions", "Advertising", "Press"];

function About() {
  return (
    <SiteShell>
      <PageIntro kicker="About OGCW" title="We report from inside culture." copy="OGCW is an independent editorial platform following the people, places and ideas shaping what comes next." />
      <main className="page-wrap pb-24">
        <section className="about-lead" aria-labelledby="our-position">
          <Img photo={{ src: editorialGrid, alt: "A DJ at the decks, a crowd on a city street, a brutalist building and a print studio" }} className="about-photo" eager />
          <div className="about-position">
            <p id="our-position" className="og-kicker">Our position</p>
            <p className="about-statement">We pay attention before everyone else does.</p>
            <p className="about-copy">We cover style, sound, art and design without flattening them into trends. Our work values original reporting, strong images and the people who build scenes long before they become markets.</p>
          </div>
        </section>

        <section className="og-block" aria-labelledby="what-we-cover">
          <SectionHead id="what-we-cover" title="What we cover" />
          <ul className="about-desks">
            {DESKS.map((desk) => (
              <li key={desk.to}>
                <Link to={desk.to} className="about-desk">
                  <span className="about-desk-name">{desk.name} <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" /></span>
                  <span className="about-desk-note">{desk.note}</span>
                  <span className="og-meta">{desk.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="og-block" aria-labelledby="the-desk">
          <SectionHead id="the-desk" title="The desk" />
          <ul className="og-grid-3">
            {WRITERS.map((writer) => (
              <li key={writer.name} className="about-writer">
                <p className="about-writer-name">{writer.name}</p>
                <p className="og-kicker">{writer.beats.join(" · ")}</p>
                <p className="og-meta">{writer.stories.length} stories · Latest:</p>
                <Link to="/news/$slug" params={{ slug: writer.stories[0]!.slug }} className="about-writer-latest">{writer.stories[0]!.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="og-block og-how" aria-labelledby="how-we-work">
          <h2 id="how-we-work" className="og-section-title">How we work</h2>
          <ol className="og-how-list">
            <li><span className="og-how-num">01</span><strong>Reported, not aggregated</strong><span>We go to the shows, the studios and the rooms, and write about what we saw and who we met there.</span></li>
            <li><span className="og-how-num">02</span><strong>Every photo credited</strong><span>Photographers are named with their work and on our <Link to="/info/$slug" params={{ slug: "credits" }}>photo credits</Link> page.</span></li>
            <li><span className="og-how-num">03</span><strong>Corrections, openly</strong><span>Spotted a mistake? Email <a href={mail("Correction")}>{BUSINESS_EMAIL}</a> and we’ll fix it and say so.</span></li>
          </ol>
        </section>

        <section className="og-block about-contact" aria-labelledby="get-in-touch">
          <SectionHead id="get-in-touch" title="Get in touch" />
          <p className="about-copy">One address for everything: <a href={mail("General")}>{BUSINESS_EMAIL}</a>. Put one of these in the subject and it reaches the right person.</p>
          <ul className="about-enquiries">
            {ENQUIRIES.map((subject) => <li key={subject}><a href={mail(subject)} className="og-chip">{subject}</a></li>)}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
