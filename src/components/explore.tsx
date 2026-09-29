import { Link } from "@tanstack/react-router";
import { useRef, useState, type KeyboardEvent } from "react";
import { LISTS, type Article } from "@/data/content";
import { Img } from "./cards";

// Explore / Discover tabs: Latest, Trending, Most Read, Editor’s Picks and
// Featured, so readers arriving from social or search keep reading. Used at
// the end of the news front and on /explore. Uses the news front’s bs-* styles.

const tabs: { id: string; label: string; stories: Article[] }[] = [
  { id: "latest", label: "Latest", stories: LISTS.latest },
  { id: "trending", label: "Trending", stories: LISTS.trending },
  { id: "most-read", label: "Most Read", stories: LISTS.mostRead },
  { id: "editors-picks", label: "Editor’s Picks", stories: LISTS.editorsPicks },
  { id: "featured", label: "Featured", stories: LISTS.featured },
];

export function Explore({ title = "Explore", idPrefix = "explore" }: { title?: string; idPrefix?: string }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[active]!;
  const [lead, ...rest] = tab.stories as [Article, ...Article[]];

  // Arrow keys move between tabs (the WAI-ARIA tabs pattern)
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const to = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (active + step + tabs.length) % tabs.length;
    if (step === 0 && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    setActive(to);
    tabRefs.current[to]?.focus();
  };

  return (
    <section className="bs-explore" aria-labelledby={`${idPrefix}-title`}>
      <div className="bs-section-head">
        <h3 id={`${idPrefix}-title`} className="bs-eyebrow">{title}</h3>
        <div className="bs-tabs" role="tablist" aria-label="Explore OGCW">
          {tabs.map((t, index) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${t.id}`}
              aria-selected={index === active}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={index === active ? 0 : -1}
              className="bs-tab"
              onClick={() => setActive(index)}
              onKeyDown={onKeyDown}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={tab.id} id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${tab.id}`} className="bs-explore-grid">
        <Link to="/news/$slug" params={{ slug: lead.slug }} className="bs-card bs-explore-lead">
          <span className="bs-explore-lead-media">
            <Img photo={lead.photo} className="bs-photo bs-explore-lead-photo" />
            <span className="bs-explore-badge" aria-hidden="true">01</span>
          </span>
          <p className="bs-eyebrow">{lead.kicker}</p>
          <h4 className="bs-title">{lead.title}</h4>
          <span className="bs-read">{lead.read}</span>
        </Link>

        <ol className="bs-explore-list">
          {rest.map((story, index) => (
            <li key={story.slug}>
              <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card bs-explore-row">
                <span className="bs-explore-num" aria-hidden="true">{String(index + 2).padStart(2, "0")}</span>
                <Img photo={story.photo} className="bs-photo bs-explore-thumb" />
                <span>
                  <span className="bs-eyebrow">{story.kicker}</span>
                  <span className="bs-title">{story.title}</span>
                  <span className="bs-read">{story.read}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
