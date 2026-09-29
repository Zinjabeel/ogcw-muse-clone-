import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageIntro, SiteShell } from "../components/ogcw-layout";
import { infoPages, isInfoSlug, type InfoSlug } from "../components/info-pages";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// The side column on every info page: the other help and company pages
const INFO_LINKS: [InfoSlug, string][] = [["help", "Help"], ["faq", "FAQ"], ["press", "Press"], ["brand", "Brand"], ["credits", "Photo credits"]];

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
      <PageIntro kicker={page.kicker} title={page.title} copy={page.intro} compact />
      <main className="page-wrap info-layout">
        <div className="info-prose">{page.body}</div>
        <aside className="info-aside" aria-labelledby="info-more">
          <p id="info-more" className="og-aside-title">Help &amp; company</p>
          <ul>
            {INFO_LINKS.map(([to, label]) => (
              <li key={to}>
                <Link to="/info/$slug" params={{ slug: to }} className="info-aside-link" aria-current={to === slug ? "page" : undefined}>{label}</Link>
              </li>
            ))}
            <li><Link to="/about" className="info-aside-link">About OGCW</Link></li>
          </ul>
          <p className="info-aside-mail">Anything else: <a href={mail("General")}>{BUSINESS_EMAIL}</a></p>
        </aside>
      </main>
    </SiteShell>
  );
}
