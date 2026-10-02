import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type DragEvent } from "react";
import { Check, ChevronDown, ImagePlus, Link2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useDocumentPane } from "sanity/structure";
import { PlacesButton } from "./placements";
import { getPublishedId, insert, ObjectInputMember, set, setIfMissing, unset, useClient, type FieldMember, type FormPatch, type ObjectInputProps, type Path, type PatchEvent, type RenderFieldCallback } from "sanity";
import { Img } from "@/components/cards";
import { formatDate, SECTIONS, wordCount } from "@/data/content";
import { SECTION_IDS, toBlocks, toPhoto, type SanityBlock, type SanityPhoto } from "@/lib/sanity-mapping";
import { SANITY_API_VERSION } from "./env";

// The story editor in the studio: the story laid out exactly like its page
// on the site (src/routes/news.$slug.tsx), with a box on everything you can
// change. Click a box and type; photos drop straight onto the page. The
// story text is Sanity's own text editor, dressed as the page. "All fields"
// switches to Sanity's plain form, for anything the page doesn't show (the
// photo's focus point and zoom, for example).

type Source = { _key: string; _type?: string; name?: string; url?: string };
type Story = {
  title?: string; slug?: { current?: string }; section?: string; kicker?: string; deck?: string; author?: string; date?: string;
  photo?: SanityPhoto; ask?: string; body?: SanityBlock[]; sources?: Source[];
};
type Change = FormPatch | FormPatch[] | PatchEvent;

const AUTHORS = ["Jonah Reyes", "Nia Vale", "Sana Lind"];
const MODE_KEY = "ogcw-studio-editor";
/** A story's web address: what the site accepts (src/lib/sanity-stories.ts) */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALL_FIELDS = "all-fields";

/** True inside the page view, so the story's photo and box blocks draw themselves as they look on the site */
export const PageViewContext = createContext(false);
export const usePageView = () => useContext(PageViewContext);

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90).replace(/-$/, "");
const newKey = () => Math.random().toString(36).slice(2, 12);

// The same rules as the story's schema (src/sanity/schemas/story.ts), checked
// on the page as you type
function checkStory(story: Story): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const add = (key: string, message: string) => { (errors[key] ??= []).push(message); };
  const required = (key: string, value: unknown) => { if (!value) add(key, "Required"); };
  const max = (key: string, value: string | undefined, limit: number) => {
    if (value && value.length > limit) add(key, `Keep it under ${limit} characters (now ${value.length}).`);
  };
  required("title", story.title?.trim());
  max("title", story.title, 140);
  required("slug", story.slug?.current);
  if (story.slug?.current && !SLUG.test(story.slug.current)) add("slug", "Use lowercase letters, numbers and dashes only, e.g. vmas-2026-winners.");
  required("section", story.section);
  required("kicker", story.kicker?.trim());
  max("kicker", story.kicker, 40);
  required("deck", story.deck?.trim());
  max("deck", story.deck, 240);
  required("author", story.author);
  required("date", story.date);
  required("photo", story.photo?.image?.asset?._ref || story.photo?.url);
  if (story.photo?.image?.asset?._ref || story.photo?.url) required("photo.alt", story.photo.alt?.trim());
  return errors;
}

// ---------------------------------------------------------------- Boxes

/** A box you click and type in, styled by whatever it sits in (the headline, the summary…) */
function Box({
  label, value, placeholder, onChange, onFocus, errors, readOnly, multiline = false, className = "",
}: {
  label: string; value: string | undefined; placeholder: string; onChange: (value: string) => void; onFocus?: () => void;
  errors?: string[]; readOnly?: boolean; multiline?: boolean; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Grow with the text, and with the column when the pane is resized
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    const fit = () => {
      field.style.height = "0px";
      field.style.height = `${field.scrollHeight}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(field);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span className={`se-box ${value ? "" : "se-empty"} ${errors?.length ? "se-invalid" : ""} ${className}`} data-label={label}>
      <textarea
        ref={ref}
        className="se-input"
        rows={1}
        value={value ?? ""}
        placeholder={placeholder}
        aria-label={label}
        readOnly={readOnly}
        onFocus={onFocus}
        onChange={(event) => onChange(multiline ? event.target.value : event.target.value.replace(/\s*\n\s*/g, " "))}
        onKeyDown={(event) => { if (!multiline && event.key === "Enter") event.preventDefault(); }}
      />
      {/* An empty box turns red on its own; other problems (too long…) are spelled out */}
      {value && errors?.map((message) => <span key={message} className="se-error" role="alert">{message}</span>)}
    </span>
  );
}

/** A small menu that looks like the words it changes (the section, the author) */
function Choice({ label, value, options, placeholder, onChange, readOnly, invalid }: {
  label: string; value: string | undefined; options: { value: string; title: string }[]; placeholder: string; onChange: (value: string) => void; readOnly: boolean; invalid: boolean;
}) {
  return (
    <span className={`se-choice ${value ? "" : "se-empty"} ${invalid ? "se-invalid" : ""}`}>
      <select aria-label={label} value={value ?? ""} disabled={readOnly} onChange={(event) => onChange(event.target.value)}>
        {!value && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.title}</option>)}
      </select>
      <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

function DateChoice({ value, onChange, readOnly, invalid }: { value: string | undefined; onChange: (value: string) => void; readOnly: boolean; invalid: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className={`se-choice se-date ${value ? "" : "se-empty"} ${invalid ? "se-invalid" : ""}`}>
      <button type="button" disabled={readOnly} onClick={() => { try { ref.current?.showPicker(); } catch { ref.current?.focus(); } }}>
        {value ? formatDate(value) : "DATE HERE"}
      </button>
      <input ref={ref} type="date" tabIndex={-1} aria-label="Date" value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </span>
  );
}

// ---------------------------------------------------------------- Lead photo

function LeadPhoto({ photo, onChange, onFocus, errors, altErrors, readOnly }: {
  photo: SanityPhoto | undefined; onChange: (change: Change) => void; onFocus: (path: Path) => void; errors: string[]; altErrors: string[]; readOnly: boolean;
}) {
  const client = useClient({ apiVersion: SANITY_API_VERSION });
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [dragging, setDragging] = useState(false);
  const [linking, setLinking] = useState(false);
  const shown = toPhoto(photo, 1600);
  const field = (name: keyof SanityPhoto) => (value: string) =>
    onChange(value ? [setIfMissing({ _type: "photo" }, ["photo"]), set(value, ["photo", name])] : unset(["photo", name]));

  const upload = async (file: File | undefined) => {
    if (!file || readOnly) return;
    if (!file.type.startsWith("image/")) {
      setProblem("That isn’t a picture. Choose a JPG, PNG or WebP.");
      return;
    }
    setBusy(true);
    setProblem("");
    try {
      const asset = await client.assets.upload("image", file, { filename: file.name });
      onChange([setIfMissing({ _type: "photo" }, ["photo"]), set({ _type: "image", asset: { _type: "reference", _ref: asset._id } }, ["photo", "image"])]);
    } catch {
      setProblem("The photo didn’t upload. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  };
  const useLink = (url: string) => {
    if (!/^https?:\/\/\S+$/.test(url.trim())) {
      setProblem("Paste a full link that starts with https://");
      return;
    }
    setProblem("");
    setLinking(false);
    onChange([setIfMissing({ _type: "photo" }, ["photo"]), unset(["photo", "image"]), set(url.trim(), ["photo", "url"])]);
  };

  return (
    <figure className="og-article-lead se-lead" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
      {shown ? (
        <div className={`se-photo ${dragging ? "se-dragging" : ""}`}>
          <Img photo={shown} className="og-article-lead-photo" eager />
          {!readOnly && (
            <div className="se-photo-tools">
              <button type="button" onClick={() => picker.current?.click()}><RefreshCw size={14} aria-hidden="true" /> Change</button>
              <button type="button" onClick={() => setLinking((open) => !open)}><Link2 size={14} aria-hidden="true" /> Link</button>
              <button type="button" aria-label="Remove the photo" onClick={() => onChange([unset(["photo", "image"]), unset(["photo", "url"])])}><Trash2 size={14} aria-hidden="true" /></button>
            </div>
          )}
          {busy && <span className="se-photo-busy">Uploading…</span>}
        </div>
      ) : (
        <button type="button" className={`og-article-lead-photo se-drop ${dragging ? "se-dragging" : ""} ${errors.length ? "se-invalid" : ""}`} disabled={readOnly || busy} onClick={() => picker.current?.click()}>
          <ImagePlus size={30} strokeWidth={1.5} aria-hidden="true" />
          <strong>{busy ? "Uploading…" : "LEAD PHOTO HERE"}</strong>
          <span>Drop a photo here, or click to choose one</span>
        </button>
      )}
      {!shown && !readOnly && <button type="button" className="se-link-toggle" onClick={() => setLinking((open) => !open)}><Link2 size={13} aria-hidden="true" /> Use a photo link instead</button>}
      {linking && (
        <span className="se-link">
          <input type="url" placeholder="Paste a photo link: https://…" autoFocus defaultValue={photo?.url ?? ""} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); useLink(event.currentTarget.value); } if (event.key === "Escape") setLinking(false); }} />
          <button type="button" aria-label="Use this link" onClick={(event) => useLink((event.currentTarget.previousElementSibling as HTMLInputElement).value)}><Check size={15} aria-hidden="true" /></button>
          <button type="button" aria-label="Cancel" onClick={() => setLinking(false)}><X size={15} aria-hidden="true" /></button>
        </span>
      )}
      <figcaption>
        Photo: <Box label="Photo credit" value={photo?.credit} placeholder="PHOTO CREDIT HERE" onChange={field("credit")} onFocus={() => onFocus(["photo", "credit"])} readOnly={readOnly} className="se-inline" />
      </figcaption>
      <p className="se-note">
        <span className="se-note-label">Not shown, read aloud to blind readers:</span>
        <Box label="Photo description" value={photo?.alt} placeholder="DESCRIBE THE PHOTO HERE" onChange={field("alt")} onFocus={() => onFocus(["photo", "alt"])} errors={altErrors} readOnly={readOnly} />
      </p>
      {/* With no photo the empty frame turns red on its own */}
      {[...(shown ? errors : []), ...(problem ? [problem] : [])].map((message) => <span key={message} className="se-error" role="alert">{message}</span>)}
      <input ref={picker} type="file" accept="image/*" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    </figure>
  );
}

// ---------------------------------------------------------------- Sources

function Sources({ sources, onChange, onFocus, readOnly }: { sources: Source[]; onChange: (change: Change) => void; onFocus: (path: Path) => void; readOnly: boolean }) {
  const edit = (key: string, name: "name" | "url") => (value: string) => onChange(set(value, ["sources", { _key: key }, name]));
  return (
    <div className="og-sources se-sources">
      <h2 className="og-sources-title">Sources</h2>
      <ul>
        {sources.map((source) => (
          <li key={source._key} className="se-source">
            <Box label="Source name" value={source.name} placeholder="SOURCE NAME HERE" onChange={edit(source._key, "name")} onFocus={() => onFocus(["sources", { _key: source._key }, "name"])} readOnly={readOnly} />
            <Box label="Source link" value={source.url} placeholder="https://…" onChange={edit(source._key, "url")} onFocus={() => onFocus(["sources", { _key: source._key }, "url"])} readOnly={readOnly} className="se-source-url" />
            {!readOnly && <button type="button" className="se-icon" aria-label="Remove this source" onClick={() => onChange(unset(["sources", { _key: source._key }]))}><X size={14} aria-hidden="true" /></button>}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <button type="button" className="se-add" onClick={() => onChange([setIfMissing([], ["sources"]), insert([{ _type: "source", _key: newKey(), name: "", url: "" }], "after", ["sources", -1])])}>
          <Plus size={14} aria-hidden="true" /> Add a source
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- The page

const bareField: RenderFieldCallback = (field) => <>{field.children}</>;

export function StoryPageInput(props: ObjectInputProps) {
  const { onChange, onPathFocus, members, groups, onFieldGroupSelect } = props;
  const readOnly = Boolean(props.readOnly);
  const story = (props.value ?? {}) as Story;
  const [mode, setMode] = useState<"page" | "fields">(() => {
    try { return localStorage.getItem(MODE_KEY) === "fields" ? "fields" : "page"; } catch { return "page"; }
  });
  const choose = (next: "page" | "fields") => {
    setMode(next);
    try { localStorage.setItem(MODE_KEY, next); } catch { /* not remembered, that's all */ }
  };

  // The page shows every field at once, so the form must too (not just one tab's)
  const selectedGroup = groups.find((group) => group.selected)?.name;
  useEffect(() => {
    if (mode === "page" && selectedGroup && selectedGroup !== ALL_FIELDS) onFieldGroupSelect(ALL_FIELDS);
  }, [mode, selectedGroup, onFieldGroupSelect]);

  // What's missing or wrong, box by box: the page's own checks, straight
  // away as you type, plus Sanity's (which also guard the Publish button)
  const { validation: checks } = useDocumentPane();
  const local = checkStory(story);
  const errorsAt = (...path: string[]) => {
    const key = path.join(".");
    const fromSanity = checks
      .filter((item) => item.level === "error" && item.path.length === path.length && path.every((part, index) => item.path[index] === part))
      .map((item) => item.message);
    return [...new Set([...(local[key] ?? []), ...fromSanity])];
  };
  const text = (name: keyof Story) => (value: string) => onChange(value ? set(value, [name]) : unset([name]));
  const focus = (path: Path) => () => onPathFocus(path);

  const switcher = (
    <div className="se-modes" role="group" aria-label="How to edit">
      <button type="button" aria-pressed={mode === "page"} onClick={() => choose("page")}>Page</button>
      <button type="button" aria-pressed={mode === "fields"} onClick={() => choose("fields")}>All fields</button>
    </div>
  );
  // Where on the site it shows besides the News page (src/sanity/placements.tsx)
  const documentId = (props.value as { _id?: string } | undefined)?._id;
  const places = (
    <PlacesButton
      story={{ id: documentId ? getPublishedId(documentId) : "", slug: story.slug?.current ?? "", title: story.title || "This story", date: story.date ?? "", photo: story.photo }}
      disabled={readOnly || !documentId}
    />
  );

  if (mode === "fields") {
    return (
      <div className="se-fields">
        <div className="se-fields-bar">{switcher}{places}</div>
        {props.renderDefault(props)}
      </div>
    );
  }

  const bodyMember = members.find((member): member is FieldMember => member.kind === "field" && member.name === "body");
  const body = toBlocks(story.body);
  const read = `${Math.max(2, Math.round(wordCount(body) / 230))} min read`;
  const subheads = body.flatMap((block) => (block.type === "h2" ? [block.text] : []));
  const slug = story.slug?.current ?? "";

  return (
    <PageViewContext.Provider value={true}>
      <div className="se-canvas">
        <div className="se-bar">
          {switcher}
          <label className={`se-address ${errorsAt("slug").length ? "se-invalid" : ""}`}>
            <span>ogcultureworld.com/news/</span>
            <input
              value={slug}
              placeholder="web-address-here"
              aria-label="Web address"
              readOnly={readOnly}
              onFocus={focus(["slug"])}
              onChange={(event) => onChange(set({ _type: "slug", current: event.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }, ["slug"]))}
            />
            {/* Only for a story without an address yet: changing a published story's address breaks links to it */}
            {!readOnly && story.title && !slug && (
              <button type="button" onClick={() => onChange(set({ _type: "slug", current: slugify(story.title ?? "") }, ["slug"]))}>Make from headline</button>
            )}
          </label>
          {places}
        </div>
        {slug && errorsAt("slug").map((message) => <p key={message} className="se-error se-bar-error" role="alert">{message}</p>)}

        <article className="og-article se-wrap">
          <header className="og-article-head">
            <div className="og-article-top">
              <div>
                <nav className="og-crumbs" aria-label="Section">
                  <span>News</span>
                  <span aria-hidden="true">/</span>
                  <Choice
                    label="Section"
                    value={story.section}
                    placeholder="SECTION HERE"
                    options={SECTION_IDS.map((id) => ({ value: id, title: SECTIONS[id].label }))}
                    onChange={text("section")}
                    readOnly={readOnly}
                    invalid={errorsAt("section").length > 0}
                  />
                </nav>
                <p className="og-kicker">
                  <Box label="Label" value={story.kicker} placeholder="LABEL HERE" onChange={text("kicker")} onFocus={focus(["kicker"])} errors={errorsAt("kicker")} readOnly={readOnly} />
                </p>
                <h1 className="og-article-title">
                  <Box label="Headline" value={story.title} placeholder="HEADLINE HERE" onChange={text("title")} onFocus={focus(["title"])} errors={errorsAt("title")} readOnly={readOnly} />
                </h1>
                <p className="og-article-deck">
                  <Box label="Summary" value={story.deck} placeholder="SUMMARY HERE: one or two sentences under the headline" onChange={text("deck")} onFocus={focus(["deck"])} errors={errorsAt("deck")} readOnly={readOnly} />
                </p>
              </div>
              <LeadPhoto photo={story.photo} onChange={onChange} onFocus={onPathFocus} errors={errorsAt("photo")} altErrors={errorsAt("photo", "alt")} readOnly={readOnly} />
            </div>
            <div className="og-byline">
              <span>By <Choice label="Author" value={story.author} placeholder="AUTHOR HERE" options={AUTHORS.map((name) => ({ value: name, title: name }))} onChange={text("author")} readOnly={readOnly} invalid={errorsAt("author").length > 0} /></span>
              <DateChoice value={story.date} onChange={text("date")} readOnly={readOnly} invalid={errorsAt("date").length > 0} />
              <span>{read}</span>
              <span className="og-share" aria-hidden="true"><Link2 size={14} /> Copy link</span>
            </div>
          </header>

          <div className="og-article-layout">
            <div className="og-prose se-prose">
              {bodyMember ? (
                <div className="se-body">
                  <ObjectInputMember
                    member={bodyMember}
                    renderField={bareField}
                    renderInput={props.renderInput}
                    renderItem={props.renderItem}
                    renderPreview={props.renderPreview}
                    {...(props.renderBlock ? { renderBlock: props.renderBlock } : {})}
                    {...(props.renderInlineBlock ? { renderInlineBlock: props.renderInlineBlock } : {})}
                    {...(props.renderAnnotation ? { renderAnnotation: props.renderAnnotation } : {})}
                  />
                </div>
              ) : (
                <p className="se-note">Loading the story text…</p>
              )}

              <section className="fb se-fb">
                <p className="fb-kicker">Your turn</p>
                <h2 className="fb-question">
                  <Box label="Question at the end" value={story.ask} placeholder="Was this helpful?" onChange={text("ask")} onFocus={focus(["ask"])} readOnly={readOnly} />
                </h2>
                <div className="fb-buttons" aria-hidden="true">
                  <span className="fb-button">Yes</span>
                  <span className="fb-button">No</span>
                </div>
              </section>
              <p className="og-signoff">{story.author ?? "The author"} for OGCW</p>
              <Sources sources={story.sources ?? []} onChange={onChange} onFocus={onPathFocus} readOnly={readOnly} />
            </div>
            <aside className="og-article-aside">
              {subheads.length > 2 && (
                <nav className="og-toc" aria-label="In this story">
                  <p className="og-aside-title">In this story</p>
                  <ol>{subheads.map((heading) => <li key={heading}><span className="se-toc-item">{heading}</span></li>)}</ol>
                </nav>
              )}
            </aside>
          </div>
        </article>
      </div>
    </PageViewContext.Provider>
  );
}
