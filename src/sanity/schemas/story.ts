import { defineArrayMember, defineField, defineType } from "sanity";
import { SLUG, StoryPageInput } from "../page-editor";
import { ChecklistPreview, FactsPreview, FaqPreview, LinkButtonPreview, StoryImagePairPreview, StoryImagePreview } from "../page-previews";

// A story, the same shape as the stories in src/data/content.ts: the
// details (section, label, headline, summary, author, date, photo, sources)
// and the full text. The text is written like a normal document (paragraphs,
// subheads, pull quotes, bullet lists) with OGCW's extra blocks dropped in
// where needed: a photo, two photos side by side, a key-facts box, a
// checklist, questions and answers, and a button link.

const SECTIONS = [
  { title: "Music", value: "music" },
  { title: "Games", value: "games" },
  { title: "Streaming", value: "streaming" },
  { title: "Culture", value: "culture" },
];
const AUTHORS = ["Jonah Reyes", "Nia Vale", "Sana Lind"];

// A photo: upload one, or paste a link (for example a YouTube thumbnail)
const photoFields = [
  defineField({ name: "image", title: "Upload a photo", type: "image", options: { hotspot: true } }),
  defineField({ name: "url", title: "…or paste a photo link", type: "url", description: "Used when no photo is uploaded, e.g. https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg" }),
  defineField({ name: "alt", title: "Describe the photo", type: "string", description: "For screen readers and search engines.", validation: (rule) => rule.required() }),
  defineField({ name: "credit", title: "Credit", type: "string", description: "Photographer and licence, e.g. “Gage Skidmore, CC BY-SA 2.0”." }),
  defineField({
    name: "position",
    title: "Focus point",
    type: "string",
    description: "Optional. Which part of the photo stays in view when it's cropped, as “left% top%”, e.g. “50% 30%”. For uploaded photos you can also set this with the hotspot tool.",
    validation: (rule) => rule.regex(/^\d{1,3}% \d{1,3}%$/, { name: "position" }).warning("Use the form “50% 30%”"),
  }),
  defineField({ name: "zoom", title: "Zoom", type: "number", description: "Optional. 1 is normal; 1.3 zooms in by 30%.", validation: (rule) => rule.min(1).max(3) }),
];

export const photo = defineType({
  name: "photo",
  title: "Photo",
  type: "object",
  fields: photoFields,
  preview: { select: { title: "alt", media: "image" } },
});

export const story = defineType({
  name: "story",
  title: "Story",
  type: "document",
  // Edited on a copy of its own page (src/sanity/page-editor.tsx)
  components: { input: StoryPageInput },
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "text", title: "Story" },
    { name: "sources", title: "Sources" },
  ],
  fields: [
    defineField({ name: "title", title: "Headline", type: "string", group: "details", validation: (rule) => rule.required().max(140) }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      group: "details",
      description: "The end of the story’s link: ogcultureworld.com/news/…",
      options: { source: "title", maxLength: 90 },
      // The site only opens lowercase addresses (src/lib/sanity-stories.ts)
      validation: (rule) => rule.required().custom((value: { current?: string } | undefined) =>
        !value?.current || SLUG.test(value.current) || "Use lowercase letters, numbers and dashes only, e.g. vmas-2026-winners."),
    }),
    defineField({ name: "section", title: "Section", type: "string", group: "details", options: { list: SECTIONS, layout: "radio", direction: "horizontal" }, validation: (rule) => rule.required() }),
    defineField({ name: "kicker", title: "Label", type: "string", group: "details", description: "The small yellow word above the headline, e.g. “Launch” or “Paris Fashion Week”.", validation: (rule) => rule.required().max(40) }),
    defineField({ name: "deck", title: "Summary", type: "text", rows: 3, group: "details", description: "One or two sentences under the headline.", validation: (rule) => rule.required().max(240) }),
    defineField({ name: "author", title: "Author", type: "string", group: "details", options: { list: AUTHORS }, validation: (rule) => rule.required() }),
    defineField({ name: "date", title: "Date", type: "date", group: "details", initialValue: () => new Date().toISOString().slice(0, 10), validation: (rule) => rule.required() }),
    defineField({ name: "photo", title: "Lead photo", type: "photo", group: "details", validation: (rule) => rule.required() }),
    defineField({ name: "ask", title: "Question at the end", type: "string", group: "details", description: "A yes/no question for readers, e.g. “Are you going?”. Leave empty for “Was this helpful?”." }),
    defineField({
      name: "body",
      title: "Story",
      type: "array",
      group: "text",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Paragraph", value: "normal" },
            { title: "Subhead", value: "h2" },
            { title: "Pull quote", value: "blockquote" },
          ],
          lists: [{ title: "Bullet list", value: "bullet" }],
          marks: { decorators: [], annotations: [] },
        }),
        defineArrayMember({
          name: "storyImage",
          title: "Photo",
          type: "object",
          fields: [
            defineField({ name: "photo", title: "Photo", type: "photo", validation: (rule) => rule.required() }),
            defineField({ name: "caption", title: "Caption", type: "string", validation: (rule) => rule.required() }),
          ],
          components: { preview: StoryImagePreview },
          preview: { select: { caption: "caption", media: "photo.image", photo: "photo" }, prepare: ({ caption, media, photo }) => ({ title: caption ?? "Photo", subtitle: "Photo", media, caption, photo }) },
        }),
        defineArrayMember({
          name: "storyImagePair",
          title: "Two photos side by side",
          type: "object",
          fields: [
            defineField({ name: "first", title: "Left photo", type: "photo", validation: (rule) => rule.required() }),
            defineField({ name: "second", title: "Right photo", type: "photo", validation: (rule) => rule.required() }),
            defineField({ name: "caption", title: "Caption", type: "string", validation: (rule) => rule.required() }),
          ],
          components: { preview: StoryImagePairPreview },
          preview: { select: { caption: "caption", media: "first.image", first: "first", second: "second" }, prepare: ({ caption, media, first, second }) => ({ title: caption ?? "Two photos", subtitle: "Two photos", media, caption, first, second }) },
        }),
        defineArrayMember({
          name: "facts",
          title: "Key facts box",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Box title", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "items",
              title: "Facts",
              type: "array",
              of: [defineArrayMember({
                type: "object",
                name: "fact",
                fields: [
                  defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
                  defineField({ name: "value", title: "Value", type: "string", validation: (rule) => rule.required() }),
                ],
                preview: { select: { title: "label", subtitle: "value" } },
              })],
            }),
          ],
          components: { preview: FactsPreview },
          preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title: title ?? "Key facts", subtitle: "Key facts box", items }) },
        }),
        defineArrayMember({
          name: "checklist",
          title: "Checklist (what to prepare)",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Checklist title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "items", title: "Points", type: "array", of: [defineArrayMember({ type: "string" })] }),
          ],
          components: { preview: ChecklistPreview },
          preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title: title ?? "Checklist", subtitle: "Checklist", items }) },
        }),
        defineArrayMember({
          name: "faq",
          title: "Questions and answers",
          type: "object",
          fields: [
            defineField({
              name: "items",
              title: "Questions",
              type: "array",
              of: [defineArrayMember({
                type: "object",
                name: "qa",
                fields: [
                  defineField({ name: "question", title: "Question", type: "string", validation: (rule) => rule.required() }),
                  defineField({ name: "answer", title: "Answer", type: "text", rows: 3, validation: (rule) => rule.required() }),
                ],
                preview: { select: { title: "question", subtitle: "answer" } },
              })],
            }),
          ],
          components: { preview: FaqPreview },
          preview: { select: { items: "items" }, prepare: ({ items }) => ({ title: `${(items as unknown[] | undefined)?.length ?? 0} questions`, subtitle: "Questions and answers", items }) },
        }),
        defineArrayMember({
          name: "linkButton",
          title: "Link button",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Button text", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "href", title: "Link", type: "string", description: "A page on the site (/news/…) or a full web address.", validation: (rule) => rule.required() }),
          ],
          components: { preview: LinkButtonPreview },
          preview: { select: { title: "label", subtitle: "href", label: "label", href: "href" } },
        }),
      ],
    }),
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      group: "sources",
      description: "The reporting the story is based on. Every story lists its sources.",
      of: [defineArrayMember({
        type: "object",
        name: "source",
        fields: [
          defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
          defineField({ name: "url", title: "Link", type: "url", validation: (rule) => rule.required() }),
        ],
        preview: { select: { title: "name", subtitle: "url" } },
      })],
    }),
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: {
    select: { title: "title", section: "section", date: "date", media: "photo.image" },
    prepare: ({ title, section, date, media }) => ({ title, subtitle: [section, date].filter(Boolean).join(" · "), media }),
  },
});

export const schemaTypes = [photo, story];
