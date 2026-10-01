import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { Img, SectionHead } from "../components/cards";
import { EPISODES, SHOPS, type Article, type SectionId } from "../data/content";
import { useStories } from "../lib/stories";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// What OGCW covers, in four photos: live music, the news, games and style
const shot = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&h=800&q=80`;
const COLLAGE = [
  { src: shot("photo-1501386761578-eac5c94b800a"), alt: "Fans singing along at the front of a concert" },
  { src: shot("photo-1495020689067-958852a7765e"), alt: "A man reading a newspaper on a bench" },
  { src: shot("photo-1542751371-adc38448a05e"), alt: "A gamer in headphones in front of glowing screens" },
  { src: shot("photo-1552346154-21d32810aba3"), alt: "A pair of Air Jordan 1 sneakers on a running track" },
];

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

// What OGCW covers, with live counts of the stories
const deskList = (inSection: (id: SectionId) => Article[]) => [
  { to: "/music", name: "Music", note: "New releases, tours and the big awards nights", count: `${inSection("music").length} stories` },
  { to: "/games", name: "Games", note: "Launches, sales and the showcases ahead", count: `${inSection("games").length} stories` },
  { to: "/streaming", name: "Streaming", note: "The creators and records on Twitch, YouTube and Kick", count: `${inSection("streaming").length} stories` },
  { to: "/culture", name: "Culture", note: "Fashion, television and sneakers", count: `${inSection("culture").length} stories` },
  { to: "/originals", name: "Originals", note: "Our own interviews, reportage and short docs", count: `${EPISODES.length} episodes` },
  { to: "/shop", name: "Shop", note: "The pieces behind the stories, picked by our desk", count: `${SHOPS.length} shops` },
] as const;

// The writers, with the beats and stories they have filed
const writerList = (all: Article[]) => [...new Set(all.map((a) => a.author))].map((name) => {
  const stories = all.filter((a) => a.author === name);
  return { name, stories, beats: [...new Set(stories.map((s) => s.kicker))].slice(0, 3) };
});

const ENQUIRIES = ["Submit a story", "Music submissions", "Advertising", "Press"];

function About() {
  const live = useStories();
  const DESKS = deskList(live.inSection);
  const WRITERS = writerList(live.all);
  return (
    <SiteShell>
      <PageIntro kicker="About OGCW" title="We report from inside culture." copy="OGCW is an independent editorial platform following the people, places and ideas shaping what comes next." />
      <main className="page-wrap pb-24">
        <section className="about-lead" aria-labelledby="our-position">
          <div className="about-collage">
            {COLLAGE.map((photo) => <Img key={photo.src} photo={photo} className="about-collage-photo" eager />)}
          </div>
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
