import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { ConnectSection } from "../components/connect-section";
import { HeroCover } from "../components/hero-cover";
import { HeroGallery } from "../components/hero-gallery";
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
    {/* Both heroes render; the hero switcher's choice (html data-hero) decides which shows */}
    <HeroCover />
    <HeroGallery />

    <main>
      <NewsFront />
      <ConnectSection />
    </main>
  </SiteShell>;
}
