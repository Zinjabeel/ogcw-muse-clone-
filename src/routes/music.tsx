import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { SectionFront } from "../components/section-front";

export const Route = createFileRoute("/music")({
  head: () => ({
    meta: [
      { title: "Music — OGCW" },
      { name: "description", content: "Rap, rumba and everything between: the artists, scenes and records moving culture right now." },
      { property: "og:title", content: "Music — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <SiteShell>
      <SectionFront section="music" />
    </SiteShell>
  ),
});
