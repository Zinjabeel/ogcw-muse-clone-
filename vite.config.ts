// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The Sanity studio (/admin) in dev: TanStack Start's server-function
// transform also looks at Vite's pre-bundled packages, and its parser
// chokes on the pre-bundled `sanity`. Pre-bundled packages never contain
// the site's server functions, so this makes that transform skip them
// (TanStack's own packages are not pre-bundled and still go through it).
function skipPrebundledDepsInStartCompiler(): Plugin {
  return {
    name: "ogcw:skip-prebundled-deps-in-start-compiler",
    configResolved(config) {
      for (const plugin of config.plugins) {
        if (!plugin.name.startsWith("tanstack-start-core::server-fn")) continue;
        const transform = plugin.transform;
        if (!transform || typeof transform === "function") continue;
        const handler = transform.handler;
        transform.handler = function (this: unknown, code: string, id: string, ...rest: unknown[]) {
          if (id.includes("/node_modules/.vite/deps/") && !id.includes("tanstack")) return null;
          return (handler as (...args: unknown[]) => unknown).call(this, code, id, ...rest);
        } as typeof handler;
      }
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [skipPrebundledDepsInStartCompiler()],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
