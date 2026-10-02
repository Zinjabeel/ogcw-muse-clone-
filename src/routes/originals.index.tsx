import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { EpisodeCard, Poster } from "../components/cards";
import { EPISODES } from "../data/content";
import { T } from "@/components/site-text";

export const Route = createFileRoute("/originals/")({
  head: () => ({
    meta: [
      { title: "OGCW Originals — OGCW" },
      { name: "description", content: "Exclusive OGCW-made video: interviews, reportage, lists and analysis you won’t find anywhere else." },
      { property: "og:title", content: "OGCW Originals" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Originals,
});

const SERIES = ["All", ...Array.from(new Set(EPISODES.map((e) => e.series)))];

function Originals() {
  const [series, setSeries] = useState("All");
  const [featured] = EPISODES;
  const list = series === "All" ? EPISODES : EPISODES.filter((e) => e.series === series);

  return (
    <SiteShell>
      <PageIntro kicker="OGCW Originals" title="Originals" copy="Exclusive OGCW-made video: interviews, reportage, countdowns and short documentaries you won’t find anywhere else." />
      <main className="page-wrap pb-24">
        {featured && (
          <Link to="/originals/$slug" params={{ slug: featured.slug }} className="og-feature">
            <Poster episode={featured} size="lg" />
            <span className="og-feature-text">
              <span className="og-kicker">Up next · {featured.series}</span>
              <span className="og-lead-title">{featured.title}</span>
              <span className="og-lead-deck">{featured.summary}</span>
              <span className="og-meta">{featured.kind} · {featured.length} · Coming soon</span>
              <span className="og-cta"><T k="originals.open">Open the episode</T> <ArrowRight size={16} aria-hidden="true" /></span>
            </span>
          </Link>
        )}

        <section className="og-block" aria-labelledby="all-episodes">
          <div className="og-section-head">
            <h2 id="all-episodes" className="og-section-title"><T k="originals.all">All episodes</T></h2>
          </div>
          <div className="og-filters" role="group" aria-label="Filter by series">
            {SERIES.map((s) => (
              <button key={s} type="button" className="og-chip" aria-pressed={series === s} onClick={() => setSeries(s)}>{s}</button>
            ))}
          </div>
          <div key={series} className="og-grid-3">
            {list.map((episode) => <EpisodeCard key={episode.slug} episode={episode} />)}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
