import { Link } from "@tanstack/react-router";
import { useRef, useState, type KeyboardEvent } from "react";
import { storyIndex as s, type Story } from "./nav-drawer";

// Explore / Discover (requirements doc): besides the categories, readers can
// find more through Latest, Trending, Most Read, Editor's Picks and Featured,
// so someone arriving from social or Google keeps reading. Sits at the end of
// the news front and uses its bs-* styles.
// TODO: fill each list from the admin panel / analytics once articles exist.

const tabs: { id: string; label: string; stories: Story[] }[] = [
  { id: "latest", label: "Latest", stories: [s.cee, s.vedan, s.labels, s.bars, s.objects] },
  { id: "trending", label: "Trending", stories: [s.vedan, s.cee, s.print, s.labels, s.bars] },
  { id: "most-read", label: "Most Read", stories: [s.bars, s.cee, s.objects, s.vedan, s.brutalism] },
  { id: "editors-picks", label: "Editor's Picks", stories: [s.brutalism, s.scenes, s.print, s.labels, s.objects] },
  { id: "featured", label: "Featured", stories: [s.labels, s.cee, s.scenes, s.objects, s.bars] },
];

// "Music / 7 min read" -> ["Music", "7 min read"]
const split = (sub: string) => sub.split(" / ") as [string, string];

function Img({ story, className }: { story: Story; className: string }) {
  const crop = story.crop ?? { pos: "50% 50%", zoom: 1 };
  return (
    <span className={`bs-photo ${className}`}>
      <img src={story.image} alt="" loading="lazy" style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom), ["--origin" as string]: crop.pos }} />
    </span>
  );
}

export function Explore() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[active]!;
  const [lead, ...rest] = tab.stories as [Story, ...Story[]];
  const [leadSection, leadRead] = split(lead.sub);

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
    <section className="bs-explore" aria-labelledby="explore-title">
      <div className="bs-section-head">
        <h3 id="explore-title" className="bs-eyebrow">Explore</h3>
        <div className="bs-tabs" role="tablist" aria-label="Explore OGCW">
          {tabs.map((t, index) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              type="button"
              role="tab"
              id={`explore-tab-${t.id}`}
              aria-selected={index === active}
              aria-controls="explore-panel"
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

      <div key={tab.id} id="explore-panel" role="tabpanel" aria-labelledby={`explore-tab-${tab.id}`} className="bs-explore-grid">
        <Link to="/news" className="bs-card bs-explore-lead">
          <span className="bs-explore-lead-media">
            <Img story={lead} className="bs-explore-lead-photo" />
            <span className="bs-explore-badge" aria-hidden="true">01</span>
          </span>
          <p className="bs-eyebrow">{leadSection}</p>
          <h4 className="bs-title">{lead.title}</h4>
          <span className="bs-read">{leadRead}</span>
        </Link>

        <ol className="bs-explore-list">
          {rest.map((story, index) => {
            const [section, read] = split(story.sub);
            return (
              <li key={story.title}>
                <Link to="/news" className="bs-card bs-explore-row">
                  <span className="bs-explore-num" aria-hidden="true">{String(index + 2).padStart(2, "0")}</span>
                  <Img story={story} className="bs-explore-thumb" />
                  <span>
                    <span className="bs-eyebrow">{section}</span>
                    <span className="bs-title">{story.title}</span>
                    <span className="bs-read">{read}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
