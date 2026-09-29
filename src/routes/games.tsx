import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { SectionFront } from "../components/section-front";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Games — OGCW" },
      { name: "description", content: "Launches, sales and the showcases setting up the next few years of play." },
      { property: "og:title", content: "Games — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <SiteShell>
      <SectionFront section="games" />
    </SiteShell>
  ),
});
