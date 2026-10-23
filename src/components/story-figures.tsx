import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Img } from "./cards";
import type { CaptionLook, GalleryLayout, Photo } from "@/data/content";

// Photos inside a story, drawn the same on the site (src/routes/news.$slug.tsx)
// and on the story's copy in the studio (src/sanity/page-previews.tsx):
// one photo with its caption, or photos together, side by side in one row,
// as a slideshow with arrows, or in a grid. A caption can be small, medium
// or large, on the left or centred, plain, in italics or beside a coloured
// bar (chosen per photo in the studio; the story's design sets the usual size).

/** The classes for a caption's look */
export function captionClass(look: CaptionLook) {
  return [
    "og-cap",
    look.captionSize ? `og-cap-${look.captionSize}` : "",
    look.captionAlign === "center" ? "og-cap-center" : "",
    look.captionStyle && look.captionStyle !== "plain" ? `og-cap-${look.captionStyle}` : "",
  ].filter(Boolean).join(" ");
}

const credits = (photos: Photo[]) => [...new Set(photos.map((photo) => photo.credit).filter(Boolean))].join("; ");

/** Photos together. `caption` may be a box to type in (the studio); `onIndex` follows the slideshow */
export function Gallery({ photos, layout = "row", columns = 3, look, caption, empty, onIndex }: {
  photos: Photo[]; layout?: GalleryLayout | undefined; columns?: number | undefined; look: CaptionLook; caption: ReactNode; empty?: ReactNode; onIndex?: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const at = count ? Math.min(index, count - 1) : 0;
  const go = (next: number) => {
    const wrapped = (next + count) % count;
    setIndex(wrapped);
    onIndex?.(wrapped);
  };
  const onKey = (event: KeyboardEvent) => {
    if (layout !== "slider" || count < 2) return;
    if (event.key === "ArrowRight") { event.preventDefault(); go(at + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(at - 1); }
  };
  const credit = layout === "slider" ? photos[at]?.credit : credits(photos);
  const shape = layout === "row" ? `og-gallery-n${Math.min(count, 4)}` : "";

  return (
    <figure className={`og-inline og-gallery og-gallery-${layout} ${shape}`} style={layout === "grid" ? { ["--cols" as string]: String(columns) } : undefined}>
      {count === 0 ? (
        empty
      ) : layout === "slider" ? (
        <div className="og-slides" tabIndex={count > 1 ? 0 : undefined} role="group" aria-roledescription="slideshow" aria-label={`Photo ${at + 1} of ${count}`} onKeyDown={onKey}>
          {photos.map((photo, i) => (
            <span key={`${photo.src}-${i}`} className={`og-slide ${i === at ? "is-on" : ""}`} aria-hidden={i !== at}>
              <Img photo={photo} className="og-slide-photo" />
            </span>
          ))}
          {count > 1 && (
            <>
              <button type="button" className="og-slide-arrow og-slide-prev" aria-label="Previous photo" onClick={() => go(at - 1)}><ChevronLeft size={22} strokeWidth={2} aria-hidden="true" /></button>
              <button type="button" className="og-slide-arrow og-slide-next" aria-label="Next photo" onClick={() => go(at + 1)}><ChevronRight size={22} strokeWidth={2} aria-hidden="true" /></button>
              <span className="og-slide-count" aria-hidden="true">{at + 1} / {count}</span>
            </>
          )}
        </div>
      ) : (
        <span className="og-gallery-photos">
          {photos.map((photo, i) => <Img key={`${photo.src}-${i}`} photo={photo} className="og-gallery-photo" />)}
        </span>
      )}
      {layout === "slider" && count > 1 && (
        <span className="og-slide-dots">
          {photos.map((photo, i) => (
            <button key={`${photo.src}-${i}`} type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === at || undefined} onClick={() => go(i)} />
          ))}
        </span>
      )}
      <figcaption className={captionClass(look)}>
        {caption}
        {credit && <span className="og-cap-credit"> {layout === "slider" || count === 1 ? "Photo" : "Photos"}: {credit}.</span>}
      </figcaption>
    </figure>
  );
}

/** One photo in the story, in one of four sizes */
export function StoryPhoto({ photo, size, look, caption }: { photo: Photo; size?: string | undefined; look: CaptionLook; caption: ReactNode }) {
  return (
    <figure className={`og-inline ${size && size !== "inline" ? `og-inline-${size}` : ""}`}>
      <Img photo={photo} className="og-inline-photo" />
      <figcaption className={captionClass(look)}>{caption}{photo.credit && <span className="og-cap-credit"> Photo: {photo.credit}.</span>}</figcaption>
    </figure>
  );
}
