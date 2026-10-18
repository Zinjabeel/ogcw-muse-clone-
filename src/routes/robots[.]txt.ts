import { createFileRoute } from "@tanstack/react-router";
import { originOf, robotsTxt } from "../lib/feeds";

// /robots.txt: everything open to search engines except the admin pages,
// with the sitemap's full address (it depends on the domain, so it's made here)
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => new Response(robotsTxt(originOf(request)), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } }),
    },
  },
});
