import { Star } from "lucide-react";
import { formatDate, type Article } from "@/data/content";
import { useStories, type StoryLabel } from "@/lib/stories";

// The small print on a story, everywhere it shows: its OGCW label
// (CERTIFIED, TRENDIEST or NEWEST, one at most, and only when it applies),
// the readers' rating once enough have rated it, and the date, or
// "Latest update" for an ongoing story. No reading times, no author names.

// Dates are days, not moments: shown in UTC so they read the same everywhere
const short = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

export function LabelBadge({ label }: { label: StoryLabel | undefined }) {
  if (!label) return null;
  return <span className={`og-label og-label-${label.toLowerCase()}`}>{label}</span>;
}

/** "★ 4.6/5", or nothing until enough readers have rated the story */
export function RatingBadge({ story, count = false }: { story: Article; count?: boolean }) {
  const rating = useStories().rating(story.slug);
  if (!rating) return null;
  return (
    <span className="og-rating" aria-label={`Rated ${rating.average.toFixed(1)} out of 5 by ${rating.count} readers`}>
      <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      {rating.average.toFixed(1)}/5{count && <small> · {rating.count} ratings</small>}
    </span>
  );
}

/** The date it happened, or the latest update for an ongoing story */
export function StoryDate({ story, long = false }: { story: Article; long?: boolean }) {
  const day = story.updated ?? story.date;
  const text = long ? formatDate(day) : short(day);
  return <time dateTime={day} className="og-date">{story.updated ? `Latest update: ${text}` : text}</time>;
}

/** Label, rating and date in one line */
export function StoryMeta({ story, date = true, className = "" }: { story: Article; date?: boolean; className?: string }) {
  const label = useStories().label(story);
  return (
    <span className={`og-meta-line ${className}`}>
      <LabelBadge label={label} />
      <RatingBadge story={story} />
      {date && <StoryDate story={story} />}
    </span>
  );
}
