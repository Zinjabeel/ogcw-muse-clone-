import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas/story";
import { OgcwNavbar } from "./navbar";
import { RestoreVersionAction } from "./restore-action";
import { ClockIcon } from "@sanity/icons/Clock";
import { EditIcon } from "@sanity/icons/Edit";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "./env";

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
    // Stories; under them the site's edit history (every "Edit site" save,
    // restorable for 30 days) and the live site texts. The front page is
    // changed from each story ("Where it appears"), so it isn't listed.
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.documentTypeListItem("story"),
            S.divider(),
            S.listItem()
              .id("site-history")
              .title("Site history")
              .icon(ClockIcon)
              .child(S.documentTypeList("siteSnapshot").title("Site history · last 30 days").defaultOrdering([{ field: "at", direction: "desc" }])),
            S.listItem()
              .id("site-texts")
              .title("Site texts (live)")
              .icon(EditIcon)
              .child(S.document().schemaType("siteContent").documentId("siteContent").title("Site texts (live)")),
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
    newDocumentOptions: (templates) => templates.filter((template) => !["siteSnapshot", "siteContent", "frontPage"].includes(template.templateId)),
  },
  // The top bar, with "Website" and minimise buttons (src/sanity/navbar.tsx)
  studio: { components: { navbar: OgcwNavbar } },
});
