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

// Each featured artist: a full-bleed photo behind the glass panel, and three stories in reading order.
const features = [
  {
    name: "Playboi Carti",
    short: "Carti",
    image: cartiPhoto.url,
    alt: "Playboi Carti performing on a smoke-filled festival stage",
    focus: "45% 30%",
    dek: "Stage, sound and the label behind rap's most chaotic live show.",
    cta: "View the dispatch",
    stories: [
      { tag: "Live", title: "Playboi Carti: full force at Clout Festival", read: "4 min read" },
      { tag: "Label", title: "Inside Opium, the label Carti built", read: "6 min read" },
      { tag: "Retrospective", title: "How Whole Lotta Red rewired rap's sound", read: "8 min read" },
    ],
  },
  {
    name: "Dave",
    short: "Dave",
    image: davePhoto,
    alt: "Dave performing with a microphone on a dark arena stage",
    focus: "50% 22%",
    dek: "The London rapper who turns arenas quiet enough to hear every word.",
    cta: "Read the live report",
    stories: [
      { tag: "Live", title: "Dave takes Brussels' ING Arena", read: "4 min read" },
      { tag: "Awards", title: "Psychodrama and the 2019 Mercury Prize", read: "6 min read" },
      { tag: "Collab", title: "Sprinter: ten weeks at No. 1 with Central Cee", read: "5 min read" },
    ],
  },
  {
    name: "Drake",
    short: "Drake",
    image: drakePhoto.url,
    alt: "Drake pointing to the crowd with a microphone in hand",
    focus: "47% 40%",
    dek: "New music, old blueprints and the city that made him.",
    cta: "Read the headline",
    stories: [
      { tag: "Release", title: "Drake drops “Quebec”", read: "2 min read" },
      { tag: "Anniversary", title: "Take Care at 15: the blueprint for moody rap", read: "6 min read" },
      { tag: "Culture", title: "OVO Fest and the Toronto homecoming", read: "5 min read" },
    ],
  },
];
const SLIDE_MS = 3000;

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

  const goTo = (index: number) => setSlide((s) => (s.active === index ? s : { prev: s.active, active: index }));
  const feature = features[slide.active] ?? features[0];
  if (!feature) return null;

  return (
    <section
      className="relative isolate overflow-hidden bg-background lg:h-[calc(100svh-3.5rem)] lg:min-h-[680px] lg:max-h-[960px] lg:bg-foreground"
      aria-roledescription="carousel"
      aria-label="Featured artists"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
    >
      <h1 className="sr-only">OGCW: culture, unfiltered</h1>

      {/* Full-bleed photography: the "film" behind the glass */}
      <Link to="/news" className="group relative block aspect-[4/5] max-h-[78svh] w-full overflow-hidden bg-foreground sm:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none" tabIndex={-1} aria-hidden="true">
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
        <span className="absolute left-4 top-4 z-20 rounded-[50px] bg-background px-4 py-2 text-[10px] font-medium uppercase tracking-[.1em] text-foreground lg:bottom-6 lg:left-6 lg:top-auto">
          {String(slide.active + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
        </span>
      </Link>

      {/* The glass vitrine: every story lives here, floating over the photo */}
      <div className="relative z-20 mx-auto -mt-32 flex max-w-[1440px] justify-end px-3 pb-3 sm:-mt-40 sm:px-6 lg:mt-0 lg:h-full lg:items-center lg:px-8 lg:py-6">
        <aside className="glass-panel flex w-full flex-col gap-3 p-3 sm:p-4 lg:max-h-full lg:w-[420px] lg:overflow-x-hidden lg:overflow-y-auto xl:w-[460px]" aria-live={paused ? "polite" : "off"}>
          <div className="grid grid-cols-3 gap-1 rounded-[6px] bg-background/55 p-1">
            {features.map((item, index) => {
              const isActive = index === slide.active;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-pressed={isActive}
                  aria-label={`Show ${item.name}`}
                  className={cn(
                    "relative overflow-hidden rounded-[4px] py-2 text-[11px] font-medium uppercase tracking-[.08em] transition-colors duration-300",
                    isActive ? "bg-foreground text-background" : "text-foreground/70 hover:bg-background/70 hover:text-foreground",
                  )}
                >
                  {item.short}
                  {isActive && !paused && !reduceMotion && <span key={slide.active} className="tab-progress" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="rounded-[6px] bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-[.1em] text-accent-foreground">Now on OGCW</span>
            <span className="text-[10px] font-medium uppercase tracking-[.1em] text-foreground/70">{feature.stories.length} stories</span>
          </div>

          {/* All three sets share one grid cell, so the panel reserves the tallest and never jumps. */}
          <div className="grid">
            {features.map((item, featureIndex) => {
              const isActive = featureIndex === slide.active;
              return (
                <div key={item.name} className={cn("flex flex-col gap-3 [grid-area:1/1]", !isActive && "invisible")} aria-hidden={!isActive}>
                  <div className={cn("rounded-[6px] bg-background p-4 shadow-[rgba(0,0,0,.08)_1px_1px_6px_-1px]", isActive && "hero-story-enter")}>
                    <p className="text-[10px] font-medium uppercase tracking-[.1em] text-muted-foreground">Featured artist</p>
                    <h2 className="mt-2 font-display text-5xl leading-[.9] sm:text-6xl">{item.name}</h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{item.dek}</p>
                  </div>
                  <ol className="flex flex-col gap-2">
                    {item.stories.map((story, index) => (
                      <li key={story.title} className={cn(isActive && "hero-story-enter")} style={{ animationDelay: `${140 + index * 110}ms` }}>
                        <Link to="/news" className="hero-story grid grid-cols-[3rem_1fr_auto] items-center gap-3 overflow-hidden rounded-[6px] border border-foreground/10 bg-background p-2.5 pr-3.5">
                          <span className="hero-story-index grid size-12 place-items-center rounded-[4px] bg-muted font-display text-2xl leading-none">0{index + 1}</span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="hero-story-tag rounded-[6px] bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[.1em]">{story.tag}</span>
                              <span className="hero-story-meta text-[10px] uppercase tracking-[.08em] text-muted-foreground">{story.read}</span>
                            </span>
                            <span className="mt-1.5 block font-display text-xl leading-none sm:text-[1.4rem]">{story.title}</span>
                          </span>
                          <ArrowUpRight className="hero-story-arrow" size={18} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 px-1 pt-2">
            <Link to="/news" className="pill-cta">{feature.cta}<ArrowRight size={16} aria-hidden="true" /></Link>
            <Link to="/news" className="text-[10px] font-medium uppercase tracking-[.1em] text-foreground/70 underline-offset-4 hover:text-foreground hover:underline">All news</Link>
          </div>
        </aside>
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
