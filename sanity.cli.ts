import { defineCliConfig } from "sanity/cli";

// Settings for the Sanity command line (npx sanity …), e.g. adding the
// site's addresses to the project's allowed origins (CORS).
export default defineCliConfig({
  api: { projectId: "z0ih0mun", dataset: "production" },
});
