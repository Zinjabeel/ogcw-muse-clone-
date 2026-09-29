import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { Img, SectionHead, StoryCard } from "../components/cards";
import { ARTICLES, formatDate } from "../data/content";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Journal — OGCW" },
      { name: "description", content: "Essays, interviews and visual stories from One Great Culture World." },
      { property: "og:title", content: "Journal — OGCW" },
      { property: "og:description", content: "Essays, interviews and visual stories from One Great Culture World." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Blog,
});

// The journal: OGCW’s longest reads, longest first, then the essays in progress
const minutes = (read: string) => Number.parseInt(read, 10) || 0;
const [cover, ...longReads] = [...ARTICLES].sort((a, b) => minutes(b.read) - minutes(a.read)).slice(0, 4);

const IN_THE_WORKS = [
  { kind: "Essay · Sound", title: "The value of a room that hasn’t been discovered yet", note: "On small stages, accidental communities and why cultural spaces need time before they need scale." },
  { kind: "Photo essay · Rap", title: "The body becomes part of the stage", note: "What happens to a performer, and a crowd, when the show is built for movement rather than songs." },
  { kind: "Notebook", title: "Who gets to write the history of a scene?", note: "A conversation about memory, documentation and the politics of being first." },
];

function Blog() {
  if (!cover) return null;
  return (
    <SiteShell>
      <PageIntro kicker="The OGCW journal" title="Deep dives" copy="Long-form essays and conversations that make room for context, contradiction and original voices." />
      <main className="page-wrap pb-24">
        <Link to="/news/$slug" params={{ slug: cover.slug }} className="journal-cover">
          <Img photo={cover.photo} className="journal-cover-photo" eager />
          <span className="journal-cover-text">
            <span className="og-kicker">Cover read · {cover.kicker}</span>
            <span className="og-lead-title">{cover.title}</span>
            <span className="og-lead-deck">{cover.deck}</span>
            <span className="og-meta">By {cover.author} · {formatDate(cover.date)} · {cover.read}</span>
            <span className="og-cta">Read it <ArrowRight size={16} aria-hidden="true" /></span>
          </span>
        </Link>

        <section className="og-block" aria-labelledby="long-reads">
          <SectionHead id="long-reads" title="More long reads">
            <Link to="/news" className="og-more-link">All stories</Link>
          </SectionHead>
          <div className="og-grid-3">
            {longReads.map((story) => <StoryCard key={story.slug} story={story} showDeck />)}
          </div>
        </section>

        <section className="og-block" aria-labelledby="in-the-works">
          <SectionHead id="in-the-works" title="In the works" />
          <ol className="journal-works">
            {IN_THE_WORKS.map((piece) => (
              <li key={piece.title}>
                <span className="og-kicker">{piece.kind}</span>
                <span className="journal-works-title">{piece.title}</span>
                <span className="journal-works-note">{piece.note}</span>
                <span className="og-meta">Coming to the journal soon</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
