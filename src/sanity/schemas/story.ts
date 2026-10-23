import { defineArrayMember, defineField, defineType } from "sanity";
import { SLUG, StoryPageInput } from "../page-editor";
import { ChecklistPreview, FactsPreview, FaqPreview, LinkButtonPreview, QuestionsPreview, RelatedPreview, StoryImagePairPreview, StoryImagePreview, SummaryPreview, TimelinePreview } from "../page-previews";
import { boxBlock, GalleryBlock, PhotoBlock } from "../story-blocks";
import { ACCENTS, LOOKS } from "@/data/designs";
import { frontPage } from "./front-page";
import { siteContent, siteEdit, siteSnapshot } from "./site";

// A story, the same shape as the stories in src/data/content.ts: the
// details (section, label, headline, summary, author, date, photo, sources)
// and the full text. The text is written like a normal document (paragraphs,
// subheads, pull quotes, bullet lists) with OGCW's extra blocks dropped in
// where needed: a photo, two photos side by side, a key-facts box, a
// checklist, questions and answers, and a button link.

const SECTIONS = [
  { title: "Music", value: "music" },
  { title: "Gaming", value: "games" },
  { title: "Streaming", value: "streaming" },
  { title: "Entertainment", value: "culture" },
  { title: "Sports", value: "sports" },
];

// A photo: upload one, or paste a link (for example a YouTube thumbnail)
const photoFields = [
  defineField({ name: "image", title: "Upload a photo", type: "image", options: { hotspot: true } }),
  defineField({ name: "url", title: "…or paste a photo link", type: "url", description: "Used when no photo is uploaded, e.g. https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg" }),
  defineField({ name: "alt", title: "Describe the photo (optional)", type: "string", description: "Read aloud to blind readers. Leave it empty and the caption (or, for the lead photo, the headline) is read instead." }),
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

// How a photo's caption looks (also buttons on the photo in the page view, src/sanity/story-blocks.tsx)
const CAPTION_SIZES = [{ title: "Small", value: "s" }, { title: "Medium", value: "m" }, { title: "Large", value: "l" }];
const captionFields = [
  defineField({ name: "captionSize", title: "Caption size", type: "string", description: "Empty: the story’s usual caption size.", options: { list: CAPTION_SIZES, layout: "radio", direction: "horizontal" } }),
  defineField({ name: "captionAlign", title: "Caption place", type: "string", options: { list: [{ title: "Left", value: "left" }, { title: "Centred", value: "center" }], layout: "radio", direction: "horizontal" } }),
  defineField({ name: "captionStyle", title: "Caption style", type: "string", options: { list: [{ title: "Plain", value: "plain" }, { title: "Italics", value: "italic" }, { title: "Beside a coloured bar", value: "bar" }], layout: "radio", direction: "horizontal" } }),
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
    { name: "design", title: "Design" },
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
    // Label and summary: a nudge, never a block on publishing (an empty label shows the section's name)
    defineField({ name: "kicker", title: "Label", type: "string", group: "details", description: "The small yellow word above the headline, e.g. “Launch” or “Paris Fashion Week”. Left empty, the section’s name shows.", validation: (rule) => rule.max(40).warning() }),
    defineField({ name: "deck", title: "Summary", type: "text", rows: 3, group: "details", description: "One or two sentences under the headline.", validation: (rule) => [rule.required().warning("A summary under the headline helps readers. You can still publish without one."), rule.max(240).warning()] }),
    defineField({
      name: "credit",
      title: "Source",
      type: "string",
      group: "details",
      description: "Who the news comes from: the company, organisation or publication behind it (e.g. “Rockstar Games”, “Deadline”), or “OGCW” for our own reporting and round-ups. Never a made-up name.",
      initialValue: "OGCW",
      validation: (rule) => rule.required().max(60),
    }),
    defineField({ name: "date", title: "Date", type: "date", group: "details", description: "The day it happened, not the day it was written up.", initialValue: () => new Date().toISOString().slice(0, 10), validation: (rule) => rule.required() }),
    defineField({ name: "updated", title: "Latest update", type: "date", group: "details", description: "For an ongoing story (a release date, a trial, a tour): the date of the latest update it reports. Shows as “Latest update: …”." }),
    defineField({ name: "certified", title: "Certified", type: "boolean", group: "details", description: "The OGCW editors’ stamp: shows a CERTIFIED label on the story.", initialValue: false }),
    defineField({
      name: "photo",
      title: "Lead photo",
      type: "photo",
      group: "details",
      validation: (rule) => rule.custom((value: { image?: { asset?: unknown }; url?: string } | undefined) =>
        value?.image?.asset || value?.url ? true : "Add a lead photo: drop one on the page, or paste a photo link."),
    }),
    defineField({ name: "ask", title: "Question at the end", type: "string", group: "details", description: "A yes/no question for readers, e.g. “Are you going?”. Leave empty for “Was this helpful?”." }),
    // How the page looks (src/data/designs.ts): chosen with "Design" in the
    // page view, copied from story to story with "Copy design" and "Paste design"
    defineField({
      name: "design",
      title: "Design",
      type: "object",
      group: "design",
      description: "How the story’s page looks. The words and photos stay the same whatever you pick.",
      options: { collapsible: false },
      fields: [
        defineField({ name: "look", title: "Look", type: "string", options: { list: LOOKS.map((look) => ({ title: `${look.name}: ${look.note}`, value: look.id })), layout: "radio" }, initialValue: "classic" }),
        defineField({ name: "accent", title: "Colour", type: "string", options: { list: ACCENTS.map((accent) => ({ title: accent.name, value: accent.id })), layout: "radio", direction: "horizontal" } }),
        defineField({ name: "headline", title: "Headline letters", type: "string", options: { list: [{ title: "Display (the usual)", value: "display" }, { title: "Bold", value: "bold" }], layout: "radio", direction: "horizontal" } }),
        defineField({ name: "text", title: "Text size", type: "string", options: { list: [{ title: "Usual", value: "normal" }, { title: "Larger", value: "large" }], layout: "radio", direction: "horizontal" } }),
        defineField({ name: "captions", title: "Caption size", type: "string", description: "For every caption, unless a photo has its own.", options: { list: CAPTION_SIZES, layout: "radio", direction: "horizontal" } }),
      ],
    }),
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
            defineField({ name: "photo", title: "Photo", type: "photo" }),
            defineField({ name: "caption", title: "Caption (optional)", type: "text", rows: 2, description: "Shift + Enter for a new line." }),
            ...captionFields,
            defineField({
              name: "size",
              title: "Size",
              type: "string",
              description: "Vary the sizes down a story: a big moment gets Full width, a portrait sits Beside the text.",
              options: { list: [{ title: "In the text column", value: "inline" }, { title: "Wider", value: "wide" }, { title: "Full width", value: "full" }, { title: "Beside the text", value: "side" }], layout: "radio", direction: "horizontal" },
              initialValue: "inline",
            }),
          ],
          components: { preview: StoryImagePreview, block: PhotoBlock },
          preview: { select: { caption: "caption", media: "photo.image", photo: "photo", size: "size" }, prepare: ({ caption, media, photo, size }) => ({ title: caption ?? "Photo", subtitle: "Photo", media, caption, photo, size }) },
        }),
        // Photos together, as many as you like: side by side, a slideshow with
        // arrows, or a grid (it used to be just two, "first" and "second";
        // those still show, and become the list the first time it's changed)
        defineArrayMember({
          name: "storyImagePair",
          title: "Photos together (side by side, slideshow or grid)",
          type: "object",
          fields: [
            defineField({ name: "photos", title: "Photos", type: "array", of: [defineArrayMember({ type: "photo" })], options: { layout: "grid" } }),
            defineField({
              name: "layout",
              title: "Show them",
              type: "string",
              options: { list: [{ title: "Side by side", value: "row" }, { title: "Slideshow (arrows to the next photo)", value: "slider" }, { title: "Grid", value: "grid" }], layout: "radio" },
              initialValue: "row",
            }),
            defineField({ name: "columns", title: "Photos across (grid)", type: "number", options: { list: [2, 3, 4], layout: "radio", direction: "horizontal" }, hidden: ({ parent }) => (parent as { layout?: string } | undefined)?.layout !== "grid" }),
            defineField({ name: "caption", title: "Caption (optional)", type: "text", rows: 2, description: "Shift + Enter for a new line." }),
            ...captionFields,
            defineField({ name: "first", title: "Left photo (older layout)", type: "photo", hidden: ({ parent }) => !(parent as { first?: unknown } | undefined)?.first }),
            defineField({ name: "second", title: "Right photo (older layout)", type: "photo", hidden: ({ parent }) => !(parent as { second?: unknown } | undefined)?.second }),
          ],
          components: { preview: StoryImagePairPreview, block: GalleryBlock },
          preview: {
            select: { caption: "caption", media: "photos.0.image", firstMedia: "first.image", photos: "photos", first: "first", second: "second", galleryLayout: "layout" },
            prepare: ({ caption, media, firstMedia, photos, first, second, galleryLayout }) => {
              const count = Array.isArray(photos) && photos.length ? photos.length : [first, second].filter(Boolean).length;
              return { title: caption || `${count} photos`, subtitle: "Photos together", media: media ?? firstMedia, caption, photos, first, second, galleryLayout };
            },
          },
        }),
        defineArrayMember({
          name: "facts",
          title: "Key facts box",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Box title", type: "string" }),
            defineField({
              name: "items",
              title: "Facts",
              type: "array",
              of: [defineArrayMember({
                type: "object",
                name: "fact",
                fields: [
                  defineField({ name: "label", title: "Label", type: "string" }),
                  defineField({ name: "value", title: "Value", type: "string" }),
                ],
                preview: { select: { title: "label", subtitle: "value" } },
              })],
            }),
          ],
          components: { preview: FactsPreview, block: boxBlock("Key facts") },
          preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title: title ?? "Key facts", subtitle: "Key facts box", items }) },
        }),
        defineArrayMember({
          name: "checklist",
          title: "Checklist (what to prepare)",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Checklist title", type: "string" }),
            defineField({ name: "items", title: "Points", type: "array", of: [defineArrayMember({ type: "string" })] }),
          ],
          components: { preview: ChecklistPreview, block: boxBlock("Checklist") },
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
                  defineField({ name: "question", title: "Question", type: "string" }),
                  defineField({ name: "answer", title: "Answer", type: "text", rows: 3 }),
                ],
                preview: { select: { title: "question", subtitle: "answer" } },
              })],
            }),
          ],
          components: { preview: FaqPreview, block: boxBlock("Questions and answers") },
          preview: { select: { items: "items" }, prepare: ({ items }) => ({ title: `${(items as unknown[] | undefined)?.length ?? 0} questions`, subtitle: "Questions and answers", items }) },
        }),
        defineArrayMember({
          name: "linkButton",
          title: "Link button",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Button text", type: "string" }),
            defineField({ name: "href", title: "Link", type: "string", description: "A page on the site (/news/…) or a full web address." }),
          ],
          components: { preview: LinkButtonPreview, block: boxBlock("Button") },
          preview: { select: { title: "label", subtitle: "href", label: "label", href: "href" } },
        }),
        defineArrayMember({
          name: "questions",
          title: "Questions this story answers",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Box title", type: "string", initialValue: "What this story answers" }),
            defineField({ name: "items", title: "Questions", type: "array", of: [defineArrayMember({ type: "string" })], validation: (rule) => rule.max(6).warning() }),
          ],
          components: { preview: QuestionsPreview, block: boxBlock("Questions") },
          preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title: title ?? "What this story answers", subtitle: "Questions this story answers", items }) },
        }),
        defineArrayMember({
          name: "summary",
          title: "Summary",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Box title", type: "string", initialValue: "The short version" }),
            defineField({ name: "items", title: "Points", type: "array", of: [defineArrayMember({ type: "string" })], validation: (rule) => rule.max(6).warning() }),
          ],
          components: { preview: SummaryPreview, block: boxBlock("Summary") },
          preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title: title ?? "The short version", subtitle: "Summary", items }) },
        }),
        defineArrayMember({
          name: "timeline",
          title: "Timeline",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Timeline title", type: "string", initialValue: "How it happened" }),
            defineField({
              name: "items",
              title: "Moments",
              type: "array",
              of: [defineArrayMember({
                type: "object",
                name: "moment",
                fields: [
                  defineField({ name: "when", title: "When", type: "string", description: "e.g. “12 September” or “2019”." }),
                  defineField({ name: "what", title: "What happened", type: "text", rows: 2 }),
                ],
                preview: { select: { title: "when", subtitle: "what" } },
              })],
            }),
          ],
          components: { preview: TimelinePreview, block: boxBlock("Timeline") },
          preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title: title ?? "How it happened", subtitle: "Timeline", items }) },
        }),
        defineArrayMember({
          name: "related",
          title: "Don’t forget to check out these",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", initialValue: "Don’t forget to check out these" }),
            defineField({ name: "stories", title: "Stories", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "story" }], weak: true })], validation: (rule) => rule.max(6) }),
          ],
          components: { preview: RelatedPreview, block: boxBlock("Related stories") },
          preview: { select: { title: "title", first: "stories.0.title", second: "stories.1.title", third: "stories.2.title", fourth: "stories.3.title", fifth: "stories.4.title" }, prepare: ({ title, first, second, third, fourth, fifth }) => ({ title: title ?? "Don’t forget to check out these", subtitle: "Related stories", items: [first, second, third, fourth, fifth].filter(Boolean) }) },
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
          defineField({ name: "name", title: "Name", type: "string" }),
          defineField({ name: "url", title: "Link", type: "string", validation: (rule) => rule.regex(/^https?:\/\/\S+$/, { name: "link" }).warning("A full link starts with https://") }),
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

export const schemaTypes = [photo, story, frontPage, siteEdit, siteContent, siteSnapshot];
