import { createMemoryHistory, type MemoryHistory } from "history";
import { useEffect, useState, type RefObject } from "react";
import { Studio } from "sanity";
import config from "./config";
import { isStudioPath, type StudioControls } from "./studio-window";

// The Studio itself. Loaded only in the browser, and only once someone opens
// /admin, so the rest of the site never downloads it.
//
// It keeps its place in a history of its own, in memory, rather than in the
// address bar. That way it can stay loaded while minimised and the site moves
// around underneath it (with the address bar's history, pressing Back on the
// site would pull the Studio along, or send you back to /admin). While it's on
// screen, every move it makes is copied to the address bar, so its links,
// refresh and Back keep working as before.

const addressBar = () => window.location.pathname + window.location.search;
const randomKey = () => Math.random().toString(36).slice(2, 10);

function createStudioHistory(): MemoryHistory {
  const memory = createMemoryHistory({ initialEntries: [addressBar()] });
  // Copied a moment later, not mid-render: the site's router reacts to the
  // address bar straight away
  const mirror = (push: boolean) =>
    queueMicrotask(() => {
      const href = memory.createHref(memory.location);
      if (!isStudioPath(window.location.pathname) || href === addressBar()) return;
      const state = (window.history.state ?? {}) as Record<string, unknown>;
      if (!push) return window.history.replaceState(state, "", href);
      // A new entry for the site's router, numbered after this one so it can tell Back from Forward
      const key = randomKey();
      window.history.pushState({ ...state, __TSR_index: Number(state["__TSR_index"] ?? 0) + 1, key, __TSR_key: key }, "", href);
    });

  return {
    get action() { return memory.action; },
    get location() { return memory.location; },
    get index() { return memory.index; },
    createHref: memory.createHref,
    push(to, state) { memory.push(to, state); mirror(true); },
    replace(to, state) { memory.replace(to, state); mirror(false); },
    go(delta) { memory.go(delta); mirror(false); },
    back() { memory.back(); mirror(false); },
    forward() { memory.forward(); mirror(false); },
    listen: memory.listen,
    block: memory.block,
  };
}

export default function OgcwStudio({ controls }: { controls: RefObject<StudioControls | null> }) {
  const [history] = useState(createStudioHistory);

  useEffect(() => {
    controls.current = {
      path: () => history.createHref(history.location),
      // The address bar moved on its own (Back and Forward between studio pages): go there too
      follow: () => {
        const href = addressBar();
        if (isStudioPath(window.location.pathname) && href !== history.createHref(history.location)) history.replace(href);
      },
    };
    return () => { controls.current = null; };
  }, [controls, history]);

  return <Studio config={config} unstable_history={history} />;
}
