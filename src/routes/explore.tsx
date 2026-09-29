import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { Explore } from "../components/explore";
import { HitLink, hitLabel, hitSub, hitTitle, Img, StoryRow } from "../components/cards";
import { READING_LISTS, searchSite } from "../data/content";

// Explore hub: search across everything, the Latest / Trending / Most Read
// tabs, curated reading lists and a directory of every section.
export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — OGCW" },
      { name: "description", content: "Search OGCW, browse what’s trending and follow curated reading lists across music, culture, Originals and the shop." },
      { property: "og:title", content: "Explore — OGCW" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ExplorePage,
});

const DIRECTORY = [
  { label: "News", note: "Every story, newest first", el: (c: string) => <Link to="/news" className={c}>News</Link> },
  { label: "Music", note: "Rap, rumba and live", el: (c: string) => <Link to="/music" className={c}>Music</Link> },
  { label: "Culture", note: "Style, design, nightlife", el: (c: string) => <Link to="/culture" className={c}>Culture</Link> },
  { label: "Originals", note: "OGCW-made video", el: (c: string) => <Link to="/originals" className={c}>Originals</Link> },
  { label: "Shop", note: "The OGCW edit", el: (c: string) => <Link to="/shop" className={c}>Shop</Link> },
  { label: "Trends", note: "The culture index", el: (c: string) => <Link to="/trends" className={c}>Trends</Link> },
];

function ExplorePage() {
  const [query, setQuery] = useState("");
  const hits = searchSite(query);

  return (
    <SiteShell>
      <PageIntro kicker="Explore" title="Explore" copy="Search everything, see what people are reading right now, or follow one of our reading lists." />
      <main className="page-wrap pb-24">
        <div className="og-explore-search">
          <Search size={22} strokeWidth={1.5} aria-hidden="true" />
          <label htmlFor="explore-q" className="sr-only">Search OGCW</label>
          <input id="explore-q" type="search" placeholder="Search stories, Originals and shops" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </div>
        {query.trim() && (
          <div className="og-hits" aria-live="polite">
            <p className="og-aside-title">{hits.length ? `${hits.length} ${hits.length === 1 ? "result" : "results"}` : `Nothing matches “${query.trim()}” yet`}</p>
            <ul>
              {hits.map((hit) => (
                <li key={hit.kind + hit.item.slug} className="og-hit">
                  <span className="og-hit-type">{hitLabel(hit)}</span>
                  <span className="og-hit-text">
                    <HitLink hit={hit} className="og-hit-link">{hitTitle(hit)}</HitLink>
                    <span className="og-meta">{hitSub(hit)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="og-block">
          <Explore title="Right now" idPrefix="explore-page" />
        </div>

        <section className="og-block" aria-labelledby="reading-lists">
          <div className="og-section-head">
            <h2 id="reading-lists" className="og-section-title">Reading lists</h2>
          </div>
          <div className="og-lists">
            {READING_LISTS.map((list, index) => (
              <article key={list.id} className="og-list">
                <Img photo={list.cover ?? list.items[0]!.photo} className="og-list-cover" />
                <p className="og-kicker">Reading list {String(index + 1).padStart(2, "0")} · {list.items.length} stories</p>
                <h3 className="og-list-title">{list.title}</h3>
                <p className="og-list-note">{list.note}</p>
                <ol className="og-aside-list">
                  {list.items.map((story, i) => <li key={story.slug}><StoryRow story={story} index={i} /></li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="og-block" aria-labelledby="directory">
          <div className="og-section-head">
            <h2 id="directory" className="og-section-title">Everything on OGCW</h2>
          </div>
          <ul className="og-directory">
            {DIRECTORY.map((d) => (
              <li key={d.label}>
                {d.el("og-directory-link")}
                <span className="og-directory-note">{d.note} <ArrowRight size={14} aria-hidden="true" /></span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
