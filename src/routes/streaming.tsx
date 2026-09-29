import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/ogcw-layout";
import { SectionFront } from "../components/section-front";

export const Route = createFileRoute("/streaming")({
  head: () => ({
    meta: [
      { title: "Streaming — OGCW" },
      { name: "description", content: "The creators, records and charity marathons that live on Twitch, YouTube and Kick." },
      { property: "og:title", content: "Streaming — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <SiteShell>
      <SectionFront section="streaming" />
    </SiteShell>
  ),
});
