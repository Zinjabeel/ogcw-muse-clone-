import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell, useSiteMenu } from "./ogcw-layout";
import { SectionHead, StoryCard } from "./cards";
import { LISTS } from "@/data/content";

// 404: inside the normal header and footer, with a way back and the latest
// stories, so a dead link still lands somewhere worth reading.
export function NotFoundPage() {
  return (
    <SiteShell>
      <main className="page-wrap og-404">
        <p className="og-kicker">Error 404</p>
        <h1 className="og-404-title">This page isn’t here.</h1>
        <p className="og-404-copy">The link may be old, or the story may have moved. Search for it, or pick up from the latest news.</p>
        <div className="og-404-actions">
          <Link to="/" className="og-cta">Back to the front page <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link to="/news" className="og-text-button">All the news</Link>
          <SearchButton />
        </div>

        <section className="og-block" aria-labelledby="latest-stories">
          <SectionHead id="latest-stories" title="Latest stories">
            <Link to="/news" className="og-more-link">All news</Link>
          </SectionHead>
          <div className="og-grid-4">
            {LISTS.latest.slice(0, 4).map((story) => <StoryCard key={story.slug} story={story} />)}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

// Opens the site-wide search (it lives in the shell, next to the menu)
function SearchButton() {
  const { openSearch } = useSiteMenu();
  return <button type="button" className="og-text-button" onClick={openSearch}>Search OGCW</button>;
}
