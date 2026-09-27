import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { ConnectSection } from "../components/connect-section";
import { HeroSlider } from "../components/hero-slider";
import { NewsFront } from "../components/news-front";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "OGCW — Culture, Unfiltered" },
    { name: "description", content: "One Great Culture World covers the people, ideas, style, sound, and spaces moving culture forward." },
    { property: "og:title", content: "OGCW — Culture, Unfiltered" },
    { property: "og:description", content: "Independent reporting from the people shaping culture now." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}), component: HomePage,
});

function HomePage() {
  return <SiteShell>
    <HeroSlider />

    <main>
      <NewsFront />
      <ConnectSection />
      <p className="page-wrap pb-8 text-[10px] leading-relaxed text-muted-foreground">Photography: Central Cee by 200izo (CC BY-SA 4.0), via Wikimedia Commons. Cropped. Drake by The Come Up Show (CC BY 2.0). Cropped. Shop photos via Unsplash by Paul Steuber, Sou Jest, Irene Kredenets and Howen.</p>
    </main>
  </SiteShell>;
}
