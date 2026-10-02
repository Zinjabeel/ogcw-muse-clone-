import { useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronUp, PenSquare, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";
import { isStudioPath, STUDIO_BASE, StudioWindowContext, type StudioControls } from "@/sanity/studio-window";
import { adminAccess } from "@/lib/work";

// The OGCW studio (Sanity, /admin) as a window over the site. On /admin it
// fills the screen. "Minimise" in its top bar takes you back to the page you
// came from and tucks it into a bar at the bottom of the site, still loaded
// and exactly where you left it, so you can check your changes on the site
// and open it again. Leaving /admin any other way (Back, a link) minimises it
// too. "Website" closes it and goes to the front page.
//
// The Studio is loaded in the browser only, the first time it opens; the
// server build and visitors who never open it don't download it.

type Phase = "closed" | "open" | "minimised" | "closing";
type StudioComponent = ComponentType<{ controls: RefObject<StudioControls | null> }>;

const loadStudio = import.meta.env.SSR ? null : () => import("../sanity/studio");
// Closing waits a moment before unloading, so the last edits finish saving
const UNLOAD_AFTER = 4000;

export function StudioHost({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const href = useRouterState({ select: (state) => state.location.href });
  const onStudio = isStudioPath(pathname);

  const [phase, setPhase] = useState<Phase>(onStudio ? "open" : "closed");
  const [Studio, setStudio] = useState<StudioComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const controls = useRef<StudioControls | null>(null);
  const siteHref = useRef(onStudio ? "/" : href);
  const [access, setAccess] = useState<"checking" | "ok">("checking");

  // Only the OGCW team gets in: the server checks the account (src/lib/work.ts).
  // Anyone else goes to the work login, and the Studio isn't even downloaded.
  useEffect(() => {
    if (phase !== "open" || access === "ok") return;
    let current = true;
    void adminAccess().then((allowed) => {
      if (!current) return;
      if (allowed) return setAccess("ok");
      setPhase("closed");
      void router.navigate({ to: "/work", search: { from: "admin" }, replace: true });
    });
    return () => { current = false; };
  }, [phase, access, router]);

  // Load the Studio the first time it opens
  useEffect(() => {
    if (phase === "closed" || access !== "ok" || Studio || !loadStudio) return;
    loadStudio()
      .then((module) => setStudio(() => module.default))
      .catch(() => setFailed(true));
  }, [phase, access, Studio]);

  // Follow the address bar
  useEffect(() => {
    if (!onStudio) {
      siteHref.current = href;
      setPhase((current) => (current === "open" ? "minimised" : current));
      return;
    }
    setPhase("open");
    // "Open the studio" links go to plain /admin: reopen it where it was
    const at = controls.current?.path();
    if (at && at !== STUDIO_BASE && (pathname === STUDIO_BASE || pathname === `${STUDIO_BASE}/`)) {
      void router.navigate({ href: at, replace: true });
      return;
    }
    controls.current?.follow();
  }, [onStudio, href, pathname, router]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase((current) => (current === "closing" ? "closed" : current)), UNLOAD_AFTER);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const minimise = useCallback(() => void router.navigate({ href: siteHref.current }), [router]);
  const leave = useCallback(() => {
    setPhase("closing");
    void router.navigate({ to: "/" });
  }, [router]);
  const restore = useCallback(() => void router.navigate({ href: controls.current?.path() ?? STUDIO_BASE }), [router]);
  const studioWindow = useMemo(() => ({ minimise, leave }), [minimise, leave]);

  const shown = phase === "open";
  return (
    <StudioWindowContext.Provider value={studioWindow}>
      {children}
      {phase !== "closed" && (
        <div className={`admin-studio ${shown ? "" : "admin-studio-hidden"}`} aria-hidden={!shown} inert={!shown}>
          {Studio ? (
            <Studio controls={controls} />
          ) : (
            <p className="admin-studio-loading">{failed ? "The studio didn’t load. Refresh to try again." : access === "ok" ? "Loading the OGCW studio…" : "Checking your access…"}</p>
          )}
        </div>
      )}
      {phase === "minimised" && (
        <div className="studio-dock" role="region" aria-label="OGCW Studio, minimised">
          <button type="button" className="studio-dock-open" onClick={restore}>
            <PenSquare size={15} strokeWidth={2} aria-hidden="true" />
            <span>OGCW Studio</span>
            <ChevronUp size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className="studio-dock-close" aria-label="Close the studio" title="Close the studio" onClick={() => setPhase("closing")}>
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
    </StudioWindowContext.Provider>
  );
}
