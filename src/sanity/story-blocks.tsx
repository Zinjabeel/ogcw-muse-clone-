import { AlignCenter, AlignLeft, ArrowDown, ArrowUp, Columns2, GalleryHorizontal, ImagePlus, LayoutGrid, Link2, Minus, Plus, RefreshCw, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type DragEvent, type ReactNode, type SyntheticEvent } from "react";
import { set, unset, useClient, type BlockProps, type Path } from "sanity";
import { Img } from "@/components/cards";
import { captionClass, Gallery } from "@/components/story-figures";
import type { CaptionLook, GalleryLayout } from "@/data/content";
import { captionLook, galleryPhotos, toPhoto, type SanityPhoto } from "@/lib/sanity-mapping";
import { SANITY_API_VERSION } from "./env";
import { usePageEditor, type Change } from "./page-editor";

// The photos and boxes inside a story's text, on the story's copy in the
// studio (src/sanity/page-editor.tsx). Each has a strip of tools on top
// while you point at it: move it up or down, open its settings, delete it.
// A photo's caption and credit are typed straight on the page, and its
// size and caption look are buttons in the strip. Photos together (a
// gallery) take any number of photos: drop them on, drag the small ones
// under it to change the order, and show them side by side, as a slideshow
// with arrows, or as a grid. Outside the page view they look as Sanity
// draws them.

type Value = Record<string, unknown> & { _key?: string };
type PhotoItem = SanityPhoto & { _key?: string; _type?: string };

const newKey = () => Math.random().toString(36).slice(2, 12);
/** Clicks and keys in the tools stay in the tools (not picked up by the text editor around them) */
const keep = (event: SyntheticEvent) => event.stopPropagation();
const hold = (event: DragEvent) => { event.preventDefault(); event.stopPropagation(); };

/** The block's place in the story, and moving it */
function useMoves(key: string | undefined) {
  const editor = usePageEditor();
  const body = editor?.body ?? [];
  const index = body.findIndex((block) => (block as Value)._key === key);
  const move = (by: number) => {
    const to = index + by;
    if (!editor || index < 0 || to < 0 || to >= body.length) return;
    const next = [...body];
    [next[index], next[to]] = [next[to]!, next[index]!];
    editor.onChange(set(next, ["body"]));
  };
  return { up: index > 0 ? () => move(-1) : undefined, down: index >= 0 && index < body.length - 1 ? () => move(1) : undefined };
}

function Tool({ label, icon, text, on, onClick, danger, disabled }: { label: string; icon?: ReactNode; text?: string; on?: boolean; onClick?: (() => void) | undefined; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`se-tool ${text ? "" : "se-tool-icon"} ${on ? "is-on" : ""} ${danger ? "se-blk-danger" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={on === undefined ? undefined : on}
      disabled={disabled || !onClick}
      onClick={onClick}
    >
      {icon}{text}
    </button>
  );
}

/** The frame around every block: its name and tools on top, then the block */
function Frame({ props, name, tools, children, own = true }: { props: BlockProps; name: string; tools?: ReactNode; children: ReactNode; own?: boolean }) {
  const editor = usePageEditor();
  const { up, down } = useMoves((props.value as Value)._key);
  const readOnly = props.readOnly || !!editor?.readOnly;
  return (
    <div className={`se-blk ${props.selected || props.focused ? "is-picked" : ""}`}>
      {!readOnly && (
        <div className="se-blk-tools" contentEditable={false} onMouseDown={keep} onKeyDown={keep} onClick={keep}>
          <span className="se-blk-name">{name}</span>
          {tools}
          {tools && <span className="se-blk-sep" />}
          <Tool label="Move up" icon={<ArrowUp size={14} />} onClick={up} />
          <Tool label="Move down" icon={<ArrowDown size={14} />} onClick={down} />
          <Tool label="All its settings" icon={<SlidersHorizontal size={14} />} text="Settings" onClick={props.onOpen} />
          <Tool label="Delete this from the story" icon={<Trash2 size={14} />} danger onClick={props.onRemove} />
        </div>
      )}
      <div className="se-blk-body">{children}</div>
      {/* Its settings window belongs to Sanity's own drawing of the block */}
      {own && props.open && <div className="se-blk-hidden">{props.renderDefault(props)}</div>}
    </div>
  );
}

/** A caption, typed on the page */
function CaptionBox({ value, placeholder, onChange, readOnly }: { value: string | undefined; placeholder: string; onChange: (value: string) => void; readOnly: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);
  return (
    <span className="se-cap" onMouseDown={keep} onKeyDown={keep} onPaste={keep} onCopy={keep} onCut={keep}>
      <textarea
        ref={ref}
        rows={1}
        value={value ?? ""}
        placeholder={placeholder}
        aria-label="Caption"
        readOnly={readOnly}
        // Enter alone does nothing; Shift + Enter starts a new line in the caption
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) event.preventDefault(); }}
      />
    </span>
  );
}

/** The caption's size, place and style, as buttons */
function CaptionTools({ look, onSet }: { look: CaptionLook; onSet: (field: keyof CaptionLook, value: string | undefined) => void }) {
  return (
    <>
      <Tool label="Small caption" text="S" on={look.captionSize === "s"} onClick={() => onSet("captionSize", look.captionSize === "s" ? undefined : "s")} />
      <Tool label="Medium caption" text="M" on={look.captionSize === "m"} onClick={() => onSet("captionSize", look.captionSize === "m" ? undefined : "m")} />
      <Tool label="Large caption" text="L" on={look.captionSize === "l"} onClick={() => onSet("captionSize", look.captionSize === "l" ? undefined : "l")} />
      <Tool label={look.captionAlign === "center" ? "Caption on the left" : "Caption centred"} icon={look.captionAlign === "center" ? <AlignCenter size={14} /> : <AlignLeft size={14} />} on={look.captionAlign === "center"} onClick={() => onSet("captionAlign", look.captionAlign === "center" ? undefined : "center")} />
      <Tool label="Caption in italics" text="I" on={look.captionStyle === "italic"} onClick={() => onSet("captionStyle", look.captionStyle === "italic" ? undefined : "italic")} />
      <Tool label="Caption beside a coloured bar" text="▍" on={look.captionStyle === "bar"} onClick={() => onSet("captionStyle", look.captionStyle === "bar" ? undefined : "bar")} />
    </>
  );
}

/** Uploading photos to Sanity, as the photo values a story keeps */
function useUpload() {
  const client = useClient({ apiVersion: SANITY_API_VERSION });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const upload = async (files: File[]): Promise<PhotoItem[]> => {
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (!pictures.length) {
      if (files.length) setProblem("That isn’t a picture. Choose a JPG, PNG or WebP.");
      return [];
    }
    setBusy(true);
    setProblem("");
    try {
      const assets = await Promise.all(pictures.map((file) => client.assets.upload("image", file, { filename: file.name })));
      return assets.map((asset) => ({ _type: "photo", _key: newKey(), image: { asset: { _ref: asset._id } } }));
    } catch {
      setProblem("The photo didn’t upload. Try again.");
      return [];
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy, problem };
}
/** A photo value ready to save (Sanity's image needs its type on it) */
const toSave = (photo: PhotoItem) => {
  const { image, ...rest } = photo;
  return { ...rest, _type: "photo", _key: photo._key ?? newKey(), ...(image?.asset?._ref ? { image: { _type: "image", ...image, asset: { _type: "reference", _ref: image.asset._ref } } } : {}) };
};

// ---------------------------------------------------------------- One photo

const SIZES: { id: string; label: string }[] = [
  { id: "inline", label: "In the text" },
  { id: "wide", label: "Wider" },
  { id: "full", label: "Full width" },
  { id: "side", label: "Beside the text" },
];

function PhotoEditor({ props }: { props: BlockProps }) {
  const editor = usePageEditor()!;
  const value = props.value as Value;
  const path = props.path;
  const at = (...rest: Path) => [...path, ...rest];
  const readOnly = props.readOnly || editor.readOnly;
  const write = (change: Change) => { if (!readOnly) editor.onChange(change); };
  const field = (name: string) => (next: string | undefined) => write(next ? set(next, at(name)) : unset(at(name)));
  const { upload, busy, problem } = useUpload();
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [linking, setLinking] = useState(false);

  const photo = value["photo"] as PhotoItem | undefined;
  const shown = toPhoto(photo, 1400);
  const size = typeof value["size"] === "string" ? value["size"] : "inline";
  const look = captionLook(value);
  const replacePhoto = async (files: File[]) => {
    const [first] = await upload(files);
    if (first) write([set({ ...toSave({ ...photo, ...first }), _key: undefined }, at("photo")), unset(at("photo", "url"))]);
  };
  const onDrop = (event: DragEvent) => { hold(event); setOver(false); void replacePhoto([...event.dataTransfer.files]); };
  const applyLink = (url: string) => {
    if (!/^https?:\/\/\S+$/.test(url.trim())) return;
    setLinking(false);
    write([set({ _type: "photo", ...(photo?.alt ? { alt: photo.alt } : {}), ...(photo?.credit ? { credit: photo.credit } : {}), url: url.trim() }, at("photo"))]);
  };

  const tools = (
    <>
      {SIZES.map((option) => <Tool key={option.id} label={`Size: ${option.label}`} text={option.label} on={size === option.id} onClick={() => write(set(option.id, at("size")))} />)}
      <span className="se-blk-sep" />
      <CaptionTools look={look} onSet={(name, next) => field(name)(next)} />
      <span className="se-blk-sep" />
      <Tool label="Choose another photo" icon={<RefreshCw size={14} />} onClick={() => picker.current?.click()} />
      <Tool label="Use a photo link" icon={<Link2 size={14} />} on={linking} onClick={() => setLinking((open) => !open)} />
    </>
  );

  return (
    <Frame props={props} name="Photo" tools={tools}>
      <div className={over ? "se-blk is-over" : undefined} onDragOver={(event) => { hold(event); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
        <figure className={`og-inline se-block ${size !== "inline" ? `og-inline-${size}` : ""}`}>
          {shown ? (
            <Img photo={shown} className="og-inline-photo" />
          ) : (
            <button type="button" className="se-blk-drop og-inline-photo" disabled={readOnly || busy} onMouseDown={keep} onClick={() => picker.current?.click()}>
              <span><ImagePlus size={28} strokeWidth={1.5} aria-hidden="true" /><strong>PHOTO HERE</strong>Drop a photo here, or click to choose one</span>
            </button>
          )}
          {linking && (
            <span className="se-link" onMouseDown={keep} onKeyDown={keep}>
              <input type="url" placeholder="Paste a photo link: https://…" autoFocus defaultValue={photo?.url ?? ""} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(event.currentTarget.value); } if (event.key === "Escape") setLinking(false); }} />
              <button type="button" aria-label="Cancel" onClick={() => setLinking(false)}><X size={15} aria-hidden="true" /></button>
            </span>
          )}
          <figcaption className={captionClass(look)}>
            <CaptionBox value={value["caption"] as string | undefined} placeholder="Write a caption (optional)" onChange={(next) => field("caption")(next || undefined)} readOnly={readOnly} />
            <label className="se-credit-line" onMouseDown={keep} onKeyDown={keep}>
              Photo:
              <input value={photo?.credit ?? ""} placeholder="who took it, and the licence (optional)" readOnly={readOnly} onChange={(event) => write(event.target.value ? set(event.target.value, at("photo", "credit")) : unset(at("photo", "credit")))} />
            </label>
          </figcaption>
        </figure>
        {busy && <span className="se-blk-busy">Uploading…</span>}
        {problem && <span className="se-error" role="alert">{problem}</span>}
      </div>
      <input ref={picker} type="file" accept="image/*" hidden onChange={(event) => { void replacePhoto([...(event.target.files ?? [])]); event.target.value = ""; }} />
    </Frame>
  );
}

export function PhotoBlock(props: BlockProps) {
  if (!usePageEditor()) return props.renderDefault(props);
  return <PhotoEditor props={props} />;
}

// ---------------------------------------------------------------- Photos together

const LAYOUTS: { id: GalleryLayout; label: string; icon: ReactNode }[] = [
  { id: "row", label: "Side by side", icon: <Columns2 size={14} /> },
  { id: "slider", label: "Slideshow", icon: <GalleryHorizontal size={14} /> },
  { id: "grid", label: "Grid", icon: <LayoutGrid size={14} /> },
];

function GalleryEditor({ props }: { props: BlockProps }) {
  const editor = usePageEditor()!;
  const value = props.value as Value;
  const path = props.path;
  const at = (...rest: Path) => [...path, ...rest];
  const readOnly = props.readOnly || editor.readOnly;
  const write = (change: Change) => { if (!readOnly) editor.onChange(change); };
  const { upload, busy, problem } = useUpload();
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  const list = galleryPhotos(value) as PhotoItem[];
  const layout = (["row", "slider", "grid"] as const).find((id) => id === value["layout"]) ?? "row";
  const columns = typeof value["columns"] === "number" ? Math.min(4, Math.max(2, Math.round(value["columns"]))) : 3;
  const look = captionLook(value);
  const field = (name: string) => (next: string | number | undefined) => write(next === undefined || next === "" ? unset(at(name)) : set(next, at(name)));
  // The whole list, in its new order (an older block's left and right photo become the first two)
  const save = (next: PhotoItem[]) => write([set(next.map(toSave), at("photos")), unset(at("first")), unset(at("second"))]);
  const add = async (files: File[]) => {
    const added = await upload(files);
    if (added.length) save([...list, ...added]);
  };
  const remove = (index: number) => save(list.filter((_, i) => i !== index));
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    save(next);
  };
  const onDrop = (event: DragEvent) => {
    hold(event);
    setOver(false);
    if (event.dataTransfer.files.length) void add([...event.dataTransfer.files]);
  };

  const photos = list.flatMap((item) => {
    const photo = toPhoto(item, 1400);
    return photo ? [photo] : [];
  });
  const tools = (
    <>
      {LAYOUTS.map((option) => <Tool key={option.id} label={option.label} icon={option.icon} text={option.label} on={layout === option.id} onClick={() => field("layout")(option.id)} />)}
      {layout === "grid" && (
        <>
          <Tool label="Fewer columns" icon={<Minus size={14} />} onClick={columns > 2 ? () => field("columns")(columns - 1) : undefined} />
          <span className="se-blk-name">{columns} across</span>
          <Tool label="More columns" icon={<Plus size={14} />} onClick={columns < 4 ? () => field("columns")(columns + 1) : undefined} />
        </>
      )}
      <span className="se-blk-sep" />
      <CaptionTools look={look} onSet={(name, next) => field(name)(next)} />
      <span className="se-blk-sep" />
      <Tool label="Add photos" icon={<ImagePlus size={14} />} text="Add" onClick={() => picker.current?.click()} />
    </>
  );

  return (
    <Frame props={props} name={`${photos.length} ${photos.length === 1 ? "photo" : "photos"}`} tools={tools}>
      <div className={over ? "se-blk is-over" : undefined} onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) { hold(event); setOver(true); } }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
        <div className="se-block" onMouseDown={keep} onKeyDown={keep}>
          <Gallery
            photos={photos}
            layout={layout}
            columns={columns}
            look={look}
            onIndex={setCurrent}
            empty={
              <button type="button" className="se-blk-drop" disabled={readOnly || busy} onClick={() => picker.current?.click()}>
                <span><ImagePlus size={28} strokeWidth={1.5} aria-hidden="true" /><strong>PHOTOS HERE</strong>Drop as many photos as you like, or click to choose them</span>
              </button>
            }
            caption={<CaptionBox value={value["caption"] as string | undefined} placeholder="Write a caption (optional)" onChange={(next) => field("caption")(next || undefined)} readOnly={readOnly} />}
          />
        </div>
        {/* The photos in order: drag to move, × to take one out */}
        {!readOnly && (
          <div className="se-thumbs" onMouseDown={keep}>
            {list.map((item, index) => {
              const thumb = toPhoto(item, 200);
              return (
                <span
                  key={item._key ?? index}
                  className={`se-thumb ${layout === "slider" && index === current ? "is-current" : ""} ${dragging === index ? "is-dragging" : ""} ${target === index && dragging !== index ? "is-target" : ""}`}
                  draggable
                  title="Drag to change the order"
                  onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-ogcw-photo", String(index)); setDragging(index); }}
                  onDragOver={(event) => { if (dragging !== null) { hold(event); setTarget(index); } }}
                  onDrop={(event) => { hold(event); if (dragging !== null) reorder(dragging, index); setDragging(null); setTarget(null); }}
                  onDragEnd={() => { setDragging(null); setTarget(null); }}
                >
                  {thumb && <img src={thumb.src} alt="" />}
                  <span>{index + 1}</span>
                  <button type="button" aria-label={`Take photo ${index + 1} out`} onClick={() => remove(index)}><X size={12} aria-hidden="true" /></button>
                </span>
              );
            })}
            <button type="button" className="se-thumb-add" aria-label="Add photos" onClick={() => picker.current?.click()}><Plus size={18} aria-hidden="true" /></button>
          </div>
        )}
        {busy && <span className="se-blk-busy">Uploading…</span>}
        {problem && <span className="se-error" role="alert">{problem}</span>}
      </div>
      <input ref={picker} type="file" accept="image/*" multiple hidden onChange={(event) => { void add([...(event.target.files ?? [])]); event.target.value = ""; }} />
    </Frame>
  );
}

export function GalleryBlock(props: BlockProps) {
  if (!usePageEditor()) return props.renderDefault(props);
  return <GalleryEditor props={props} />;
}

// ---------------------------------------------------------------- Boxes

/** A box (key facts, questions and answers…): drawn as on the site, with the same tools strip */
export function boxBlock(name: string) {
  return function BoxBlock(props: BlockProps) {
    if (!usePageEditor()) return props.renderDefault(props);
    return <Frame props={props} name={name} own={false}>{props.renderDefault(props)}</Frame>;
  };
}
