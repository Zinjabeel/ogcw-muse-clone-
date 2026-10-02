import { useRouter, useRouterState } from "@tanstack/react-router";
import { createClient, type SanityClient } from "@sanity/client";
import { Eye, ImagePlus, Loader2, PenLine, RotateCcw, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { itemKey, storyKey, useSiteText, type Pending, type SiteContent, type SiteImage, type StoryField } from "@/lib/site-text";
import { refreshSiteCache } from "@/lib/sanity-stories";
import { useWorkAccess } from "@/lib/work";

// Editing the site on the page, for admins (src/lib/site-text.tsx).
//   <T k="home.news.title">OGCW News</T>      a text anyone sees, an admin can change
//   <S story={story} f="title" />             a story's label, headline or summary
//   <EditableImage k="hero.card.news" … />    a photo an admin can replace
// Logged in as an admin, point at any text and an "Edit" button appears
// beside it: press it and type (Enter to finish, Esc to cancel). Photos get
// a "Change photo" button. A bar collects the changes: Undo, Discard, Save.
// Saving puts them live for everyone and keeps the site's words as a version
// in the studio ("Site history"), restorable for 30 days; story changes go
// to the story itself (with its own history in the studio).

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

/** A short, steady name made from a text's usual wording */
function autoKey(text: string) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `auto.${(hash >>> 0).toString(36)}`;
}

/**
 * A text from the site: its usual wording, or what an admin changed it to.
 * Without a name (`k`), the name comes from the usual wording, so the same
 * wording changes everywhere it's used (e.g. "Play on Spotify").
 */
export function T({ k, children }: { k?: string; children: string | number | undefined }) {
  const site = useSiteText();
  const usualRaw = String(children ?? "");
  // Spaces around the words stay where the page put them
  const [, before = "", usual = "", after = ""] = usualRaw.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? [];
  const key = k ?? autoKey(usual);
  const value = site.text(key) ?? usual;
  if (!usual) return <>{usualRaw}</>;
  if (!site.editing) return <>{before}{rich(value)}{after}</>;
  return (
    <>
      {before}
      <Editable
        value={value}
        display={rich(value)}
        changed={value !== usual}
        hint={value !== usual ? `Edited · usual: “${usual}”` : undefined}
        onCommit={(next) => site.change(key, "text", next === usual ? null : next)}
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
  if (!site.editing) return <>{display}</>;
  return (
    <Editable
      value={value}
      display={display}
      changed={value !== usual}
      max={STORY_LIMITS[f]}
      hint={`The story’s ${STORY_NAMES[f]}: changing it changes it everywhere`}
      onCommit={(next) => site.change(storyKey(story.slug, f), "story", next === usual ? null : next)}
    />
  );
}

function Editable({ value, display, changed, max, hint, onCommit }: { value: string; display: ReactNode; changed: boolean; max?: number; hint?: string | undefined; onCommit: (next: string) => void }) {
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
      className={`site-t${active ? " is-active" : ""}${changed ? " is-changed" : ""}${over ? " is-over" : ""}`}
      data-edit=""
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
  const swap = site.image(k);
  const shown = { ...rest, src: swap?.src ?? src, alt: swap?.alt ?? alt };
  if (!site.editing) return <img {...shown} className={className} />;
  return <img {...shown} className={`${className ?? ""} site-img${swap ? " is-changed" : ""}`} data-edit-img={k} data-swapped={swap ? "" : undefined} />;
}

// ---------------------------------------------------------------- Saving

/** Writing to Sanity as the admin logged in to the studio on this browser */
function adminClient(): SanityClient | null {
  try {
    const token = JSON.parse(localStorage.getItem(`__studio_auth_token_${SANITY_PROJECT_ID}`) ?? "null")?.token;
    if (!token) return null;
    return createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, token, useCdn: false });
  } catch {
    return null;
  }
}

const textItems = (content: SiteContent) => Object.entries(content.texts).map(([key, value]) => ({ _key: itemKey(key), _type: "siteText", key, value }));
const imageItems = (content: SiteContent) =>
  Object.entries(content.images).map(([key, image]) => ({
    _key: itemKey(key),
    _type: "siteImage",
    key,
    ...(image.alt ? { alt: image.alt } : {}),
    ...(image.assetId ? { image: { _type: "image", asset: { _type: "reference", _ref: image.assetId } } } : { url: image.src }),
  }));

/** The last change to each thing (later changes replace earlier ones) */
const lastChanges = (pending: Pending[]) => [...new Map(pending.map((item) => [`${item.kind}:${item.key}`, item])).values()];

/** What the site's words and photos will be once these changes are saved */
function applyChanges(live: SiteContent, pending: Pending[]): SiteContent {
  const texts = { ...live.texts };
  const images = { ...live.images };
  for (const item of pending) {
    if (item.kind === "text") {
      if (item.value === null) delete texts[item.key];
      else texts[item.key] = item.value as string;
    } else if (item.kind === "image") {
      if (item.value === null) delete images[item.key];
      else images[item.key] = item.value as SiteImage;
    }
  }
  return { texts, images };
}

function describe(changes: Pending[]) {
  const parts = changes.map((item) => {
    if (item.kind === "image") return item.value === null ? `photo ${item.key} back to usual` : `photo ${item.key}`;
    if (item.kind === "story") {
      const [slug, field] = item.key.split("|");
      return `${STORY_NAMES[field as StoryField]} of ${slug} → “${String(item.value).slice(0, 40)}”`;
    }
    return item.value === null ? `${item.key} back to usual` : `${item.key} → “${String(item.value).slice(0, 40)}”`;
  });
  return parts.slice(0, 3).join(", ") + (parts.length > 3 ? ` and ${parts.length - 3} more` : "");
}

type Target = { el: HTMLElement; kind: "text" | "image"; rect: DOMRect; typing: boolean };

export function SiteEditor() {
  const site = useSiteText();
  const { editing, setEditing, setBusy } = site;
  const access = useWorkAccess();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<{ k: string; rect: DOMRect; swapped: boolean; alt: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const targetRef = useRef<Target | null>(null);
  targetRef.current = target;

  const admin = access === "admin" && !pathname.startsWith("/admin");

  // Admins get the edit buttons straight away, unless they turned them off
  useEffect(() => {
    if (!admin) return setEditing(false);
    let off = false;
    try { off = localStorage.getItem(OFF_KEY) === "1"; } catch { /* storage blocked */ }
    setEditing(!off);
  }, [admin, setEditing]);
  const toggle = () => {
    const next = !editing;
    setEditing(next);
    setTarget(null);
    setPhoto(null);
    try { if (next) localStorage.removeItem(OFF_KEY); else localStorage.setItem(OFF_KEY, "1"); } catch { /* storage blocked */ }
  };

  // While pointing at or typing in something, the moving parts hold still
  useEffect(() => { setBusy(!!target || !!photo); }, [target, photo, setBusy]);
  useEffect(() => {
    document.documentElement.classList.toggle("site-editing", editing);
    return () => document.documentElement.classList.remove("site-editing");
  }, [editing]);

  // Find the text (or photo) under the pointer, and keep the Edit button by it
  useEffect(() => {
    if (!editing) return;
    let frame = 0;
    const show = (el: HTMLElement, kind: Target["kind"]) => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
      const current = targetRef.current;
      if (current?.el === el) return;
      setTarget({ el, kind, rect: el.getBoundingClientRect(), typing: false });
    };
    const hideSoon = () => {
      if (hideTimer.current !== undefined) return;
      hideTimer.current = window.setTimeout(() => { hideTimer.current = undefined; setTarget((current) => (current?.typing ? current : null)); }, 450);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || targetRef.current?.typing) return;
      cancelAnimationFrame(frame);
      const { clientX: x, clientY: y } = event;
      const from = event.target as Element | null;
      frame = requestAnimationFrame(() => {
        if (from?.closest?.(".site-edit-btn, .site-photo-menu, .site-savebar, .site-edit")) return void window.clearTimeout(hideTimer.current);
        const text = from?.closest?.("[data-edit]") as HTMLElement | null;
        if (text) return show(text, "text");
        const img = document.elementsFromPoint(x, y).find((el) => el instanceof HTMLImageElement && el.dataset["editImg"] !== undefined) as HTMLElement | undefined;
        if (img) return show(img, "image");
        hideSoon();
      });
    };
    const onScroll = () => setTarget((current) => (current ? { ...current, rect: current.el.getBoundingClientRect() } : current));
    const onEnd = () => setTarget(null);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener(END_EVENT, onEnd);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener(END_EVENT, onEnd);
    };
  }, [editing]);
  useEffect(() => { if (!editing) setTarget(null); }, [editing]);

  const startEditing = useCallback(() => {
    const current = targetRef.current;
    if (!current) return;
    if (current.kind === "image") {
      const img = current.el as HTMLImageElement;
      setPhoto({ k: img.dataset["editImg"] ?? "", rect: img.getBoundingClientRect(), swapped: img.dataset["swapped"] !== undefined, alt: img.alt });
      setTarget(null);
      return;
    }
    setTarget({ ...current, typing: true });
    current.el.dispatchEvent(new Event(START_EVENT));
  }, []);

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
        tx.createIfNotExists({ _id: "siteContent", _type: "siteContent" });
        // The very first save also keeps the site as it was, so it can be gone back to
        if (!hasHistory) tx.create({ _type: "siteSnapshot", at: new Date(Date.now() - 1000).toISOString(), by: "OGCW", summary: "The site before the first edit", texts: textItems(site.live), images: imageItems(site.live) });
        tx.patch("siteContent", (patch) => patch.set({ texts: textItems(next), images: imageItems(next), updatedBy: by }));
        tx.create({ _type: "siteSnapshot", at: now, by, summary: describe(siteChanges), texts: textItems(next), images: imageItems(next) });
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

  const upload = async (file: File | undefined) => {
    if (!file || !photo) return;
    const client = adminClient();
    if (!client) {
      setStatus("error");
      setMessage("Log in with GitHub at For Work on this browser to connect uploads, then try again.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("That isn’t a picture. Choose a JPG, PNG or WebP.");
      return;
    }
    setUploading(true);
    try {
      const asset = await client.assets.upload("image", file, { filename: file.name });
      site.change(photo.k, "image", { src: `${asset.url}?auto=format&w=2000`, assetId: asset._id, alt: photo.alt });
      setPhoto(null);
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

  return (
    <>
      <div className={`site-edit ${editing ? "is-on" : ""}`}>
        <button type="button" className="site-edit-toggle" aria-pressed={editing} onClick={toggle}>
          {editing ? <Eye size={15} aria-hidden="true" /> : <PenLine size={15} aria-hidden="true" />}
          {editing ? "Hide edit buttons" : "Edit site"}
        </button>
        {editing && <span className="site-edit-hint">Point at any text and press Edit</span>}
      </div>

      {button && target && (
        <>
          <span className="site-edit-frame" aria-hidden="true" style={{ top: target.rect.top - 3, left: target.rect.left - 4, width: target.rect.width + 8, height: target.rect.height + 6 }} />
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
        <div className="site-photo-menu" role="dialog" aria-label="Change this photo" style={{ top: Math.max(12, Math.min(window.innerHeight - 180, photo.rect.top + 12)), left: Math.max(12, Math.min(window.innerWidth - 260, photo.rect.left + 12)) }}>
          <p>Photo</p>
          <button type="button" disabled={uploading} onClick={() => picker.current?.click()}>
            {uploading ? <Loader2 size={15} className="site-spin" aria-hidden="true" /> : <ImagePlus size={15} aria-hidden="true" />} {uploading ? "Uploading…" : "Replace photo"}
          </button>
          {photo.swapped && <button type="button" onClick={() => { site.change(photo.k, "image", null); setPhoto(null); }}><RotateCcw size={15} aria-hidden="true" /> Back to the usual photo</button>}
          <button type="button" onClick={() => setPhoto(null)}><X size={15} aria-hidden="true" /> Close</button>
          <input ref={picker} type="file" accept="image/*" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      )}
    </>
  );
}
