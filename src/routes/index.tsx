import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { HeroCover } from "../components/hero-cover";
import { HeroGallery } from "../components/hero-gallery";
import { HeroGallery2 } from "../components/hero-gallery-2";
import { HeroImpact } from "../components/hero-impact";
import { FrontPage } from "../components/front-page";
import { EditSection } from "../components/site-text";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "OGCW — Culture, Unfiltered" },
    { name: "description", content: "One Great Culture World covers the people, ideas, style, sound, sport and spaces moving culture forward." },
    { property: "og:title", content: "OGCW — Culture, Unfiltered" },
    { property: "og:description", content: "Independent reporting from the people shaping culture now." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}), component: HomePage,
});

function HomePage() {
  return <SiteShell>
    {/* All four heroes render; the hero switcher’s choice (html data-hero) decides which shows */}
    <EditSection name="Hero">
      <HeroImpact />
      <HeroCover />
      <HeroGallery />
      <HeroGallery2 />
    </EditSection>

    {/* The front page, band by band (src/components/front-page.tsx) */}
    <main><FrontPage /></main>
  </SiteShell>;
}
