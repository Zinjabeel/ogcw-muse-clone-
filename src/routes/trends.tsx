import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { StoryRow } from "../components/cards";
import { useStories } from "../lib/stories";
import { T } from "@/components/site-text";

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

// The culture index: what the desk keeps seeing in its reporting, each trend
// with the story that shows it
const TRENDS = [
  { title: "Albums get a second act", note: "New songs added almost a year after release keep a record in the conversation, and on the charts, long after its first week.", slug: "taylor-swift-the-life-of-a-showgirl-the-encore" },
  { title: "The comeback is a stadium tour", note: "After time away, the biggest acts return at full scale: 88 shows in 34 cities, not a quiet warm-up.", slug: "bts-arirang-world-tour-latin-america" },
  { title: "Charity streams go record-sized", note: "Livestream marathons now raise sums that used to belong to telethons, and the audience keeps growing with them.", slug: "z-event-2026-final-edition" },
  { title: "VTubers lead the launches", note: "Animated creators are no longer a niche: some of the biggest audiences for new games now tune in to a cartoon face.", slug: "wardogs-launch-theburntpeanut" },
  { title: "Big games, bigger waits", note: "Studios are announcing years ahead, with release windows in 2029 and 2030, while fans count down to this year’s giants.", slug: "blizzcon-2026-diablo-v-starcraft" },
  { title: "Paris backs its big names", note: "After two seasons defined by designer debuts, the spotlight in Paris swings back to the houses everyone already knows.", slug: "paris-fashion-week-ss27" },
];

function Trends() {
  const stories = useStories();
  return (
    <SiteShell>
      <PageIntro kicker="Culture index · September 2026" title="Trend report" copy="A living index of the aesthetics, behaviours and underground movements gathering real momentum, compiled by the OGCW desk from its reporting." />
      <main className="page-wrap pb-24">
        <ol className="trend-list">
          {TRENDS.map((trend, index) => (
            <li key={trend.title} className="trend">
              <span className="trend-num">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="trend-title"><T>{trend.title}</T></h2>
              <p className="trend-note"><T>{trend.note}</T></p>
              <p className="trend-read"><T k="trends.read">Read the story</T></p>
              <StoryRow story={stories.pick(trend.slug)} />
            </li>
          ))}
        </ol>
      </main>
    </SiteShell>
  );
}
