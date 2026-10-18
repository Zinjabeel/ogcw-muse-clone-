import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Plus, Star } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { SiteShell } from "../components/ogcw-layout";
import { BsPhoto } from "../components/broadsheet";
import { SECTION_PATH } from "../components/cards";
import { EPISODES, SECTIONS, SECTION_IDS, SHOPS, type Article, type Photo } from "../data/content";
import { useStories, type Stories } from "../lib/stories";
import { ROOMS } from "../lib/forum";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";
import { S, T } from "@/components/site-text";
import { SOCIALS, SocialIcon } from "@/components/socials";
import { NewsletterForm } from "@/components/connect-section";
import { LabelBadge, StoryDate } from "@/components/story-meta";

// The About page (owner, 18 Oct 2026: "not just a little text and pictures,
// take inspiration from other websites and make it better"). Built in the
// front page's bands, top to bottom: who we are, with the newest story from
// each desk and the site in numbers; our position and the standard every
// story is held to; the anatomy of a real OGCW story; what we cover; where
// the news comes from; the community (socials, newsletter, forum); questions;
// and how to reach us. Every number, photo and name is live from the stories.

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

type Tone = "light" | "dark" | "grey" | "gold";
const pad = (n: number) => String(n).padStart(2, "0");
const num = (n: number) => n.toLocaleString("en-GB");

function Band({ tone, id, className = "", children }: { tone: Tone; id: string; className?: string; children: ReactNode }) {
  return (
    <section className={`fx-band ab-band ${className}`} data-band={tone} aria-labelledby={`${id}-title`} id={id}>
      <div className="fx-wrap">{children}</div>
    </section>
  );
}

function Head({ id, k, kicker, title, children }: { id: string; k: string; kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="fx-head">
      <div>
        <p className="fx-kicker"><T k={`${k}.kicker`}>{kicker}</T></p>
        <h2 id={`${id}-title`} className="fx-title"><T k={`${k}.title`}>{title}</T></h2>
      </div>
      {children}
    </header>
  );
}

// ------------------------------------------------------------ Who we are

/** The site in numbers, counted from the stories themselves */
function numbers(live: Stories) {
  const words = live.all.reduce((sum, story) => sum + story.words, 0);
  const links = new Set(live.all.flatMap((story) => story.sources.map((source) => source.url))).size;
  return [
    { value: live.all.length, label: "Stories published" },
    { value: words, label: "Words of reporting" },
    { value: links, label: "Sources linked" },
    { value: EPISODES.length, label: "Originals episodes" },
    { value: ROOMS.length, label: "Forum rooms" },
  ];
}

/** The newest story from each desk, newest first (the photos at the top) */
const deskLeads = (live: Stories) => SECTION_IDS.flatMap((id) => live.inSection(id)[0] ?? []).sort((a, b) => b.date.localeCompare(a.date));

function Hero({ live, newest }: { live: Stories; newest: Article[] }) {
  return (
    <section className="fx-band ab-band ab-hero" data-band="dark" aria-labelledby="about-title">
      <div className="fx-wrap">
        <div className="ab-hero-grid">
          <div className="ab-hero-text">
            <p className="fx-kicker"><T k="intro.about-ogcw.kicker">About OGCW</T></p>
            <h1 id="about-title" className="ab-hero-title"><T k="intro.about-ogcw.title">We report from inside culture.</T></h1>
            <p className="ab-hero-copy"><T k="intro.about-ogcw.copy">OGCW is an independent editorial platform following the people, places and ideas shaping what comes next.</T></p>
            <div className="ab-hero-ctas">
              <Link to="/news" className="fx-btn"><T k="about.cta.read">Read the latest</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
              <a href="#socials" className="fx-btn fx-btn-ghost"><T k="about.cta.follow">Follow OGCW</T></a>
            </div>
          </div>
          <ul className="ab-mosaic" aria-label="The newest story from each desk">
            {newest.map((story, index) => (
              <li key={story.slug}>
                <Link to="/news/$slug" params={{ slug: story.slug }} className="ab-mosaic-tile">
                  <BsPhoto photo={story.photo} className="ab-mosaic-photo" eager={index < 2} />
                  <span className="ab-mosaic-text">
                    <span className="ab-mosaic-desk"><T>{SECTIONS[story.section].label}</T></span>
                    <span className="ab-mosaic-title"><S story={story} f="title" /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <dl className="ab-numbers">
          {numbers(live).map((item) => (
            <div key={item.label}>
              <dt><T>{item.label}</T></dt>
              <dd>{num(item.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ Our position + the standard

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

function Position() {
  return (
    <Band tone="light" id="position">
      <div className="ab-position">
        <p id="position-title" className="fx-kicker"><T k="about.position">Our position</T></p>
        <div>
          <p className="ab-statement"><T k="about.statement">We pay attention before everyone else does.</T></p>
          <p className="ab-lede"><T k="about.copy">We cover style, sound, art and design without flattening them into trends. Our work values original reporting, strong images and the people who build scenes long before they become markets.</T></p>
        </div>
      </div>

      <div className="ab-standard">
        <Head id="standard" k="about.standard" kicker="How we work" title="The OGCW standard" />
        <ol className="ab-rules">
          {STANDARD.map((rule, index) => (
            <li key={rule.title}>
              <span className="ab-rule-no" aria-hidden="true">{pad(index + 1)}</span>
              <strong className="ab-rule-title">{rule.k ? <T k={rule.k}>{rule.title}</T> : <T>{rule.title}</T>}</strong>
              <span className="ab-rule-copy">{rule.copy}</span>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Anatomy of a story

const PARTS = [
  { title: "The label", copy: "CERTIFIED, TRENDIEST or NEWEST, when a story has earned one." },
  { title: "Headline and deck", copy: "The headline says what happened; the line under it fills in the detail." },
  { title: "The source", copy: "Where the news comes from, or OGCW for our own reporting." },
  { title: "The date", copy: "The day it happened, or the latest update on a story that is still going." },
  { title: "The photo credit", copy: "The photographer, agency or archive behind the picture." },
  { title: "Your rating", copy: "One to five stars and a yes or no question at the end of every story." },
  { title: "The sources", copy: "The links behind the facts, so you can check them yourself." },
];

/** A question readers can answer with the Yes and No buttons */
const YES_NO = /^(Are|Is|Was|Were|Will|Would|Do|Does|Did|Can|Could|Should|Has|Have)\b/;

function Pin({ n }: { n: number }) {
  return <span className="ab-pin" aria-hidden="true">{n}</span>;
}

function Anatomy({ live, skip }: { live: Stories; skip: Set<string> }) {
  const [on, setOn] = useState(0);
  // A real, recent story that shows every part (a label, a credited photo,
  // sources), and isn't one of the photos at the top of the page
  const story = useMemo(
    () => live.all.find((s) => !skip.has(s.slug) && live.label(s) && s.photo.credit && s.sources.length >= 2 && (!s.ask || YES_NO.test(s.ask))) ?? live.all[0],
    [live, skip],
  );
  if (!story) return null;
  const part = (n: number) => ({ className: "ab-part", "data-on": on === n || undefined, onPointerEnter: () => setOn(n), onPointerLeave: () => setOn(0) });
  return (
    <Band tone="grey" id="anatomy">
      <Head id="anatomy" k="about.anatomy" kicker="Inside a story" title="Anatomy of an OGCW story">
        <Link to="/news/$slug" params={{ slug: story.slug }} className="fx-more"><T k="about.anatomy.open">Read this story</T> <ArrowRight size={15} aria-hidden="true" /></Link>
      </Head>
      <div className="ab-anatomy">
        <figure className="ab-paper" aria-label="A story from OGCW, with its parts numbered">
          <div {...part(1)}><Pin n={1} /><p className="ab-paper-kicker"><LabelBadge label={live.label(story)} /> <S story={story} f="kicker" /></p></div>
          <div {...part(2)}><Pin n={2} />
            <p className="ab-paper-title"><S story={story} f="title" /></p>
            <p className="ab-paper-deck"><S story={story} f="deck" /></p>
          </div>
          <div className="ab-paper-byline">
            <div {...part(3)}><Pin n={3} /><span>{story.credit === "OGCW" ? "By" : "Source:"} <strong>{story.credit}</strong></span></div>
            <div {...part(4)}><Pin n={4} /><StoryDate story={story} long /></div>
          </div>
          <div {...part(5)}><Pin n={5} />
            <BsPhoto photo={story.photo} className="ab-paper-photo" />
            <p className="ab-paper-caption">Photo: {story.photo.credit}</p>
          </div>
          <div {...part(6)}><Pin n={6} />
            <p className="ab-paper-rate"><T k="story.rate">Rate this story</T> <span className="ab-paper-stars" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={17} strokeWidth={1.5} />)}</span></p>
            <p className="ab-paper-ask">{story.ask ?? "Was this helpful?"} <span className="ab-paper-yes">Yes</span><span className="ab-paper-yes">No</span></p>
          </div>
          <div {...part(7)}><Pin n={7} />
            <p className="ab-paper-sources-title"><T k="story.sources">Sources</T></p>
            <ul className="ab-paper-sources">{story.sources.slice(0, 3).map((source) => <li key={source.url}>{source.name}</li>)}</ul>
          </div>
        </figure>
        <ol className="ab-keys">
          {PARTS.map((item, index) => (
            <li key={item.title} data-on={on === index + 1 || undefined} onPointerEnter={() => setOn(index + 1)} onPointerLeave={() => setOn(0)}>
              <Pin n={index + 1} />
              <span>
                <strong><T>{item.title}</T></strong>
                <span><T>{item.copy}</T></span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ What we cover

type Desk = { to: (typeof SECTION_PATH)[keyof typeof SECTION_PATH] | "/originals" | "/shop"; name: string; note: string; count: string; photo: Photo | undefined; latest: string | undefined };

function deskList(live: Stories): Desk[] {
  const notes: Record<string, string> = {
    music: "New releases, tours and the big awards nights",
    games: "Launches, sales and the showcases ahead",
    streaming: "The creators and records on Twitch, YouTube and Kick",
    culture: "Fashion, television and sneakers",
    sports: SECTIONS.sports.intro.replace(/\.$/, ""),
  };
  const desks = SECTION_IDS.map((id): Desk => {
    const stories: Article[] = live.inSection(id);
    // The desk's second-newest photo: the newest is already at the top of the page
    const photo = (stories[1] ?? stories[0])?.photo;
    return { to: SECTION_PATH[id], name: SECTIONS[id].label, note: notes[id] ?? SECTIONS[id].intro, count: `${stories.length} stories`, photo, latest: stories[0]?.title };
  });
  return [
    ...desks,
    { to: "/originals", name: "Originals", note: "The best interviews and podcasts with rappers, streamers and stars", count: `${EPISODES.length} episodes`, photo: EPISODES[0]?.still, latest: EPISODES[0]?.title },
    { to: "/shop", name: "Shop", note: "The pieces behind the stories, picked by our desk", count: `${SHOPS.length} shops`, photo: SHOPS[0]?.hero, latest: undefined },
  ];
}

function Cover({ live }: { live: Stories }) {
  return (
    <Band tone="dark" id="cover">
      <Head id="cover" k="about.cover" kicker="The desks" title="What we cover" />
      <ul className="ab-desks">
        {deskList(live).map((desk) => (
          <li key={desk.to}>
            <Link to={desk.to} className="ab-desk">
              {desk.photo && <BsPhoto photo={desk.photo} className="ab-desk-photo" />}
              <span className="ab-desk-text">
                <span className="ab-desk-count">{desk.count}</span>
                <span className="ab-desk-name"><T>{desk.name}</T> <ArrowRight size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                <span className="ab-desk-note"><T>{desk.note}</T></span>
                {desk.latest && <span className="ab-desk-latest">Latest: {desk.latest}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Band>
  );
}

// ------------------------------------------------------------ Where the news comes from

function Sources({ live }: { live: Stories }) {
  // Our own reporting is counted on its own; the bars are everyone else
  const credits = useMemo(() => {
    const names = [...new Set(live.all.map((a) => a.credit))].filter((name) => name !== "OGCW");
    const ranked = names
      .map((name) => {
        const stories = live.all.filter((a) => a.credit === name);
        return { name, stories, beats: [...new Set(stories.map((s) => s.kicker))].slice(0, 2) };
      })
      .sort((a, b) => b.stories.length - a.stories.length || b.stories[0]!.date.localeCompare(a.stories[0]!.date));
    return { others: names.length, own: live.all.filter((a) => a.credit === "OGCW").length, top: ranked.slice(0, 8) };
  }, [live]);
  const max = credits.top[0]?.stories.length ?? 1;
  return (
    <Band tone="light" id="our-sources">
      <Head id="our-sources" k="about.sources" kicker="The record" title="Where the news comes from" />
      <div className="ab-sources">
        <div className="ab-sources-intro">
          <p className="ab-lede"><T k="about.sources.copy">Every story names where its news comes from: the company, label, league or publication behind it, or OGCW for our own reporting and round-ups. These are the names that appear most, counted live from every story on the site.</T></p>
          <div className="ab-sources-totals">
            <p className="ab-sources-total"><span>{num(credits.own)}</span> <T>stories of our own reporting and round-ups</T></p>
            <p className="ab-sources-total"><span>{num(credits.others)}</span> <T>other sources credited so far</T></p>
          </div>
        </div>
        <ol className="ab-bars">
          {credits.top.map((source, index) => (
            <li key={source.name} className="ab-bar">
              <span className="ab-bar-rank" aria-hidden="true">{pad(index + 1)}</span>
              <span className="ab-bar-body">
                <span className="ab-bar-name"><T>{source.name}</T> <small>{source.beats.join(" · ")}</small></span>
                <span className="ab-bar-track" aria-hidden="true"><span style={{ width: `${(source.stories.length / max) * 100}%` }} /></span>
                <Link to="/news/$slug" params={{ slug: source.stories[0]!.slug }} className="ab-bar-latest">Latest: {source.stories[0]!.title}</Link>
              </span>
              <span className="ab-bar-count">{source.stories.length} <small>{source.stories.length === 1 ? "story" : "stories"}</small></span>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ The community

// Where to follow OGCW (the "Socials" link on the news front comes here)
const SOCIAL_NOTES: Record<(typeof SOCIALS)[number]["name"], string> = {
  Instagram: "Photos from the shows, the streets and the studio",
  TikTok: "The day’s stories in a minute",
  YouTube: "Clips, interviews and short videos",
  X: "Breaking news as it happens",
};

function Community() {
  return (
    <Band tone="gold" id="socials" className="ab-join">
      <Head id="socials" k="about.join" kicker="The community" title="Join in" />
      <div className="ab-join-grid">
        <section aria-labelledby="follow-ogcw">
          <h3 id="follow-ogcw" className="ab-join-title"><T k="about.follow">Follow OGCW</T></h3>
          <ul className="ab-socials">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className="ab-social">
                  <span className="ab-social-icon"><SocialIcon path={social.path} size={18} /></span>
                  <span className="ab-social-text">
                    <span className="ab-social-name"><T>{social.name}</T></span>
                    <span className="ab-social-note"><T>{SOCIAL_NOTES[social.name]}</T></span>
                  </span>
                  <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-newsletter">
          <h3 id="about-newsletter" className="ab-join-title"><T k="connect.newsletter.title">Stay in the culture.</T></h3>
          <p className="ab-join-copy"><T k="connect.newsletter.copy">Get the biggest stories from OGCW directly to your inbox.</T></p>
          <NewsletterForm source="about" />
        </section>

        <section aria-labelledby="about-forum">
          <h3 id="about-forum" className="ab-join-title"><T k="about.forum">The forum</T></h3>
          <p className="ab-join-copy"><T k="about.forum.copy">Argue the ranking, the drops and the games with everyone else who reads OGCW.</T></p>
          <ul className="ab-rooms">
            {ROOMS.map((room) => (
              <li key={room.id}><Link to="/forum/$room" params={{ room: room.id }} className="ab-room"><T>{room.name}</T></Link></li>
            ))}
          </ul>
          <Link to="/forum" className="fx-btn fx-btn-dark ab-join-btn"><T k="about.forum.open">Open the forum</T> <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>
        </section>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Questions

const QUESTIONS: [string, ReactNode][] = [
  ["Who writes the stories?", <T>Every story is credited to where its news comes from, the company, label, league or publication behind it, or to OGCW for our own reporting and round-ups. We don’t put invented names on stories.</T>],
  ["What does CERTIFIED mean?", <T>It is stamped on a story by the OGCW editors, or earned when at least five readers rate it 4.5 stars or more on average.</T>],
  ["How do ratings work?", <T>At the end of every story you can rate it from 1 to 5 stars and answer its yes or no question. The readers’ score appears once three people have rated it.</T>],
  ["I found a mistake. What do I do?", <>Email <a href={mail("Correction")}>{BUSINESS_EMAIL}</a> <T>with “Correction” in the subject. We fix it and say so.</T></>],
  ["Can I send you a story or my music?", <><T>Yes. Email</T> <a href={mail("Submit a story")}>{BUSINESS_EMAIL}</a> <T>with “Submit a story” or “Music submissions” in the subject.</T></>],
  ["Is there a newsletter?", <T>Yes. Sign up above with your email; we’ll send the biggest stories from OGCW straight to your inbox when it launches.</T>],
];

function Questions() {
  return (
    <Band tone="light" id="questions">
      <div className="ab-faq">
        <div>
          <p className="fx-kicker"><T k="about.faq.kicker">Good to know</T></p>
          <h2 id="questions-title" className="fx-title"><T k="about.faq.title">Questions, answered</T></h2>
          <Link to="/info/$slug" params={{ slug: "faq" }} className="fx-more fx-more-block"><T k="about.faq.more">More in the FAQ</T> <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="ab-faq-list">
          {QUESTIONS.map(([question, answer]) => (
            <details key={question} className="ab-q">
              <summary><span><T>{question}</T></span><Plus size={20} strokeWidth={1.6} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Band>
  );
}

// ------------------------------------------------------------ Get in touch

const ENQUIRIES = [
  { subject: "Submit a story", note: "Tips, pitches and stories we should be telling" },
  { subject: "Music submissions", note: "New releases from artists and labels" },
  { subject: "Advertising", note: "Campaigns, sponsorships and branded content" },
  { subject: "Partnerships", note: "Events, collaborations and long-term partners" },
  { subject: "Press", note: "Interviews and press enquiries about OGCW" },
  { subject: "Correction", note: "Something in a story that needs fixing" },
];

function Contact() {
  return (
    <Band tone="dark" id="get-in-touch">
      <div className="ab-contact">
        <p className="fx-kicker"><T k="about.contact.kicker">Get in touch</T></p>
        <h2 id="get-in-touch-title" className="fx-title"><T k="about.contact.title">One address for everything</T></h2>
        <p className="ab-contact-email"><a href={mail("General")}>{BUSINESS_EMAIL}</a></p>
        <p className="ab-lede"><T>Put one of these in the subject and it reaches the right person.</T></p>
      </div>
      <ul className="ab-enquiries">
        {ENQUIRIES.map((item) => (
          <li key={item.subject}>
            <a href={mail(item.subject)} className="ab-enquiry">
              <span className="ab-enquiry-name"><T>{item.subject}</T></span>
              <span className="ab-enquiry-note"><T>{item.note}</T></span>
              <ArrowUpRight size={20} strokeWidth={1.6} className="ab-enquiry-arrow" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </Band>
  );
}

function About() {
  const live = useStories();
  const newest = useMemo(() => deskLeads(live), [live]);
  const onTop = useMemo(() => new Set(newest.map((story) => story.slug)), [newest]);
  return (
    <SiteShell>
      <main className="ab">
        <Hero live={live} newest={newest} />
        <Position />
        <Anatomy live={live} skip={onTop} />
        <Cover live={live} />
        <Sources live={live} />
        <Community />
        <Questions />
        <Contact />
      </main>
    </SiteShell>
  );
}
