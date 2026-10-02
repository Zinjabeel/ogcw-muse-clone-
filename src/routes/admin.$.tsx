import { createFileRoute } from "@tanstack/react-router";

// /admin: the OGCW content studio (Sanity), full screen, outside the site's
// header and footer. It covers /admin/* too, since the Studio has its own
// pages under it. Sign-in is Sanity's: only people invited to the Sanity
// project can open it. The Studio itself is drawn by StudioHost
// (src/components/studio-host.tsx) in the root layout, so it can stay open,
// minimised, while you move around the site; this page only gives /admin its
// title.

export const Route = createFileRoute("/admin/$")({
  head: () => ({
    meta: [
      { title: "OGCW Studio" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "same-origin" },
    ],
  }),
  component: () => null,
});
