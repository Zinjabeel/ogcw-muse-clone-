import { useRouter, useRouterState } from "@tanstack/react-router";
import { createClient, type SanityClient } from "@sanity/client";
import { Check, ImagePlus, Loader2, PenLine, RotateCcw, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState, type ImgHTMLAttributes, type MouseEvent as ReactMouseEvent } from "react";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/env";
import { itemKey, useSiteText, type SiteContent, type SiteImage } from "@/lib/site-text";
import { refreshSiteCache } from "@/lib/sanity-stories";
import { useWorkAccess } from "@/lib/work";

// Editing the site on the page, for admins (src/lib/site-text.tsx).
//   <T k="home.news.title">OGCW News</T>      a text anyone sees, an admin can change
//   <EditableImage k="hero.card.news" … />    a photo an admin can replace
// "Edit site" (bottom left, admins only) outlines everything editable: click
// a text and type (Enter to finish, Esc to cancel), click a photo to replace
// it. A bar collects the changes: Undo, Discard, Save. Saving puts them live
// for everyone and keeps the whole set as a version in the studio ("Site
// history"), restorable for 30 days.

const HISTORY_DAYS = 30;
const IMAGE_EVENT = "ogcw-edit-image";

/** A text from the site: its usual wording, or what an admin changed it to */
export function T({ k, children }: { k: string; children: string }) {
  const site = useSiteText();
  const value = site.text(k) ?? children;
  if (!site.editing) return <>{value}</>;
  return <EditableText k={k} value={value} usual={children} />;
}

function EditableText({ k, value, usual }: { k: string; value: string; usual: string }) {
  const site = useSiteText();
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const changed = value !== usual;

  const start = (event: ReactMouseEvent) => {
    event.preventDefault(); // a text inside a link or button doesn't follow it while editing
    event.stopPropagation();
    if (active) return;
    setActive(true);
  };
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
    const el = ref.current;
    const next = (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    setActive(false);
    if (!next || next === value) return;
    site.change(k, "text", next === usual ? null : next);
  };

  return (
    <span
      // Remounts between reading and typing, so React never fights the typed text
      key={active ? "typing" : "reading"}
      ref={ref}
      className={`site-t ${active ? "is-active" : ""} ${changed ? "is-changed" : ""}`}
      data-k={k}
      title={active ? undefined : changed ? `Edited · usual: “${usual}”` : "Click to edit"}
      contentEditable={active ? "plaintext-only" : undefined}
      suppressContentEditableWarning
      role={active ? "textbox" : undefined}
      onClick={start}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") { event.preventDefault(); ref.current?.blur(); }
        if (event.key === "Escape") { if (ref.current) ref.current.textContent = value; ref.current?.blur(); }
      }}
      onBlur={finish}
    >
      {value}
    </span>
  );
}

/** A photo from the site: its usual one, or the one an admin put in its place */
export function EditableImage({ k, src, alt, className, onClick, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { k: string; src: string; alt: string }) {
  const site = useSiteText();
  const swap = site.image(k);
  const shown = { ...rest, src: swap?.src ?? src, alt: swap?.alt ?? alt };
  if (!site.editing) return <img {...shown} className={className} onClick={onClick} />;
  return (
    <img
      {...shown}
      className={`${className ?? ""} site-img ${swap ? "is-changed" : ""}`}
      data-k={k}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        window.dispatchEvent(new CustomEvent(IMAGE_EVENT, { detail: { k, rect, swapped: !!swap, alt: shown.alt } }));
      }}
    />
  );
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

/** What the site will look like once these changes are saved */
function applyChanges(live: SiteContent, pending: ReturnType<typeof useSiteText>["pending"]): SiteContent {
  const texts = { ...live.texts };
  const images = { ...live.images };
  for (const item of pending) {
    if (item.kind === "text") {
      if (item.value === null) delete texts[item.key];
      else texts[item.key] = item.value as string;
    } else if (item.value === null) delete images[item.key];
    else images[item.key] = item.value as SiteImage;
  }
  return { texts, images };
}

function describe(pending: ReturnType<typeof useSiteText>["pending"]) {
  const last = new Map(pending.map((item) => [`${item.kind}:${item.key}`, item]));
  const parts = [...last.values()].map((item) => (item.kind === "image" ? `photo ${item.key}` : item.value === null ? `${item.key} back to usual` : `${item.key} → “${String(item.value).slice(0, 40)}”`));
  return parts.slice(0, 3).join(", ") + (parts.length > 3 ? ` and ${parts.length - 3} more` : "");
}

export function SiteEditor() {
  const site = useSiteText();
  const access = useWorkAccess();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<{ k: string; rect: DOMRect; swapped: boolean; alt: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  // Everything editable gets its outline from the page's class
  useEffect(() => {
    document.documentElement.classList.toggle("site-editing", site.editing);
    return () => document.documentElement.classList.remove("site-editing");
  }, [site.editing]);
  useEffect(() => {
    const open = (event: Event) => setPhoto((event as CustomEvent).detail);
    window.addEventListener(IMAGE_EVENT, open);
    return () => window.removeEventListener(IMAGE_EVENT, open);
  }, []);
  // Leaving with unsaved changes: the browser asks first
  useEffect(() => {
    if (!site.pending.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [site.pending.length]);

  if (access !== "admin" || pathname.startsWith("/admin")) return null;

  const count = new Set(site.pending.map((item) => `${item.kind}:${item.key}`)).size;

  const save = async () => {
    const client = adminClient();
    if (!client) {
      setStatus("error");
      setMessage("Open the admin dashboard once on this browser to connect saving, then try again.");
      return;
    }
    setStatus("saving");
    try {
      const next = applyChanges(site.live, site.pending);
      const me = await client.request<{ name?: string; email?: string }>({ uri: "/users/me" }).catch(() => null);
      const by = me?.name || me?.email || "OGCW admin";
      const now = new Date().toISOString();
      const hasHistory = await client.fetch<number>(`count(*[_type == "siteSnapshot"])`);
      const tx = client.transaction().createIfNotExists({ _id: "siteContent", _type: "siteContent" });
      // The very first save also keeps the site as it was, so it can be gone back to
      if (!hasHistory) tx.create({ _type: "siteSnapshot", at: new Date(Date.now() - 1000).toISOString(), by: "OGCW", summary: "The site before the first edit", texts: textItems(site.live), images: imageItems(site.live) });
      tx.patch("siteContent", (patch) => patch.set({ texts: textItems(next), images: imageItems(next), updatedBy: by }));
      tx.create({ _type: "siteSnapshot", at: now, by, summary: describe(site.pending), texts: textItems(next), images: imageItems(next) });
      await tx.commit();
      // Versions older than 30 days go
      const cutoff = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
      await client.delete({ query: `*[_type == "siteSnapshot" && at < $cutoff]`, params: { cutoff } }).catch(() => {});
      site.settle(next);
      await refreshSiteCache().catch(() => {});
      void router.invalidate();
      setStatus("saved");
      setMessage("Saved. It’s live for everyone now, and kept in Site history.");
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
      setMessage("Open the admin dashboard once on this browser to connect uploads, then try again.");
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

  return (
    <>
      <div className={`site-edit ${site.editing ? "is-on" : ""}`}>
        <button type="button" className="site-edit-toggle" aria-pressed={site.editing} onClick={() => { site.setEditing(!site.editing); setPhoto(null); }}>
          {site.editing ? <Check size={15} aria-hidden="true" /> : <PenLine size={15} aria-hidden="true" />}
          {site.editing ? "Done editing" : "Edit site"}
        </button>
        {site.editing && <span className="site-edit-hint">Click any outlined text or photo to change it</span>}
      </div>

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

      {photo && site.editing && (
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
