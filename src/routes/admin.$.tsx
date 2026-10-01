import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

// /admin: the OGCW content studio (Sanity), full screen, outside the site's
// header and footer. It covers /admin/* too, since the Studio has its own
// pages under it. Sign-in is Sanity's: only people invited to the Sanity
// project can open it. The Studio is loaded in the browser only; the
// server build leaves it out entirely.
const loadStudio = import.meta.env.SSR ? null : () => import("../sanity/studio");

export const Route = createFileRoute("/admin/$")({
  head: () => ({
    meta: [
      { title: "OGCW Studio" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "same-origin" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [Studio, setStudio] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadStudio?.()
      .then((module) => setStudio(() => module.default))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="admin-studio">
      {Studio ? <Studio /> : <p className="admin-studio-loading">{failed ? "The studio didn’t load. Refresh to try again." : "Loading the OGCW studio…"}</p>}
    </div>
  );
}
