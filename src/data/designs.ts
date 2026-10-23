// How a story's page looks: its "design". The text and photos are the
// story's own; the design is only the look, so it can be copied from one
// story and pasted onto another (the studio's "Copy design" and "Paste
// design", src/sanity/page-editor.tsx) without touching the words. A new
// story starts from one of the starting points below ("New story" in the
// studio asks which), each a look plus a few empty blocks to fill in.
// The site draws each look with the og-look-… styles in src/styles/story-designs.css.

export type LookId = "classic" | "spotlight" | "cover" | "magazine" | "split" | "night" | "breaking" | "minimal";
export type Accent = "yellow" | "red" | "blue" | "green" | "white";
export type CaptionSize = "s" | "m" | "l";

export type StoryDesign = {
  look?: LookId;
  accent?: Accent;
  /** The headline's letters: the display face, or a plain bold one */
  headline?: "display" | "bold";
  /** The story text: the usual size, or larger */
  text?: "normal" | "large";
  /** Every caption's size, unless a photo has its own */
  captions?: CaptionSize;
};

export const LOOKS: { id: LookId; name: string; note: string }[] = [
  { id: "classic", name: "Classic", note: "Headline on the left, the photo beside it" },
  { id: "spotlight", name: "Big photo", note: "A wide photo across the top, the headline under it" },
  { id: "cover", name: "Cover", note: "The headline written over a full-width photo" },
  { id: "magazine", name: "Magazine", note: "Centred headline, a wide photo, one calm column" },
  { id: "split", name: "Split screen", note: "The photo fills one half, the words the other" },
  { id: "night", name: "Night", note: "A black page with white words" },
  { id: "breaking", name: "Breaking", note: "A coloured ‘Breaking’ bar and a bold headline" },
  { id: "minimal", name: "Minimal", note: "Words first, the photo after them, nothing else around" },
];

export const ACCENTS: { id: Accent; name: string; colour: string }[] = [
  { id: "yellow", name: "OGCW yellow", colour: "#FFE600" },
  { id: "red", name: "Red", colour: "#E5322D" },
  { id: "blue", name: "Blue", colour: "#2F6BFF" },
  { id: "green", name: "Green", colour: "#1FA65A" },
  { id: "white", name: "Black and white", colour: "#BDBDBD" },
];

const LOOK_IDS = new Set<string>(LOOKS.map((look) => look.id));
const ACCENT_IDS = new Set<string>(ACCENTS.map((accent) => accent.id));

/** Only the parts of a design the site knows (anything else from the studio is dropped) */
export function cleanDesign(value: unknown): StoryDesign | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const design: StoryDesign = {};
  if (typeof raw["look"] === "string" && LOOK_IDS.has(raw["look"])) design.look = raw["look"] as LookId;
  if (typeof raw["accent"] === "string" && ACCENT_IDS.has(raw["accent"])) design.accent = raw["accent"] as Accent;
  if (raw["headline"] === "display" || raw["headline"] === "bold") design.headline = raw["headline"];
  if (raw["text"] === "normal" || raw["text"] === "large") design.text = raw["text"];
  if (raw["captions"] === "s" || raw["captions"] === "m" || raw["captions"] === "l") design.captions = raw["captions"];
  return Object.keys(design).length ? design : undefined;
}

/** The classes that draw a design on the story's page (and on its copy in the studio) */
export function designClasses(design: StoryDesign | undefined) {
  const look = design?.look ?? "classic";
  return [
    `og-look-${look}`,
    design?.accent && design.accent !== "yellow" ? `og-accent-${design.accent}` : "",
    design?.headline === "bold" ? "og-head-bold" : "",
    design?.text === "large" ? "og-text-large" : "",
    design?.captions ? `og-captions-${design.captions}` : "",
  ].filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- Starting points

/** The empty blocks a starting point puts in the story text (Sanity's shape) */
type Starter =
  | { kind: "p" | "h2" | "quote" }
  | { kind: "photo"; size?: "inline" | "wide" | "full" | "side" }
  | { kind: "gallery"; layout: "row" | "slider" | "grid" }
  | { kind: "summary" | "facts" | "timeline" | "faq" | "questions" };

export type StartingPoint = { id: string; name: string; note: string; design: StoryDesign; blocks: Starter[] };

export const STARTING_POINTS: StartingPoint[] = [
  { id: "classic", name: "Classic news", note: "The everyday OGCW story: headline and photo side by side.", design: { look: "classic" }, blocks: [{ kind: "summary" }, { kind: "p" }, { kind: "h2" }, { kind: "p" }, { kind: "photo" }, { kind: "p" }] },
  { id: "spotlight", name: "Big photo", note: "When the picture is the story: a wide photo across the top.", design: { look: "spotlight" }, blocks: [{ kind: "p" }, { kind: "photo", size: "wide" }, { kind: "h2" }, { kind: "p" }] },
  { id: "cover", name: "Cover story", note: "The headline over a full-width photo, for the big ones.", design: { look: "cover" }, blocks: [{ kind: "summary" }, { kind: "p" }, { kind: "quote" }, { kind: "h2" }, { kind: "p" }] },
  { id: "magazine", name: "Magazine feature", note: "Long reads: centred headline, a calm single column.", design: { look: "magazine", text: "large" }, blocks: [{ kind: "p" }, { kind: "quote" }, { kind: "h2" }, { kind: "p" }, { kind: "photo", size: "full" }, { kind: "p" }] },
  { id: "split", name: "Split screen", note: "A tall photo on one half, the words on the other.", design: { look: "split" }, blocks: [{ kind: "summary" }, { kind: "p" }, { kind: "h2" }, { kind: "p" }] },
  { id: "night", name: "Night feature", note: "A black page: films, games, night-time culture.", design: { look: "night" }, blocks: [{ kind: "p" }, { kind: "photo", size: "wide" }, { kind: "h2" }, { kind: "p" }] },
  { id: "breaking", name: "Breaking news", note: "Fast news: a Breaking bar, the short version, then how it happened.", design: { look: "breaking", accent: "red", headline: "bold" }, blocks: [{ kind: "summary" }, { kind: "p" }, { kind: "timeline" }, { kind: "p" }] },
  { id: "minimal", name: "Minimal", note: "Just the words, then the photo. Quiet and clean.", design: { look: "minimal" }, blocks: [{ kind: "p" }, { kind: "p" }, { kind: "h2" }, { kind: "p" }] },
  { id: "photo-story", name: "Photo story", note: "A slideshow of photos with big captions.", design: { look: "spotlight", captions: "l" }, blocks: [{ kind: "p" }, { kind: "gallery", layout: "slider" }, { kind: "p" }, { kind: "gallery", layout: "grid" }] },
  { id: "interview", name: "Interview", note: "A conversation: pull quotes and questions and answers.", design: { look: "magazine" }, blocks: [{ kind: "p" }, { kind: "quote" }, { kind: "faq" }, { kind: "p" }] },
  { id: "review", name: "Review", note: "A verdict: the key facts box, the short version, then the review.", design: { look: "classic", headline: "bold" }, blocks: [{ kind: "facts" }, { kind: "summary" }, { kind: "p" }, { kind: "h2" }, { kind: "p" }, { kind: "gallery", layout: "row" }] },
  { id: "explainer", name: "Explainer", note: "Everything you need to know: questions, a timeline and answers.", design: { look: "classic" }, blocks: [{ kind: "questions" }, { kind: "summary" }, { kind: "p" }, { kind: "timeline" }, { kind: "faq" }] },
];

const key = () => Math.random().toString(36).slice(2, 12);
const textBlock = (style: "normal" | "h2" | "blockquote") => ({ _type: "block", _key: key(), style, markDefs: [], children: [{ _type: "span", _key: key(), text: "", marks: [] }] });

/** A starting point's blocks, as Sanity story text */
export function starterBody(point: StartingPoint) {
  return point.blocks.map((block) => {
    switch (block.kind) {
      case "p": return textBlock("normal");
      case "h2": return textBlock("h2");
      case "quote": return textBlock("blockquote");
      case "photo": return { _type: "storyImage", _key: key(), size: block.size ?? "inline" };
      case "gallery": return { _type: "storyImagePair", _key: key(), layout: block.layout, photos: [] };
      case "summary": return { _type: "summary", _key: key(), title: "The short version", items: [] };
      case "facts": return { _type: "facts", _key: key(), title: "Key facts", items: [] };
      case "timeline": return { _type: "timeline", _key: key(), title: "How it happened", items: [] };
      case "faq": return { _type: "faq", _key: key(), items: [] };
      case "questions": return { _type: "questions", _key: key(), title: "What this story answers", items: [] };
    }
  });
}
