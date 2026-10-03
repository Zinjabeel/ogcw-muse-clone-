import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { themeInitScript } from "../components/theme-switcher";
import { heroInitScript } from "../components/hero-switcher";
import { NotFoundPage } from "../components/not-found";
import { getStorySummaries } from "../lib/sanity-stories";
import { EMPTY_LAYOUT } from "../data/placements";
import { EMPTY_SITE, SiteTextProvider } from "../lib/site-text";
import { SiteEditor } from "../components/site-text";
import { StoriesProvider } from "../lib/stories";
import { StudioHost } from "../components/studio-host";
import { CardHover } from "../components/card-hover";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn’t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OGCW — One Great Culture World" },
      { name: "description", content: "Independent news and stories from the people shaping culture now." },
      { name: "author", content: "One Great Culture World" },
      { property: "og:title", content: "OGCW — One Great Culture World" },
      { property: "og:description", content: "Independent news and stories from the people shaping culture now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600;700&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  // Every story, and which goes where on the front page, live from the
  // Sanity studio (/admin), for every page. Reloaded in the background after
  // 15 seconds when you move around.
  loader: async () => getStorySummaries().catch(() => ({ stories: [], layout: EMPTY_LAYOUT, ratings: {}, site: EMPTY_SITE })),
  staleTime: 15_000,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // data-theme is set by the script below before React hydrates, hence suppressHydrationWarning
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the visitor’s saved colour theme and hero before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript + heroInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { stories, layout, ratings, site } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <StoriesProvider stories={stories} layout={layout} ratings={ratings}>
        {/* The studio (/admin) floats over every page, so it can stay open while minimised */}
        {/* The site's own texts and photos, editable by admins on the page (src/components/site-text.tsx) */}
        <SiteTextProvider content={site}>
          <StudioHost>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </StudioHost>
          <SiteEditor />
          <CardHover />
        </SiteTextProvider>
      </StoriesProvider>
    </QueryClientProvider>
  );
}
