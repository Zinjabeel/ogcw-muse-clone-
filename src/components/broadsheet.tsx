import { Link } from "@tanstack/react-router";
import type { Article, Photo as PhotoData } from "@/data/content";
import { StoryMeta } from "./story-meta";

// Shared pieces of the broadsheet (bs-*) look: the OGCW News front on the
// home page, its This week block, and the News page all use these, so a
// story card reads the same wherever it appears.

/** A story's label, rating and date under its headline (src/components/story-meta.tsx) */
export const Meta = ({ story, date = true }: { story: Article; date?: boolean }) => <StoryMeta story={story} date={date} className="bs-read" />;

/** A story photo, cropped by the story's focal point and zoom */
export function BsPhoto({ photo, className, eager = false }: { photo: PhotoData; className?: string; eager?: boolean }) {
  const crop = photo.crop ?? { pos: "50% 50%" };
  return (
    <div className={`bs-photo ${className ?? ""}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading={eager ? "eager" : "lazy"}
        style={{ objectPosition: crop.pos, ["--zoom" as string]: String(crop.zoom ?? 1), ["--origin" as string]: crop.pos }}
      />
    </div>
  );
}

/** The standard card: photo, label, headline, then label, rating and date */
export function StoryCard({ story, photoClass, hidden = false }: { story: Article; photoClass: string; hidden?: boolean }) {
  return (
    <Link to="/news/$slug" params={{ slug: story.slug }} className="bs-card" tabIndex={hidden ? -1 : undefined}>
      <BsPhoto photo={story.photo} className={photoClass} />
      <p className="bs-eyebrow">{story.kicker}</p>
      <h4 className="bs-title">{story.title}</h4>
      <Meta story={story} />
    </Link>
  );
}

/** "30 Sept" (a day, in UTC) */
export const shortDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
