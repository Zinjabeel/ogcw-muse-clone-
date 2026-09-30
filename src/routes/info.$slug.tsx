import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { INFO_GROUPS, infoLabel, infoPages, isInfoSlug } from "../components/info-pages";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// The footer and menu pages at /info/<slug>: help and contact, company pages
// and the legal documents, as plain text. The side column lists every page
// by group; legal documents show when they were last updated.
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
      <PageIntro kicker={page.kicker} title={page.title} copy={page.intro} compact />
      <main className="page-wrap info-layout">
        <div className="info-prose">
          {page.updated && <p className="info-updated">Last updated {page.updated}</p>}
          {page.body}
        </div>
        <aside className="info-aside" aria-label="More help, company and legal pages">
          {INFO_GROUPS.map(({ group, pages }) => (
            <div key={group} className="info-aside-group">
              <p className="og-aside-title">{group}</p>
              <ul>
                {pages.map((to) => (
                  <li key={to}>
                    <Link to="/info/$slug" params={{ slug: to }} className="info-aside-link" aria-current={to === slug ? "page" : undefined}>{infoLabel(to)}</Link>
                  </li>
                ))}
                {group === "Company" && <li><Link to="/about" className="info-aside-link">About OGCW</Link></li>}
              </ul>
            </div>
          ))}
          <p className="info-aside-mail">Anything else: <a href={mail("General")}>{BUSINESS_EMAIL}</a></p>
        </aside>
      </main>
    </SiteShell>
  );
}
