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

const LICENCES = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
};

// [what, photographer, licence, Commons file name]
const COMMONS_CREDITS: [string, string, string, string][] = [
  ["Taylor Swift’s Eras Tour in London", "BrigidLIS", "CC BY 4.0", "Taylor_Swift_Eras_Tour_London_20240819_1989era.jpg"],
  ["Madonna, The Celebration Tour", "Ronald Woan", "CC BY 4.0", "Madonna_-_The_Celebration_Tour_(53539842925)_(cropped).jpg"],
  ["BTS, Arirang World Tour in Paris (“Swim”)", "Chiyako92", "CC BY-SA 4.0", "BTS_Arirang_World_Tour_in_Paris_(17_July_2026)_-_Swim.jpg"],
  ["BTS, Arirang World Tour in Paris (stadium)", "Chiyako92", "CC BY-SA 4.0", "BTS_Arirang_World_Tour_in_Paris_(17_July_2026)_-_stadium_view.jpg"],
  ["Tokyo Game Show 2026", "Syced", "CC0", "Tokyo_Game_Show_2026.jpg"],
  ["BlizzCon at the Anaheim Convention Center", "tofuprod", "CC BY-SA 2.0", "BlizzCon_2017.jpg"],
  ["Boulevard Hotel neon sign, Miami Beach", "Radomianin", "public domain", "Boulevard_Hotel_(Neon_sign),_Miami_Beach.jpg"],
  ["ZeratoR at Z Event 2025", "Mickaël Schauli", "CC BY-SA 4.0", "ZeratoR_lors_du_ZEVENT_2025_-_11.jpg"],
  ["TwitchCon block party", "Succubussy", "CC0", "TwitchCon_Block_Party.png"],
  ["Models walking for Alexander McQueen", "Christopher Macsurak", "CC BY 2.0", "Models_walking_for_Alexander_McQueen_in_2018_(from_behind).jpg"],
  ["Noah Wyle at his Walk of Fame ceremony", "Kevin Paul", "CC BY 4.0", "Noah_Wyle_-_Walk_of_Fame-01.jpg"],
  ["Rhea Seehorn", "Gage Skidmore", "CC BY-SA 2.0", "Rhea_Seehorn_(41794796000).jpg"],
  ["Barbican Estate, London", "Julian Herzog", "CC BY 4.0", "Barbican_Estate_Lakeside_City_of_London_2026_10.jpg"],
  ["Miley Cyrus at Primavera Sound", "Jwslubbock", "CC BY-SA 4.0", "Miley_Cyrus,_Seat_stage_2.jpg"],
  ["Nia Archives in Amsterdam", "Michielderoo", "CC0", "Nia_Archives_2024-11-16_Amsterdam.jpg"],
  ["Bill Skarsgård", "Gage Skidmore", "CC BY-SA 2.0", "Bill_Skarsgård_(8608397609).jpg"],
  ["The Venice Film Festival red carpet", "Pietro Luca Cassarino", "CC BY-SA 2.0", "Venice_2020_Red_Carpet.jpg"],
  ["IShowSpeed in Singapore", "Aerodynamically", "CC0", "IShowSpeed_at_Trifecta_Somerset,_Singapore.jpg"],
];

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
        <dd>Music, fashion, film &amp; TV, sport and pop culture, plus OGCW Originals: our own interviews, reportage, lists and analysis.</dd>
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
      <>
        <p>News photos come from Wikimedia Commons under the licences below. Each was resized, and some are cropped where they appear.</p>
        <ul className="info-list">
          {COMMONS_CREDITS.map(([what, who, licence, file]) => (
            <li key={file}>
              {what} by {who}, <a href={`https://commons.wikimedia.org/wiki/File:${file}`} target="_blank" rel="noopener noreferrer">via Wikimedia Commons</a>, {licence in LICENCES ? <a href={LICENCES[licence as keyof typeof LICENCES]} target="_blank" rel="noopener noreferrer">{licence}</a> : licence}.
            </li>
          ))}
        </ul>
        <p>Video thumbnails (streamers, music videos, and game trailers and showcases from Capcom and PlayStation) belong to the channels that published them and link to the videos on YouTube.</p>
        <p>Shop, hero, Originals and some news photos (sneakers, the cinema, the controller) come from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a> under the Unsplash License, including shop photos by Paul Steuber (Nike), Sou Jest (Adidas), Irene Kredenets (StockX) and Howen (Uniqlo), and a PlayStation controller by User_Pascal.</p>
        <p>Is one of your photos on OGCW without the right credit? Email <Mail subject="Photo credit">{BUSINESS_EMAIL}</Mail> and we’ll fix it.</p>
      </>
    ),
  },
};

export const isInfoSlug = (slug: string): slug is InfoSlug => slug in infoPages;
