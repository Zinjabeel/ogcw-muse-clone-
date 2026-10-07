import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { ExploreMix } from "../components/explore-mix";
import { HitLink, hitLabel, hitSub, hitTitle, Img, StoryRow } from "../components/cards";
import { searchSite } from "../data/content";
import { useStories } from "../lib/stories";
import { T } from "@/components/site-text";

// Explore hub: search across everything, the Explore mix, curated reading
// lists and a directory of every section.
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
  { label: "News", note: "Every story, newest first", el: (c: string) => <Link to="/news" className={c}><T>News</T></Link> },
  { label: "Music", note: "Releases, tours and awards", el: (c: string) => <Link to="/music" className={c}><T>Music</T></Link> },
  { label: "Games", note: "Launches and showcases", el: (c: string) => <Link to="/games" className={c}><T>Games</T></Link> },
  { label: "Streaming", note: "Creators and records", el: (c: string) => <Link to="/streaming" className={c}><T>Streaming</T></Link> },
  { label: "Culture", note: "Fashion, TV and sneakers", el: (c: string) => <Link to="/culture" className={c}><T>Culture</T></Link> },
  { label: "Originals", note: "Interviews and podcasts", el: (c: string) => <Link to="/originals" className={c}><T>Originals</T></Link> },
  { label: "Shop", note: "The OGCW edit", el: (c: string) => <Link to="/shop" className={c}><T>Shop</T></Link> },
  { label: "Trends", note: "The culture index", el: (c: string) => <Link to="/trends" className={c}><T>Trends</T></Link> },
];

function ExplorePage() {
  const [query, setQuery] = useState("");
  const stories = useStories();
  const hits = searchSite(query, stories.all);

  return (
    <SiteShell>
      <PageIntro kicker="Explore" title="Explore" copy="Search everything, see what people are reading right now, or follow one of our reading lists." />
      <main className="page-wrap pb-24">
        <div className="og-explore-search">
          <Search size={22} strokeWidth={1.5} aria-hidden="true" />
          <label htmlFor="explore-q" className="sr-only"><T>Search OGCW</T></label>
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
          <ExploreMix title="Right now" idPrefix="explore-page" />
        </div>

        <section className="og-block" aria-labelledby="reading-lists">
          <div className="og-section-head">
            <h2 id="reading-lists" className="og-section-title"><T k="explore.lists">Reading lists</T></h2>
          </div>
          <div className="og-lists">
            {stories.readingLists.map((list, index) => (
              <article key={list.id} className="og-list">
                <Img photo={list.cover ?? list.items[0]!.photo} className="og-list-cover" />
                <p className="og-kicker"><T>Reading list</T> {String(index + 1).padStart(2, "0")} · {list.items.length} stories</p>
                <h3 className="og-list-title"><T>{list.title}</T></h3>
                <p className="og-list-note"><T>{list.note}</T></p>
                <ol className="og-aside-list">
                  {list.items.map((story, i) => <li key={story.slug}><StoryRow story={story} index={i} /></li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="og-block" aria-labelledby="directory">
          <div className="og-section-head">
            <h2 id="directory" className="og-section-title"><T k="explore.directory">Everything on OGCW</T></h2>
          </div>
          <ul className="og-directory">
            {DIRECTORY.map((d) => (
              <li key={d.label}>
                {d.el("og-directory-link")}
                <span className="og-directory-note"><T>{d.note}</T> <ArrowRight size={14} aria-hidden="true" /></span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
