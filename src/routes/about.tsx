import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { BsPhoto } from "../components/broadsheet";
import { EPISODES, SECTIONS, type Article, type Photo } from "../data/content";
import { TREND_TOPICS } from "../data/trends";
import { useStories, type Stories } from "../lib/stories";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";
import { S, T } from "@/components/site-text";
import { SOCIALS } from "@/components/socials";

// The About page (owner, 19 Oct 2026: "take inspiration from Moncler's In
// Moncler page and recreate it like that"). Its language, in OGCW's type and
// colours: full-screen photo chapters with a few words on them, calm
// off-white chapters laid out in three (title, picture, words), small quiet
// headings, uppercase text links with a chevron, and nothing that moves on
// scroll (the owner turned scroll effects down). Top to bottom: who we are;
// our position on a gold-washed photo; how we work; the desks (pick one and
// its picture changes, like Moncler's icons); the standard; join in; more
// from OGCW as four tall pictures; get in touch. Every story, number and
// photo credit is live.

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

// The full-screen photos (Unsplash)
const shot = (id: string, width = 2400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
const CROWD = { src: shot("photo-1501386761578-eac5c94b800a"), alt: "Fans with their hands up in front of a lit stage at a concert" };
const READER = { src: shot("photo-1495020689067-958852a7765e", 2000), alt: "" };
const SCREENS = { src: shot("photo-1542751371-adc38448a05e"), alt: "A gamer in headphones in front of glowing screens" };

/** An uppercase text link with a chevron, the page's one kind of link */
function More({ to, href, children, hash }: { to?: "/news" | "/forum" | "/originals" | "/trends" | "/explore" | "/tour/bts-arirang" | "/music" | "/games" | "/culture" | "/sports"; href?: string; hash?: string; children: ReactNode }) {
  const inner = <>{children}<ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" /></>;
  if (to) return <Link to={to} {...(hash ? { hash } : {})} className="ab-more">{inner}</Link>;
  const external = href?.startsWith("http");
  return <a href={href} className="ab-more" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>;
}

// ------------------------------------------------------------ 1. Who we are

function Hero() {
  return (
    <section className="ab-hero" aria-labelledby="about-title">
      <img className="ab-hero-img" src={CROWD.src} alt={CROWD.alt} fetchPriority="high" />
      <div className="ab-hero-text">
        <p className="ab-hero-kicker"><T k="intro.about-ogcw.kicker">About OGCW</T></p>
        <h1 id="about-title" className="ab-hero-title"><T k="intro.about-ogcw.title">We report from inside culture.</T></h1>
        <p className="ab-hero-copy"><T k="intro.about-ogcw.copy">OGCW is an independent editorial platform following the people, places and ideas shaping what comes next.</T></p>
        <More to="/news"><T k="about.cta.read">Read the latest</T></More>
      </div>
      <p className="ab-credit">Photo: Unsplash</p>
    </section>
  );
}

// ------------------------------------------------------------ 2. Our position (on a gold wash)

function Position() {
  return (
    <section className="ab-wash" aria-labelledby="position-title">
      <span className="ab-wash-photo" aria-hidden="true"><img src={READER.src} alt="" loading="lazy" /></span>
      <div className="ab-grid ab-wash-grid">
        <h2 id="position-title" className="ab-h2 ab-wash-title"><T k="about.statement">We pay attention before everyone else does.</T></h2>
        <p className="ab-wash-copy"><T k="about.copy">We cover style, sound, art and design without flattening them into trends. Our work values original reporting, strong images and the people who build scenes long before they become markets.</T></p>
      </div>
      <p className="ab-credit">Photo: Unsplash</p>
    </section>
  );
}

// ------------------------------------------------------------ 3. How we work (title, picture, words)

function HowWeWork({ story }: { story: Article | undefined }) {
  return (
    <section className="ab-paper ab-tri" aria-labelledby="how-title">
      <div className="ab-grid ab-tri-grid">
        <h2 id="how-title" className="ab-h2 ab-tri-title"><T k="about.how">How we work</T></h2>
        {story && (
          <figure className="ab-tri-figure">
            <Link to="/news/$slug" params={{ slug: story.slug }} className="ab-tri-photo-link" aria-label={story.title}>
              <BsPhoto photo={story.photo} className="ab-tri-photo" />
            </Link>
            <figcaption className="ab-caption"><S story={story} f="kicker" />{story.photo.credit && <> · Photo: {story.photo.credit}</>}</figcaption>
          </figure>
        )}
        <div className="ab-tri-text">
          <p className="ab-body"><T k="about.how.copy">Every story names where its news comes from, links its sources and credits its photos. Readers rate what they read, and when we get something wrong, we fix it and say so.</T></p>
          <More href="#standard"><T k="about.how.more">Our standard</T></More>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ 4. The desks (pick one, its picture changes)

type Desk = { id: string; name: string; to: "/music" | "/games" | "/culture" | "/sports"; intro: string; count: number; story: Article | undefined };

function deskList(live: Stories): Desk[] {
  const newest = (...ids: Article["section"][]) => live.all.filter((s) => ids.includes(s.section));
  const desk = (id: Article["section"], to: Desk["to"], extra: Article["section"][] = []): Desk => {
    const list = newest(id, ...extra);
    return { id, name: SECTIONS[id].label, to, intro: SECTIONS[id].intro, count: list.length, story: list[0] };
  };
  return [desk("music", "/music"), desk("games", "/games", ["streaming"]), desk("culture", "/culture"), desk("sports", "/sports")];
}

function Desks({ live }: { live: Stories }) {
  const desks = useMemo(() => deskList(live), [live]);
  const [on, setOn] = useState(0);
  const desk = desks[on]!;
  // Up/down (and left/right) arrows move between the desks
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (on + step + desks.length) % desks.length;
    setOn(next);
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
  };
  return (
    <section className="ab-desks" aria-labelledby="desks-title">
      {desk.story && <span className="ab-desks-bg" aria-hidden="true"><img key={desk.story.photo.src} src={desk.story.photo.src} alt="" loading="lazy" /></span>}
      <div className="ab-grid ab-desks-grid">
        <div className="ab-desks-nav">
          <h2 id="desks-title" className="ab-desks-heading"><T k="about.cover.title">What we cover</T></h2>
          <div className="ab-desks-list" role="tablist" aria-labelledby="desks-title" onKeyDown={onKey}>
            {desks.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`desk-tab-${item.id}`}
                aria-selected={index === on}
                aria-controls="desk-panel"
                tabIndex={index === on ? 0 : -1}
                className="ab-desks-tab"
                onClick={() => setOn(index)}
                onPointerEnter={(event) => { if (event.pointerType === "mouse") setOn(index); }}
              >
                <T>{item.name}</T>
              </button>
            ))}
          </div>
        </div>
        <div className="ab-desks-panel" role="tabpanel" id="desk-panel" aria-labelledby={`desk-tab-${desk.id}`}>
          {desk.story && (
            <Link to="/news/$slug" params={{ slug: desk.story.slug }} className="ab-desks-figure" key={desk.id} aria-label={desk.story.title}>
              <BsPhoto photo={desk.story.photo} className="ab-desks-photo" />
            </Link>
          )}
          <div className="ab-desks-text" key={`${desk.id}-text`}>
            <p className="ab-body"><T>{desk.intro}</T></p>
            <p className="ab-desks-meta">{desk.count} stories{desk.story && <> · Latest: <S story={desk.story} f="title" /></>}</p>
            <More to={desk.to}><T k="about.cover.go">Explore</T> <T>{desk.name}</T></More>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ 5. The standard

const STANDARD: { k?: string; title: string; copy: ReactNode }[] = [
  { k: "about.how.1", title: "Reported, not aggregated", copy: <T k="about.how.1.copy">We go to the shows, the studios and the rooms, and write about what we saw and who we met there.</T> },
  { title: "Sources on every story", copy: <T>Our stories end with links to where their facts come from, so you can check them yourself.</T> },
  { title: "Real names only", copy: <T>A story is credited to the company, label, league or publication the news comes from, or to OGCW for our own reporting and round-ups. Never a made-up name.</T> },
  { k: "about.how.2", title: "Every photo credited", copy: <><T>Photographers are named with their work and on our</T> <Link to="/info/$slug" params={{ slug: "credits" }}><T>photo credits</T></Link> page.</> },
  { title: "Labels that mean something", copy: <T>CERTIFIED is stamped by our editors, or earned with 4.5 stars from at least five readers. TRENDIEST marks our trending list; NEWEST the six most recent stories.</T> },
  { title: "Readers have a say", copy: <T>Every story ends with a question and a rating from 1 to 5 stars. The readers’ score shows once three people have rated it.</T> },
  { title: "Updated as it happens", copy: <T>A story that is still going carries the date of its latest update, and keeps the day it was first reported.</T> },
  { k: "about.how.3", title: "Corrections, openly", copy: <>Spotted a mistake? Email <a href={mail("Correction")}>{BUSINESS_EMAIL}</a> <T>and we’ll fix it and say so.</T></> },
];

function Standard() {
  return (
    <section className="ab-paper ab-standard" id="standard" aria-labelledby="standard-title">
      <div className="ab-grid ab-standard-grid">
        <h2 id="standard-title" className="ab-h2 ab-standard-title"><T k="about.standard.title">The OGCW standard</T></h2>
        <ul className="ab-rules">
          {STANDARD.map((rule) => (
            <li key={rule.title}>
              <h3 className="ab-rule-title">{rule.k ? <T k={rule.k}>{rule.title}</T> : <T>{rule.title}</T>}</h3>
              <p className="ab-rule-copy">{rule.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ 6. Join in (full screen)

function JoinIn() {
  return (
    <section className="ab-join" id="socials" aria-labelledby="join-title">
      <img className="ab-join-img" src={SCREENS.src} alt={SCREENS.alt} loading="lazy" />
      <div className="ab-grid ab-join-grid">
        <h2 id="join-title" className="ab-h2 ab-join-title"><T k="about.join.title">Join the conversation</T></h2>
        <div className="ab-join-text">
          <p className="ab-body"><T k="about.join.copy">Argue the rankings in the forum, get the biggest stories by email, and follow OGCW on social media.</T></p>
          <p className="ab-more-row">
            <More to="/forum"><T k="about.forum.open">Open the forum</T></More>
            <More href="/info/newsletter"><T k="about.join.newsletter">Newsletter</T></More>
          </p>
          <p className="ab-more-row" aria-label="Follow OGCW">
            {SOCIALS.map((social) => <More key={social.name} href={social.href}><T>{social.name}</T></More>)}
          </p>
        </div>
      </div>
      <p className="ab-credit">Photo: Unsplash</p>
    </section>
  );
}

// ------------------------------------------------------------ 7. More from OGCW (four tall pictures)

type Card = { label: string; to: "/originals" | "/trends" | "/tour/bts-arirang" | "/explore"; photo: Photo | undefined };

function MoreFromOgcw({ live, skip }: { live: Stories; skip: Set<string> }) {
  const cards = useMemo((): Card[] => {
    const used = new Set(skip);
    const free = (...candidates: (Article | undefined)[]) => {
      const story = candidates.find((s) => s && !used.has(s.photo.src));
      if (story) used.add(story.photo.src);
      return story?.photo;
    };
    return [
      { label: "Originals", to: "/originals", photo: EPISODES[0]?.still },
      { label: "The trend report", to: "/trends", photo: free(...TREND_TOPICS.map((t) => live.get(t.slug))) },
      { label: "BTS on tour", to: "/tour/bts-arirang", photo: free(live.get("bts-arirang-world-tour-latin-america"), ...live.inSection("music")) },
      { label: "Explore", to: "/explore", photo: free(...live.editorsPicks, ...live.trending, ...live.all) },
    ];
  }, [live, skip]);
  return (
    <section className="ab-paper ab-beyond" aria-labelledby="beyond-title">
      <div className="ab-grid ab-beyond-head">
        <h2 id="beyond-title" className="ab-h2"><T k="about.beyond.title">More from OGCW</T></h2>
        <div className="ab-beyond-text">
          <p className="ab-body"><T k="about.beyond.copy">Interviews and podcasts with the people in the news, the season’s trend report, a tour followed city by city, and everything else in one place.</T></p>
        </div>
      </div>
      <ul className="ab-cards">
        {cards.map((card) => (
          <li key={card.to}>
            <Link to={card.to} className="ab-card">
              {card.photo && <BsPhoto photo={card.photo} className="ab-card-photo" />}
              <span className="ab-card-label"><T>{card.label}</T><ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------ 8. Get in touch

const ENQUIRIES = ["Submit a story", "Music submissions", "Advertising", "Partnerships", "Press", "Correction"];

function Contact() {
  return (
    <section className="ab-paper ab-contact" aria-labelledby="contact-title">
      <div className="ab-grid ab-contact-grid">
        <h2 id="contact-title" className="ab-h2"><T k="about.contact.kicker">Get in touch</T></h2>
        <div className="ab-contact-text">
          <p className="ab-body"><T k="about.contact.title">One address for everything</T>. <T>Put one of these in the subject and it reaches the right person.</T></p>
          <p className="ab-contact-email"><a href={mail("General")}>{BUSINESS_EMAIL}</a></p>
          <p className="ab-more-row ab-more-grid">
            {ENQUIRIES.map((subject) => <More key={subject} href={mail(subject)}><T>{subject}</T></More>)}
          </p>
        </div>
      </div>
    </section>
  );
}

function About() {
  const live = useStories();
  const desks = useMemo(() => deskList(live), [live]);
  // How we work shows a recent story with a credited photo that isn't one of the desks' pictures
  const deskPhotos = useMemo(() => new Set(desks.flatMap((d) => (d.story ? [d.story.photo.src] : []))), [desks]);
  const howStory = useMemo(
    () => [...live.editorsPicks, ...live.trending, ...live.all].find((s) => s.photo.credit && !deskPhotos.has(s.photo.src)) ?? live.all[0],
    [live, deskPhotos],
  );
  const used = useMemo(() => new Set([...deskPhotos, ...(howStory ? [howStory.photo.src] : [])]), [deskPhotos, howStory]);
  return (
    <SiteShell>
      <main className="ab">
        <Hero />
        <Position />
        <HowWeWork story={howStory} />
        <Desks live={live} />
        <Standard />
        <JoinIn />
        <MoreFromOgcw live={live} skip={used} />
        <Contact />
      </main>
    </SiteShell>
  );
}
