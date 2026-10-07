import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { EpisodeCard, episodeLabel, Poster } from "../components/cards";
import { EPISODES, formatDate } from "../data/content";
import { T } from "@/components/site-text";

export const Route = createFileRoute("/originals/")({
  head: () => ({
    meta: [
      { title: "OGCW Originals — OGCW" },
      { name: "description", content: "The conversations worth your time: long-form interviews and podcasts with rappers, streamers and stars, picked by OGCW." },
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
      <PageIntro kicker="Picked by OGCW" title="Originals" copy="The conversations worth your time: long-form interviews and podcasts with rappers, streamers and stars. Every episode plays from its creator’s official channel." />
      <main className="page-wrap pb-24">
        {featured && (
          <Link to="/originals/$slug" params={{ slug: featured.slug }} className="og-feature">
            <Poster episode={featured} size="lg" />
            <span className="og-feature-text">
              <span className="og-kicker"><T>Watch first ·</T> {episodeLabel(featured)}</span>
              <span className="og-lead-title"><T>{featured.title}</T></span>
              <span className="og-lead-deck"><T>{featured.summary}</T></span>
              <span className="og-meta">{featured.guest} · {featured.length} · {formatDate(featured.date)}</span>
              <span className="og-cta"><T k="originals.open">Open the episode</T> <ArrowRight size={16} aria-hidden="true" /></span>
            </span>
          </Link>
        )}

        <section className="og-block" aria-labelledby="all-episodes">
          <div className="og-section-head">
            <h2 id="all-episodes" className="og-section-title"><T k="originals.all">All episodes</T></h2>
          </div>
          <div className="og-filters" role="group" aria-label="Filter by show">
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
