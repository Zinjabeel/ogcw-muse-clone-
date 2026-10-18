import { createFileRoute } from "@tanstack/react-router";
import { allStories, originOf, sitemapXml } from "../lib/feeds";

// /sitemap.xml: every page and story, for search engines (src/lib/feeds.ts)
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        new Response(sitemapXml(originOf(request), await allStories()), {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
        }),
    },
  },
});
