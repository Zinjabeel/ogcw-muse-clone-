import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { StoryRow } from "../components/cards";
import { article } from "../data/content";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends — OGCW" },
      { name: "description", content: "The movements and ideas defining culture now." },
      { property: "og:title", content: "Trends — OGCW" },
      { property: "og:description", content: "The movements and ideas defining culture now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trends,
});

// The culture index: what the desk keeps seeing, each with the story that covers it
const TRENDS = [
  { title: "The return of the personal archive", note: "Labelled mixtapes, scanned flyers and objects bought to keep: people want a record of their own scene, not just what the feed remembers.", story: article("objects-built-to-outlast-the-feed") },
  { title: "Listening bars after the hype", note: "The first wave of rooms has settled in. The ones still full care more about the sound system than the queue outside.", story: article("the-listening-bars-changing-nightlife") },
  { title: "Small-run print finds its audience", note: "Zines and risograph posters sell out in days, and the buyers are younger than the collectors who kept print alive.", story: article("a-new-generation-remakes-print") },
  { title: "Useful clothes replace statement pieces", note: "Workwear cuts, deep pockets and fabrics that last a season of wear: independent labels are designing for use first.", story: article("independent-labels-reclaim-the-runway") },
  { title: "The new rules of night photography", note: "Flash off, grain up, concrete in frame. The city after dark has become a generation’s favourite backdrop.", story: article("why-brutalism-keeps-returning") },
  { title: "Local scenes reject the algorithm", note: "Artists are building crowds city by city, in their own language, long before a playlist notices them.", story: article("vedan-and-the-reach-of-regional-rap") },
];

function Trends() {
  return (
    <SiteShell>
      <PageIntro kicker="Culture index · September 2026" title="Trend report" copy="A living index of the aesthetics, behaviours and underground movements gathering real momentum, compiled by the OGCW desk from its reporting." />
      <main className="page-wrap pb-24">
        <ol className="trend-list">
          {TRENDS.map((trend, index) => (
            <li key={trend.title} className="trend">
              <span className="trend-num">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="trend-title">{trend.title}</h2>
              <p className="trend-note">{trend.note}</p>
              <p className="trend-read">Read the story</p>
              <StoryRow story={trend.story} />
            </li>
          ))}
        </ol>
      </main>
    </SiteShell>
  );
}
