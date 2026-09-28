import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { SectionFront } from "../components/section-front";

export const Route = createFileRoute("/culture")({
  head: () => ({
    meta: [
      { title: "Culture — OGCW" },
      { name: "description", content: "Style, design, nightlife, architecture and print, and the people who make them matter." },
      { property: "og:title", content: "Culture — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <SiteShell>
      <SectionFront section="culture" />
    </SiteShell>
  ),
});
