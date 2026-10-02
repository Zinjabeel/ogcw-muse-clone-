import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell, useSiteMenu } from "./ogcw-layout";
import { SectionHead, StoryCard } from "./cards";
import { useStories } from "@/lib/stories";
import { T } from "./site-text";

// 404: inside the normal header and footer, with a way back and the latest
// stories, so a dead link still lands somewhere worth reading.
export function NotFoundPage() {
  const stories = useStories();
  return (
    <SiteShell>
      <main className="page-wrap og-404">
        <p className="og-kicker"><T k="404.kicker">Error 404</T></p>
        <h1 className="og-404-title"><T k="404.title">This page isn’t here.</T></h1>
        <p className="og-404-copy"><T k="404.copy">The link may be old, or the story may have moved. Search for it, or pick up from the latest news.</T></p>
        <div className="og-404-actions">
          <Link to="/" className="og-cta"><T k="404.back">Back to the front page</T> <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link to="/news" className="og-text-button"><T k="404.all">All the news</T></Link>
          <SearchButton />
        </div>

        <section className="og-block" aria-labelledby="latest-stories">
          <SectionHead id="latest-stories" title="Latest stories">
            <Link to="/news" className="og-more-link"><T k="404.all-news">All news</T></Link>
          </SectionHead>
          <div className="og-grid-4">
            {stories.latest.slice(0, 4).map((story) => <StoryCard key={story.slug} story={story} />)}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

// Opens the site-wide search (it lives in the shell, next to the menu)
function SearchButton() {
  const { openSearch } = useSiteMenu();
  return <button type="button" className="og-text-button" onClick={openSearch}><T k="404.search">Search OGCW</T></button>;
}
