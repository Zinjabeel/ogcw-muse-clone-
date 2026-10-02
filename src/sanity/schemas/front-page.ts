import { defineArrayMember, defineField, defineType } from "sanity";
import { SLOTS } from "@/data/placements";

// The front page: which stories sit in which spot (src/data/placements.ts),
// and which are kept to the News page. There's one, with the id "frontPage".
// It's changed from a story, with "Where it appears" in the story editor
// (src/sanity/placements.tsx), and the changes go live straight away, so it
// isn't listed in the studio's menu.
export const frontPage = defineType({
  name: "frontPage",
  title: "Front page",
  type: "document",
  fields: [
    defineField({
      name: "slots",
      title: "Spots",
      type: "array",
      of: [defineArrayMember({
        name: "slot",
        type: "object",
        fields: [
          defineField({ name: "slot", title: "Spot", type: "string", options: { list: SLOTS.map((slot) => ({ title: `${slot.area}: ${slot.name}`, value: slot.id })) } }),
          // Weak, so a story can be placed before it's published, and deleted while placed
          defineField({ name: "stories", title: "Stories, in order", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "story" }], weak: true })] }),
        ],
        preview: { select: { title: "slot" } },
      })],
    }),
    defineField({
      name: "hidden",
      title: "News page only",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "story" }], weak: true })],
    }),
  ],
});
