import { defineArrayMember, defineField, defineType } from "sanity";

// The site's own words and photos, changed by admins on the page itself
// ("Edit site", src/components/site-text.tsx): one live document, and a
// version kept at every save ("Site history", restorable for 30 days).

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
        defineField({ name: "value", title: "Text", type: "text", rows: 2 }),
      ],
      preview: { select: { title: "value", subtitle: "key" } },
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
        defineField({ name: "image", title: "Photo", type: "image" }),
        defineField({ name: "url", title: "…or a photo link", type: "url" }),
        defineField({ name: "alt", title: "Describe the photo", type: "string" }),
      ],
      preview: { select: { title: "key", media: "image" } },
    })],
  }),
];

export const siteContent = defineType({
  name: "siteContent",
  title: "Site texts",
  type: "document",
  description: "Changed on the site itself: log in, press “Edit site”, click a text or photo.",
  fields: [...contentFields, defineField({ name: "updatedBy", title: "Last changed by", type: "string", readOnly: true })],
  preview: { prepare: () => ({ title: "Site texts (live)", subtitle: "Changed on the site with “Edit site”" }) },
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
    prepare: ({ at, by, summary }) => ({
      title: at ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(at)) : "Version",
      subtitle: [by, summary].filter(Boolean).join(" · "),
    }),
  },
});
