import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { SectionFront } from "../components/section-front";

export const Route = createFileRoute("/culture")({
  head: () => ({
    meta: [
      { title: "Culture — OGCW" },
      { name: "description", content: "Fashion weeks, television, sneakers and the shows shaping the season." },
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
