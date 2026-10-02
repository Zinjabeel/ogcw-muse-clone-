import { ArrowUpRight, Play } from "lucide-react";
import { AWARDS_SOURCE, CONTENT_OF_THE_MONTH, youtubeThumb, youtubeUrl } from "@/data/content";
import { T } from "./site-text";

// Content of the month: the creators who won the year's top streaming awards,
// ranked. First place takes the big card on the left; second to fifth sit in
// a two-by-two grid beside it. Each card opens a recent video from the
// creator's own channel.

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export function ContentOfTheMonth({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <section className="cotm" aria-labelledby="cotm-title">
      <div className="bs-section-head">
        <Heading id="cotm-title" className="bs-eyebrow cotm-heading"><T k="cotm.title">Content of the month</T></Heading>
        <a href={AWARDS_SOURCE.url} className="bs-more" target="_blank" rel="noopener noreferrer"><T k="cotm.link">The Streamer Awards winners</T></a>
      </div>
      <ol className="cotm-grid">
        {CONTENT_OF_THE_MONTH.map((creator) => (
          <li key={creator.name} className="cotm-item" data-rank={creator.rank}>
            <a className="cotm-card" href={youtubeUrl(creator.video)} target="_blank" rel="noopener noreferrer">
              <span className="cotm-thumb">
                <img src={youtubeThumb(creator.video)} alt="" loading="lazy" />
                <span className="cotm-rank"><span className="sr-only"><T>Ranked</T> </span>{ordinal(creator.rank)}</span>
                <span className="cotm-play" aria-hidden="true"><Play size={15} fill="currentColor" strokeWidth={0} /></span>
              </span>
              <span className="cotm-text">
                <span className="cotm-honour">{creator.honour}</span>
                <span className="cotm-name"><T>{creator.name}</T></span>
                <span className="cotm-awards">{creator.awards.join(" · ")}</span>
                <span className="cotm-video"><span className="sr-only"><T>Watch:</T> </span>{creator.videoTitle}<ArrowUpRight size={13} aria-hidden="true" /></span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
