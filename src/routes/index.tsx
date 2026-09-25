import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell, StoryLink } from "../components/ogcw-layout";
import { cn } from "../lib/utils";
import cartiPhoto from "../assets/playboi-carti.jpg.asset.json";
import drakePhoto from "../assets/drake.jpg.asset.json";
import davePhoto from "../assets/dave.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import editorialGrid from "../assets/ogcw-editorial-grid.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "OGCW — Culture, Unfiltered" },
    { name: "description", content: "OG Culture World covers the people, ideas, style, sound, and spaces moving culture forward." },
    { property: "og:title", content: "OGCW — Culture, Unfiltered" },
    { property: "og:description", content: "Independent reporting from the people shaping culture now." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}), component: HomePage,
});

type Crop = { pos: string; zoom: number };

// Each featured artist: a full-bleed photo behind the vitrine, a narrative title,
// and three stories. Story thumbnails are details cropped from the same photo.
const features: {
  name: string;
  image: string;
  focus: string;
  face: Crop;
  title: string;
  dek: string;
  cta: string;
  stories: { tag: string; title: string; read: string; crop: Crop }[];
}[] = [
  {
    name: "Playboi Carti",
    image: cartiPhoto.url,
    focus: "45% 30%",
    face: { pos: "44% 30%", zoom: 2.6 },
    title: "Playboi Carti, at full force",
    dek: "Stage, sound and the label behind rap's most chaotic live show.",
    cta: "View the dispatch",
    stories: [
      { tag: "Live", title: "Playboi Carti: full force at Clout Festival", read: "4 min read", crop: { pos: "43% 26%", zoom: 3.4 } },
      { tag: "Label", title: "Inside Opium, the label Carti built", read: "6 min read", crop: { pos: "42% 74%", zoom: 2.6 } },
      { tag: "Retro", title: "How Whole Lotta Red rewired rap's sound", read: "8 min read", crop: { pos: "36% 38%", zoom: 3.2 } },
    ],
  },
  {
    name: "Dave",
    image: davePhoto,
    focus: "50% 22%",
    face: { pos: "52% 17%", zoom: 2.4 },
    title: "Dave, and the art of the quiet arena",
    dek: "The London rapper who turns arenas quiet enough to hear every word.",
    cta: "Read the live report",
    stories: [
      { tag: "Live", title: "Dave takes Brussels' ING Arena", read: "4 min read", crop: { pos: "52% 16%", zoom: 2.6 } },
      { tag: "Awards", title: "Psychodrama and the 2019 Mercury Prize", read: "6 min read", crop: { pos: "30% 30%", zoom: 2.4 } },
      { tag: "Collab", title: "Sprinter: ten weeks at No. 1 with Central Cee", read: "5 min read", crop: { pos: "55% 66%", zoom: 1.9 } },
    ],
  },
  {
    name: "Drake",
    image: drakePhoto.url,
    focus: "47% 40%",
    face: { pos: "48% 42%", zoom: 3 },
    title: "Drake, and the city that made him",
    dek: "New music, old blueprints and a homecoming that never really ends.",
    cta: "Read the headline",
    stories: [
      { tag: "Release", title: "Drake drops “Quebec”", read: "2 min read", crop: { pos: "48% 45%", zoom: 3.2 } },
      { tag: "Classic", title: "Take Care at 15: the blueprint for moody rap", read: "6 min read", crop: { pos: "10% 22%", zoom: 3.2 } },
      { tag: "Culture", title: "OVO Fest and the Toronto homecoming", read: "5 min read", crop: { pos: "48% 62%", zoom: 3 } },
    ],
  },
];
const SLIDE_MS = 3000;
const sections = [
  { label: "News", to: "/news" as const },
  { label: "Trends", to: "/trends" as const },
  { label: "Blog", to: "/blog" as const },
];

function Cropped({ src, crop, className }: { src: string; crop: Crop; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={className}
      style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom), ["--origin" as string]: crop.pos }}
    />
  );
}

function FeatureHero() {
  const [slide, setSlide] = useState({ active: 0, prev: -1 });
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Advance every 3s. Hovering or focusing the hero pauses it so nobody loses the story they're reading.
  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setTimeout(() => setSlide((s) => ({ prev: s.active, active: (s.active + 1) % features.length })), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [slide.active, paused, reduceMotion]);

  return (
    <section
      className="relative isolate overflow-hidden bg-foreground lg:h-[calc(100svh-3.5rem)] lg:min-h-[680px] lg:max-h-[960px]"
      aria-roledescription="carousel"
      aria-label="Featured artist"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
    >
      <h1 className="sr-only">OGCW: culture, unfiltered</h1>

      {/* Full-bleed photography: the "film" behind the glass */}
      <Link to="/news" className="group absolute inset-x-0 top-0 block h-[62svh] overflow-hidden sm:h-[56svh] lg:inset-0 lg:h-auto" tabIndex={-1} aria-hidden="true">
        <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.03]">
          {features.map((item, index) => (
            <img
              key={item.name}
              src={item.image}
              alt=""
              width={1920}
              height={1280}
              fetchPriority={index === 0 ? "high" : "low"}
              style={{ objectPosition: item.focus }}
              className={cn(
                "absolute inset-0 h-full w-full object-cover saturate-[.7] contrast-110",
                index === slide.active ? "hero-image-enter z-10" : index === slide.prev ? "z-0" : "z-0 opacity-0",
              )}
            />
          ))}
        </div>
      </Link>

      {/* The vitrine: one artist at a time, pinned to the right edge. All three share one grid
          cell so the height never jumps; the outgoing panel slides away as the next slides in. */}
      <div className="relative z-20 grid px-3 pb-3 pt-[48svh] sm:pt-[40svh] lg:absolute lg:inset-y-3 lg:right-3 lg:w-[min(440px,36vw)] lg:p-0">
        {features.map((item, index) => {
          const state = index === slide.active ? "active" : index === slide.prev ? "prev" : "idle";
          return (
            <aside
              key={item.name}
              className={cn("vitrine [grid-area:1/1]", state === "active" && "vitrine-enter", state === "prev" && "vitrine-exit", state === "idle" && "invisible")}
              aria-hidden={state !== "active"}
              inert={state !== "active"}
            >
              <nav className="vitrine-tabs" aria-label="Sections">
                {sections.map((section, sectionIndex) => (
                  <Link key={section.to} to={section.to} className="vitrine-tab" data-active={sectionIndex === 0 ? "" : undefined}>{section.label}</Link>
                ))}
              </nav>

              <div className="vitrine-onglass flex items-center justify-between px-1">
                <span className="flex items-center gap-2">
                  <span className="vitrine-badge">Now</span>
                  <span className="vitrine-count">On OGCW</span>
                </span>
                <span className="vitrine-count">{String(index + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}</span>
              </div>

              <article className="vitrine-card">
                <p className="vitrine-label">Now on OGCW</p>
                <h2 className="vitrine-title">{item.title}</h2>
                <p className="vitrine-body">{item.dek}</p>
                <Link to="/news" className="vitrine-link">{item.cta}<ArrowRight size={13} aria-hidden="true" /></Link>
              </article>

              <Link to="/news" className="vitrine-artist vitrine-onglass">
                <span className="vitrine-avatar"><Cropped src={item.image} crop={item.face} /></span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium">{item.name}</span>
                  <span className="block text-[11px] opacity-75">ogcultureworld.com/news</span>
                </span>
                <span className="vitrine-icon"><ArrowUpRight size={14} strokeWidth={1.25} aria-hidden="true" /></span>
              </Link>

              <ol className="vitrine-list">
                {item.stories.map((story) => (
                  <li key={story.title}>
                    <Link to="/news" className="vitrine-product">
                      <span className="vitrine-thumb"><Cropped src={item.image} crop={story.crop} /></span>
                      <span className="min-w-0">
                        <span className="vitrine-name">{story.title}</span>
                        <span className="vitrine-sku">{story.read}</span>
                      </span>
                      <span className="vitrine-tag">{story.tag}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          );
        })}
      </div>
    </section>
  );
}

function HomePage() {
  return <SiteShell>
    <FeatureHero />

    <main>
      <section className="mx-auto max-w-[1440px] px-4 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between border-b-2 border-foreground pb-3"><div><p className="section-kicker">Current signal</p><h2 className="mt-3 font-display text-5xl sm:text-7xl">WHAT'S MOVING NOW</h2></div><StoryLink to="/trends">All trends</StoryLink></div>
        <div className="grid gap-8 lg:grid-cols-12">
          <article className="group lg:col-span-7"><div className="overflow-hidden"><img src={editorialGrid} alt="Culture makers across music, fashion, architecture and print" loading="lazy" width={1600} height={1600} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" /></div><p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Culture / Field Notes</p><h3 className="mt-2 max-w-3xl font-display text-4xl leading-none sm:text-5xl">FOUR SCENES, ONE SHARED LANGUAGE</h3><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">From record rooms to concrete landmarks, the communities protecting independent culture are building their own infrastructure.</p></article>
          <aside className="lg:col-span-5 lg:border-l lg:border-border lg:pl-8"><p className="section-kicker">The hit list</p><ol className="mt-7">{["The quiet return of personal style","Why listening bars became the new club","The photographers documenting the margins","Small-run magazines are selling out again","Can a city still have an underground?"].map((item,index) => <li key={item} className="grid grid-cols-[auto_1fr] gap-5 border-t border-border py-5"><span className="font-display text-4xl text-accent">0{index+1}</span><div><h4 className="font-semibold leading-snug">{item}</h4><p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{5+index*2} min read</p></div></li>)}</ol></aside>
        </div>
      </section>

      <section className="bg-foreground py-16 text-background lg:py-24"><div className="mx-auto max-w-[1440px] px-4 lg:px-8"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="section-kicker text-accent">The OGCW journal</p><h2 className="mt-4 font-display text-6xl leading-[.9] sm:text-8xl">LONG READS. NO SHORTCUTS.</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-background/60">Essays, interviews and visual dispatches from people with something real to say.</p><div className="mt-7"><StoryLink to="/blog">Open the journal</StoryLink></div></div><div className="grid gap-1 sm:grid-cols-2"><img src={musicHero} alt="Independent artist performing in a crowded club" loading="lazy" width={1920} height={1088} className="aspect-[4/3] h-full w-full object-cover"/><div className="flex min-h-64 flex-col justify-end bg-accent p-7 text-accent-foreground"><p className="text-[10px] font-bold uppercase tracking-[.2em]">Essay 001</p><h3 className="mt-4 font-display text-4xl leading-none">THE VALUE OF A ROOM THAT HASN'T BEEN DISCOVERED YET</h3><p className="mt-4 text-sm opacity-70">By Nia Vale · 11 min</p></div></div></div></div></section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24"><div><p className="section-kicker">About the publication</p><h2 className="mt-4 max-w-5xl font-display text-5xl leading-[.95] sm:text-7xl">OGCW DOCUMENTS CULTURE BEFORE IT BECOMES CONTENT.</h2></div><StoryLink to="/about">Our point of view</StoryLink></section>
      <p className="mx-auto max-w-[1440px] px-4 pb-8 text-[10px] leading-relaxed text-muted-foreground lg:px-8">Hero photography: Playboi Carti by Wojciech Pędzich (CC BY 4.0); Dave by Jasonhm121 (CC BY-SA 4.0); Drake by The Come Up Show (CC BY 2.0), via Wikimedia Commons. Cropped and color-treated.</p>
    </main>
  </SiteShell>;
}
