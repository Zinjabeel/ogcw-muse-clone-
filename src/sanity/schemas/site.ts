import { defineArrayMember, defineField, defineType } from "sanity";
import { SITE_SECTIONS } from "../../lib/site-sections";

// The site's own words and photos, changed by admins on the page itself
// (point at a text, press "Edit", src/components/site-text.tsx). Each change
// is a "Site edit", filed under the part of the site it's in ("Site edits"
// → Hero, OGCW News…); every save is also kept as a version ("Site
// history", restorable for 30 days).

const formatWhen = (at?: string) => (at ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(at)) : "");

// A section's look, or a section an admin added (src/lib/site-text.tsx, LayoutPos)
const SECTION_FIELDS = [
  defineField({ name: "cw", title: "Content width (%)", type: "number" }),
  defineField({ name: "pt", title: "Space above (px)", type: "number" }),
  defineField({ name: "pb", title: "Space below (px)", type: "number" }),
  defineField({ name: "bg", title: "Colour", type: "string" }),
  defineField({ name: "bg2", title: "Second colour", type: "string" }),
  defineField({ name: "split", title: "Split (x side by side, y top and bottom)", type: "string" }),
  defineField({ name: "at", title: "Split at (%)", type: "number" }),
  defineField({ name: "bw", title: "Colour width (%)", type: "number" }),
  defineField({ name: "bh", title: "Colour height (%)", type: "number" }),
  defineField({ name: "hide", title: "Hidden", type: "boolean" }),
  defineField({ name: "order", title: "Place", type: "number" }),
  defineField({ name: "kind", title: "Added section", type: "string" }),
  defineField({ name: "after", title: "Comes after", type: "string" }),
  defineField({ name: "cols", title: "Columns", type: "number" }),
  defineField({ name: "band", title: "Band height (px)", type: "number" }),
  defineField({ name: "stories", title: "Stories in it (web addresses, in order)", type: "array", of: [defineArrayMember({ type: "string" })] }),
  defineField({ name: "w", title: "Card width (px)", type: "number" }),
  defineField({ name: "h", title: "Card height (px)", type: "number" }),
  defineField({ name: "ih", title: "Picture height (px)", type: "number" }),
  defineField({ name: "one", title: "Collage: only picture number (from 0)", type: "number" }),
];

// A video in a photo's place, and a crop by hand (the site editor's photo menu, 23 Oct 2026)
const MEDIA_FIELDS = [
  defineField({ name: "videoFile", title: "Video (plays in the photo’s place, muted, on a loop)", type: "file", options: { accept: "video/*" } }),
  defineField({ name: "video", title: "…or a video link", type: "url" }),
  defineField({ name: "videoStart", title: "Video starts at (seconds)", type: "number" }),
  defineField({ name: "videoEnd", title: "Video ends at (seconds)", type: "number" }),
  defineField({ name: "videoOnce", title: "Play once (no loop)", type: "boolean" }),
  defineField({ name: "videoRate", title: "Video speed (1 = usual)", type: "number" }),
  defineField({
    name: "tone",
    title: "Photo finish",
    type: "object",
    fields: [
      defineField({ name: "b", title: "Brightness (%)", type: "number" }),
      defineField({ name: "c", title: "Contrast (%)", type: "number" }),
      defineField({ name: "s", title: "Colour (%)", type: "number" }),
      defineField({ name: "g", title: "Black and white (%)", type: "number" }),
    ],
  }),
  defineField({
    name: "crop",
    title: "Cropped by hand",
    description: "Empty: cropped automatically around the middle.",
    type: "object",
    fields: [
      defineField({ name: "x", title: "Across (%)", type: "number" }),
      defineField({ name: "y", title: "Down (%)", type: "number" }),
      defineField({ name: "zoom", title: "Zoom (1 = none)", type: "number" }),
    ],
  }),
];

export const siteEdit = defineType({
  name: "siteEdit",
  title: "Site edit",
  type: "document",
  description: "Changed on the site itself: log in, point at a text and press “Edit”. Changing the text here and publishing works too.",
  fields: [
    defineField({ name: "value", title: "Text on the site", type: "text", rows: 3, hidden: ({ document }) => document?.["kind"] === "image" || document?.["kind"] === "layout" }),
    defineField({
      name: "layout",
      title: "Moved on the page",
      type: "object",
      readOnly: true,
      description: "A text or photo dragged to another place or resized on this page (x and y in pixels from where it usually sits; size 1 = usual), or a whole section sized (width in % of the space it sits in, height in pixels). Delete this edit to put it back.",
      hidden: ({ document }) => document?.["kind"] !== "layout",
      fields: (["d", "m"] as const).map((bp) => defineField({
        name: bp,
        title: bp === "d" ? "On computers" : "On phones and tablets",
        type: "object",
        fields: [
          defineField({ name: "x", type: "number" }),
          defineField({ name: "y", type: "number" }),
          defineField({ name: "s", title: "Size", type: "number" }),
          ...SECTION_FIELDS,
        ],
      })),
    }),
    defineField({ name: "image", title: "Photo on the site", type: "image", hidden: ({ document }) => document?.["kind"] !== "image" }),
    defineField({ name: "url", title: "…or a photo link", type: "url", hidden: ({ document }) => document?.["kind"] !== "image" }),
    defineField({ name: "alt", title: "Describe the photo", type: "string", hidden: ({ document }) => document?.["kind"] !== "image" }),
    defineField({ name: "fit", title: "How it fits", type: "string", options: { list: [{ title: "Fill the frame", value: "cover" }, { title: "Whole picture", value: "contain" }] }, hidden: ({ document }) => document?.["kind"] !== "image" }),
    defineField({ name: "clear", title: "Shown clearly (no dark overlay)", type: "boolean", hidden: ({ document }) => document?.["kind"] !== "image" }),
    ...MEDIA_FIELDS.map((field) => ({ ...field, hidden: ({ document }: { document?: Record<string, unknown> | undefined }) => document?.["kind"] !== "image" })),
    defineField({ name: "usual", title: "Usual wording", type: "string", readOnly: true, description: "What it said before it was changed. Delete this edit to go back to it." }),
    defineField({ name: "section", title: "Part of the site", type: "string", readOnly: true, options: { list: [...SITE_SECTIONS] } }),
    defineField({ name: "page", title: "Changed on the page", type: "string", readOnly: true }),
    defineField({ name: "updatedAt", title: "Last changed", type: "datetime", readOnly: true }),
    defineField({ name: "updatedBy", title: "Changed by", type: "string", readOnly: true }),
    defineField({ name: "key", title: "Name in the code", type: "string", readOnly: true }),
    defineField({ name: "kind", type: "string", readOnly: true, hidden: true }),
  ],
  orderings: [{ title: "Last changed", name: "updatedAtDesc", by: [{ field: "updatedAt", direction: "desc" }] }],
  preview: {
    select: { value: "value", usual: "usual", kind: "kind", media: "image", at: "updatedAt", page: "page" },
    prepare: ({ value, usual, kind, media, at, page }) => ({
      title: kind === "image" ? "Photo" : kind === "layout" ? "Moved or resized" : value || "(empty)",
      subtitle: [usual && kind !== "image" ? `was “${usual}”` : "", page, formatWhen(at)].filter(Boolean).join(" · "),
      media,
    }),
  },
});

// The whole set of edits at one save, for Site history
const contentFields = [
  defineField({
    name: "texts",
    title: "Texts",
    type: "array",
    of: [defineArrayMember({
      name: "siteText",
      type: "object",
      fields: [
        defineField({ name: "key", title: "Where", type: "string", readOnly: true }),
        defineField({ name: "section", title: "Part of the site", type: "string", readOnly: true }),
        defineField({ name: "usual", title: "Usual wording", type: "string", readOnly: true }),
        defineField({ name: "value", title: "Text", type: "text", rows: 2 }),
      ],
      preview: { select: { title: "value", section: "section", usual: "usual" }, prepare: ({ title, section, usual }) => ({ title, subtitle: [section, usual && `was “${usual}”`].filter(Boolean).join(" · ") }) },
    })],
  }),
  defineField({
    name: "images",
    title: "Photos",
    type: "array",
    of: [defineArrayMember({
      name: "siteImage",
      type: "object",
      fields: [
        defineField({ name: "key", title: "Where", type: "string", readOnly: true }),
        defineField({ name: "section", title: "Part of the site", type: "string", readOnly: true }),
        defineField({ name: "usual", title: "The picture it replaces", type: "string", readOnly: true }),
        defineField({ name: "page", title: "Page", type: "string", readOnly: true }),
        defineField({ name: "image", title: "Photo", type: "image" }),
        defineField({ name: "url", title: "…or a photo link", type: "url" }),
        defineField({ name: "alt", title: "Describe the photo", type: "string" }),
        defineField({ name: "fit", title: "How it fits", type: "string" }),
        defineField({ name: "clear", title: "Shown clearly", type: "boolean" }),
        ...MEDIA_FIELDS,
      ],
      preview: { select: { title: "section", subtitle: "key", media: "image" } },
    })],
  }),
  defineField({
    name: "layouts",
    title: "Moved and resized",
    type: "array",
    of: [defineArrayMember({
      name: "siteLayout",
      type: "object",
      fields: [
        defineField({ name: "key", title: "Where", type: "string", readOnly: true }),
        defineField({ name: "page", title: "Page", type: "string", readOnly: true }),
        defineField({ name: "layout", title: "Place and size", type: "object", fields: [defineField({ name: "d", type: "object", fields: [defineField({ name: "x", type: "number" }), defineField({ name: "y", type: "number" }), defineField({ name: "s", type: "number" }), ...SECTION_FIELDS] }), defineField({ name: "m", type: "object", fields: [defineField({ name: "x", type: "number" }), defineField({ name: "y", type: "number" }), defineField({ name: "s", type: "number" }), ...SECTION_FIELDS] })] }),
      ],
      preview: { select: { title: "key", subtitle: "page" } },
    })],
  }),
];

/** The old single document all edits were kept in (moved to Site edits on the next save) */
export const siteContent = defineType({
  name: "siteContent",
  title: "Site texts (old)",
  type: "document",
  fields: [...contentFields, defineField({ name: "updatedBy", title: "Last changed by", type: "string", readOnly: true })],
});

export const siteSnapshot = defineType({
  name: "siteSnapshot",
  title: "Site version",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "at", title: "Saved", type: "datetime" }),
    defineField({ name: "by", title: "By", type: "string" }),
    defineField({ name: "summary", title: "What changed", type: "string" }),
    ...contentFields,
  ],
  orderings: [{ title: "Newest first", name: "atDesc", by: [{ field: "at", direction: "desc" }] }],
  preview: {
    select: { at: "at", by: "by", summary: "summary" },
    // What changed first, then when and who: easier to find the one to go back to
    prepare: ({ at, by, summary }) => ({ title: summary ? String(summary).replace(/^./, (first) => first.toUpperCase()) : "Saved the site", subtitle: [formatWhen(at), by].filter(Boolean).join(" · ") }),
  },
});
