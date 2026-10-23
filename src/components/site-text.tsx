import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Camera, Check, ClipboardPaste, Copy, Crop, Eye, EyeOff, Film, ImagePlus, Loader2, Maximize2, MousePointerClick, Move, PenLine, Play, Plus, RefreshCw, Repeat, RotateCcw, Scaling, Scissors, Search, SkipBack, SkipForward, Sparkles, Sun, Trash2, Undo2, Upload, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ImgHTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { adminClient, studioToken } from "@/lib/admin-sanity";
import { itemKey, layoutKey, layoutStyle, storyKey, useSiteText, type EditMeta, type LayoutPos, type Pending, type SectionKind, type SiteContent, type SiteCrop, type SiteImage, type SiteLayout, type StoryField } from "@/lib/site-text";
import { pageSection, sectionOfKey, type SiteSection } from "@/lib/site-sections";
import { refreshSiteCache } from "@/lib/sanity-stories";
import { useStories } from "@/lib/stories";
import { useWorkAccess } from "@/lib/work";
import { StoryCard } from "./broadsheet";
import { DesignNotes } from "./design-notes";

// Editing the site on the page, for admins (src/lib/site-text.tsx).
//   <T k="home.news.title">OGCW News</T>      a text anyone sees, an admin can change
//   <S story={story} f="title" />             a story's label, headline or summary
//   <EditableImage k="hero.card.news" … />    a photo with its own name
// Logged in as an admin, point at (or, on a phone, tap) any text and an
// "Edit" button appears beside it: press it and type (Enter to finish, Esc to
// cancel). Every picture gets "Change photo": upload one from the computer,
// or from Photos, Files or the camera on a phone. Every section gets "Section
// size": drag its edges to make it, and its background, wider or narrower,
// taller or shorter. A bar collects the changes: Undo, Discard, Save.
// Saving puts them live for everyone. In the studio each change is a "Site
// edit" filed under the part of the site it's in (<EditSection name="Hero">,
// src/lib/site-sections.ts), and every save is kept as a version ("Site
// history"), restorable for 30 days; story changes go to the story itself
// (with its own history in the studio).

const HISTORY_DAYS = 30;
const START_EVENT = "ogcw-edit-start";
const END_EVENT = "ogcw-edit-end";
const OFF_KEY = "ogcw-edit-buttons-off";
const STORY_LIMITS: Record<StoryField, number> = { kicker: 40, title: 140, deck: 240 };
const STORY_NAMES: Record<StoryField, string> = { kicker: "label", title: "headline", deck: "summary" };

/** "*word*" in a site text shows in italics, as in the usual wording */
function rich(value: string): ReactNode {
  if (!value.includes("*")) return value;
  return value.split(/\*([^*]+)\*/).map((part, index) => (index % 2 ? <em key={index}>{part}</em> : part));
}

// Which part of the site the texts inside belong to, for filing their edits
const SectionContext = createContext<SiteSection | null>(null);
export function EditSection({ name, children }: { name: SiteSection; children: ReactNode }) {
  return <SectionContext.Provider value={name}>{children}</SectionContext.Provider>;
}
const useSection = () => useContext(SectionContext);
const sectionNow = (section: SiteSection | null) => section ?? pageSection(window.location.pathname);
const slugOf = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** A short, steady name made from a text's usual wording and its part of the site */
function autoKey(text: string, section: SiteSection | null) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `auto.${section ? `${slugOf(section)}.` : ""}${(hash >>> 0).toString(36)}`;
}

/**
 * A text from the site: its usual wording, or what an admin changed it to.
 * Without a name (`k`), the name comes from the usual wording, so the same
 * wording changes everywhere it's used in that part of the site (e.g. every
 * "Play on Spotify" in Explore).
 */
export function T({ k, children }: { k?: string; children: string | number | undefined }) {
  const site = useSiteText();
  const section = useSection();
  const usualRaw = String(children ?? "");
  // Spaces around the words stay where the page put them
  const [, before = "", usual = "", after = ""] = usualRaw.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? [];
  const key = k ?? autoKey(usual, section);
  const value = site.text(key) ?? usual;
  const thing = `t:${key}`;
  const layout = site.layout(thing);
  if (!usual) return <>{usualRaw}</>;
  if (!site.editing) return <>{before}{layout ? <span className="site-lay site-lay-inline" style={layoutStyle(layout)}>{rich(value)}</span> : rich(value)}{after}</>;
  return (
    <>
      {before}
      <Editable
        thing={thing}
        layout={layout}
        value={value}
        display={rich(value)}
        changed={value !== usual}
        hint={value !== usual ? `Edited · usual: “${usual}”` : undefined}
        onCommit={(next) => site.change(key, "text", next === usual ? null : next, { section: sectionNow(section), page: window.location.pathname, usual })}
      />
      {after}
    </>
  );
}

type StoryLike = { slug: string; title: string; deck: string; kicker: string };

/**
 * A story's label, headline or summary where it's shown on the site. An
 * admin's change goes to the story itself, so it changes everywhere.
 * `children` can lay the words out (the cover's headline lines).
 */
export function S({ story, f, children }: { story: StoryLike; f: StoryField; children?: (value: string) => ReactNode }) {
  const site = useSiteText();
  const usual = story[f];
  const value = site.story(story.slug, f) ?? usual;
  const display = children ? children(value) : value;
  const thing = `s:${storyKey(story.slug, f)}`;
  const layout = site.layout(thing);
  if (!site.editing) return layout ? <span className="site-lay site-lay-inline" style={layoutStyle(layout)}>{display}</span> : <>{display}</>;
  return (
    <Editable
      thing={thing}
      layout={layout}
      value={value}
      display={display}
      changed={value !== usual}
      max={STORY_LIMITS[f]}
      hint={`The story’s ${STORY_NAMES[f]}: changing it changes it everywhere`}
      onCommit={(next) => site.change(storyKey(story.slug, f), "story", next === usual ? null : next)}
    />
  );
}

function Editable({ thing, layout, value, display, changed, max, hint, onCommit }: { thing: string; layout: SiteLayout | undefined; value: string; display: ReactNode; changed: boolean; max?: number; hint?: string | undefined; onCommit: (next: string) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [over, setOver] = useState(false);

  // The page's Edit button asks this text to start
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = () => setActive(true);
    el.addEventListener(START_EVENT, start);
    return () => el.removeEventListener(START_EVENT, start);
  }, [active]);
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, [active]);

  const finish = () => {
    const next = (ref.current?.textContent ?? "").replace(/\s+/g, " ").trim();
    setActive(false);
    setOver(false);
    window.dispatchEvent(new Event(END_EVENT));
    if (!next || next === value) return;
    onCommit(max ? next.slice(0, max) : next);
  };

  return (
    <span
      // Remounts between reading and typing, so React never fights the typed text
      key={active ? "typing" : "reading"}
      ref={ref}
      className={`site-t${active ? " is-active" : ""}${changed ? " is-changed" : ""}${over ? " is-over" : ""}${layout ? " site-lay site-lay-inline" : ""}`}
      style={layoutStyle(layout)}
      data-edit=""
      data-lay={thing}
      data-hint={hint}
      data-left={active && max ? max : undefined}
      contentEditable={active ? "plaintext-only" : undefined}
      suppressContentEditableWarning
      role={active ? "textbox" : undefined}
      aria-label={active ? "Edit this text" : undefined}
      onClick={(event) => {
        // Typing inside a link or button doesn't follow it
        if (!active) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onInput={(event) => {
        if (!max) return;
        setOver((event.currentTarget.textContent ?? "").trim().length > max);
      }}
      onKeyDown={(event) => {
        if (!active) return;
        event.stopPropagation();
        if (event.key === "Enter") { event.preventDefault(); ref.current?.blur(); }
        if (event.key === "Escape") { if (ref.current) ref.current.textContent = value; ref.current?.blur(); }
      }}
      onBlur={() => { if (active) finish(); }}
    >
      {active ? value : display}
    </span>
  );
}

/** A photo from the site: its usual one, or the one an admin put in its place */
export function EditableImage({ k, src, alt, className, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { k: string; src: string; alt: string }) {
  const site = useSiteText();
  const section = useSection();
  const swap = site.image(k);
  const shown = { ...rest, src: swap?.src ?? src, alt: swap?.alt ?? alt, style: swap?.fit === "contain" ? { ...rest.style, objectFit: "contain" as const } : rest.style };
  if (!site.editing) return <img {...shown} className={className} data-img-key={k} />;
  return <img {...shown} className={`${className ?? ""} site-img${swap ? " is-changed" : ""}`} data-img-key={k} data-edit-img={k} data-edit-section={section ?? undefined} data-usual={src} data-swapped={swap ? "" : undefined} />;
}

// ---------------------------------------------------------------- Moving and resizing
// Texts carry their move themselves (<T>, <S>: the .site-lay CSS variables).
// Pictures can be any <img> on the page, so their moves are put on the page
// here: the picture's box (the picture and any wrappers the same size as it,
// such as a card's link) is shifted and scaled with inline translate/scale,
// which leave the page's own transforms (the card tilt) alone.

const BP_QUERY = "(min-width: 1024px)";
const bpNow = (): "d" | "m" => (window.matchMedia(BP_QUERY).matches ? "d" : "m");
const SITE_UI = ".site-edit, .site-blk-ui, .site-photo-menu, .site-savebar, .site-edit-btn, .site-lay-handle, .site-sec-pill, .site-sec-bar, .site-sec-handle, .dn-layer, .dn-bar";

/** A picture's box: the picture, or the wrappers around it that are the same size */
function frameOf(img: HTMLElement): HTMLElement {
  let el = img;
  const r = img.getBoundingClientRect();
  for (let p = img.parentElement; p && !/^(BODY|MAIN|SECTION|HEADER|FOOTER|UL|OL)$/.test(p.tagName); p = p.parentElement) {
    const pr = p.getBoundingClientRect();
    if (Math.abs(pr.width - r.width) > 4 || Math.abs(pr.height - r.height) > 4) break;
    el = p;
  }
  return el;
}

const normSrc = (src: string | null) => {
  if (!src) return "";
  try {
    const url = new URL(src, window.location.href);
    return (url.origin === window.location.origin ? "" : url.host) + url.pathname;
  } catch {
    return src;
  }
};
/** A picture's usual address, even after it has been replaced on the page */
const srcOf = (img: HTMLImageElement) => img.dataset["origSrc"] ?? img.getAttribute("src");
/** A picture's name on its page: its site name, or its file and which copy of it this is */
function thingOfImage(img: HTMLImageElement): string {
  if (img.dataset["imgKey"]) return `i:${img.dataset["imgKey"]}`;
  const src = normSrc(srcOf(img));
  const same = [...document.images].filter((item) => !item.dataset["imgKey"] && normSrc(srcOf(item)) === src);
  return `src:${src}#${Math.max(0, same.indexOf(img))}`;
}
function findImage(thing: string): HTMLImageElement | undefined {
  if (thing.startsWith("i:")) return document.querySelector<HTMLImageElement>(`img[data-img-key="${CSS.escape(thing.slice(2))}"]`) ?? undefined;
  const [src = "", n = "0"] = thing.slice(4).split("#");
  return [...document.images].filter((item) => !item.dataset["imgKey"] && normSrc(srcOf(item)) === src)[Number(n)];
}

/** True once React has taken over an element from the server's HTML (it keeps its own links on it) */
const hydrated = (el: Element) => Object.keys(el).some((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactProps$"));

/** The edit that replaces a picture everywhere: named after its usual address */
function pictureKey(usual: string) {
  let hash = 5381;
  for (let i = 0; i < usual.length; i += 1) hash = ((hash << 5) + hash + usual.charCodeAt(i)) | 0;
  return `pic.${(hash >>> 0).toString(36)}`;
}

/** Puts a replacement in a picture's place (none: back to its usual one), and its fit and clearness */
function showPicture(img: HTMLImageElement, picture: SiteImage | undefined, own: boolean) {
  const data = img.dataset;
  // The page changed the picture itself since it was replaced (a carousel moving on): start again
  if (data["swapSrc"] !== undefined && img.getAttribute("src") !== data["swapSrc"]) {
    delete data["swapSrc"];
    delete data["origSrc"];
    delete data["origSrcset"];
  }
  if (!own) {
    if (picture) {
      if (data["swapSrc"] === undefined) {
        data["origSrc"] = img.getAttribute("src") ?? "";
        const set = img.getAttribute("srcset");
        if (set) { data["origSrcset"] = set; img.removeAttribute("srcset"); }
      }
      data["swapSrc"] = picture.src;
      if (img.getAttribute("src") !== picture.src) img.setAttribute("src", picture.src);
    } else if (data["swapSrc"] !== undefined) {
      img.setAttribute("src", data["origSrc"] ?? "");
      if (data["origSrcset"]) img.setAttribute("srcset", data["origSrcset"]);
      delete data["swapSrc"];
      delete data["origSrc"];
      delete data["origSrcset"];
    }
    img.style.objectFit = picture?.fit === "contain" ? "contain" : picture ? "cover" : "";
  }
  cropPicture(img, picture?.crop);
  videoOver(img, picture);
  // Clear: the picture at full strength, without the dark wash over it (a
  // hidden picture, e.g. in the closed menu, has no box to clear around it)
  const shown = img.getBoundingClientRect().width > 0;
  for (const el of new Set(shown ? [img, frameOf(img), img.parentElement] : [img])) {
    if (!el) continue;
    if (picture?.clear) el.setAttribute("data-pic-clear", "");
    else el.removeAttribute("data-pic-clear");
  }
}

/**
 * A crop by hand: the point kept in the middle and the zoom (the page's own
 * --zoom and --origin, which its cards already zoom from on hover; styles.css,
 * img[data-pic-crop]). Without one, the picture is back to the page's own crop.
 */
function cropPicture(img: HTMLImageElement, crop: SiteCrop | undefined) {
  const data = img.dataset;
  if (crop) {
    if (data["picCrop"] === undefined) {
      data["origPos"] = img.style.objectPosition;
      data["origZoom"] = img.style.getPropertyValue("--zoom");
      data["origOrigin"] = img.style.getPropertyValue("--origin");
    }
    const pos = `${crop.x}% ${crop.y}%`;
    data["picCrop"] = "";
    img.style.objectPosition = pos;
    img.style.setProperty("--zoom", String(crop.zoom));
    img.style.setProperty("--origin", pos);
  } else if (data["picCrop"] !== undefined) {
    img.style.objectPosition = data["origPos"] ?? "";
    if (data["origZoom"]) img.style.setProperty("--zoom", data["origZoom"]);
    else img.style.removeProperty("--zoom");
    if (data["origOrigin"]) img.style.setProperty("--origin", data["origOrigin"]);
    else img.style.removeProperty("--origin");
    for (const name of ["picCrop", "origPos", "origZoom", "origOrigin"]) delete data[name];
  }
}

/** A video's trim, from its data-trim ("start|end|once") */
const trimOf = (video: HTMLVideoElement) => {
  const [start = "0", end = "", once = "0"] = (video.dataset["trim"] ?? "").split("|");
  return { start: Number(start) || 0, end: end ? Number(end) : null, once: once === "1" };
};
/**
 * Plays only the chosen part of a video: from its start to its end, then
 * back to the start (or, played once, it stops on the end's frame)
 */
function playTrimmed(video: HTMLVideoElement) {
  video.loop = false;
  const atEnd = () => {
    const { start, once } = trimOf(video);
    if (once) { video.pause(); return; }
    video.currentTime = start;
    void video.play().catch(() => {});
  };
  video.addEventListener("loadedmetadata", () => {
    const { start } = trimOf(video);
    if (start && start < video.duration) video.currentTime = start;
  });
  video.addEventListener("timeupdate", () => {
    const { end } = trimOf(video);
    if (end !== null && video.currentTime >= end) atEnd();
  });
  video.addEventListener("ended", atEnd);
}

/** The video put in a picture's place: it plays over the picture, muted, on a loop (or once) */
const videoOf = (img: HTMLImageElement) => (img.nextElementSibling instanceof HTMLVideoElement && img.nextElementSibling.classList.contains("site-video") ? img.nextElementSibling : null);
function videoOver(img: HTMLImageElement, picture: SiteImage | undefined) {
  let video = videoOf(img);
  const parent = img.parentElement;
  if (!picture?.video || !parent) {
    if (video) {
      video.remove();
      if (parent?.dataset["videoPlaced"] !== undefined) { parent.style.position = ""; delete parent.dataset["videoPlaced"]; }
    }
    return;
  }
  if (!video) {
    video = document.createElement("video");
    video.className = "site-video";
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    playTrimmed(video);
    img.after(video);
  }
  // The part that plays, how, and how fast (read by playTrimmed)
  const trim = `${picture.videoStart ?? 0}|${picture.videoEnd ?? ""}|${picture.videoOnce ? 1 : 0}`;
  const retrim = video.dataset["trim"] !== trim;
  video.dataset["trim"] = trim;
  video.playbackRate = picture.videoRate ?? 1;
  video.defaultPlaybackRate = picture.videoRate ?? 1;
  if (video.getAttribute("src") !== picture.video) { video.src = picture.video; void video.play().catch(() => {}); }
  else if (retrim && video.readyState >= 1) { video.currentTime = picture.videoStart ?? 0; void video.play().catch(() => {}); }
  // It covers exactly the picture's box
  if (getComputedStyle(parent).position === "static") { parent.style.position = "relative"; parent.dataset["videoPlaced"] = ""; }
  video.poster = picture.src;
  video.style.top = `${img.offsetTop}px`;
  video.style.left = `${img.offsetLeft}px`;
  video.style.width = `${img.offsetWidth}px`;
  video.style.height = `${img.offsetHeight}px`;
  video.style.objectFit = picture.fit === "contain" ? "contain" : "cover";
  video.style.objectPosition = picture.crop ? `${picture.crop.x}% ${picture.crop.y}%` : "";
  video.style.transform = picture.crop && picture.crop.zoom !== 1 ? `scale(${picture.crop.zoom})` : "";
  video.style.transformOrigin = picture.crop ? `${picture.crop.x}% ${picture.crop.y}%` : "";
}

// ---------------------------------------------------------------- Sections
// Any section can be sized: its width as a share of the space it sits in
// (kept centred, so its background band narrows or widens on both sides)
// and its height. Sections are found from the thing under the pointer: the
// nearest wide part of the page with a background of its own (the black More
// news band, a white band) or else the nearest wide part.

const SECTION_SEL = "section, footer, aside, [data-band], .broadsheet, main > div, main > article";
const isPainted = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  return (style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") || style.backgroundImage !== "none";
};
/** The wide parts of the page around a point, innermost first */
function sectionsAround(from: Element | null): HTMLElement[] {
  const wide = document.documentElement.clientWidth * 0.45;
  const out: HTMLElement[] = [];
  for (let el = from?.closest?.(SECTION_SEL) as HTMLElement | null; el; el = el.parentElement?.closest(SECTION_SEL) as HTMLElement | null) {
    if (el.closest(SITE_UI)) return [];
    const rect = el.getBoundingClientRect();
    if (rect.width >= wide && rect.height >= 60) out.push(el);
  }
  return out;
}
function sectionOf(from: Element | null): HTMLElement | null {
  const all = sectionsAround(from);
  return all.find(isPainted) ?? all[0] ?? null;
}
function sectionThing(el: HTMLElement): string {
  if (el.id) return `sec:#${el.id}`;
  const classes = [...el.classList].filter((name) => !/^(is-|has-|site-)/.test(name)).slice(0, 3);
  const sel = el.tagName.toLowerCase() + classes.map((name) => `.${CSS.escape(name)}`).join("");
  return `sec:${sel}#${Math.max(0, [...document.querySelectorAll(sel)].indexOf(el))}`;
}
function findSection(thing: string): HTMLElement | null {
  const body = thing.slice(4);
  if (body.startsWith("#")) return document.getElementById(body.slice(1));
  const at = body.lastIndexOf("#");
  try { return (document.querySelectorAll(body.slice(0, at))[Number(body.slice(at + 1))] as HTMLElement | undefined) ?? null; } catch { return null; }
}

// Inline styles this editor put on the page, with what was there before,
// so they can be taken off again without touching anything else
const TOUCHED = new WeakMap<HTMLElement, Map<string, [string, string]>>();
function touch(el: HTMLElement, prop: string, value: string) {
  let saved = TOUCHED.get(el);
  if (!saved) TOUCHED.set(el, (saved = new Map()));
  if (!saved.has(prop)) saved.set(prop, [el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]);
  el.style.setProperty(prop, value);
}
function untouch(el: HTMLElement) {
  const saved = TOUCHED.get(el);
  if (!saved) return;
  for (const [prop, [value, priority]] of saved) {
    if (value) el.style.setProperty(prop, value, priority);
    else el.style.removeProperty(prop);
  }
  TOUCHED.delete(el);
}

/** A section's content: its "…-wrap" column (one or two levels in), or its only child */
export function contentOf(el: HTMLElement): HTMLElement | null {
  const isWrap = (node: Element) => [...node.classList].some((name) => /wrap/.test(name) && !/^site-/.test(name));
  const kids = [...el.children].filter((node): node is HTMLElement => node instanceof HTMLElement);
  const own = kids.find(isWrap);
  if (own) return own;
  for (const kid of kids) {
    const inner = [...kid.children].find(isWrap);
    if (inner instanceof HTMLElement) return inner;
  }
  return kids.length === 1 ? kids[0]! : null;
}

/** Roughly how light a colour is, 0 (black) to 1 (white) */
const lightness = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

/**
 * Puts a section's look on it (none: back to how it was): the content's width
 * and the space around it, the colour and how much of the section it covers
 * (split in two if asked), and whether it is hidden. Words inside take the
 * site's light or dark text colours to suit the colour behind them.
 */
export function lookSection(el: HTMLElement, pos: LayoutPos | undefined, editing: boolean) {
  const content = contentOf(el);
  untouch(el);
  if (content) untouch(content);
  el.removeAttribute("data-sec-hidden");
  if (!pos) return;
  if (pos.cw) {
    if (content) {
      touch(content, "box-sizing", "border-box");
      touch(content, "width", `${pos.cw}%`);
      touch(content, "max-width", "none");
      touch(content, "margin-left", "auto");
      touch(content, "margin-right", "auto");
    } else {
      touch(el, "padding-left", `${(100 - pos.cw) / 2}%`);
      touch(el, "padding-right", `${(100 - pos.cw) / 2}%`);
    }
  }
  if (pos.pt !== undefined) touch(el, "padding-top", `${pos.pt}px`);
  if (pos.pb !== undefined) touch(el, "padding-bottom", `${pos.pb}px`);
  if (pos.bg) {
    const second = pos.split && pos.bg2 ? pos.bg2 : pos.bg;
    const at = pos.at ?? 50;
    const paint = pos.split && pos.bg2
      ? `linear-gradient(${pos.split === "x" ? "to right" : "to bottom"}, ${pos.bg} 0 ${at}%, ${second} ${at}% 100%)`
      : `linear-gradient(${pos.bg}, ${pos.bg})`;
    touch(el, "background", `${paint} center / ${pos.bw ?? 100}% ${pos.bh ?? 100}% no-repeat`);
    const dark = lightness(pos.bg) < 0.5;
    touch(el, "--ogcw-text", dark ? "#F4F4F2" : "#121212");
    touch(el, "--ogcw-text-2", dark ? "#B5B2AB" : "#5C5C5A");
    touch(el, "--ogcw-border", dark ? "#4A4A4A" : "#D6D6D3");
    touch(el, "--ogcw-surface", dark ? "#3A3A3A" : "#ECECEA");
    touch(el, "color", "var(--ogcw-text)");
  }
  if (pos.hide) {
    if (editing) el.setAttribute("data-sec-hidden", "");
    else touch(el, "display", "none");
  }
  if (pos.order !== undefined) touch(el, "order", String(pos.order));
}

/** Lays a part of the page out as a column, so the sections in it can change places */
function stackParent(el: HTMLElement | null, on: boolean) {
  if (!el) return;
  if (!on) return untouch(el);
  touch(el, "display", "flex");
  touch(el, "flex-direction", "column");
}
// What a box's own inline styles were before it was moved, to put back
const ORIGINAL = new WeakMap<HTMLElement, { position: string; zIndex: string; display: string; origin: string }>();
/** Shift and scale one element in place (none: back to how it was) */
function placeInline(el: HTMLElement, pos: LayoutPos | undefined) {
  if (!pos) {
    const original = ORIGINAL.get(el);
    if (!original) return;
    el.style.translate = "";
    el.style.scale = "";
    el.style.transformOrigin = original.origin;
    el.style.position = original.position;
    el.style.zIndex = original.zIndex;
    el.style.display = original.display;
    ORIGINAL.delete(el);
    return;
  }
  if (!ORIGINAL.has(el)) {
    ORIGINAL.set(el, { position: el.style.position, zIndex: el.style.zIndex, display: el.style.display, origin: el.style.transformOrigin });
    const computed = getComputedStyle(el);
    if (computed.position === "static") el.style.position = "relative";
    el.style.zIndex = "5";
    if (computed.display === "inline") el.style.display = "inline-block";
  }
  el.style.translate = `${pos.x}px ${pos.y}px`;
  el.style.scale = String(pos.s);
  el.style.transformOrigin = "0 0";
}

/** Puts this page's moved pictures, section looks, added sections and replaced pictures in place, for everyone */
export function SiteLayouts() {
  const { pageLayouts, pictures, image, editing } = useSiteText();

  // Sections an admin added: each gets a place on the page right after the
  // section it follows (after any added before it), and is drawn into it
  const blocks = Object.entries(pageLayouts)
    .filter(([thing]) => thing.startsWith("blk:"))
    .map(([thing, layout]) => ({ id: thing.slice(4), def: layout.d ?? layout.m }))
    .filter((block): block is { id: string; def: LayoutPos } => !!block.def?.kind && !!block.def.after)
    .sort((a, b) => a.id.localeCompare(b.id));
  const blockKey = blocks.map((block) => `${block.id}>${block.def.after}`).join("|");
  const [hosts, setHosts] = useState<Record<string, HTMLElement>>({});
  useEffect(() => {
    const list = blockKey ? blockKey.split("|").map((entry) => { const [id = "", after = ""] = entry.split(">"); return { id, after }; }) : [];
    const made: Record<string, HTMLElement> = {};
    let retry = 0;
    let tries = 0;
    const place = () => {
      for (let round = 0; round <= list.length; round += 1) {
        let progress = false;
        for (const block of list) {
          if (made[block.id]) continue;
          const anchor = findSection(block.after);
          // Only once React has taken over the anchor and everything beside it:
          // a section slipped in earlier would make it rebuild that part of the page
          const parent = anchor?.parentElement;
          const settled = (node: Element) => hydrated(node) || node.classList.contains("site-block");
          if (!anchor || !parent || !settled(anchor) || !(hydrated(parent) || parent === document.body) || ![...parent.children].every(settled)) continue;
          const host = document.createElement("section");
          host.id = `blk-${block.id}`;
          host.className = "site-block";
          host.dataset["blk"] = block.id;
          let before: Element = anchor;
          while (before.nextElementSibling instanceof HTMLElement && before.nextElementSibling.classList.contains("site-block") && (before.nextElementSibling.dataset["blk"] ?? "") < block.id) before = before.nextElementSibling;
          before.after(host);
          made[block.id] = host;
          progress = true;
        }
        if (!progress) break;
      }
      setHosts({ ...made });
      tries += 1;
      if (list.some((block) => !made[block.id]) && tries < 40) retry = window.setTimeout(place, 300);
    };
    place();
    return () => {
      window.clearTimeout(retry);
      for (const host of Object.values(made)) host.remove();
      setHosts({});
    };
  }, [blockKey]);

  useEffect(() => {
    const things = Object.entries(pageLayouts).filter(([thing]) => thing.startsWith("i:") || thing.startsWith("src:"));
    const sections = Object.entries(pageLayouts).filter(([thing]) => thing.startsWith("sec:"));
    const placed = new Set<HTMLElement>();
    const looked = new Set<HTMLElement>();
    const stacked = new Set<HTMLElement>();
    const swapped = new Set<HTMLImageElement>();
    const media = window.matchMedia(BP_QUERY);
    let frame = 0;
    let retry = 0;
    const apply = () => {
      const bp = bpNow();
      // Parts of the page React hasn't taken over yet are left alone (changing
      // them first would make it complain), and looked at again shortly
      let waiting = false;
      const ready = (el: Element) => {
        const ok = hydrated(el) || !!el.closest(".site-block");
        if (!ok) waiting = true;
        return ok;
      };
      // Replaced pictures first, so the moves below find them by their usual address
      const nowSwapped = new Set<HTMLImageElement>();
      for (const img of document.images) {
        if (img.closest(SITE_UI) || !ready(img)) continue;
        const key = img.dataset["imgKey"];
        const picture = key ? image(key) : pictures[normSrc(srcOf(img))];
        if (picture || swapped.has(img)) showPicture(img, picture, !!key);
        if (picture) nowSwapped.add(img);
      }
      swapped.clear();
      for (const img of nowSwapped) swapped.add(img);
      const seen = new Set<HTMLElement>();
      for (const [thing, layout] of things) {
        const img = findImage(thing);
        if (!img || !ready(img)) continue;
        const el = frameOf(img);
        seen.add(el);
        placeInline(el, layout[bp]);
      }
      for (const el of placed) if (!seen.has(el)) placeInline(el, undefined);
      placed.clear();
      for (const el of seen) placed.add(el);
      // Sections: their look, and the parts that hold reordered sections laid out as columns
      const seenSections = new Set<HTMLElement>();
      const seenStacks = new Set<HTMLElement>();
      for (const [thing, layout] of sections) {
        const el = findSection(thing);
        if (!el || !ready(el)) continue;
        const pos = layout[bp];
        seenSections.add(el);
        lookSection(el, pos, editing);
        if (pos?.order !== undefined && el.parentElement) seenStacks.add(el.parentElement);
      }
      for (const el of looked) if (!seenSections.has(el)) lookSection(el, undefined, editing);
      looked.clear();
      for (const el of seenSections) looked.add(el);
      for (const el of stacked) if (!seenStacks.has(el)) stackParent(el, false);
      for (const el of seenStacks) stackParent(el, true);
      stacked.clear();
      for (const el of seenStacks) stacked.add(el);
      // An added section takes the place of the section it follows
      for (const host of document.querySelectorAll<HTMLElement>(".site-block")) {
        const before = host.previousElementSibling;
        const order = before instanceof HTMLElement ? before.style.getPropertyValue("order") : "";
        if (order && !host.style.getPropertyValue("order")) host.style.setProperty("order", order);
        if (!order && !TOUCHED.get(host)?.has("order")) host.style.removeProperty("order");
      }
      window.clearTimeout(retry);
      if (waiting) retry = window.setTimeout(apply, 200);
    };
    apply();
    // Pictures and sections that arrive later (lazy lists, route content, a carousel moving on) get theirs too
    const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    media.addEventListener("change", apply);
    // Videos over pictures follow their picture's size
    const resized = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); };
    window.addEventListener("resize", resized);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      media.removeEventListener("change", apply);
      window.removeEventListener("resize", resized);
      for (const el of placed) placeInline(el, undefined);
      for (const el of looked) lookSection(el, undefined, editing);
      for (const el of stacked) stackParent(el, false);
      for (const img of swapped) showPicture(img, undefined, !!img.dataset["imgKey"]);
    };
  }, [pageLayouts, pictures, image, editing, hosts]);

  return (
    <>
      {blocks.map((block) => hosts[block.id] ? createPortal(<EditSection name="Added sections"><AddedSection id={block.id} def={block.def} /></EditSection>, hosts[block.id]!, block.id) : null)}
    </>
  );
}

// ---------------------------------------------------------------- Added sections
// What an admin adds with "Add a section": words (a heading and a paragraph),
// a picture, both, or a plain band of colour, in one to three columns. Each
// heading, paragraph and picture is an ordinary site edit, so it is typed and
// changed on the page like any other. Until something is written, visitors
// don't see the empty parts; admins see "Your heading" and an empty picture.

const EMPTY_PICTURE = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#d9d9d6"/><text x="600" y="410" font-family="Inter, sans-serif" font-size="42" font-weight="700" fill="#77756f" text-anchor="middle">Point here and press “Change photo”</text></svg>')}`;

function AddedText({ k, as, usual }: { k: string; as: "h2" | "p"; usual: string }) {
  const site = useSiteText();
  if (!site.text(k) && !site.editing) return null;
  const Tag = as;
  return <Tag className={as === "h2" ? "site-block-title" : "site-block-copy"}><T k={k}>{usual}</T></Tag>;
}
function AddedPicture({ k }: { k: string }) {
  const site = useSiteText();
  if (!site.image(k) && !site.editing) return null;
  return <EditableImage k={k} src={EMPTY_PICTURE} alt="" className="site-block-img" loading="lazy" />;
}
/** A story's web address from a link to it (/news/<slug>), if it is one */
function slugOfLink(link: Element | null): string | null {
  const href = link?.getAttribute("href");
  if (!href) return null;
  try {
    const match = new URL(href, window.location.href).pathname.match(/^\/news\/([a-z0-9-]{1,120})\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Story cards chosen by hand (a pasted section, or "Stories" added): the
 * site's own story card, in one to four columns. An admin changes, removes
 * and adds stories on the page: by searching, or by clicking any story
 * anywhere on the page.
 */
function AddedStories({ id, def }: { id: string; def: LayoutPos }) {
  const site = useSiteText();
  const stories = useStories();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [picking, setPicking] = useState<{ at: number } | null>(null); // at: the card to change, or -1 for a new one
  const [clicking, setClicking] = useState(false);
  const [query, setQuery] = useState("");
  const slugs = useMemo(() => def.stories ?? [], [def.stories]);
  const shown = slugs.flatMap((slug) => { const story = stories.get(slug); return story ? [story] : []; });
  const cols = Math.min(4, Math.max(1, Math.round(def.cols ?? 3)));

  const setSlugs = useCallback((next: string[]) => {
    const base = site.layout(`blk:${id}`);
    if (!base) return;
    const out: SiteLayout = {};
    for (const at of ["d", "m"] as const) if (base[at]) out[at] = { ...base[at]!, stories: next.slice(0, 24) };
    site.change(layoutKey(pathname, `blk:${id}`), "layout", out, { section: pageSection(pathname), page: pathname });
  }, [site, id, pathname]);
  const put = useCallback((slug: string, at: number) => {
    // A new one goes at the end; a changed one takes the card's place (and leaves any other place it had)
    if (at < 0 || at >= slugs.length) { if (!slugs.includes(slug)) setSlugs([...slugs, slug]); return; }
    setSlugs(slugs.map((item, index) => (index === at ? slug : item)).filter((item, index) => item !== slug || index === at));
  }, [slugs, setSlugs]);

  // "Click a story on the page": the next story clicked anywhere goes in, instead of opening
  useEffect(() => {
    if (!clicking || !picking) return;
    document.body.dataset["sitePicking"] = "";
    const onClick = (event: MouseEvent) => {
      const from = event.target as Element | null;
      if (from?.closest?.(".site-blk-ui")) return;
      const slug = slugOfLink(from?.closest?.("a[href]") ?? null);
      event.preventDefault();
      event.stopPropagation();
      if (!slug) return;
      put(slug, picking.at);
      // Adding: carry on picking more; changing one: done
      if (picking.at >= 0) { setClicking(false); setPicking(null); }
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setClicking(false); setPicking(null); } };
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.body.dataset["sitePicking"];
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [clicking, picking, put]);

  const found = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = words.length ? stories.all.filter((story) => { const hay = `${story.title} ${story.kicker} ${story.deck}`.toLowerCase(); return words.every((word) => hay.includes(word)); }) : stories.all;
    return list.slice(0, 40);
  }, [query, stories.all]);

  if (!shown.length && !site.editing) return null;
  return (
    <div className="site-block-wrap site-block-stories">
      <AddedText k={`blk.${id}.0.h`} as="h2" usual="Your heading" />
      <div className="site-stories-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {shown.map((story, index) => (
          <div key={story.slug} className="site-stories-item">
            <StoryCard story={story} photoClass="bs-photo-more" />
            {site.editing && (
              <div className="site-blk-ui site-stories-tools">
                <button type="button" onClick={() => { setPicking({ at: index }); setClicking(false); setQuery(""); }}><RefreshCw size={13} aria-hidden="true" /> Change</button>
                {index > 0 && <button type="button" aria-label="Move left" onClick={() => { const next = [...slugs]; [next[index - 1], next[index]] = [next[index]!, next[index - 1]!]; setSlugs(next); }}><ArrowLeft size={13} aria-hidden="true" /></button>}
                <button type="button" aria-label="Take this story out" onClick={() => setSlugs(slugs.filter((slug) => slug !== story.slug))}><X size={13} aria-hidden="true" /></button>
              </div>
            )}
          </div>
        ))}
        {site.editing && (
          <button type="button" className="site-blk-ui site-stories-add" onClick={() => { setPicking({ at: -1 }); setClicking(false); setQuery(""); }}>
            <Plus size={18} aria-hidden="true" /> Add stories
          </button>
        )}
      </div>

      {picking && site.editing && (clicking ? (
        <div className="site-blk-ui site-stories-clickbar" role="status">
          <MousePointerClick size={15} aria-hidden="true" />
          {picking.at >= 0 ? "Click the story to put here, anywhere on the page" : "Click stories anywhere on the page to add them"}
          <button type="button" onClick={() => { setClicking(false); setPicking(null); }}><Check size={14} aria-hidden="true" /> Done</button>
        </div>
      ) : (
        <div className="site-blk-ui site-stories-picker" role="dialog" aria-label={picking.at >= 0 ? "Change this story" : "Add stories"}>
          <header>
            <p>{picking.at >= 0 ? "Change this story" : "Add stories"}<small>{slugs.length} in this section</small></p>
            <button type="button" aria-label="Close" onClick={() => setPicking(null)}><X size={16} aria-hidden="true" /></button>
          </header>
          <button type="button" className="is-main" onClick={() => setClicking(true)}><MousePointerClick size={15} aria-hidden="true" /> Click stories on the page</button>
          <label className="site-stories-search">
            <Search size={14} aria-hidden="true" />
            <input type="search" value={query} placeholder="Search every story" autoFocus onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.stopPropagation()} />
          </label>
          <ul>
            {found.map((story) => {
              const inIt = slugs.includes(story.slug);
              return (
                <li key={story.slug}>
                  <button type="button" aria-pressed={inIt} onClick={() => { if (picking.at < 0 && inIt) setSlugs(slugs.filter((slug) => slug !== story.slug)); else { put(story.slug, picking.at); if (picking.at >= 0) setPicking(null); } }}>
                    <img src={story.photo.src} alt="" loading="lazy" />
                    <span><small>{story.kicker}</small>{story.title}</span>
                    {inIt && <Check size={15} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
            {!found.length && <li className="site-stories-none">No story has those words.</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AddedSection({ id, def }: { id: string; def: LayoutPos }) {
  const cols = Math.min(3, Math.max(1, Math.round(def.cols ?? 1)));
  if (def.kind === "stories") return <AddedStories id={id} def={def} />;
  if (def.kind === "band") return <div className="site-block-wrap site-block-band" style={{ minHeight: def.band ?? 160 }} />;
  return (
    <div className="site-block-wrap" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols }, (_, column) => {
        const k = `blk.${id}.${column}`;
        return (
          <div key={column} className={`site-block-col${def.kind === "textimage" ? " has-picture" : ""}`}>
            {(def.kind === "image" || def.kind === "textimage") && <AddedPicture k={`${k}.img`} />}
            {def.kind !== "image" && (
              <div className="site-block-words">
                <AddedText k={`${k}.h`} as="h2" usual="Your heading" />
                <AddedText k={`${k}.p`} as="p" usual="Write something here. Point at it and press Edit to change it." />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
// ---------------------------------------------------------------- Saving

// Writing to Sanity: adminClient() (src/lib/admin-sanity.ts), straight with
// this browser's studio login, or through the server for an admin account

/** One edit's document in Sanity ("Site edits" in the studio, filed by part of the site) */
export const editDocId = (key: string) => `siteEdit-${itemKey(key)}`;
type EditDoc = { _id: string; _type: string; [field: string]: unknown };
function editDoc(key: string, kind: "text" | "image" | "layout", value: string | SiteImage | SiteLayout, meta: EditMeta | undefined, by: string, at: string): EditDoc {
  const image = kind === "image" ? (value as SiteImage) : null;
  return {
    _id: editDocId(key),
    _type: "siteEdit",
    key,
    kind,
    section: meta?.section ?? sectionOfKey(key),
    ...(meta?.page ? { page: meta.page } : {}),
    ...(meta?.usual ? { usual: meta.usual } : {}),
    ...(kind === "layout"
      ? { layout: value }
      : image
        ? { ...(image.alt ? { alt: image.alt } : {}), ...(image.fit ? { fit: image.fit } : {}), ...(image.clear ? { clear: true } : {}), ...mediaExtras(image), ...(image.assetId ? { image: { _type: "image", asset: { _type: "reference", _ref: image.assetId } } } : { url: image.src }) }
        : { value }),
    updatedAt: at,
    updatedBy: by,
  };
}
/** A replacement's video and its crop by hand, as kept in Sanity */
const mediaExtras = (image: SiteImage) => ({
  ...(image.video ? {
    video: image.video,
    ...(image.videoAssetId ? { videoFile: { _type: "file", asset: { _type: "reference", _ref: image.videoAssetId } } } : {}),
    ...(image.videoStart ? { videoStart: image.videoStart } : {}),
    ...(image.videoEnd ? { videoEnd: image.videoEnd } : {}),
    ...(image.videoOnce ? { videoOnce: true } : {}),
    ...(image.videoRate && image.videoRate !== 1 ? { videoRate: image.videoRate } : {}),
  } : {}),
  ...(image.crop ? { crop: { x: image.crop.x, y: image.crop.y, zoom: image.crop.zoom } } : {}),
});
const editKind = (content: SiteContent, key: string): "text" | "image" | "layout" => (key in content.texts ? "text" : key in content.images ? "image" : "layout");

// The whole set of edits, as kept in each Site history version
const textItems = (content: SiteContent) =>
  Object.entries(content.texts).map(([key, value]) => {
    const meta = content.meta[key];
    return { _key: itemKey(key), _type: "siteText", key, value, section: meta?.section ?? sectionOfKey(key), ...(meta?.usual ? { usual: meta.usual } : {}) };
  });
const imageItems = (content: SiteContent) =>
  Object.entries(content.images).map(([key, image]) => ({
    _key: itemKey(key),
    _type: "siteImage",
    key,
    section: content.meta[key]?.section ?? sectionOfKey(key),
    // The picture it replaces (a "pic." photo is found on the page by it), so Restore puts it back in the right place
    ...(content.meta[key]?.usual ? { usual: content.meta[key]!.usual } : {}),
    ...(content.meta[key]?.page ? { page: content.meta[key]!.page } : {}),
    ...(image.alt ? { alt: image.alt } : {}),
    ...(image.fit ? { fit: image.fit } : {}),
    ...(image.clear ? { clear: true } : {}),
    ...mediaExtras(image),
    ...(image.assetId ? { image: { _type: "image", asset: { _type: "reference", _ref: image.assetId } } } : { url: image.src }),
  }));
const layoutItems = (content: SiteContent) =>
  Object.entries(content.layouts).map(([key, layout]) => ({ _key: itemKey(key), _type: "siteLayout", key, page: key.split("|")[0], layout }));

/** The last change to each thing (later changes replace earlier ones) */
const lastChanges = (pending: Pending[]) => [...new Map(pending.map((item) => [`${item.kind}:${item.key}`, item])).values()];

/** What the site's words and photos will be once these changes are saved */
function applyChanges(live: SiteContent, pending: Pending[]): SiteContent {
  const texts = { ...live.texts };
  const images = { ...live.images };
  const layouts = { ...live.layouts };
  const meta = { ...live.meta };
  for (const item of pending) {
    if (item.kind === "story") continue;
    const list: Record<string, unknown> = item.kind === "text" ? texts : item.kind === "image" ? images : layouts;
    if (item.value === null) {
      delete list[item.key];
      delete meta[item.key];
    } else {
      list[item.key] = item.value;
      meta[item.key] = { ...meta[item.key], ...item.meta, legacy: false };
    }
  }
  return { texts, images, layouts, meta } as SiteContent;
}
function describe(changes: Pending[]) {
  const parts = changes.map((item) => {
    if (item.kind === "layout") return item.value === null ? `${item.key} back in place` : `moved ${item.key}`;
    if (item.kind === "image") return item.value === null ? `photo ${item.key} back to usual` : `photo ${item.key}`;
    if (item.kind === "story") {
      const [slug, field] = item.key.split("|");
      return `${STORY_NAMES[field as StoryField]} of ${slug} → “${String(item.value).slice(0, 40)}”`;
    }
    return item.value === null ? `${item.key} back to usual` : `${item.key} → “${String(item.value).slice(0, 40)}”`;
  });
  return parts.slice(0, 3).join(", ") + (parts.length > 3 ? ` and ${parts.length - 3} more` : "");
}

/** What's under the pointer: el is what gets outlined and moved (a picture's box), img the picture itself */
type Target = { el: HTMLElement; kind: "text" | "image"; rect: DOMRect; typing: boolean; thing: string; img?: HTMLImageElement };
type Drag = { mode: "move" | "size"; el: HTMLElement; thing: string; text: boolean; x: number; y: number; pos: LayoutPos; base: SiteLayout | undefined; zoom: number; w: number; bp: "d" | "m"; next?: LayoutPos };
/** The photo being changed: its edit's name, where it is, and what it shows now */
type PhotoTarget = { k: string; rect: DOMRect; swapped: boolean; alt: string; section: SiteSection | null; usual: string; current: SiteImage };
/** The section being sized, and the drag on one of its edges */
type Sizing = { el: HTMLElement; thing: string; rect: DOMRect };
/** A change to a section's look: a field set to undefined is taken off */
type LookPatch = { [K in keyof LayoutPos]?: LayoutPos[K] | undefined };
type SecDrag = { mode: "w" | "wl" | "h"; x: number; y: number; cw: number; pb: number; across: number; zoom: number };
/** The colours to choose from for a section (any other colour is one click away) */
const SECTION_COLOURS: [string, string][] = [["White", "#FFFFFF"], ["Off-white", "#F4F4F2"], ["Light grey", "#E7E7E5"], ["Charcoal", "#303030"], ["Black", "#0D0D0D"], ["Yellow", "#FFE600"], ["Gold", "#86600E"]];

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

/** 75.3 → "1:15.3" */
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
const RATES = [0.5, 1, 1.5, 2];

/**
 * Trimming a video in a photo's place: where it starts and ends (drag the
 * two handles, or play it and press "Start here" / "End here"), whether it
 * loops or plays once, and its speed. The preview plays just that part.
 */
function VideoTrim({ look, onKeep }: { look: SiteImage; onKeep: (next: SiteImage) => void }) {
  const preview = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number] | null>(null);
  const [now, setNow] = useState(0);
  const start = range?.[0] ?? look.videoStart ?? 0;
  const end = range?.[1] ?? look.videoEnd ?? duration;
  // The preview plays the part chosen so far
  useEffect(() => {
    const video = preview.current;
    if (!video) return;
    video.dataset["trim"] = `${start}|${end && end < duration ? end : ""}|${look.videoOnce ? 1 : 0}`;
    video.playbackRate = look.videoRate ?? 1;
    if (video.currentTime < start || (end && video.currentTime > end)) video.currentTime = start;
  }, [start, end, duration, look.videoOnce, look.videoRate]);
  useEffect(() => { const video = preview.current; if (video) playTrimmed(video); }, []);

  const keep = (next: Partial<SiteImage>) => {
    const merged = { ...look, ...next };
    // The whole video: no trim kept
    if (!merged.videoStart || merged.videoStart <= 0) delete merged.videoStart;
    if (!merged.videoEnd || (duration && merged.videoEnd >= duration - 0.05)) delete merged.videoEnd;
    if (!merged.videoOnce) delete merged.videoOnce;
    if (!merged.videoRate || merged.videoRate === 1) delete merged.videoRate;
    onKeep(merged);
  };
  const settle = () => { if (range) { keep({ videoStart: range[0], videoEnd: range[1] }); setRange(null); } };
  const max = duration || Math.max(end, 1);
  const step = 0.1;
  const round = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="site-trim">
      <p className="site-trim-head"><Scissors size={13} aria-hidden="true" /> Video length<b>{clock(start)} – {clock(end || 0)} · {round(Math.max(0, (end || 0) - start)).toFixed(1)} s</b></p>
      <video
        ref={preview}
        className="site-trim-video"
        src={look.video}
        poster={look.src}
        muted
        autoPlay
        playsInline
        onLoadedMetadata={(event) => setDuration(round(event.currentTarget.duration || 0))}
        onTimeUpdate={(event) => setNow(event.currentTarget.currentTime)}
        onClick={(event) => { const video = event.currentTarget; if (video.paused) void video.play(); else video.pause(); }}
        title="Click to pause or play"
      />
      <div className="site-trim-bar" style={{ "--a": `${(start / max) * 100}%`, "--b": `${((end || max) / max) * 100}%`, "--now": `${(now / max) * 100}%` } as CSSProperties}>
        <span className="site-trim-fill" aria-hidden="true" />
        <span className="site-trim-now" aria-hidden="true" />
        <input type="range" min={0} max={max} step={step} value={start} aria-label="Where the video starts" aria-valuetext={clock(start)}
          onChange={(event) => setRange([Math.min(Number(event.target.value), round((end || max) - 0.5)), end || max])} onPointerUp={settle} onKeyUp={settle} />
        <input type="range" min={0} max={max} step={step} value={end || max} aria-label="Where the video ends" aria-valuetext={clock(end || max)}
          onChange={(event) => setRange([start, Math.max(Number(event.target.value), round(start + 0.5))])} onPointerUp={settle} onKeyUp={settle} />
      </div>
      <div className="site-photo-opts">
        <button type="button" onClick={() => keep({ videoStart: round(Math.min(now, (end || max) - 0.5)), videoEnd: end || max })}><SkipBack size={13} aria-hidden="true" /> Start here</button>
        <button type="button" onClick={() => keep({ videoStart: start, videoEnd: round(Math.max(now, start + 0.5)) })}><SkipForward size={13} aria-hidden="true" /> End here</button>
      </div>
      <div className="site-photo-opts" role="group" aria-label="How it plays">
        <button type="button" aria-pressed={!look.videoOnce} onClick={() => keep({ videoOnce: false })}><Repeat size={13} aria-hidden="true" /> On a loop</button>
        <button type="button" aria-pressed={!!look.videoOnce} onClick={() => keep({ videoOnce: true })}><Play size={13} aria-hidden="true" /> Play once</button>
      </div>
      <div className="site-photo-opts site-trim-rates" role="group" aria-label="Speed">
        {RATES.map((rate) => <button key={rate} type="button" aria-pressed={(look.videoRate ?? 1) === rate} onClick={() => keep({ videoRate: rate })}>{rate}×</button>)}
      </div>
      {(look.videoStart || look.videoEnd || look.videoOnce || (look.videoRate && look.videoRate !== 1)) && (
        <button type="button" onClick={() => { const { videoStart: _s, videoEnd: _e, videoOnce: _o, videoRate: _r, ...rest } = look; onKeep(rest); }}><RotateCcw size={15} aria-hidden="true" /> The whole video, as it was</button>
      )}
    </div>
  );
}

/** A copied section, kept on this browser until something else is copied (parts: "<column>.h", ".p", ".img") */
type SectionCopy = { name: string; from: string; def: LayoutPos; look: Partial<LayoutPos>; texts: Record<string, string>; images: Record<string, SiteImage> };
const COPY_KEY = "ogcw-section-copy";
function readCopy(): SectionCopy | null {
  try {
    const copy = JSON.parse(localStorage.getItem(COPY_KEY) ?? "null") as SectionCopy | null;
    return copy && typeof copy.name === "string" && copy.def?.kind ? copy : null;
  } catch {
    return null;
  }
}
/** "rgb(13, 13, 13)" → "#0d0d0d" (nothing for a see-through colour) */
function toHex(colour: string): string | undefined {
  const match = colour.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match || (match[4] !== undefined && Number(match[4]) < 0.9)) return undefined;
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

/** Photos from phones are big: anything over 2400 px or 3 MB is made smaller before it goes up */
async function shrink(file: File): Promise<Blob> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 3_000_000) { bitmap.close(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.88));
  } catch {
    return file;
  }
}

export function SiteEditor() {
  const site = useSiteText();
  const { editing, setEditing, setBusy } = site;
  const access = useWorkAccess();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<PhotoTarget | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dropping, setDropping] = useState(false);
  // Crop: automatically (around the middle, as the page does) or by hand; remembered on this browser
  const [cropMode, setCropModeState] = useState<"auto" | "hand">(() => {
    try { return typeof window !== "undefined" && localStorage.getItem("ogcw-crop-mode") === "hand" ? "hand" : "auto"; } catch { return "auto"; }
  });
  const setCropMode = (mode: "auto" | "hand") => {
    setCropModeState(mode);
    try { localStorage.setItem("ogcw-crop-mode", mode); } catch { /* private window */ }
  };
  const [cropping, setCropping] = useState(false);
  // A copied section, ready to paste (also from another tab)
  const [copied, setCopied] = useState<SectionCopy | null>(null);
  useEffect(() => {
    setCopied(readCopy());
    const onStorage = (event: StorageEvent) => { if (event.key === COPY_KEY) setCopied(readCopy()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const cropDrag = useRef<{ x: number; y: number; start: SiteCrop; w: number; h: number } | null>(null);
  const [cropDraft, setCropDraft] = useState<SiteCrop | null>(null);
  useEffect(() => { if (!photo) { setCropping(false); setCropDraft(null); } }, [photo]);
  const [target, setTarget] = useState<Target | null>(null);
  const [section, setSection] = useState<{ el: HTMLElement; rect: DOMRect } | null>(null);
  const [sizing, setSizing] = useState<Sizing | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const targetRef = useRef<Target | null>(null);
  targetRef.current = target;
  const sizingRef = useRef<Sizing | null>(null);
  sizingRef.current = sizing;
  const drag = useRef<Drag | null>(null);
  const secDrag = useRef<SecDrag | null>(null);
  // The section being edited: its sizes as they are now, and slider changes not yet in the changes
  const [measured, setMeasured] = useState({ cw: 100, pt: 0, pb: 0, zoom: 1 });
  const [draft, setDraft] = useState<LookPatch>({});
  const draftRef = useRef<{ patch: LookPatch; everywhere: boolean }>({ patch: {}, everywhere: false });
  const draftTimer = useRef<number | undefined>(undefined);
  const [dragging, setDragging] = useState(false);
  const [touch, setTouch] = useState(false);

  const admin = access === "admin" && !pathname.startsWith("/admin");

  // Admins get the edit buttons straight away, unless they turned them off
  useEffect(() => {
    if (!admin) return setEditing(false);
    let off = false;
    try { off = localStorage.getItem(OFF_KEY) === "1"; } catch { /* storage blocked */ }
    setEditing(!off);
  }, [admin, setEditing]);
  useEffect(() => { setTouch(isTouch()); }, []);
  const toggle = () => {
    const next = !editing;
    setEditing(next);
    setTarget(null);
    setPhoto(null);
    setSection(null);
    setSizing(null);
    try { if (next) localStorage.removeItem(OFF_KEY); else localStorage.setItem(OFF_KEY, "1"); } catch { /* storage blocked */ }
  };

  // While pointing at, typing in or sizing something, the moving parts hold still
  useEffect(() => { setBusy(!!target || !!photo || !!sizing); }, [target, photo, sizing, setBusy]);
  useEffect(() => {
    document.documentElement.classList.toggle("site-editing", editing);
    return () => document.documentElement.classList.remove("site-editing");
  }, [editing]);
  useEffect(() => { setSizing(null); setSection(null); setPhoto(null); }, [pathname]);

  // Find the text, picture or section under the pointer (or the finger), and keep the buttons by it
  useEffect(() => {
    if (!editing) return;
    let frame = 0;
    const show = (el: HTMLElement, kind: Target["kind"], img?: HTMLImageElement) => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
      const current = targetRef.current;
      if (current?.el === el) return;
      const thing = img ? thingOfImage(img) : el.dataset["lay"] ?? "";
      setTarget({ el, kind, rect: el.getBoundingClientRect(), typing: false, thing, ...(img ? { img } : {}) });
    };
    const hideSoon = () => {
      if (hideTimer.current !== undefined) return;
      hideTimer.current = window.setTimeout(() => { hideTimer.current = undefined; setTarget((current) => (current?.typing ? current : null)); }, 450);
    };
    // The picture you can see there: in a slideshow the photos sit on top of
    // each other and only the one showing is at full strength, so faded-out
    // ones underneath (or on top) are skipped
    const seen = (el: Element) => {
      let opacity = 1;
      for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.visibility === "hidden") return false;
        opacity *= Number(style.opacity);
      }
      return opacity > 0.5;
    };
    const imageAt = (x: number, y: number) => {
      const images = document.elementsFromPoint(x, y).filter((el): el is HTMLImageElement => el instanceof HTMLImageElement && !el.closest(SITE_UI) && el.getBoundingClientRect().width >= 24);
      return images.find(seen) ?? images[0];
    };
    const noteSection = (from: Element | null) => {
      if (sizingRef.current) return;
      const el = sectionOf(from);
      setSection((current) => (el ? (current?.el === el ? current : { el, rect: el.getBoundingClientRect() }) : null));
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || targetRef.current?.typing || drag.current || secDrag.current) return;
      cancelAnimationFrame(frame);
      const { clientX: x, clientY: y } = event;
      const from = event.target as Element | null;
      frame = requestAnimationFrame(() => {
        if (from?.closest?.(".site-edit-btn, .site-photo-menu, .site-savebar, .site-edit, .site-lay-handle, .site-sec-pill, .site-sec-bar, .site-sec-handle")) return void window.clearTimeout(hideTimer.current);
        // Drawing design notes: no Edit buttons under the pen
        if (from?.closest?.(".dn-layer, .dn-bar")) return hideSoon();
        noteSection(from);
        const text = from?.closest?.("[data-edit]") as HTMLElement | null;
        if (text) return show(text, "text");
        // Any picture on the page can be moved and changed
        const img = imageAt(x, y);
        if (img) return show(frameOf(img), "image", img);
        hideSoon();
      });
    };
    // Phones and tablets: the first tap on a text or picture picks it (the
    // link under it waits); a second tap on the same one does what it usually does
    let fingers = false;
    const onDown = (event: PointerEvent) => { fingers = event.pointerType !== "mouse"; };
    const onClick = (event: MouseEvent) => {
      // Choosing stories by clicking them (AddedStories): those clicks are theirs
      if (!fingers || targetRef.current?.typing || document.body.dataset["sitePicking"] !== undefined) return;
      const from = event.target as Element | null;
      if (from?.closest?.(SITE_UI)) return;
      const text = from?.closest?.("[data-edit]") as HTMLElement | null;
      // The page's own buttons (a slideshow's arrows and dots) still work, to get to its other photos
      if (!text && from?.closest?.("button, input, select, textarea")) return;
      const img = text ? undefined : imageAt(event.clientX, event.clientY);
      const el = text ?? (img ? frameOf(img) : null);
      noteSection(from);
      if (el && targetRef.current?.el === el) return;
      if (!el) { setTarget(null); return; }
      event.preventDefault();
      event.stopPropagation();
      if (text) show(text, "text");
      else if (img) show(el, "image", img);
    };
    const onScroll = () => {
      setTarget((current) => (current ? { ...current, rect: current.el.getBoundingClientRect() } : current));
      setSection((current) => (current ? { ...current, rect: current.el.getBoundingClientRect() } : current));
      setSizing((current) => (current ? { ...current, rect: current.el.getBoundingClientRect() } : current));
    };
    const onEnd = () => setTarget(null);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener(END_EVENT, onEnd);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      window.removeEventListener(END_EVENT, onEnd);
    };
  }, [editing]);
  useEffect(() => { if (!editing) { setTarget(null); setSection(null); setSizing(null); } }, [editing]);

  const startEditing = useCallback(() => {
    const current = targetRef.current;
    if (!current) return;
    if (current.kind === "image") {
      const img = current.img;
      if (!img) return;
      const own = img.dataset["editImg"];
      if (own !== undefined) {
        // A photo with its own name (the hero's)
        const swap = site.image(own);
        const usual = img.dataset["usual"] ?? "";
        setPhoto({ k: own, rect: img.getBoundingClientRect(), swapped: !!swap, alt: img.alt, section: (img.dataset["editSection"] as SiteSection | undefined) ?? null, usual, current: swap ?? { src: usual, alt: img.alt } });
      } else {
        // Any other picture: replaced wherever it's used
        const raw = srcOf(img) ?? "";
        const usual = normSrc(raw);
        const swap = site.pictures[usual];
        setPhoto({ k: pictureKey(usual), rect: img.getBoundingClientRect(), swapped: !!swap, alt: img.alt, section: null, usual, current: swap ?? { src: raw, alt: img.alt } });
      }
      setTarget(null);
      return;
    }
    setTarget({ ...current, typing: true });
    current.el.dispatchEvent(new Event(START_EVENT));
  }, [site]);

  // Dragging the move handle shifts the text or picture; the corner handle resizes it.
  // Each is kept for this page, for computers or phones depending on the screen now.
  const startDrag = (mode: Drag["mode"]) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = targetRef.current;
    if (!current?.thing || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const bp = bpNow();
    const base = site.layout(current.thing);
    const pos = base?.[bp] ?? { x: 0, y: 0, s: 1 };
    const el = current.el;
    // How far the page moves for each pixel of shift (the page is drawn at 90% on computers)
    placeInline(el, pos);
    const before = el.getBoundingClientRect();
    placeInline(el, { ...pos, x: pos.x + 100 });
    const after = el.getBoundingClientRect();
    placeInline(el, pos);
    const zoom = Math.abs(after.left - before.left) / 100 || 1;
    drag.current = { mode, el, thing: current.thing, text: current.kind === "text", x: event.clientX, y: event.clientY, pos, base, zoom, w: before.width || 1, bp };
    setDragging(true);
  };
  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y;
    d.next = d.mode === "move"
      ? { ...d.pos, x: Math.round(d.pos.x + dx / d.zoom), y: Math.round(d.pos.y + dy / d.zoom) }
      : { ...d.pos, s: Math.min(6, Math.max(0.2, Math.round(d.pos.s * ((d.w + dx) / d.w) * 100) / 100)) };
    placeInline(d.el, d.next);
    setTarget((current) => (current ? { ...current, rect: d.el.getBoundingClientRect() } : current));
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    const moved = d.next && (d.next.x !== d.pos.x || d.next.y !== d.pos.y || d.next.s !== d.pos.s);
    if (moved && d.next) site.change(layoutKey(pathname, d.thing), "layout", { ...(d.base ?? {}), [d.bp]: d.next }, { section: pageSection(pathname), page: pathname });
    // A text takes its place from its own styles once the change is in; a picture's stays inline
    if (d.text) requestAnimationFrame(() => requestAnimationFrame(() => {
      placeInline(d.el, undefined);
      setTarget((current) => (current ? { ...current, rect: current.el.getBoundingClientRect() } : current));
    }));
  };
  const resetPlace = () => {
    const current = targetRef.current;
    if (!current?.thing) return;
    const bp = bpNow();
    const base = site.layout(current.thing);
    const rest: SiteLayout = { ...(base ?? {}) };
    delete rest[bp];
    if (current.kind === "text") placeInline(current.el, undefined);
    site.change(layoutKey(pathname, current.thing), "layout", rest.d || rest.m ? rest : null, { section: pageSection(pathname), page: pathname });
    requestAnimationFrame(() => setTarget((t) => (t ? { ...t, rect: t.el.getBoundingClientRect() } : t)));
  };

  // ------------------------------------------------ Editing a section
  // "Edit section" opens a panel: the content's width and the space around it
  // (also by dragging the handles on its sides and bottom), its colour, a split
  // into two colours, how much of the section the colour covers, moving it up
  // or down, hiding it, and adding a new section below it. Sizes are kept for
  // this kind of screen (computer or phone); colours, hiding and places for both.
  const startSizing = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const content = contentOf(el);
    const style = getComputedStyle(el);
    const zoom = rect.height / (el.offsetHeight || 1) || 1;
    setMeasured({
      cw: content ? Math.round((content.getBoundingClientRect().width / (rect.width || 1)) * 100) : 100,
      pt: Math.round(parseFloat(style.paddingTop) || 0),
      pb: Math.round(parseFloat(style.paddingBottom) || 0),
      zoom,
    });
    setDraft({});
    setSizing({ el, thing: sectionThing(el), rect });
    setSection(null);
    setTarget(null);
  };
  /** The part of the page around the one being edited */
  const outer = () => {
    const current = sizingRef.current;
    if (!current) return;
    const all = sectionsAround(current.el.parentElement);
    const next = all.find(isPainted) ?? all[0];
    if (next) startSizing(next);
  };
  const secMeta = () => ({ section: pageSection(pathname), page: pathname });
  /** Changes a section's look: sizes for this kind of screen, or (everywhere) for computers and phones alike; an undefined field is taken off */
  const restyle = (thing: string, patch: LookPatch, everywhere = false) => {
    const base = site.layout(thing) ?? {};
    const next: SiteLayout = { ...base };
    for (const at of everywhere ? (["d", "m"] as const) : [bpNow()]) {
      const merged: Record<string, unknown> = { x: 0, y: 0, s: 1, ...(base[at] ?? {}), ...patch };
      for (const [name, value] of Object.entries(merged)) if (value === undefined) delete merged[name];
      if (Object.keys(merged).some((name) => !["x", "y", "s"].includes(name))) next[at] = merged as LayoutPos;
      else delete next[at];
    }
    site.change(layoutKey(pathname, thing), "layout", next.d || next.m ? next : null, secMeta());
  };
  // Sliders show the change at once and put it in the changes when they settle
  const nudge = (patch: LookPatch, everywhere = false) => {
    const current = sizingRef.current;
    if (!current) return;
    const merged = { ...draftRef.current.patch, ...patch };
    draftRef.current = { patch: merged, everywhere: draftRef.current.everywhere || everywhere };
    setDraft(merged);
    const pos = { x: 0, y: 0, s: 1, ...(site.layout(current.thing)?.[bpNow()] ?? {}), ...merged } as LayoutPos;
    lookSection(current.el, pos, true);
    setSizing({ ...current, rect: current.el.getBoundingClientRect() });
    window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(settleDraft, 450);
  };
  /** The slider changes not yet put in the changes (taken out, to go with another change) */
  const takeDraft = () => {
    const taken = draftRef.current;
    draftRef.current = { patch: {}, everywhere: false };
    window.clearTimeout(draftTimer.current);
    setDraft({});
    return taken;
  };
  const settleDraft = () => {
    const current = sizingRef.current;
    const { patch, everywhere } = takeDraft();
    if (current && Object.keys(patch).length) restyle(current.thing, patch, everywhere);
  };
  /** A click (a colour, a split, hiding): for computers and phones alike, with any slider changes */
  const pickStyle = (patch: LookPatch) => {
    const current = sizingRef.current;
    if (!current) return;
    restyle(current.thing, { ...takeDraft().patch, ...patch }, true);
  };
  const startSecDrag = (mode: SecDrag["mode"]) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = sizingRef.current;
    if (!current || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    settleDraft();
    const live = site.layout(current.thing)?.[bpNow()];
    secDrag.current = { mode, x: event.clientX, y: event.clientY, cw: live?.cw ?? measured.cw, pb: live?.pb ?? measured.pb, across: current.el.getBoundingClientRect().width || 1, zoom: measured.zoom };
    setDragging(true);
  };
  const moveSecDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const d = secDrag.current;
    if (!d) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y;
    if (d.mode === "h") nudge({ pb: Math.max(0, Math.round(d.pb + dy / d.zoom)) });
    else nudge({ cw: Math.min(100, Math.max(20, Math.round(d.cw + ((d.mode === "wl" ? -dx : dx) * 200) / d.across))) });
  };
  const endSecDrag = () => {
    secDrag.current = null;
    setDragging(false);
    settleDraft();
  };
  /** Moves the section one place up or down among the parts beside it */
  const moveSection = (step: -1 | 1) => {
    const current = sizingRef.current;
    const parent = current?.el.parentElement;
    if (!current || !parent) return;
    const pending = takeDraft().patch;
    const parts = [...parent.children].filter((node): node is HTMLElement => node instanceof HTMLElement && !/^(SCRIPT|STYLE|TEMPLATE|LINK)$/.test(node.tagName));
    const ordered = parts.map((node, index) => ({ node, order: parseFloat(getComputedStyle(node).order) || 0, index })).sort((a, b) => a.order - b.order || a.index - b.index).map((item) => item.node);
    const from = ordered.indexOf(current.el);
    const to = from + step;
    if (from < 0 || to < 0 || to >= ordered.length) return;
    [ordered[from], ordered[to]] = [ordered[to]!, ordered[from]!];
    ordered.forEach((node, index) => restyle(sectionThing(node), node === current.el ? { ...pending, order: (index + 1) * 10 } : { order: (index + 1) * 10 }, true));
    window.setTimeout(() => setSizing((s) => (s ? { ...s, rect: s.el.getBoundingClientRect() } : s)), 120);
  };
  /** Adds a new section right after this one, and opens it */
  const addSection = (kind: SectionKind) => {
    const current = sizingRef.current;
    if (!current) return;
    settleDraft();
    const id = Date.now().toString(36);
    const def: LayoutPos = { x: 0, y: 0, s: 1, kind, after: current.thing, cols: kind === "stories" ? 3 : 1, ...(kind === "band" ? { band: 160 } : {}), ...(kind === "stories" ? { stories: [] } : {}) };
    site.change(layoutKey(pathname, `blk:${id}`), "layout", { d: def, m: def }, secMeta());
    let tries = 0;
    const open = () => {
      const host = document.getElementById(`blk-${id}`);
      if (host) { host.scrollIntoView({ block: "center", behavior: "smooth" }); window.setTimeout(() => startSizing(host), 450); }
      else if ((tries += 1) < 20) window.setTimeout(open, 150);
    };
    window.setTimeout(open, 150);
  };
  /** An added section: change what it is and its columns, or delete it */
  const changeAdded = (id: string, patch: Partial<LayoutPos>) => {
    const base = site.layout(`blk:${id}`);
    if (!base) return;
    const next: SiteLayout = {};
    for (const at of ["d", "m"] as const) if (base[at]) next[at] = { ...base[at]!, ...patch };
    site.change(layoutKey(pathname, `blk:${id}`), "layout", next, secMeta());
    window.setTimeout(() => setSizing((s) => (s ? { ...s, rect: s.el.getBoundingClientRect() } : s)), 120);
  };
  const deleteAdded = (id: string) => {
    site.change(layoutKey(pathname, `blk:${id}`), "layout", null, secMeta());
    if (site.layout(`sec:#blk-${id}`)) site.change(layoutKey(pathname, `sec:#blk-${id}`), "layout", null, secMeta());
    setSizing(null);
  };
  /**
   * Copy a section, to paste below any section on any page. An added section
   * is copied whole (its words, pictures and colours); any other section
   * becomes story cards with the same stories (or its heading, words and
   * first picture, if it has no stories), which can then be changed one by one.
   */
  const copySection = () => {
    const current = sizingRef.current;
    if (!current) return;
    settleDraft();
    const { el, thing } = current;
    const texts: Record<string, string> = {};
    const images: Record<string, SiteImage> = {};
    let def: LayoutPos;
    const addedId = el.classList.contains("site-block") ? el.dataset["blk"] : undefined;
    const added = addedId ? site.layout(`blk:${addedId}`)?.d : undefined;
    if (addedId && added) {
      const { after: _after, ...rest } = added;
      def = rest;
      for (let column = 0; column < 4; column += 1) {
        for (const part of ["h", "p"]) { const value = site.text(`blk.${addedId}.${column}.${part}`); if (value) texts[`${column}.${part}`] = value; }
        const picture = site.image(`blk.${addedId}.${column}.img`);
        if (picture) images[`${column}.img`] = picture;
      }
    } else {
      const slugs = [...new Set([...el.querySelectorAll("a[href]")].flatMap((link) => slugOfLink(link) ?? []))].slice(0, 24);
      const heading = el.querySelector("h1, h2, h3")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 140);
      if (heading) texts["0.h"] = heading;
      if (slugs.length) {
        def = { x: 0, y: 0, s: 1, kind: "stories", cols: Math.min(4, slugs.length), stories: slugs };
      } else {
        def = { x: 0, y: 0, s: 1, kind: "textimage", cols: 1 };
        const words = el.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 600);
        if (words) texts["0.p"] = words;
        const picture = [...el.querySelectorAll("img")].find((img) => img.getBoundingClientRect().width > 60);
        const src = picture?.currentSrc || picture?.getAttribute("src");
        if (src && /^(https:\/\/|\/)/.test(src)) images["0.img"] = { src: new URL(src, window.location.href).href.replace(window.location.origin, ""), alt: picture?.alt ?? "" };
      }
    }
    // Its colours and spacing come along
    const live = site.layout(thing)?.d;
    const look: Partial<LayoutPos> = {};
    if (live) for (const name of ["cw", "pt", "pb", "bg", "bg2", "split", "at", "bw", "bh"] as const) if (live[name] !== undefined) (look as Record<string, unknown>)[name] = live[name];
    if (!look.bg) { const hex = toHex(getComputedStyle(el).backgroundColor); if (hex) look.bg = hex; }
    const name = el.querySelector("h1, h2, h3")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 48) || "A section";
    const copy: SectionCopy = { name, from: pathname, def, look, texts, images };
    setCopied(copy);
    try { localStorage.setItem(COPY_KEY, JSON.stringify(copy)); } catch { /* private window: this tab still has it */ }
    setStatus("saved");
    setMessage(`Copied “${name}”. Open “Edit section” on any section, on any page, and press Paste below.`);
    window.setTimeout(() => setStatus((value) => (value === "saved" ? "idle" : value)), 4000);
  };
  /** Puts the copied section right after this one (a new section of its own: the copy can be changed without touching the first) */
  const pasteSection = () => {
    const current = sizingRef.current;
    if (!current || !copied) return;
    settleDraft();
    const id = Date.now().toString(36);
    const meta = secMeta();
    const def: LayoutPos = { ...copied.def, x: 0, y: 0, s: 1, after: current.thing };
    site.change(layoutKey(pathname, `blk:${id}`), "layout", { d: def, m: def }, meta);
    if (Object.keys(copied.look).length) {
      const look = { x: 0, y: 0, s: 1, ...copied.look } as LayoutPos;
      site.change(layoutKey(pathname, `sec:#blk-${id}`), "layout", { d: look, m: look }, meta);
    }
    const partMeta = { section: "Added sections", page: pathname };
    for (const [part, value] of Object.entries(copied.texts)) site.change(`blk.${id}.${part}`, "text", value, partMeta);
    for (const [part, value] of Object.entries(copied.images)) site.change(`blk.${id}.${part}`, "image", value, partMeta);
    let tries = 0;
    const open = () => {
      const host = document.getElementById(`blk-${id}`);
      if (host) { host.scrollIntoView({ block: "center", behavior: "smooth" }); window.setTimeout(() => startSizing(host), 450); }
      else if ((tries += 1) < 20) window.setTimeout(open, 150);
    };
    window.setTimeout(open, 150);
  };
  const resetSection = () => {
    const current = sizingRef.current;
    if (!current) return;
    draftRef.current = { patch: {}, everywhere: false };
    window.clearTimeout(draftTimer.current);
    setDraft({});
    site.change(layoutKey(pathname, current.thing), "layout", null, secMeta());
    window.setTimeout(() => setSizing((s) => (s ? { ...s, rect: s.el.getBoundingClientRect() } : s)), 120);
  };

  // Leaving with unsaved changes: the browser asks first
  useEffect(() => {
    if (!site.pending.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [site.pending.length]);

  if (!admin) return null;

  const changes = lastChanges(site.pending);
  const count = changes.length;

  const save = async () => {
    const client = adminClient();
    if (!client) {
      setStatus("error");
      setMessage("Log in at For Work on this browser (your admin account and its code, or GitHub) to save, then try again.");
      return;
    }
    setStatus("saving");
    try {
      const siteChanges = changes.filter((item) => item.kind !== "story");
      const storyChanges = changes.filter((item) => item.kind === "story");
      const next = applyChanges(site.live, site.pending);
      const by = await client.me().catch(() => "OGCW admin");
      const now = new Date().toISOString();
      const tx = client.transaction();
      if (siteChanges.length) {
        const hasHistory = await client.fetch<number>(`count(*[_type == "siteSnapshot"])`);
        // The very first save also keeps the site as it was, so it can be gone back to
        if (!hasHistory) tx.create({ _type: "siteSnapshot", at: new Date(Date.now() - 1000).toISOString(), by: "OGCW", summary: "The site before the first edit", texts: textItems(site.live), images: imageItems(site.live), layouts: layoutItems(site.live) });
        // Each changed text or photo is its own "Site edit", filed under its part of the site
        for (const item of siteChanges) {
          if (item.value === null) tx.delete(editDocId(item.key));
          else tx.createOrReplace(editDoc(item.key, item.kind as "text" | "image" | "layout", item.value, next.meta[item.key], by, now));
        }
        // Edits still in the old single "Site texts" document move to their own too
        const legacy = Object.entries(next.meta).filter(([, meta]) => meta.legacy);
        for (const [key] of legacy) {
          const value = next.texts[key] ?? next.images[key];
          if (value !== undefined) tx.createOrReplace(editDoc(key, editKind(next, key), value, next.meta[key], by, now));
        }
        if (legacy.length || Object.values(site.live.meta).some((meta) => meta.legacy)) tx.delete("siteContent");
        tx.create({ _type: "siteSnapshot", at: now, by, summary: describe(siteChanges), texts: textItems(next), images: imageItems(next), layouts: layoutItems(next) });
      }
      // A story's words: the published story and any draft of it both change
      const storyValues = new Map<string, string>();
      for (const item of storyChanges) {
        if (item.value === null) continue;
        const [slug, field] = item.key.split("|") as [string, StoryField];
        const ids = await client.fetch<string[]>(`*[_type == "story" && slug.current == $slug]._id`, { slug });
        for (const id of ids) tx.patch(id, (patch) => patch.set({ [field]: item.value }));
        storyValues.set(item.key, item.value as string);
      }
      await tx.commit();
      if (siteChanges.length) {
        // Versions older than 30 days go
        const cutoff = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
        await client.pruneHistory(cutoff).catch(() => {});
      }
      site.settle(next, storyValues);
      await refreshSiteCache().catch(() => {});
      void router.invalidate();
      setStatus("saved");
      setMessage(storyChanges.length && !siteChanges.length ? "Saved. It’s live for everyone now." : "Saved. It’s live for everyone now, and kept in Site history.");
      window.setTimeout(() => setStatus((value) => (value === "saved" ? "idle" : value)), 3500);
    } catch {
      setStatus("error");
      setMessage("That didn’t save. Check your connection and try again.");
    }
  };

  /** Puts a new look for the photo in the changes (and on the page at once) */
  const setLook = (next: SiteImage) => {
    if (!photo) return;
    site.change(photo.k, "image", next, { section: sectionNow(photo.section), page: window.location.pathname, usual: photo.usual });
    setPhoto({ ...photo, swapped: true, current: next });
  };
  const upload = async (file: File | undefined) => {
    if (!file || !photo) return;
    const client = adminClient();
    if (!client) {
      setStatus("error");
      setMessage("Log in at For Work on this browser (your admin account and its code, or GitHub) to upload, then try again.");
      return;
    }
    // A video plays in the photo's place (the photo stays as its still, shown while it loads)
    const isVideo = /^video\/(mp4|webm|quicktime)$/.test(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    if (isVideo) {
      // Through the server a video travels as text, so it's kept smaller there
      const limit = studioToken() ? 80 : 11;
      if (file.size > limit * 1_000_000) {
        setStatus("error");
        setMessage(`That video is too big (${Math.round(file.size / 1_000_000)} MB). Use one under ${limit} MB: a short clip works best.`);
        return;
      }
      setUploading(true);
      try {
        const type = file.type || (/\.webm$/i.test(file.name) ? "video/webm" : /\.mov$/i.test(file.name) ? "video/quicktime" : "video/mp4");
        const asset = await client.upload(file.type ? file : new Blob([file], { type }), file.name);
        setLook({ ...photo.current, video: asset.url, videoAssetId: asset._id });
      } catch {
        setStatus("error");
        setMessage("The video didn’t upload. Try again, or try an MP4.");
      } finally {
        setUploading(false);
      }
      return;
    }
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name)) {
      setStatus("error");
      setMessage("That isn’t a picture or a video. Choose a photo (JPG, PNG, WebP or HEIC) or a video (MP4, MOV or WebM).");
      return;
    }
    setUploading(true);
    try {
      const body = await shrink(file);
      const asset = await client.upload(body, file.name.replace(/\.(heic|heif)$/i, ".jpg"));
      const { fit, clear } = photo.current;
      // A new photo starts cropped automatically; "Crop it myself" sets it by hand
      setLook({ src: `${asset.url}?auto=format&w=2000`, assetId: asset._id, alt: photo.alt, ...(fit ? { fit } : {}), ...(clear ? { clear } : {}) });
      if (cropMode === "hand") setCropping(true);
    } catch {
      setStatus("error");
      setMessage("The photo didn’t upload. Try again.");
    } finally {
      setUploading(false);
    }
  };
  /** The crop while dragging: shown at once, put in the changes when let go */
  const cropNow = (): SiteCrop => cropDraft ?? photo?.current.crop ?? { x: 50, y: 50, zoom: 1 };
  const showDraft = (next: SiteCrop) => {
    setCropDraft(next);
    // On the page at once, without a change for every step of the drag
    if (!photo) return;
    for (const img of document.images) {
      if (img.closest(SITE_UI)) continue;
      const key = img.dataset["imgKey"];
      if (key ? key === photo.k : pictureKey(normSrc(srcOf(img))) === photo.k) cropPicture(img, next);
    }
  };
  const keepCrop = (next: SiteCrop) => {
    if (!photo) return;
    setCropDraft(null);
    setLook({ ...photo.current, crop: next });
  };

  // The Edit button: just above the text's top right corner (below it near the top of the screen)
  const button = target && !target.typing && (() => {
    const { rect, kind } = target;
    if (kind === "image") return { top: Math.max(8, rect.top + 10), left: Math.max(8, Math.min(window.innerWidth - 150, rect.left + 10)) };
    const top = rect.top > 40 ? rect.top - 32 : rect.bottom + 6;
    return { top, left: Math.max(8, Math.min(window.innerWidth - 84, rect.right - 72)) };
  })();
  // The section's button sits inside its top right corner, below the site's header
  const pill = editing && !sizing && section && (() => {
    const { rect } = section;
    if (rect.bottom < 120 || rect.top > window.innerHeight - 60) return null;
    return { top: Math.min(window.innerHeight - 50, Math.max(70, rect.top + 12)), left: Math.max(8, Math.min(window.innerWidth - 150, rect.right - 150)) };
  })();


  return (
    <>
      <div className={`site-edit ${editing ? "is-on" : ""}`}>
        <button type="button" className="site-edit-toggle" aria-pressed={editing} onClick={toggle}>
          {editing ? <Eye size={15} aria-hidden="true" /> : <PenLine size={15} aria-hidden="true" />}
          {editing ? "Hide edit buttons" : "Edit site"}
        </button>
        {/* Drawing and writing notes on the page, for Claude (src/components/design-notes.tsx) */}
        <DesignNotes />
        {editing && <span className="site-edit-hint">{touch ? "Tap any text or picture to edit it; “Edit section” changes a whole section" : "Point at any text or picture: press Edit, or drag its handles. “Edit section” changes a whole section, its colours, or adds a new one"}</span>}
      </div>

      {pill && section && (
        <button type="button" className="site-sec-pill" style={pill} onClick={() => startSizing(section.el)} title="Change this section: its content's size, its colours, its place, or add a new section">
          <Scaling size={13} aria-hidden="true" /> Edit section
        </button>
      )}

      {sizing && (() => {
        const { rect, el, thing } = sizing;
        const top = Math.max(64, rect.top);
        const bottom = Math.min(window.innerHeight - 8, rect.bottom);
        const mid = (top + bottom) / 2;
        const content = contentOf(el)?.getBoundingClientRect();
        const look = { ...(site.layout(thing)?.[bpNow()] ?? {}), ...draft } as LookPatch;
        const cw = look.cw ?? measured.cw;
        const pt = look.pt ?? measured.pt;
        const pb = look.pb ?? measured.pb;
        const addedId = el.classList.contains("site-block") ? el.dataset["blk"] ?? null : null;
        const added = addedId ? site.layout(`blk:${addedId}`)?.d : undefined;
        const name = el.querySelector("h1, h2, h3")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 48) || (added ? "Your new section" : "This section");
        const swatch = (value: string | undefined, pick: (colour: string | undefined) => void, label: string) => (
          <div className="site-sec-swatches" role="group" aria-label={label}>
            <button type="button" className="is-usual" aria-pressed={!value} onClick={() => pick(undefined)} title="The usual colour">Usual</button>
            {SECTION_COLOURS.map(([title, hex]) => (
              <button key={hex} type="button" aria-pressed={value?.toLowerCase() === hex.toLowerCase()} onClick={() => pick(hex)} title={title} style={{ background: hex }} aria-label={title} />
            ))}
            <label className="site-sec-custom" title="Any colour">
              <input type="color" value={value ?? "#ffffff"} onChange={(event) => pick(event.target.value)} aria-label={`${label}: any colour`} />
              <span aria-hidden="true">+</span>
            </label>
          </div>
        );
        const slider = (label: string, value: number, min: number, max: number, unit: string, set: (n: number) => void) => (
          <label className="site-sec-slider">
            <span>{label}<b>{value}{unit}</b></span>
            <input type="range" min={min} max={max} value={value} onChange={(event) => set(Number(event.target.value))} onPointerUp={settleDraft} onKeyUp={settleDraft} />
          </label>
        );
        return (
          <>
            {/* The section's frame, its content's frame, and handles for the content's width and the space below */}
            <span className="site-sec-frame" aria-hidden="true" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
            {content && <span className="site-sec-content" aria-hidden="true" style={{ top: content.top, left: content.left, width: content.width, height: content.height }} />}
            <button type="button" className="site-sec-handle is-w" style={{ top: mid - 22, left: (content?.right ?? rect.right) - 9 }} aria-label="Drag to make the content wider or narrower" title="Content width" onPointerDown={startSecDrag("w")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
            <button type="button" className="site-sec-handle is-w" style={{ top: mid - 22, left: (content?.left ?? rect.left) - 9 }} aria-label="Drag to make the content wider or narrower" title="Content width" onPointerDown={startSecDrag("wl")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
            {rect.bottom < window.innerHeight + 4 && (
              <button type="button" className="site-sec-handle is-h" style={{ top: rect.bottom - 9, left: rect.left + rect.width / 2 - 22 }} aria-label="Drag to change the space below the content" title="Space below" onPointerDown={startSecDrag("h")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
            )}

            <aside className="site-sec-panel" role="dialog" aria-label="Edit this section">
              <header className="site-sec-head">
                <p><Scaling size={14} aria-hidden="true" /> Section<small>{name}</small></p>
                <button type="button" className="site-sec-x" onClick={() => { settleDraft(); setSizing(null); }} aria-label="Close"><X size={16} aria-hidden="true" /></button>
              </header>

              <section className="site-sec-group" aria-label="Content">
                <h3>Content <small>the words and pictures inside</small></h3>
                {slider("Width", cw, 20, 100, "%", (n) => nudge({ cw: n }))}
                {slider("Space above", pt, 0, 320, "px", (n) => nudge({ pt: n }))}
                {slider("Space below", pb, 0, 320, "px", (n) => nudge({ pb: n }))}
              </section>

              <section className="site-sec-group" aria-label="Colour">
                <h3>Colour <small>behind the content</small></h3>
                {swatch(look.bg, (colour) => pickStyle({ bg: colour, ...(colour ? {} : { bg2: undefined, split: undefined }) }), "Colour")}
                {look.bg && (
                  <>
                    {slider("Colour width", look.bw ?? 100, 10, 100, "%", (n) => nudge({ bw: n }))}
                    {slider("Colour height", look.bh ?? 100, 10, 100, "%", (n) => nudge({ bh: n }))}
                    <div className="site-sec-seg" role="group" aria-label="Divide the colour">
                      <button type="button" aria-pressed={!look.split} onClick={() => pickStyle({ split: undefined })}>One colour</button>
                      <button type="button" aria-pressed={look.split === "x"} onClick={() => pickStyle({ split: "x", bg2: look.bg2 ?? "#0D0D0D" })}>Side by side</button>
                      <button type="button" aria-pressed={look.split === "y"} onClick={() => pickStyle({ split: "y", bg2: look.bg2 ?? "#0D0D0D" })}>Top and bottom</button>
                    </div>
                    {look.split && (
                      <>
                        {slider("Divide at", look.at ?? 50, 5, 95, "%", (n) => nudge({ at: n }, true))}
                        <p className="site-sec-note">Second colour</p>
                        {swatch(look.bg2, (colour) => pickStyle(colour ? { bg2: colour } : { bg2: undefined, split: undefined }), "Second colour")}
                      </>
                    )}
                  </>
                )}
              </section>

              {added && addedId && (
                <section className="site-sec-group" aria-label="Your section">
                  <h3>Your section</h3>
                  <div className="site-sec-seg" role="group" aria-label="What it shows">
                    {([["text", "Words"], ["image", "Picture"], ["textimage", "Both"], ["stories", "Stories"], ["band", "Colour band"]] as const).map(([kind, label]) => (
                      <button key={kind} type="button" aria-pressed={added.kind === kind} onClick={() => changeAdded(addedId, kind === "stories" ? { kind, cols: Math.max(added.cols ?? 1, 3) } : { kind, cols: Math.min(added.cols ?? 1, 3) })}>{label}</button>
                    ))}
                  </div>
                  {added.kind !== "band" ? (
                    <div className="site-sec-seg" role="group" aria-label="Columns">
                      {(added.kind === "stories" ? [1, 2, 3, 4] : [1, 2, 3]).map((cols) => <button key={cols} type="button" aria-pressed={(added.cols ?? 1) === cols} onClick={() => changeAdded(addedId, { cols })}>{cols} {cols === 1 ? "column" : "columns"}</button>)}
                    </div>
                  ) : (
                    slider("Band height", added.band ?? 160, 20, 800, "px", (n) => changeAdded(addedId, { band: n }))
                  )}
                  <p className="site-sec-note">{added.kind === "stories" ? "Press Change on a card, or Add stories, then search or click any story on the page." : "Point at its words or picture and press Edit or Change photo to fill it in."}</p>
                  <button type="button" className="site-sec-danger" onClick={() => deleteAdded(addedId)}><Trash2 size={14} aria-hidden="true" /> Delete this section</button>
                </section>
              )}

              <section className="site-sec-group" aria-label="Section">
                <h3>Section</h3>
                <div className="site-sec-row">
                  <button type="button" onClick={() => moveSection(-1)}><ArrowUp size={14} aria-hidden="true" /> Move up</button>
                  <button type="button" onClick={() => moveSection(1)}><ArrowDown size={14} aria-hidden="true" /> Move down</button>
                  <button type="button" onClick={() => pickStyle({ hide: look.hide ? undefined : true })}>{look.hide ? <><Eye size={14} aria-hidden="true" /> Show it</> : <><EyeOff size={14} aria-hidden="true" /> Hide it</>}</button>
                  <button type="button" onClick={outer} title="Edit the bigger part around this one instead">Outer part</button>
                </div>
                <p className="site-sec-note">Add a section below this one</p>
                <div className="site-sec-row">
                  <button type="button" onClick={() => addSection("text")}><Plus size={14} aria-hidden="true" /> Words</button>
                  <button type="button" onClick={() => addSection("image")}><Plus size={14} aria-hidden="true" /> Picture</button>
                  <button type="button" onClick={() => addSection("textimage")}><Plus size={14} aria-hidden="true" /> Both</button>
                  <button type="button" onClick={() => addSection("stories")}><Plus size={14} aria-hidden="true" /> Stories</button>
                  <button type="button" onClick={() => addSection("band")}><Plus size={14} aria-hidden="true" /> Colour band</button>
                </div>
                <p className="site-sec-note">Copy and paste</p>
                <div className="site-sec-row">
                  <button type="button" onClick={copySection} title="Copy this section, to paste below any section on any page"><Copy size={14} aria-hidden="true" /> Copy this section</button>
                  {copied && <button type="button" onClick={pasteSection} title={`Paste “${copied.name}” below this section`}><ClipboardPaste size={14} aria-hidden="true" /> Paste below</button>}
                </div>
                {copied && <p className="site-sec-note">Copied: “{copied.name}”</p>}
              </section>

              <footer className="site-sec-foot">
                <button type="button" onClick={resetSection}><RotateCcw size={13} aria-hidden="true" /> Back to usual</button>
                <button type="button" className="is-done" onClick={() => { settleDraft(); setSizing(null); }}><Check size={14} aria-hidden="true" /> Done</button>
              </footer>
            </aside>
          </>
        );
      })()}
      {button && target && !sizing && (
        <>
          <span className={`site-edit-frame${dragging ? " is-dragging" : ""}`} aria-hidden="true" style={{ top: target.rect.top - 3, left: target.rect.left - 4, width: target.rect.width + 8, height: target.rect.height + 6 }} />
          {!dragging && (
            <button
              type="button"
              className={`site-edit-btn ${target.kind === "image" ? "is-photo" : ""}`}
              style={button}
              onPointerDown={(event) => event.preventDefault()} // keeps the page's focus and selection as they are
              onClick={startEditing}
              title={target.el.dataset["hint"]}
              aria-label={target.kind === "image" ? "Change photo" : "Edit this text"}
            >
              {target.kind === "image" ? <ImagePlus size={13} aria-hidden="true" /> : <PenLine size={13} aria-hidden="true" />}
              {target.kind === "image" ? "Change photo" : "Edit"}
            </button>
          )}
          {target.thing && (
            <>
              <button
                type="button"
                className="site-lay-handle is-move"
                style={{ top: Math.max(4, target.rect.top - 16), left: Math.max(4, target.rect.left - 16) }}
                title="Drag to move it anywhere on this page"
                aria-label="Move"
                onPointerDown={startDrag("move")}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <Move size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="site-lay-handle is-size"
                style={{ top: target.rect.bottom - 9, left: target.rect.right - 9 }}
                title="Drag to make it bigger or smaller"
                aria-label="Resize"
                onPointerDown={startDrag("size")}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <Maximize2 size={11} aria-hidden="true" />
              </button>
              {!dragging && site.layout(target.thing)?.[bpNow()] && (
                <button
                  type="button"
                  className="site-lay-handle is-reset"
                  style={{ top: Math.max(4, target.rect.top - 16), left: Math.max(4, target.rect.left + 14) }}
                  title="Put it back where it usually is"
                  onClick={resetPlace}
                >
                  <RotateCcw size={12} aria-hidden="true" /> Reset
                </button>
              )}
            </>
          )}
        </>
      )}

      {(count > 0 || status !== "idle") && (
        <div className="site-savebar" role="region" aria-label="Unsaved changes">
          {status === "saving" ? (
            <span className="site-savebar-text"><Loader2 size={15} className="site-spin" aria-hidden="true" /> Saving…</span>
          ) : status === "saved" || status === "error" ? (
            <span className={`site-savebar-text ${status === "error" ? "is-error" : ""}`} role="status">{message}</span>
          ) : (
            <span className="site-savebar-text"><span className="site-savebar-dot" aria-hidden="true" />{count} unsaved {count === 1 ? "change" : "changes"}</span>
          )}
          {count > 0 && status !== "saving" && (
            <div className="site-savebar-actions">
              <button type="button" onClick={() => { site.undo(); setStatus("idle"); }}><Undo2 size={14} aria-hidden="true" /> Undo</button>
              <button type="button" onClick={() => { site.discard(); setStatus("idle"); }}>Discard</button>
              <button type="button" className="site-save" onClick={() => void save()}>Save changes</button>
            </div>
          )}
          {count === 0 && status === "error" && <button type="button" className="site-savebar-close" aria-label="Close" onClick={() => setStatus("idle")}><X size={14} aria-hidden="true" /></button>}
        </div>
      )}

      {photo && editing && (
        <div
          className={`site-photo-menu${dropping ? " is-dropping" : ""}`}
          role="dialog"
          aria-label="Change this photo"
          style={touch ? undefined : { top: Math.max(12, Math.min(window.innerHeight - 420, photo.rect.top + 12)), left: Math.max(12, Math.min(window.innerWidth - 300, photo.rect.left + 12)) }}
          onDragOver={(event) => { event.preventDefault(); setDropping(true); }}
          onDragLeave={() => setDropping(false)}
          onDrop={(event) => { event.preventDefault(); setDropping(false); void upload(event.dataTransfer.files?.[0]); }}
        >
          <div className="site-photo-head">
            <img src={photo.current.src} alt="" className="site-photo-thumb" />
            <p>{photo.swapped ? "Your photo" : "Photo"}<small>{photo.k.startsWith("pic.") ? "Changes it everywhere it’s used" : "This spot on the site"}</small></p>
          </div>
          <button type="button" className="is-main" disabled={uploading} onClick={() => picker.current?.click()}>
            {uploading ? <Loader2 size={15} className="site-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
            {uploading ? "Uploading…" : touch ? "Choose a photo or video" : "Choose a photo or video from this computer"}
          </button>
          {touch && (
            <button type="button" disabled={uploading} onClick={() => camera.current?.click()}><Camera size={15} aria-hidden="true" /> Take a photo</button>
          )}
          {!touch && <span className="site-photo-drop">or drop a picture or a video here</span>}
          {photo.current.video ? (
            <>
              <VideoTrim key={photo.current.video} look={photo.current} onKeep={setLook} />
              <button type="button" onClick={() => { const { video: _video, videoAssetId: _asset, videoStart: _s, videoEnd: _e, videoOnce: _o, videoRate: _r, ...still } = photo.current; setLook(still); }}><Film size={15} aria-hidden="true" /> Remove the video (keep the photo)</button>
            </>
          ) : (
            <span className="site-photo-drop"><Film size={12} aria-hidden="true" /> Videos (MP4, MOV, WebM) play here muted, on a loop</span>
          )}
          <div className="site-photo-opts" role="group" aria-label="How it shows">
            <button type="button" aria-pressed={photo.current.fit !== "contain"} onClick={() => setLook({ ...photo.current, fit: "cover" })}>Fill the frame</button>
            <button type="button" aria-pressed={photo.current.fit === "contain"} onClick={() => setLook({ ...photo.current, fit: "contain" })}>Whole picture</button>
          </div>
          <div className="site-photo-opts" role="group" aria-label="Crop">
            <button type="button" aria-pressed={!photo.current.crop && !cropping} onClick={() => { setCropMode("auto"); setCropping(false); setCropDraft(null); if (photo.current.crop) { const { crop: _crop, ...rest } = photo.current; setLook(rest); } }}><Sparkles size={13} aria-hidden="true" /> Crop automatically</button>
            <button type="button" aria-pressed={!!photo.current.crop || cropping} onClick={() => { setCropMode("hand"); setCropping(true); }}><Crop size={13} aria-hidden="true" /> Crop it myself</button>
          </div>
          {cropping && (() => {
            const crop = cropNow();
            const ratio = photo.rect.width > 0 && photo.rect.height > 0 ? photo.rect.width / photo.rect.height : 16 / 9;
            const pos = `${crop.x}% ${crop.y}%`;
            return (
              <div className="site-crop">
                <div
                  className="site-crop-box"
                  // The frame's own shape: a tall one is 220px high and narrower, a wide one fills the menu
                  style={{ aspectRatio: String(Math.min(3, Math.max(0.4, ratio))), width: ratio < 1.2 ? `${Math.round(220 * Math.min(3, Math.max(0.4, ratio)))}px` : "100%" }}
                  role="slider"
                  tabIndex={0}
                  aria-label="Drag the picture to choose what stays in the frame (arrow keys work too)"
                  aria-valuetext={`${Math.round(crop.x)}% across, ${Math.round(crop.y)}% down`}
                  onPointerDown={(event) => {
                    const box = event.currentTarget.getBoundingClientRect();
                    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer has */ }
                    cropDrag.current = { x: event.clientX, y: event.clientY, start: crop, w: box.width, h: box.height };
                  }}
                  onPointerMove={(event) => {
                    const drag = cropDrag.current;
                    if (!drag) return;
                    // Dragging the picture right shows more of its left side
                    const speed = 100 / drag.start.zoom;
                    const x = Math.min(100, Math.max(0, drag.start.x - ((event.clientX - drag.x) / drag.w) * speed));
                    const y = Math.min(100, Math.max(0, drag.start.y - ((event.clientY - drag.y) / drag.h) * speed));
                    showDraft({ ...drag.start, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
                  }}
                  onPointerUp={() => { if (cropDrag.current) { cropDrag.current = null; keepCrop(cropNow()); } }}
                  onPointerCancel={() => { cropDrag.current = null; }}
                  onKeyDown={(event) => {
                    const step = event.shiftKey ? 10 : 2;
                    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
                    const move = moves[event.key];
                    if (!move) return;
                    event.preventDefault();
                    event.stopPropagation();
                    keepCrop({ ...crop, x: Math.min(100, Math.max(0, crop.x + move[0])), y: Math.min(100, Math.max(0, crop.y + move[1])) });
                  }}
                >
                  {photo.current.video
                    ? <video src={photo.current.video} poster={photo.current.src} muted loop autoPlay playsInline style={{ objectPosition: pos, transform: `scale(${crop.zoom})`, transformOrigin: pos }} />
                    : <img src={photo.current.src} alt="" draggable={false} style={{ objectPosition: pos, transform: `scale(${crop.zoom})`, transformOrigin: pos }} />}
                  <span className="site-crop-grid" aria-hidden="true" />
                </div>
                <label className="site-sec-slider">
                  <span>Zoom<b>{Math.round(crop.zoom * 100)}%</b></span>
                  <input type="range" min={100} max={300} value={Math.round(crop.zoom * 100)} onChange={(event) => showDraft({ ...crop, zoom: Number(event.target.value) / 100 })} onPointerUp={() => keepCrop(cropNow())} onKeyUp={() => keepCrop(cropNow())} />
                </label>
                <p className="site-sec-note">Drag the picture to choose what stays in the frame. It changes on the page as you go.</p>
                <div className="site-photo-opts">
                  <button type="button" onClick={() => keepCrop({ x: 50, y: 50, zoom: 1 })}><RotateCcw size={13} aria-hidden="true" /> Centre</button>
                  <button type="button" aria-pressed="true" onClick={() => { if (cropDraft) keepCrop(cropDraft); setCropping(false); }}><Check size={13} aria-hidden="true" /> Done</button>
                </div>
              </div>
            );
          })()}
          <button type="button" aria-pressed={!!photo.current.clear} onClick={() => setLook({ ...photo.current, clear: !photo.current.clear })}>
            <Sun size={15} aria-hidden="true" /> {photo.current.clear ? "Shown clearly (tap to dim again)" : "Show it clearly, nothing behind it"}
          </button>
          {photo.swapped && <button type="button" onClick={() => { site.change(photo.k, "image", null, { section: sectionNow(photo.section), page: window.location.pathname, usual: photo.usual }); setPhoto(null); }}><RotateCcw size={15} aria-hidden="true" /> Back to the usual photo</button>}
          <button type="button" onClick={() => setPhoto(null)}><X size={15} aria-hidden="true" /> Close</button>
          <input ref={picker} type="file" accept="image/*,.heic,.heif,video/mp4,video/webm,video/quicktime,.mp4,.mov,.m4v,.webm" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      )}
    </>
  );
}
