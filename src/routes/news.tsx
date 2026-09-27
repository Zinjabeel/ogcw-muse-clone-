import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SiteShell, StoryLink } from "../components/ogcw-layout";
import cartiPhoto from "../assets/playboi-carti.jpg.asset.json";
import vedanPhoto from "../assets/vedan.jpg.asset.json";
import designHero from "../assets/ogcw-hero-design.jpg";

export const Route = createFileRoute("/news")({ head: () => ({ meta: [{ title: "News — OGCW" },{ name: "description", content: "The latest independent culture news from OGCW." },{ property: "og:title", content: "News — OGCW" },{ property: "og:description", content: "The latest independent culture news from OGCW." },{ property: "og:type", content: "website" },{ name: "twitter:card", content: "summary_large_image" }] }), component: News });
const items = [
  [cartiPhoto.url,"Rap","Playboi Carti at Clout Festival: A Visual Dispatch","Stage design, movement and a crowd operating at full intensity."],
  [vedanPhoto.url,"New Voices","Vedan and the Reach of Regional Rap","A performance-led look at an artist carrying Malayalam rap to a wider audience."],
  [designHero,"Design","Objects Built to Outlast the Feed","Utility and restraint define a wave of products designed for daily life rather than launch day."],
];
function News(){return <SiteShell><PageIntro kicker="Latest dispatches" title="NEWS" copy="Fast, considered reporting across style, music, art, design and the places where they collide."/><main className="page-wrap pb-24"><div className="border-t-2 border-foreground">{items.map(([image,tag,title,copy],i)=><article key={title} className="grid gap-6 border-b border-border py-8 md:grid-cols-[80px_1fr_1.15fr] md:items-center"><span className="font-display text-5xl text-muted">0{i+1}</span><img src={image} alt="" loading="lazy" width={1920} height={1088} className="aspect-[16/10] w-full object-cover"/><div><p className="text-[10px] font-bold uppercase tracking-widest text-accent">{tag} / September 2026</p><h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{title}</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{copy}</p><div className="mt-5"><StoryLink>Read dispatch</StoryLink></div></div></article>)}</div></main></SiteShell>}
