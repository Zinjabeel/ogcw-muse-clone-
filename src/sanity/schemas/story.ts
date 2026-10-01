import { defineArrayMember, defineField, defineType } from "sanity";

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
      validation: (rule) => rule.required(),
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
          preview: { select: { title: "caption", media: "photo.image" }, prepare: ({ title, media }) => ({ title: title ?? "Photo", subtitle: "Photo", media }) },
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
          preview: { select: { title: "caption", media: "first.image" }, prepare: ({ title, media }) => ({ title: title ?? "Two photos", subtitle: "Two photos", media }) },
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
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: title ?? "Key facts", subtitle: "Key facts box" }) },
        }),
        defineArrayMember({
          name: "checklist",
          title: "Checklist (what to prepare)",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Checklist title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "items", title: "Points", type: "array", of: [defineArrayMember({ type: "string" })] }),
          ],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: title ?? "Checklist", subtitle: "Checklist" }) },
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
          preview: { select: { items: "items" }, prepare: ({ items }) => ({ title: `${(items as unknown[] | undefined)?.length ?? 0} questions`, subtitle: "Questions and answers" }) },
        }),
        defineArrayMember({
          name: "linkButton",
          title: "Link button",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Button text", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "href", title: "Link", type: "string", description: "A page on the site (/news/…) or a full web address.", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "label", subtitle: "href" } },
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
