import { defineConfig, type SanityClient } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas/story";
import { OgcwNavbar } from "./navbar";
import { RestoreVersionAction } from "./restore-action";
import { ClockIcon } from "@sanity/icons/Clock";
import { EditIcon } from "@sanity/icons/Edit";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "./env";
import { SITE_SECTIONS, sectionOfKey } from "../lib/site-sections";

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
  // Admins sign in with GitHub only (the project's members: the owner's
  // GitHub account), and go straight to GitHub without a choice screen
  auth: {
    redirectOnSingle: true,
    mode: "replace",
    providers: [{ name: "github", title: "GitHub", url: "https://api.sanity.io/v1/auth/login/github" }],
  },
  plugins: [
    // Stories; under them the site's own edits, filed by the part of the site
    // they're in (only the parts that have edits are listed), and the edit
    // history (every save, restorable for 30 days). The front page is
    // changed from each story ("Where it appears"), so it isn't listed.
    structureTool({
      structure: (S, context) =>
        S.list()
          .title("Content")
          .items([
            S.documentTypeListItem("story"),
            S.divider(),
            S.listItem()
              .id("site-edits")
              .title("Site edits")
              .icon(EditIcon)
              .child(async () => {
                const client = context.getClient({ apiVersion: SANITY_API_VERSION });
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
            S.listItem()
              .id("site-history")
              .title("Site history")
              .icon(ClockIcon)
              .child(S.documentTypeList("siteSnapshot").title("Site history · last 30 days").defaultOrdering([{ field: "at", direction: "desc" }])),
          ]),
    }),
    visionTool({ defaultApiVersion: SANITY_API_VERSION }),
  ],
  schema: { types: schemaTypes },
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
