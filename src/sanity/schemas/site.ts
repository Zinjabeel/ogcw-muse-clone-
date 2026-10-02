import { defineArrayMember, defineField, defineType } from "sanity";
import { SITE_SECTIONS } from "../../lib/site-sections";

// The site's own words and photos, changed by admins on the page itself
// (point at a text, press "Edit", src/components/site-text.tsx). Each change
// is a "Site edit", filed under the part of the site it's in ("Site edits"
// → Hero, OGCW News…); every save is also kept as a version ("Site
// history", restorable for 30 days).

const formatWhen = (at?: string) => (at ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(at)) : "");

export const siteEdit = defineType({
  name: "siteEdit",
  title: "Site edit",
  type: "document",
  description: "Changed on the site itself: log in, point at a text and press “Edit”. Changing the text here and publishing works too.",
  fields: [
    defineField({ name: "value", title: "Text on the site", type: "text", rows: 3, hidden: ({ document }) => document?.["kind"] === "image" }),
    defineField({ name: "image", title: "Photo on the site", type: "image", hidden: ({ document }) => document?.["kind"] !== "image" }),
    defineField({ name: "url", title: "…or a photo link", type: "url", hidden: ({ document }) => document?.["kind"] !== "image" }),
    defineField({ name: "alt", title: "Describe the photo", type: "string", hidden: ({ document }) => document?.["kind"] !== "image" }),
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
      title: kind === "image" ? "Photo" : value || "(empty)",
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
        defineField({ name: "image", title: "Photo", type: "image" }),
        defineField({ name: "url", title: "…or a photo link", type: "url" }),
        defineField({ name: "alt", title: "Describe the photo", type: "string" }),
      ],
      preview: { select: { title: "section", subtitle: "key", media: "image" } },
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
    prepare: ({ at, by, summary }) => ({ title: formatWhen(at) || "Version", subtitle: [by, summary].filter(Boolean).join(" · ") }),
  },
});
