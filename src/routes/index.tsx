import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell, StoryLink } from "../components/ogcw-layout";
import styleHero from "../assets/ogcw-hero-style.jpg";
import musicHero from "../assets/ogcw-hero-music.jpg";
import designHero from "../assets/ogcw-hero-design.jpg";
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

const slides = [
  { image: styleHero, label: "Style / Cover Story", title: "The New Uniform Is Built for the City", copy: "Inside the silhouettes, spaces and independent labels redrawing the streetwear map.", cta: "Read the cover story" },
  { image: musicHero, label: "Sound / After Dark", title: "The Rooms Where New Sounds Begin", copy: "A field report from the small stages keeping live music dangerous, local and alive.", cta: "Enter the scene" },
  { image: designHero, label: "Design / Objects", title: "When Everyday Objects Become Icons", copy: "The designers turning utility, texture and restraint into the next visual language.", cta: "See the report" },
];
const headlines = ["Independent labels reclaim the runway", "The listening bars changing nightlife", "A new generation remakes print", "Why brutalism keeps returning"];

function HomePage() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 3500); return () => window.clearInterval(timer); }, [playing]);
  const go = (direction: number) => setActive((value) => (value + direction + slides.length) % slides.length);
  const slide = slides[active] ?? slides[0];
  if (!slide) return null;

  return <SiteShell>
    <div className="overflow-hidden bg-foreground py-2 text-background"><div className="ticker-track flex w-max whitespace-nowrap">{[0,1].map((copy) => <div key={copy} className="flex items-center gap-10 px-5">{headlines.map((headline) => <span key={`${copy}-${headline}`} className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.2em]"><i className="size-1.5 bg-accent" />{headline}</span>)}</div>)}</div></div>

    <section className="relative h-[calc(100svh-5rem)] min-h-[560px] max-h-[900px] overflow-hidden bg-foreground">
      <img key={slide.image} src={slide.image} alt="" width={1920} height={1088} className="slide-enter absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 top-0 mx-auto flex max-w-[1440px] items-end px-4 pb-16 lg:px-8 lg:pb-20">
        <div key={slide.title} className="slide-enter max-w-3xl text-background">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-accent">{slide.label}</p>
          <h1 className="font-display text-6xl leading-[.88] sm:text-8xl lg:text-[7.5rem]">{slide.title}</h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-background/75 sm:text-base">{slide.copy}</p>
          <Link to="/news" className="mt-7 inline-flex items-center gap-3 border border-background bg-background px-5 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:bg-accent">{slide.cta}<ArrowRight size={16} /></Link>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2 lg:bottom-8 lg:right-8">
        <button className="grid size-10 place-items-center border border-background/40 bg-foreground/30 text-background backdrop-blur-sm hover:bg-background hover:text-foreground" onClick={() => go(-1)} aria-label="Previous story"><ChevronLeft size={20}/></button>
        <button className="grid size-10 place-items-center border border-background/40 bg-foreground/30 text-background backdrop-blur-sm hover:bg-background hover:text-foreground" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button>
        <button className="grid size-10 place-items-center border border-background/40 bg-foreground/30 text-background backdrop-blur-sm hover:bg-background hover:text-foreground" onClick={() => go(1)} aria-label="Next story"><ChevronRight size={20}/></button>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex">{slides.map((item, index) => <button key={item.title} aria-label={`Show story ${index + 1}`} onClick={() => setActive(index)} className="h-1 flex-1 bg-background/30"><span key={active === index ? active : -1} className={`block h-full bg-accent ${active === index && playing ? "slide-progress" : active === index ? "w-full" : "w-0"}`} /></button>)}</div>
    </section>

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
    </main>
  </SiteShell>;
}
