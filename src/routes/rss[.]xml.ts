import { createFileRoute } from "@tanstack/react-router";
import { allStories, originOf, rssXml } from "../lib/feeds";

// /rss.xml: the 50 newest stories, for feed readers (src/lib/feeds.ts)
export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        new Response(rssXml(originOf(request), await allStories()), {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
        }),
    },
  },
});
