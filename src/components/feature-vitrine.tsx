import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import cartiPhoto from "../assets/playboi-carti.jpg.asset.json";
import drakePhoto from "../assets/drake.jpg.asset.json";
import davePhoto from "../assets/dave.jpg";

// The feature panel (built to the Sneak in Peace reference): one artist at a
// time, three stories each. Every 3 seconds the whole panel slides out and the
// next artist's panel slides in. Hovering or focusing it pauses the rotation.

type Crop = { pos: string; zoom: number };

const features: {
  name: string;
  image: string;
  face: Crop;
  title: string;
  dek: string;
  cta: string;
  stories: { tag: string; title: string; read: string; crop: Crop }[];
}[] = [
  {
    name: "Playboi Carti",
    image: cartiPhoto.url,
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

function Cropped({ src, crop }: { src: string; crop: Crop }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom), ["--origin" as string]: crop.pos }}
    />
  );
}

export function FeatureVitrine() {
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

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setTimeout(() => setSlide((s) => ({ prev: s.active, active: (s.active + 1) % features.length })), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [slide.active, paused, reduceMotion]);

  return (
    <div
      className="vitrine-rail"
      aria-roledescription="carousel"
      aria-label="Featured artist"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
    >
      {/* All three panels share one grid cell, so the height never jumps. */}
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

            <div className="vitrine-status">
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

            <Link to="/news" className="vitrine-artist">
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
  );
}
