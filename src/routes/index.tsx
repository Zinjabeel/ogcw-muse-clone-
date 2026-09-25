import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, StoryLink } from "../components/ogcw-layout";
import { NewsFront } from "../components/news-front";
import musicHero from "../assets/ogcw-hero-music.jpg";

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

function HomePage() {
  return <SiteShell>
    <section className="hero-empty" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">OGCW: culture, unfiltered</h1>
    </section>

    <main>
      <NewsFront />

      <section className="bg-foreground py-16 text-background lg:py-24"><div className="mx-auto max-w-[1440px] px-4 lg:px-8"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="section-kicker text-accent">The OGCW journal</p><h2 className="mt-4 font-display text-6xl leading-[.9] sm:text-8xl">LONG READS. NO SHORTCUTS.</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-background/60">Essays, interviews and visual dispatches from people with something real to say.</p><div className="mt-7"><StoryLink to="/blog">Open the journal</StoryLink></div></div><div className="grid gap-1 sm:grid-cols-2"><img src={musicHero} alt="Independent artist performing in a crowded club" loading="lazy" width={1920} height={1088} className="aspect-[4/3] h-full w-full object-cover"/><div className="flex min-h-64 flex-col justify-end bg-accent p-7 text-accent-foreground"><p className="text-[10px] font-bold uppercase tracking-[.2em]">Essay 001</p><h3 className="mt-4 font-display text-4xl leading-none">THE VALUE OF A ROOM THAT HASN'T BEEN DISCOVERED YET</h3><p className="mt-4 text-sm opacity-70">By Nia Vale · 11 min</p></div></div></div></div></section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24"><div><p className="section-kicker">About the publication</p><h2 className="mt-4 max-w-5xl font-display text-5xl leading-[.95] sm:text-7xl">OGCW DOCUMENTS CULTURE BEFORE IT BECOMES CONTENT.</h2></div><StoryLink to="/about">Our point of view</StoryLink></section>
      <p className="mx-auto max-w-[1440px] px-4 pb-8 text-[10px] leading-relaxed text-muted-foreground lg:px-8">Photography: Central Cee by 200izo (CC BY-SA 4.0), via Wikimedia Commons. Cropped.</p>
    </main>
  </SiteShell>;
}
