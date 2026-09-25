import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import type { ReactNode } from "react";

// Hero cards: three tall cards on the plain page background, one per section,
// sitting to the left of the feature panel. Each has a blank image slot; pass
// `image` to fill it later.

type Card = {
  title: string;
  lines: [string, string];
  to: "/news" | "/trends" | "/blog";
  tint: string;
  doodle: ReactNode;
  image?: string;
  imageAlt?: string;
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const cards: Card[] = [
  {
    title: "News",
    lines: ["Latest from the", "culture world"],
    to: "/news",
    tint: "#e4eaf1",
    doodle: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M5 16 L11 12" />
        <path d="M8 21 L12 15" />
        <path d="M3 10 L10 9" />
      </svg>
    ),
  },
  {
    title: "Trends",
    lines: ["What's moving", "right now"],
    to: "/trends",
    tint: "#fbeff3",
    doodle: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M4 18 C7 18 7 12 10 12 C13 12 13 16 16 16 C19 16 19 8 20 5" />
        <path d="M17 5 H20 V8" />
      </svg>
    ),
  },
  {
    title: "Blog",
    lines: ["Long reads,", "no shortcuts"],
    to: "/blog",
    tint: "#e9e8fb",
    doodle: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M12 3 C12.6 8.5 15.5 11.4 21 12 C15.5 12.6 12.6 15.5 12 21 C11.4 15.5 8.5 12.6 3 12 C8.5 11.4 11.4 8.5 12 3 Z" />
      </svg>
    ),
  },
];

export function HeroCards() {
  const total = String(cards.length).padStart(2, "0");

  return (
    <nav className="hero-cards" aria-label="Explore OGCW">
      <ul className="hc-track">
        {cards.map((card, index) => (
          <li key={card.title} className="hc-item" style={{ ["--i" as string]: index }}>
            <Link to={card.to} className="hc-card" style={{ ["--tint" as string]: card.tint }}>
              <span className="hc-head">
                <span className="hc-title">
                  {card.title}
                  <span className="hc-doodle" aria-hidden="true">{card.doodle}</span>
                </span>
                <span className="hc-lines">
                  <span>{card.lines[0]}</span>
                  <span>{card.lines[1]}</span>
                </span>
              </span>

              <span className="hc-media">
                {card.image ? (
                  <img src={card.image} alt={card.imageAlt ?? ""} />
                ) : (
                  <span className="hc-placeholder" role="img" aria-label="Image coming soon">
                    <ImageIcon size={22} strokeWidth={1.25} aria-hidden="true" />
                  </span>
                )}
              </span>

              <span className="hc-foot">
                <span className="hc-count" aria-label={`Section ${index + 1} of ${cards.length}`}>
                  <span className="hc-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="hc-bar" aria-hidden="true">
                    <span className="hc-bar-fill" style={{ ["--fill" as string]: (index + 1) / cards.length }} />
                  </span>
                  <span className="hc-total">{total}</span>
                </span>
                <span className="hc-button" aria-hidden="true">
                  <ArrowUpRight size={20} strokeWidth={1.75} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
