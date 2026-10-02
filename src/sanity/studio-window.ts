import { createContext, useContext } from "react";

// The studio (/admin) opens like a window over the site: on screen, minimised
// to a small bar at the bottom of the site (still loaded, exactly where you
// left it), or closed. StudioHost (src/components/studio-host.tsx) runs it;
// the buttons in the studio's top bar (src/sanity/navbar.tsx) use these.

export type StudioWindow = {
  /** Hide the studio and go back to the site page you came from; it stays loaded */
  minimise: () => void;
  /** Close the studio and go to the front page */
  leave: () => void;
};

export const StudioWindowContext = createContext<StudioWindow>({ minimise: () => {}, leave: () => {} });
export const useStudioWindow = () => useContext(StudioWindowContext);

/** Where the studio is (its own address, e.g. /admin/structure/story), and a way to send it back to the address bar's */
export type StudioControls = { path: () => string; follow: () => void };

export const STUDIO_BASE = "/admin";
export const isStudioPath = (pathname: string) => pathname === STUDIO_BASE || pathname.startsWith(`${STUDIO_BASE}/`);
