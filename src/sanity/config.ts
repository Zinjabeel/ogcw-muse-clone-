import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas/story";
import { OgcwNavbar } from "./navbar";
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
  plugins: [structureTool(), visionTool({ defaultApiVersion: SANITY_API_VERSION })],
  schema: { types: schemaTypes },
  // The top bar, with "Website" and minimise buttons (src/sanity/navbar.tsx)
  studio: { components: { navbar: OgcwNavbar } },
});
