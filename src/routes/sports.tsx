import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { SectionFront } from "../components/section-front";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "Sports — OGCW" },
      { name: "description", content: "The games, records and athletes crossing over into music and fashion." },
      { property: "og:title", content: "Sports — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <SiteShell>
      <SectionFront section="sports" />
    </SiteShell>
  ),
});
