import { useRouter, useRouterState } from "@tanstack/react-router";
import { createClient, type SanityClient } from "@sanity/client";
import { Camera, Check, Eye, ImagePlus, Loader2, Maximize2, Move, PenLine, RotateCcw, Scaling, Sun, Undo2, Upload, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ImgHTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { itemKey, layoutKey, layoutStyle, storyKey, useSiteText, type EditMeta, type LayoutPos, type Pending, type SiteContent, type SiteImage, type SiteLayout, type StoryField } from "@/lib/site-text";
import { pageSection, sectionOfKey, type SiteSection } from "@/lib/site-sections";
import { refreshSiteCache } from "@/lib/sanity-stories";
import { useWorkAccess } from "@/lib/work";
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
const SITE_UI = ".site-edit, .site-photo-menu, .site-savebar, .site-edit-btn, .site-lay-handle, .site-sec-pill, .site-sec-bar, .site-sec-handle, .dn-layer, .dn-bar";

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
  // Clear: the picture at full strength, without the dark wash over it (a
  // hidden picture, e.g. in the closed menu, has no box to clear around it)
  const shown = img.getBoundingClientRect().width > 0;
  for (const el of new Set(shown ? [img, frameOf(img), img.parentElement] : [img])) {
    if (!el) continue;
    if (picture?.clear) el.setAttribute("data-pic-clear", "");
    else el.removeAttribute("data-pic-clear");
  }
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

// What a section's own inline sizes were before it was sized, to put back
const ORIGINAL_SIZE = new WeakMap<HTMLElement, Record<"width" | "maxWidth" | "marginLeft" | "marginRight" | "height" | "minHeight" | "overflow" | "boxSizing", string>>();
/** Sizes one section in place (none: back to how it was) */
function sizeSection(el: HTMLElement, pos: LayoutPos | undefined) {
  if (!ORIGINAL_SIZE.has(el)) {
    const s = el.style;
    ORIGINAL_SIZE.set(el, { width: s.width, maxWidth: s.maxWidth, marginLeft: s.marginLeft, marginRight: s.marginRight, height: s.height, minHeight: s.minHeight, overflow: s.overflow, boxSizing: s.boxSizing });
  }
  const original = ORIGINAL_SIZE.get(el)!;
  const style = el.style;
  if (pos?.w) {
    style.boxSizing = "border-box";
    style.width = `${pos.w}%`;
    style.maxWidth = "none";
    style.marginLeft = style.marginRight = `${(100 - pos.w) / 2}%`;
  } else {
    style.width = original.width;
    style.maxWidth = original.maxWidth;
    style.marginLeft = original.marginLeft;
    style.marginRight = original.marginRight;
    style.boxSizing = original.boxSizing;
  }
  if (pos?.h) {
    style.height = pos.clip ? `${pos.h}px` : original.height;
    style.minHeight = pos.clip ? original.minHeight : `${pos.h}px`;
    style.overflow = pos.clip ? "hidden" : original.overflow;
  } else {
    style.height = original.height;
    style.minHeight = original.minHeight;
    style.overflow = original.overflow;
  }
  if (!pos?.w && !pos?.h) ORIGINAL_SIZE.delete(el);
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

/** Puts this page's moved pictures, sized sections and replaced pictures in place, for everyone */
export function SiteLayouts() {
  const { pageLayouts, pictures, image } = useSiteText();
  useEffect(() => {
    const things = Object.entries(pageLayouts).filter(([thing]) => thing.startsWith("i:") || thing.startsWith("src:"));
    const sections = Object.entries(pageLayouts).filter(([thing]) => thing.startsWith("sec:"));
    const placed = new Set<HTMLElement>();
    const sized = new Set<HTMLElement>();
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
        const ok = hydrated(el);
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
      const seenSections = new Set<HTMLElement>();
      for (const [thing, layout] of sections) {
        const el = findSection(thing);
        if (!el || !ready(el)) continue;
        seenSections.add(el);
        sizeSection(el, layout[bp]);
      }
      for (const el of sized) if (!seenSections.has(el)) sizeSection(el, undefined);
      sized.clear();
      for (const el of seenSections) sized.add(el);
      window.clearTimeout(retry);
      if (waiting) retry = window.setTimeout(apply, 200);
    };
    apply();
    // Pictures and sections that arrive later (lazy lists, route content, a carousel moving on) get theirs too
    const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    media.addEventListener("change", apply);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      media.removeEventListener("change", apply);
      for (const el of placed) placeInline(el, undefined);
      for (const el of sized) sizeSection(el, undefined);
      for (const img of swapped) showPicture(img, undefined, !!img.dataset["imgKey"]);
    };
  }, [pageLayouts, pictures, image]);
  return null;
}

// ---------------------------------------------------------------- Saving

/** Writing to Sanity as the admin logged in to the studio on this browser */
export function adminClient(): SanityClient | null {
  try {
    const token = JSON.parse(localStorage.getItem(`__studio_auth_token_${SANITY_PROJECT_ID}`) ?? "null")?.token;
    if (!token) return null;
    return createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, token, useCdn: false });
  } catch {
    return null;
  }
}

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
        ? { ...(image.alt ? { alt: image.alt } : {}), ...(image.fit ? { fit: image.fit } : {}), ...(image.clear ? { clear: true } : {}), ...(image.assetId ? { image: { _type: "image", asset: { _type: "reference", _ref: image.assetId } } } : { url: image.src }) }
        : { value }),
    updatedAt: at,
    updatedBy: by,
  };
}
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
    ...(image.alt ? { alt: image.alt } : {}),
    ...(image.fit ? { fit: image.fit } : {}),
    ...(image.clear ? { clear: true } : {}),
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
type SecDrag = { mode: "w" | "wl" | "h" | "wh"; x: number; y: number; w: number; h: number; natural: number; across: number; zoom: number; bp: "d" | "m"; base: SiteLayout | undefined; next?: LayoutPos };

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

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
    const imageAt = (x: number, y: number) => document.elementsFromPoint(x, y).find((el) => el instanceof HTMLImageElement && !el.closest(SITE_UI) && el.getBoundingClientRect().width >= 24) as HTMLImageElement | undefined;
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
      if (!fingers || targetRef.current?.typing) return;
      const from = event.target as Element | null;
      if (from?.closest?.(SITE_UI)) return;
      const text = from?.closest?.("[data-edit]") as HTMLElement | null;
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

  // ------------------------------------------------ Sizing a section
  const startSizing = (el: HTMLElement) => {
    setSizing({ el, thing: sectionThing(el), rect: el.getBoundingClientRect() });
    setSection(null);
    setTarget(null);
  };
  /** The part of the page around the one being sized */
  const outer = () => {
    const current = sizingRef.current;
    if (!current) return;
    const all = sectionsAround(current.el.parentElement);
    const next = all.find(isPainted) ?? all[0];
    if (next) startSizing(next);
  };
  const startSecDrag = (mode: SecDrag["mode"]) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = sizingRef.current;
    if (!current || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const el = current.el;
    const bp = bpNow();
    const base = site.layout(current.thing);
    const pos = base?.[bp];
    // Its height with nothing set: below that, the rest gets cut off
    const saved = { height: el.style.height, minHeight: el.style.minHeight };
    el.style.height = "auto";
    el.style.minHeight = "0px";
    const natural = el.offsetHeight;
    el.style.height = saved.height;
    el.style.minHeight = saved.minHeight;
    const rect = el.getBoundingClientRect();
    const across = el.parentElement?.getBoundingClientRect().width || rect.width;
    secDrag.current = { mode, x: event.clientX, y: event.clientY, w: pos?.w ?? Math.round((rect.width / across) * 1000) / 10, h: pos?.h ?? el.offsetHeight, natural, across, zoom: rect.height / (el.offsetHeight || 1) || 1, bp, base };
    setDragging(true);
  };
  const moveSecDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const d = secDrag.current;
    const current = sizingRef.current;
    if (!d || !current) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y;
    const before = d.base?.[d.bp];
    const next: LayoutPos = { x: 0, y: 0, s: 1, ...(before?.w ? { w: before.w } : {}), ...(before?.h ? { h: before.h, ...(before.clip ? { clip: true } : {}) } : {}) };
    if (d.mode !== "h") next.w = Math.min(150, Math.max(20, Math.round((d.w + ((d.mode === "wl" ? -dx : dx) * 200) / d.across) * 10) / 10));
    if (d.mode === "h" || d.mode === "wh") {
      next.h = Math.max(40, Math.round(d.h + dy / d.zoom));
      if (next.h < d.natural - 1) next.clip = true;
      else delete next.clip;
    }
    d.next = next;
    sizeSection(current.el, next);
    setSizing({ ...current, rect: current.el.getBoundingClientRect() });
  };
  const endSecDrag = () => {
    const d = secDrag.current;
    const current = sizingRef.current;
    secDrag.current = null;
    setDragging(false);
    if (!d?.next || !current) return;
    site.change(layoutKey(pathname, current.thing), "layout", { ...(d.base ?? {}), [d.bp]: d.next }, { section: pageSection(pathname), page: pathname });
  };
  const resetSize = () => {
    const current = sizingRef.current;
    if (!current) return;
    const bp = bpNow();
    const rest: SiteLayout = { ...(site.layout(current.thing) ?? {}) };
    delete rest[bp];
    sizeSection(current.el, rest[bp]);
    site.change(layoutKey(pathname, current.thing), "layout", rest.d || rest.m ? rest : null, { section: pageSection(pathname), page: pathname });
    requestAnimationFrame(() => setSizing((s) => (s ? { ...s, rect: s.el.getBoundingClientRect() } : s)));
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
      setMessage("Log in with GitHub at For Work on this browser to connect saving, then try again.");
      return;
    }
    setStatus("saving");
    try {
      const siteChanges = changes.filter((item) => item.kind !== "story");
      const storyChanges = changes.filter((item) => item.kind === "story");
      const next = applyChanges(site.live, site.pending);
      const me = await client.request<{ name?: string; email?: string }>({ uri: "/users/me" }).catch(() => null);
      const by = me?.name || me?.email || "OGCW admin";
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
        await client.delete({ query: `*[_type == "siteSnapshot" && at < $cutoff]`, params: { cutoff } }).catch(() => {});
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
      setMessage("Log in with GitHub at For Work on this browser to connect uploads, then try again.");
      return;
    }
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name)) {
      setStatus("error");
      setMessage("That isn’t a picture. Choose a photo (JPG, PNG, WebP or HEIC).");
      return;
    }
    setUploading(true);
    try {
      const body = await shrink(file);
      const asset = await client.assets.upload("image", body, { filename: file.name.replace(/\.(heic|heif)$/i, ".jpg") });
      const { fit, clear } = photo.current;
      setLook({ src: `${asset.url}?auto=format&w=2000`, assetId: asset._id, alt: photo.alt, ...(fit ? { fit } : {}), ...(clear ? { clear } : {}) });
    } catch {
      setStatus("error");
      setMessage("The photo didn’t upload. Try again.");
    } finally {
      setUploading(false);
    }
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
  const live = sizing ? site.layout(sizing.thing)?.[bpNow()] : undefined;

  return (
    <>
      <div className={`site-edit ${editing ? "is-on" : ""}`}>
        <button type="button" className="site-edit-toggle" aria-pressed={editing} onClick={toggle}>
          {editing ? <Eye size={15} aria-hidden="true" /> : <PenLine size={15} aria-hidden="true" />}
          {editing ? "Hide edit buttons" : "Edit site"}
        </button>
        {/* Drawing and writing notes on the page, for Claude (src/components/design-notes.tsx) */}
        <DesignNotes />
        {editing && <span className="site-edit-hint">{touch ? "Tap any text or picture to edit it; “Section size” resizes a whole section" : "Point at any text or picture: press Edit, or drag its handles. “Section size” resizes a whole section"}</span>}
      </div>

      {pill && section && (
        <button type="button" className="site-sec-pill" style={pill} onClick={() => startSizing(section.el)} title="Make this section, and its background, wider or narrower, taller or shorter">
          <Scaling size={13} aria-hidden="true" /> Section size
        </button>
      )}

      {sizing && (() => {
        const { rect } = sizing;
        const top = Math.max(64, rect.top);
        const bottom = Math.min(window.innerHeight - 8, rect.bottom);
        const mid = (top + bottom) / 2;
        return (
          <>
            <span className="site-sec-frame" aria-hidden="true" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
            <button type="button" className="site-sec-handle is-w" style={{ top: mid - 22, left: rect.right - 9 }} aria-label="Drag to make the section wider or narrower" onPointerDown={startSecDrag("w")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
            <button type="button" className="site-sec-handle is-w" style={{ top: mid - 22, left: rect.left - 9 }} aria-label="Drag to make the section wider or narrower" onPointerDown={startSecDrag("wl")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
            {rect.bottom < window.innerHeight + 4 && (
              <>
                <button type="button" className="site-sec-handle is-h" style={{ top: rect.bottom - 9, left: rect.left + rect.width / 2 - 22 }} aria-label="Drag to make the section taller or shorter" onPointerDown={startSecDrag("h")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
                <button type="button" className="site-sec-handle is-wh" style={{ top: rect.bottom - 13, left: rect.right - 13 }} aria-label="Drag to resize the section" onPointerDown={startSecDrag("wh")} onPointerMove={moveSecDrag} onPointerUp={endSecDrag} onPointerCancel={endSecDrag} />
              </>
            )}
            <div className="site-sec-bar" role="toolbar" aria-label="Section size" style={{ top: Math.min(window.innerHeight - 52, Math.max(66, rect.top + 10)), left: Math.max(8, Math.min(window.innerWidth - 380, rect.left + 10)) }}>
              <span className="site-sec-read">
                <Scaling size={13} aria-hidden="true" /> {live?.w ? `${live.w}% wide` : "Usual width"} · {live?.h ? `${live.h}px tall` : "usual height"}
              </span>
              <button type="button" onClick={outer} title="Size the bigger part around this one instead">Outer part</button>
              {(live?.w || live?.h) && <button type="button" onClick={resetSize}><RotateCcw size={12} aria-hidden="true" /> Reset</button>}
              <button type="button" className="is-done" onClick={() => setSizing(null)}><Check size={13} aria-hidden="true" /> Done</button>
            </div>
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
            {uploading ? "Uploading…" : touch ? "Choose from Photos or Files" : "Choose from this computer"}
          </button>
          {touch && (
            <button type="button" disabled={uploading} onClick={() => camera.current?.click()}><Camera size={15} aria-hidden="true" /> Take a photo</button>
          )}
          {!touch && <span className="site-photo-drop">or drop a picture here</span>}
          <div className="site-photo-opts" role="group" aria-label="How it shows">
            <button type="button" aria-pressed={photo.current.fit !== "contain"} onClick={() => setLook({ ...photo.current, fit: "cover" })}>Fill the frame</button>
            <button type="button" aria-pressed={photo.current.fit === "contain"} onClick={() => setLook({ ...photo.current, fit: "contain" })}>Whole picture</button>
          </div>
          <button type="button" aria-pressed={!!photo.current.clear} onClick={() => setLook({ ...photo.current, clear: !photo.current.clear })}>
            <Sun size={15} aria-hidden="true" /> {photo.current.clear ? "Shown clearly (tap to dim again)" : "Show it clearly, nothing behind it"}
          </button>
          {photo.swapped && <button type="button" onClick={() => { site.change(photo.k, "image", null, { section: sectionNow(photo.section), page: window.location.pathname, usual: photo.usual }); setPhoto(null); }}><RotateCcw size={15} aria-hidden="true" /> Back to the usual photo</button>}
          <button type="button" onClick={() => setPhoto(null)}><X size={15} aria-hidden="true" /> Close</button>
          <input ref={picker} type="file" accept="image/*,.heic,.heif" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      )}
    </>
  );
}
