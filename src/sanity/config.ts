import { defineConfig, type SanityClient } from "sanity";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas/story";
import { OgcwNavbar } from "./navbar";
import { RestoreVersionAction } from "./restore-action";
import { ClockIcon } from "@sanity/icons/Clock";
import { DocumentsIcon } from "@sanity/icons/Documents";
import { EditIcon } from "@sanity/icons/Edit";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "./env";
import { SITE_SECTIONS, sectionOfKey } from "../lib/site-sections";
import { SECTION_IDS, SECTIONS } from "../data/content";
import { STARTING_POINTS, starterBody } from "../data/designs";
import { resolveSlots, SLOTS, type FrontLayout, type SlotId } from "../data/placements";
import { byDate } from "../lib/sanity-mapping";

type OldItem = { key?: string; value?: string; alt?: string; url?: string; image?: unknown };

/** Edits saved in the old single "Site texts" document move to their own Site edits, each in its part of the site */
async function moveOldSiteTexts(client: SanityClient) {
  const old = await client.fetch<{ texts?: OldItem[]; images?: OldItem[]; updatedBy?: string } | null>(`*[_id == "siteContent"][0] { texts, images, updatedBy }`).catch(() => null);
  if (!old) return;
  const tx = client.transaction();
  const now = new Date().toISOString();
  const id = (key: string) => `siteEdit-${key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120)}`;
  const base = (key: string, kind: string): { _id: string; _type: string; [field: string]: unknown } => ({ _id: id(key), _type: "siteEdit", key, kind, section: sectionOfKey(key), updatedAt: now, updatedBy: old.updatedBy ?? "OGCW admin" });
  for (const item of old.texts ?? []) if (item.key && item.value) tx.createIfNotExists({ ...base(item.key, "text"), value: item.value });
  for (const item of old.images ?? []) {
    if (!item.key) continue;
    const doc = base(item.key, "image");
    if (item.alt) doc["alt"] = item.alt;
    if (item.image) doc["image"] = item.image;
    else doc["url"] = item.url;
    tx.createIfNotExists(doc);
  }
  tx.delete("siteContent");
  await tx.commit().catch(() => {});
}

// ---------------------------------------------------------------- New stories
// "New story" asks how it should look: a blank story (which opens the
// design chooser on the page, with a drawing of each starting point), or one
// of the starting points straight away (src/data/designs.ts).
const today = () => new Date().toISOString().slice(0, 10);
const BLANK_TEMPLATE = "story-choose";
const STORY_TEMPLATES = [
  { id: BLANK_TEMPLATE, title: "New story (choose its design on the page)", description: "Opens with the design chooser", schemaType: "story", value: () => ({ credit: "OGCW", date: today() }) },
  ...STARTING_POINTS.map((point) => ({
    id: `story-${point.id}`,
    title: `New story: ${point.name}`,
    description: point.note,
    schemaType: "story",
    value: () => ({ credit: "OGCW", date: today(), design: point.design, body: starterBody(point) }),
  })),
];

// ---------------------------------------------------------------- The menu

/** Stories, filed: all of them, each section, each spot on the front page, and the ones not published yet */
function storiesMenu(S: StructureBuilder, client: SanityClient) {
  const templates = STORY_TEMPLATES.map((template) => S.initialValueTemplateItem(template.id));
  const list = (title: string, filter: string, params: Record<string, unknown> = {}) =>
    S.documentList().title(title).schemaType("story").filter(filter).params(params).defaultOrdering([{ field: "date", direction: "desc" }]).initialValueTemplates(templates);

  return S.listItem()
    .id("stories")
    .title("Stories")
    .icon(DocumentsIcon)
    .child(async () => {
      // What each front-page spot shows now: the stories placed there, and the newest filling the empty places (as the site does)
      const { front, stories } = await client.fetch<{ front: { slots?: { id?: string; refs?: (string | null)[] }[]; hidden?: (string | null)[] } | null; stories: { _id: string; slug: string; date?: string }[] }>(`{
        "front": *[_id == "frontPage"][0] { "slots": slots[] { "id": slot, "refs": stories[]._ref }, "hidden": hidden[]._ref },
        "stories": *[_type == "story" && defined(slug.current) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] { _id, "slug": slug.current, date }
      }`).catch(() => ({ front: null, stories: [] }));
      const all = stories.map((story) => ({ ...story, date: story.date ?? "" })).sort(byDate);
      const slugOf = new Map(all.map((story) => [story._id, story.slug]));
      const toSlugs = (refs: (string | null)[] | undefined) => (refs ?? []).flatMap((ref) => (ref && slugOf.has(ref) ? [slugOf.get(ref)!] : []));
      const layout: FrontLayout = {
        slots: Object.fromEntries((front?.slots ?? []).flatMap((slot) => (slot.id ? [[slot.id, toSlugs(slot.refs ?? [])]] : []))),
        hidden: toSlugs(front?.hidden ?? []),
      };
      const shown = resolveSlots(all, layout);
      const idsIn = (slot: SlotId) => {
        const ids = shown[slot].map((story) => story._id);
        return [...ids, ...ids.map((id) => `drafts.${id}`)];
      };
      const hiddenIds = layout.hidden.flatMap((hidden) => {
        const id = all.find((story) => story.slug === hidden)?._id;
        return id ? [id, `drafts.${id}`] : [];
      });
      const areas = [...new Set(SLOTS.map((slot) => slot.area))];
      const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      return S.list()
        .title("Stories")
        .items([
          S.listItem().id("all-stories").title("All stories").icon(DocumentsIcon).child(list("All stories", `_type == "story"`)),
          S.divider(),
          ...SECTION_IDS.map((id) =>
            S.listItem().id(`section-${id}`).title(SECTIONS[id].label).child(list(SECTIONS[id].label, `_type == "story" && section == $section`, { section: id })),
          ),
          S.divider(),
          S.listItem()
            .id("front-page")
            .title("On the front page")
            .child(
              S.list()
                .title("On the front page")
                .items(areas.map((area) =>
                  S.listItem()
                    .id(`area-${slug(area)}`)
                    .title(area)
                    .child(
                      S.list()
                        .title(area)
                        .items(SLOTS.filter((slot) => slot.area === area).map((slot) =>
                          S.listItem().id(`spot-${slot.id}`).title(`${slot.name} (${shown[slot.id as SlotId].length})`).child(list(slot.name, `_type == "story" && _id in $ids`, { ids: idsIn(slot.id as SlotId) })),
                        )),
                    ),
                )),
            ),
          S.listItem().id("news-page-only").title("News page only (off the front page)").child(list("News page only", `_type == "story" && _id in $ids`, { ids: hiddenIds })),
          S.divider(),
          S.listItem().id("not-published").title("Never published").child(list("Never published", `_type == "story" && _id in path("drafts.**") && count(*[_id == string::split(^._id, "drafts.")[1]]) == 0`)),
          S.listItem().id("unpublished-changes").title("Changed, not published yet").child(list("Changed, not published yet", `_type == "story" && _id in path("drafts.**")`)),
        ]);
    });
}

/** Site history, by day: today, yesterday, this week, older */
function historyMenu(S: StructureBuilder) {
  const versions = (title: string, filter: string, params: Record<string, unknown> = {}) =>
    S.documentList().title(title).schemaType("siteSnapshot").filter(filter).params(params).defaultOrdering([{ field: "at", direction: "desc" }]);
  return S.listItem()
    .id("site-history")
    .title("Site history")
    .icon(ClockIcon)
    .child(() => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const day = 86_400_000;
      const iso = (ms: number) => new Date(ms).toISOString();
      const today = start.getTime();
      return S.list()
        .title("Site history · last 30 days")
        .items([
          S.listItem().id("history-today").title("Today").child(versions("Today", `_type == "siteSnapshot" && at >= $from`, { from: iso(today) })),
          S.listItem().id("history-yesterday").title("Yesterday").child(versions("Yesterday", `_type == "siteSnapshot" && at >= $from && at < $to`, { from: iso(today - day), to: iso(today) })),
          S.listItem().id("history-week").title("Earlier this week").child(versions("Earlier this week", `_type == "siteSnapshot" && at >= $from && at < $to`, { from: iso(today - 7 * day), to: iso(today - day) })),
          S.listItem().id("history-older").title("Older").child(versions("Older", `_type == "siteSnapshot" && at < $to`, { to: iso(today - 7 * day) })),
          S.divider(),
          S.listItem().id("history-all").title("Every version").child(versions("Every version", `_type == "siteSnapshot"`)),
        ]);
    });
}

// The Sanity Studio, embedded in the website at /admin (src/routes/admin.$.tsx).
// Stories written here appear on the site next to the ones in
// src/data/content.ts; a story here with the same web address as one in
// the code replaces it.
export default defineConfig({
  name: "ogcw",
  title: "OGCW",
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  basePath: "/admin",
  // Admins sign in with GitHub (the project's members: the owner's GitHub
  // account) or with the admin password on the work login (/work), which
  // logs this browser straight in. The login is kept on this device, not in
  // a cookie (browsers often throw those away, which asked for a new login
  // all the time), until "Log out".
  auth: {
    loginMethod: "token",
    redirectOnSingle: true,
    mode: "replace",
    providers: [{ name: "github", title: "GitHub", url: "https://api.sanity.io/v1/auth/login/github" }],
  },
  plugins: [
    // Stories (filed by section and by spot on the front page); under them
    // the site's own edits, filed by the part of the site they're in (only
    // the parts that have edits are listed), and the edit history (every
    // save, restorable for 30 days), by day.
    structureTool({
      structure: (S, context) => {
        const client = context.getClient({ apiVersion: SANITY_API_VERSION });
        return S.list()
          .title("Content")
          .items([
            storiesMenu(S, client),
            S.divider(),
            S.listItem()
              .id("site-edits")
              .title("Site edits")
              .icon(EditIcon)
              .child(async () => {
                await moveOldSiteTexts(client);
                const edits = await client.fetch<{ section?: string }[]>(`*[_type == "siteEdit" && !(_id in path("drafts.**"))] { section }`);
                const counts = new Map<string, number>();
                for (const edit of edits) counts.set(edit.section ?? "Other", (counts.get(edit.section ?? "Other") ?? 0) + 1);
                const sections = [...SITE_SECTIONS, ...[...counts.keys()].filter((name) => !(SITE_SECTIONS as readonly string[]).includes(name))].filter((name) => counts.has(name));
                const list = (title: string, filter: string, params: Record<string, string> = {}) =>
                  S.documentList().title(title).schemaType("siteEdit").filter(filter).params(params).defaultOrdering([{ field: "updatedAt", direction: "desc" }]);
                return S.list()
                  .title("Site edits")
                  .items([
                    S.listItem().id("all-edits").title(`All edits (${edits.length})`).child(list("All edits", `_type == "siteEdit"`)),
                    S.divider(),
                    ...sections.map((section) =>
                      S.listItem()
                        .id(`edits-${section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)
                        .title(`${section} (${counts.get(section)})`)
                        .child(list(section, `_type == "siteEdit" && section == $section`, { section })),
                    ),
                  ]);
              }),
            historyMenu(S),
          ]);
      },
    }),
    visionTool({ defaultApiVersion: SANITY_API_VERSION }),
  ],
  schema: {
    types: schemaTypes,
    // A story starts from a design (no plain "Story" template)
    templates: (previous) => [...previous.filter((template) => template.schemaType !== "story"), ...STORY_TEMPLATES],
  },
  document: {
    // A site version can be restored (or deleted), not edited or published
    actions: (actions, context) =>
      context.schemaType === "siteSnapshot" ? [RestoreVersionAction, ...actions.filter((action) => action.action === "delete")] : actions,
    // No "create new" for the site's own documents
    newDocumentOptions: (templates) => templates.filter((template) => !["siteSnapshot", "siteContent", "siteEdit", "frontPage"].includes(template.templateId)),
  },
  // The top bar, with "Website" and minimise buttons (src/sanity/navbar.tsx)
  studio: { components: { navbar: OgcwNavbar } },
});
