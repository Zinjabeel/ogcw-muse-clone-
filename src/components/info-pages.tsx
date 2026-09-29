import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";

// Content for the small info pages linked from the footer, served at
// /info/<slug> by src/routes/info.$slug.tsx. FAQ, Help, Brand and Press are
// written from what OGCW is today. Terms, Privacy, Cookies and Legal need
// real legal text, and Testimonials need real quotes, so those say what is
// coming instead of inventing it.
// TODO: replace the placeholder pages with the final documents.

export type InfoSlug = "faq" | "help" | "brand" | "press" | "testimonials" | "terms" | "privacy" | "cookies" | "legal" | "credits";
type InfoPage = { kicker: string; title: string; intro: string; body: ReactNode };

const Mail = ({ subject, children }: { subject: string; children: ReactNode }) => <a href={mail(subject)}>{children}</a>;

const comingSoon = (what: string, subject: string) => (
  <>
    <p>{what}</p>
    <p>
      Until then, questions go to <Mail subject={subject}>{BUSINESS_EMAIL}</Mail>.
    </p>
  </>
);

export const infoPages: Record<InfoSlug, InfoPage> = {
  faq: {
    kicker: "Help",
    title: "FAQ",
    intro: "Quick answers to the questions we get most.",
    body: (
      <dl className="info-faq">
        <dt>What is OGCW?</dt>
        <dd>OGCW, One Great Culture World, is an independent platform for culture and the stories around it. The idea is to bring culture and what’s happening right now, from all over the world, together in one place.</dd>
        <dt>What do you cover?</dt>
        <dd>Music, from rap to rumba, and culture: style, design, nightlife, architecture and print. Plus OGCW Originals, our own interviews, reportage, lists and short documentaries, and the OGCW Shop.</dd>
        <dt>How do I send you a story or a tip?</dt>
        <dd>Email <Mail subject="Submit a story">{BUSINESS_EMAIL}</Mail> with “Submit a story” in the subject.</dd>
        <dt>I’m an artist or a label. Can I send you music?</dt>
        <dd>Yes. Email <Mail subject="Music submissions">{BUSINESS_EMAIL}</Mail> with “Music submissions” in the subject and a link to the release.</dd>
        <dt>How do I advertise or partner with OGCW?</dt>
        <dd>Email <Mail subject="Advertising">{BUSINESS_EMAIL}</Mail> with “Advertising” or “Partnerships” in the subject.</dd>
        <dt>How do I get the newsletter?</dt>
        <dd>Sign up in the Newsletter box on the <Link to="/" hash="newsletter-title">home page</Link>. It launches soon.</dd>
        <dt>Something of mine is on OGCW and I want it removed.</dt>
        <dd>Email <Mail subject="Copyright / Content removal">{BUSINESS_EMAIL}</Mail> with “Copyright / Content removal” in the subject and a link to the page.</dd>
      </dl>
    ),
  },
  help: {
    kicker: "Help",
    title: "How can we help?",
    intro: "Pick what you need and we’ll get it to the right person.",
    body: (
      <>
        <p>Most answers are in the <Link to="/info/$slug" params={{ slug: "faq" }}>FAQ</Link>. Otherwise, email us with one of these subjects:</p>
        <ul className="info-list">
          <li><Mail subject="General">General</Mail>: anything else</li>
          <li><Mail subject="Submit a story">Submit a story</Mail>: tips, pitches and stories we should be telling</li>
          <li><Mail subject="Music submissions">Music submissions</Mail>: new releases from artists and labels</li>
          <li><Mail subject="Advertising">Advertising</Mail> and <Mail subject="Partnerships">Partnerships</Mail>: brands, agencies and partners</li>
          <li><Mail subject="Press">Press</Mail>: journalists and media</li>
          <li><Mail subject="Copyright / Content removal">Copyright / Content removal</Mail>: rights holders</li>
        </ul>
      </>
    ),
  },
  brand: {
    kicker: "Brand",
    title: "The OGCW brand",
    intro: "How to write, show and colour OGCW.",
    body: (
      <>
        <h2>Name</h2>
        <p>Write OGCW in capitals. In full it’s One Great Culture World.</p>
        <h2>Colours</h2>
        <ul className="info-swatches">
          {[
            ["#0D0D0D", "Background"],
            ["#1A1A1A", "Surface / cards"],
            ["#292929", "Borders"],
            ["#F5F5F5", "Primary text"],
            ["#A3A3A3", "Secondary text"],
            ["#FFE600", "OGCW yellow (accents only)"],
          ].map(([hex, name]) => (
            <li key={hex}><span style={{ background: hex }} aria-hidden="true" /><strong>{hex}</strong> {name}</li>
          ))}
        </ul>
        <h2>Type</h2>
        <p>Source Serif 4 for headlines and reading text; Inter for labels, navigation and buttons.</p>
        <h2>Assets</h2>
        <p>For logos and brand files, email <Mail subject="Brand assets">{BUSINESS_EMAIL}</Mail> with “Brand assets” in the subject.</p>
      </>
    ),
  },
  press: {
    kicker: "Company",
    title: "Press",
    intro: "For journalists and media.",
    body: (
      <>
        <p>For interviews, comment or information about OGCW, email <Mail subject="Press">{BUSINESS_EMAIL}</Mail> with “Press” in the subject.</p>
        <p>Brand guidance is on the <Link to="/info/$slug" params={{ slug: "brand" }}>brand page</Link>.</p>
      </>
    ),
  },
  testimonials: {
    kicker: "Company",
    title: "Testimonials",
    intro: "What artists, brands and readers say about working with OGCW.",
    body: comingSoon("We’re collecting these now and will publish them here soon. Worked with us and want to share how it went? We’d love to hear it.", "Testimonial"),
  },
  terms: {
    kicker: "Legal",
    title: "Terms of Service",
    intro: "The rules for using OGCW.",
    body: comingSoon("Our terms of service are being finalised and will be published here.", "Terms of Service"),
  },
  privacy: {
    kicker: "Legal",
    title: "Privacy Policy",
    intro: "How OGCW handles your personal data.",
    body: comingSoon("Our privacy policy is being finalised and will be published here.", "Privacy"),
  },
  cookies: {
    kicker: "Legal",
    title: "Cookie Policy",
    intro: "Which cookies OGCW uses and why.",
    body: comingSoon("Our cookie policy is being finalised and will be published here.", "Cookies"),
  },
  legal: {
    kicker: "Legal",
    title: "Legal",
    intro: "Company details and legal notices.",
    body: comingSoon("Our legal notice is being finalised and will be published here.", "Legal"),
  },
  // Attribution the Creative Commons licences require (moved here from the home page).
  credits: {
    kicker: "Legal",
    title: "Photo credits",
    intro: "The photographers whose work appears on OGCW.",
    body: (
      <ul className="info-list">
        <li>Central Cee by 200izo, via Wikimedia Commons, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Cropped.</li>
        <li>Drake by The Come Up Show, licensed <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener noreferrer">CC BY 2.0</a>. Cropped.</li>
        <li>Shop photos via <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a> by Paul Steuber (Nike), Sou Jest (Adidas), Irene Kredenets (StockX) and Howen (Uniqlo), under the Unsplash License.</li>
        <li>Is one of your photos on OGCW without the right credit? Email <Mail subject="Photo credit">{BUSINESS_EMAIL}</Mail> and we’ll fix it.</li>
      </ul>
    ),
  },
};

export const isInfoSlug = (slug: string): slug is InfoSlug => slug in infoPages;
