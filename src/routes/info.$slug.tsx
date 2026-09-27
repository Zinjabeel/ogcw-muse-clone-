import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { infoPages, isInfoSlug } from "../components/info-pages";

// Footer info pages: /info/faq, /info/help, /info/brand, /info/press,
// /info/testimonials, /info/terms, /info/privacy, /info/cookies, /info/legal.
export const Route = createFileRoute("/info/$slug")({
  beforeLoad: ({ params }) => {
    if (!isInfoSlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const page = isInfoSlug(params.slug) ? infoPages[params.slug] : null;
    const title = page ? `${page.title} — OGCW` : "OGCW";
    return {
      meta: [
        { title },
        { name: "description", content: page?.intro ?? "One Great Culture World" },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: InfoPage,
});

function InfoPage() {
  const { slug } = Route.useParams();
  if (!isInfoSlug(slug)) return null;
  const page = infoPages[slug];
  return (
    <SiteShell>
      <PageIntro kicker={page.kicker} title={page.title.toUpperCase()} copy={page.intro} />
      <main className="page-wrap pb-24">
        <div className="info-prose">{page.body}</div>
      </main>
    </SiteShell>
  );
}
