import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BUSINESS_EMAIL, mail } from "@/lib/contact";
import { ARTICLES, EPISODES, SECTION_IDS, SHOPS } from "@/data/content";
import { NewsletterForm } from "./connect-section";
import { CookieSettingsButton } from "./cookie-settings-button";

// The pages linked from the footer and the menu, served at /info/<slug> by
// src/routes/info.$slug.tsx: help and contact, company pages, and the legal
// documents (terms, privacy, cookies, legal notice, copyright), all as plain
// text. The legal pages describe what the site actually does today; the
// company's registered details are added once they exist.
// TODO: have the legal documents reviewed by a lawyer, and add the registered
// company name, address and number to the legal notice and privacy policy.

export type InfoSlug =
  | "faq" | "help" | "contact" | "submissions" | "work-with-us" | "newsletter"
  | "press" | "brand" | "testimonials"
  | "terms" | "privacy" | "cookies" | "legal" | "copyright" | "credits";
export type InfoGroup = "Help" | "Company" | "Legal";
type InfoPage = { kicker: InfoGroup; title: string; label?: string; intro: string; updated?: string; body: ReactNode };

const UPDATED = "30 September 2026";

const Mail = ({ subject, children }: { subject: string; children: ReactNode }) => <a href={mail(subject)}>{children}</a>;
const Page = ({ slug, children }: { slug: InfoSlug; children: ReactNode }) => <Link to="/info/$slug" params={{ slug }}>{children}</Link>;
const Faq = ({ items }: { items: [string, ReactNode][] }) => (
  <div className="og-faq">
    {items.map(([question, answer]) => (
      <details key={question}><summary>{question}</summary><p>{answer}</p></details>
    ))}
  </div>
);

const LICENCES = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
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
  ["Kendrick Lamar at the 2018 Pulitzer Prizes", "Fuzheado", "CC BY-SA 4.0", "Pulitzer2018-portraits-kendrick-lamar_(cropped).jpg"],
  ["Drake on the Summer Sixteen Tour", "The Come Up Show", "CC BY 2.0", "Drake_and_Future_2016_Summer_Sixteen_Tour_(cropped).jpg"],
  ["J. Cole in 2010", "H D", "CC BY 2.0", "J._Cole_2010.jpg"],
  ["J. Cole in concert, 2017", "The Come Up Show", "CC BY 2.0", "Cole_2017.jpg"],
  ["Future in 2014", "thecomeupshow", "CC BY 2.0", "Future_(rapper)_2014_(cropped).JPG"],
  ["Cardi B at the 2018 VMAs", "Nicole Alexander", "CC BY 3.0", "Cardi_B_VMA_2018_-_closeup.png"],
  ["Lil Durk", "Daniel X. O’Neil", "CC BY 2.0", "Lil_Durk_and_Sonja_Marziano_(cropped).jpg"],
  ["Tupac Shakur’s star on the Hollywood Walk of Fame", "Alexis Doine", "CC0", "Tupac_Shakur_star_(Hollywood_Walk_of_Fame_star).jpg"],
  ["Jhené Aiko in concert", "The Come Up Show", "CC BY 2.0", "Jhené_Aiko_(28620047176).jpg"],
  ["Kai Cenat", "ImDavisss Live", "CC BY 3.0", "Kai_Cenat_July_2025.jpg"],
  ["Leslie Benzies", "Austin Hargrave", "CC BY-SA 3.0", "Leslie_Benzies_@_Everywhere_Game.jpg"],
  ["Fortnite Battle Royale at GDC 2018", "Official GDC", "CC BY 2.0", "Fortnite_Battle_Royale_at_GDC_2018.jpg"],
  ["Rosalía in concert in Chile", "Andrés Ibarra", "CC BY-SA 4.0", "Rosalía_Chile2022_06.png"],
  ["Karol G in 2018", "Programas Telemedellín", "CC BY 3.0", "Karol_G_en_2018.jpg"],
  ["Studio headphones", "Melissa Ursula Dawn Goldsmith", "CC BY-SA 4.0", "Studio_Headphones.jpg"],
  ["Studio A, In Your Ear Studios", "Will Fisher", "CC BY-SA 2.0", "Studio_A,_In_Your_Ear_Studios.jpg"],
  ["The Foley room at Vancouver Film School", "Vancouver Film School", "CC BY 2.0", "Foley_Room_at_the_Sound_Design_Campus_(cropped).jpg"],
  ["LCD Soundsystem at Roskilde Festival", "Bill Ebbesen", "CC BY 3.0", "LCD_Soundsystem_-_Roskilde_Festival_2010.jpg"],
  ["Knockdown Center, Queens", "Jimmyfever1978", "CC BY-SA 4.0", "Knockdown_Center_-_Oct_2023.jpg"],
  ["Al Doyle with Hot Chip", "Kim Metso", "CC BY-SA 3.0", "Al_Doyle_Hot_Chip_Popaganda_2013.jpg"],
  ["Michael Stipe in Padova, 2003", "Stefano Andreoli", "CC BY-SA 2.0", "Michael_Stipe_sings_Padova_2003.jpg"],
  ["The Flaming Lips in 2017", "dom fellowes", "CC BY 2.0", "The_Flaming_Lips_2017.jpg"],
  ["Wayne Coyne in 2006", "Kris Krug", "CC BY-SA 2.0", "Wayne_Coyne_from_the_Flaming_Lips_photographed_by_Kris_Krug.jpg"],
  ["Leon Bridges at Webster Hall", "Brianga", "CC BY-SA 4.0", "Leon_Bridges_at_Webster_Hall,_21_October_2015.JPG"],
  ["Julia Jacklin at Haldern Pop", "Martin Schumann", "CC BY-SA 4.0", "Julia_Jacklin_-_Haldern_Pop_Festival_2017-8.jpg"],
  ["Nintendo Switch 2 in its dock", "Crisco 1492", "CC BY-SA 4.0", "Nintendo_Switch_2_in_Docking_Console.jpg"],
  ["Xbox Series X and Series S", "Kyu3a", "CC BY-SA 4.0", "Xbox_Series_XとSeries_S.jpg"],
  ["Goichi Suda at Toulouse Game Show", "Georges Seguin (Okki)", "CC BY-SA 3.0", "Goichi_Suda_20121201_Toulouse_Game_Show_2_(cropped).jpg"],
  ["Painting a Warhammer 40,000 miniature", "David Poe, US Air Force", "Public domain", "Wh40k_painting_miniature.jpg"],
  ["A WWE NXT arena", "InFlamester20", "CC BY-SA 4.0", "WWE_NXT_-_arena_-_2016-09-17_-_02.jpg"],
  ["QTCinderella and Maya Higa at TwitchCon", "LeahBeahReah", "CC BY-SA 4.0", "QTCinderella_and_Maya_Higa_TwitchCon_2023.jpg"],
  ["The Kick logo", "Kick", "CC BY-SA 4.0", "Kick_Logo.jpg"],
  ["YouTube headquarters, San Bruno", "BrokenSphere", "CC BY 3.0", "YouTube_HQ_11.JPG"],
  ["The Grand Bassin Octogonal, Tuileries", "Chabe01", "CC BY-SA 4.0", "Grand_Bassin_Octogonal_Jardin_Tuileries_Paris_1.jpg"],
  ["Anthony Vaccarello", "YanRB", "CC BY-SA 4.0", "Anthony_Vaccarello_en_2017.jpg"],
  ["Charlotte Gainsbourg at Webster Hall", "Amy Hope Dermont", "CC BY 2.0", "Charlotte_Gainsbourg_at_Webster_Hall_April_2010_d.jpg"],
  ["Galleria Vittorio Emanuele II, Milan", "Maurizio Moro5153", "CC BY-SA 4.0", "Galleria_Vittorio_Emanuele_Interno.jpg"],
  ["Dennis Haskins", "Lucha VaVOOM", "CC BY 2.0", "Dennis_Haskins_(39643581163).jpg"],
  ["Florence Pugh", "greg2600", "CC BY-SA 2.0", "Florence_Pugh_in_2019.jpg"],
  ["Omar Sy", "Harald Krichel", "CC BY-SA 3.0", "Omar_Sy_(2020).jpg"],
  ["Kylian Mbappé at Real Madrid", "SdHb", "CC BY-SA 4.0", "Kylian_Mbappe_at_Real_Madrid's_game_versus_Juventus_Turin_on_22_October_2025.jpeg"],
  ["An André Courrèges ensemble, 1965", "Jacqueline Barrière Courrèges", "CC BY-SA 4.0", "Ensemble15,_André_Courrèges,_1965.jpg"],
  ["The Palais de Tokyo, Paris", "Strobilomyces", "CC BY-SA 3.0", "Palais_de_Tokyo_20030101w.JPG"],
  ["Niketown, Oxford Circus, London", "hyku", "CC BY-SA 2.0", "Niketown_-_Oxford_Circus_-_London_2009-04-19,_UK_09.jpg"],
  ["A Nike store in downtown Portland", "Steve Morgan", "CC BY-SA 4.0", "Nike_store_in_downtown_Portland_(2018).jpg"],
  ["Nike House of Innovation, New York", "Ajay Suresh", "CC BY 2.0", "Nike_House_of_Innovation_(48155638687).jpg"],
  ["An Adidas store in Jakarta", "RasyaAbhirama13", "CC BY-SA 4.0", "Adidas_Store_in_Grand_Indonesia,_Jakarta.jpg"],
  ["A Uniqlo store in Shenzhen", "Dinkun Chen", "CC BY-SA 4.0", "A_UNIQLO_STORE_IN_IN_COCO_PARK,_SHENZHEN.jpg"],
  ["A Uniqlo store at Tokyo Station", "Nick-D", "CC BY-SA 4.0", "Small_Uniqlo_store_in_Tokyo_Station_November_2023.jpg"],
];

// Every item OGCW keeps in the browser, for the Cookie Policy
const STORAGE_ITEMS: [string, string, string][] = [
  ["ogcw-consent", "Strictly necessary", "Remembers your cookie choices, so we don’t ask on every visit."],
  ["ogcw-lang", "Strictly necessary", "Remembers your language."],
  ["ogcw-theme", "Preferences", "Remembers the colour theme you picked (Night, Gold, Navy or Aurora)."],
  ["ogcw-hero", "Preferences", "Remembers which home page hero you picked."],
  ["ogcw-vote-no1-rapper", "Preferences", "Remembers your vote in the No. 1 rapper poll, so you see the results when you come back."],
  ["ogcw-answer-(story)", "Preferences", "Remembers your answer to the question at the end of a story."],
];

// The contact subjects, for the Contact page
const ENQUIRIES: [string, string, string][] = [
  ["General", "Anything that doesn’t fit below.", "Tell us what you need and we’ll pass it to the right person."],
  ["Corrections", "Something in a story is wrong.", "Include the link to the story and what needs correcting."],
  ["Submit a story", "Tips, pitches and stories we should be telling.", "See the submissions page for what to include."],
  ["Music submissions", "New releases from artists and labels.", "Send a streaming link and the release date; no attachments."],
  ["Press", "Journalists and media.", "Your publication, your deadline and what you need."],
  ["Advertising", "Brands and agencies.", "What you have in mind, your timing and your budget range."],
  ["Partnerships", "Events, collaborations and long-term partners.", "Who you are and the idea."],
  ["Copyright / Content removal", "Rights holders.", "See the copyright page for what a notice must include."],
  ["Privacy request", "Access, correction or deletion of your data.", "Tell us which right you want to use and how we can identify your data."],
];

export const infoPages: Record<InfoSlug, InfoPage> = {
  // ------------------------------------------------------------------ Help
  faq: {
    kicker: "Help",
    title: "Frequently asked questions",
    label: "FAQ",
    intro: "Quick answers to the questions readers ask us most.",
    body: (
      <>
        <h2>About OGCW</h2>
        <Faq items={[
          ["What is OGCW?", "OGCW, One Great Culture World, is an independent platform for culture and the stories around it. The idea is simple: bring culture and what’s happening right now, from all over the world, together in one place."],
          ["What do you cover?", <>Music, games, streaming and culture, from fashion and film to television and sneakers, plus OGCW Originals, our own video series. See <Link to="/about">About OGCW</Link> for more.</>],
          ["Who writes OGCW?", <>The OGCW desk. Every story carries the name of the writer, and the <Link to="/about">About page</Link> lists the desk and what each writer covers.</>],
          ["Where do your facts come from?", "Every story ends with a Sources list: the reporting, official announcements and records it is based on. Our stories are written in our own words, and we link to the original sources so you can check them."],
        ]} />
        <h2>Reading OGCW</h2>
        <Faq items={[
          ["Do I need an account?", "No. Everything on OGCW is free to read without an account or sign-up."],
          ["How do I change the colours?", "Use the colour button in the header to switch between the Night, Gold, Navy and Aurora themes. If you allow preferences, we remember your choice."],
          ["How do I search?", "Use the search button in the header, or the Explore page, to search every story, Originals episode and shop."],
          ["I found a mistake in a story.", <>Thank you. Email <Mail subject="Correction">{BUSINESS_EMAIL}</Mail> with the link and what needs correcting. We fix mistakes and say so.</>],
        ]} />
        <h2>Votes and feedback</h2>
        <Faq items={[
          ["How do the votes work?", "Polls such as the No. 1 rapper vote, and the question at the end of each story, count one answer per browser. After you answer you see everyone’s share of the answers so far. They are for fun and conversation, not scientific surveys."],
          ["What happens to the notes I write under a story?", <>They go to the desk that wrote the story. We read them and never publish them. Please leave out personal details. See the <Page slug="privacy">Privacy Policy</Page>.</>],
        ]} />
        <h2>Newsletter and shop</h2>
        <Faq items={[
          ["How do I get the newsletter?", <>Sign up on the <Page slug="newsletter">newsletter page</Page> or on the home page. It launches soon, and leaving takes one tap.</>],
          ["Can I buy things from OGCW?", <>Not directly. The <Link to="/shop">OGCW Shop</Link> is our edit of products from Nike, Adidas, StockX and Uniqlo. “Shop at” links take you to the retailer, who handles stock, payment, delivery and returns.</>],
          ["Why is a price different on the retailer’s site?", "Prices on OGCW are guides in euros. The retailer sets the final price, which can change with stock, sales and your country."],
        ]} />
        <h2>Working with us</h2>
        <Faq items={[
          ["How do I send you a story or a tip?", <>See <Page slug="submissions">Submissions</Page> for what to include, then email <Mail subject="Submit a story">{BUSINESS_EMAIL}</Mail>.</>],
          ["I’m an artist or a label. Can I send you music?", <>Yes. See <Page slug="submissions">Submissions</Page>, then email <Mail subject="Music submissions">{BUSINESS_EMAIL}</Mail> with a streaming link.</>],
          ["How do I advertise or partner with OGCW?", <>See <Page slug="work-with-us">Work with OGCW</Page>.</>],
          ["Something of mine is on OGCW and I want it removed.", <>See <Page slug="copyright">Copyright and content removal</Page> for how to send a notice.</>],
        ]} />
        <h2>Privacy and cookies</h2>
        <Faq items={[
          ["Do you use tracking or advertising cookies?", <>No. OGCW keeps only a few small items in your browser: your cookie choices and language, and, if you allow it, your preferences. The <Page slug="cookies">Cookie Policy</Page> lists every one.</>],
          ["How do I change my cookie choices?", "Use “Cookie settings” in the footer or the menu at any time."],
        ]} />
      </>
    ),
  },
  help: {
    kicker: "Help",
    title: "How can we help?",
    label: "Help",
    intro: "Find the right page, or the right person, for what you need.",
    body: (
      <>
        <p>Most answers are in the <Page slug="faq">FAQ</Page>. If yours isn’t, pick what you need below.</p>
        <ul className="info-cards">
          <li><Page slug="faq"><strong>Questions</strong><span>Quick answers about OGCW, votes, the newsletter and the shop.</span></Page></li>
          <li><Page slug="contact"><strong>Contact us</strong><span>Every way to reach the OGCW desk, by subject.</span></Page></li>
          <li><Page slug="submissions"><strong>Send us a story or music</strong><span>What to include in a tip, a pitch or a new release.</span></Page></li>
          <li><Page slug="work-with-us"><strong>Advertise or partner</strong><span>Campaigns, sponsorships, events and collaborations.</span></Page></li>
          <li><Page slug="copyright"><strong>Copyright and removals</strong><span>How rights holders can ask us to remove something.</span></Page></li>
          <li><Page slug="privacy"><strong>Your data</strong><span>What we collect, why, and how to use your rights.</span></Page></li>
        </ul>
        <h2>Correcting a story</h2>
        <p>If something in a story is wrong, email <Mail subject="Correction">{BUSINESS_EMAIL}</Mail> with the link and the correction. We check every report, fix mistakes and note the change.</p>
        <h2>Accessibility</h2>
        <p>We want OGCW to work for everyone: the site supports keyboard navigation, respects your device’s reduced-motion setting and offers light and dark colour themes. If something doesn’t work for you, tell us at <Mail subject="Accessibility">{BUSINESS_EMAIL}</Mail>.</p>
      </>
    ),
  },
  contact: {
    kicker: "Help",
    title: "Contact us",
    label: "Contact",
    intro: "One address for everything. The subject line gets it to the right person.",
    body: (
      <>
        <p>Email <Mail subject="General">{BUSINESS_EMAIL}</Mail>. Choose the subject that fits, and we’ll route it. Each link below opens an email with the subject already filled in.</p>
        <table className="info-table">
          <thead><tr><th>Subject</th><th>For</th><th>Please include</th></tr></thead>
          <tbody>
            {ENQUIRIES.map(([subject, forWhat, include]) => (
              <tr key={subject}><td><Mail subject={subject}>{subject}</Mail></td><td>{forWhat}</td><td>{include}</td></tr>
            ))}
          </tbody>
        </table>
        <h2>When we reply</h2>
        <p>We aim to answer within five working days. Copyright notices and privacy requests are handled first. We read every message, including tips and submissions, but can’t always reply to each one.</p>
      </>
    ),
  },
  submissions: {
    kicker: "Help",
    title: "Submissions",
    intro: "Send us a story, a tip or new music. Here is what helps us most.",
    body: (
      <>
        <h2 id="story">Submit a story</h2>
        <p>Tips, pitches and stories we should be telling are welcome from readers, creators and people inside the industries we cover. Email <Mail subject="Submit a story">{BUSINESS_EMAIL}</Mail> with:</p>
        <ul className="info-list">
          <li>What happened, when and where, in a few sentences</li>
          <li>How you know, and any links or documents that support it</li>
          <li>Whether we may name you, and how to reach you</li>
        </ul>
        <p>If you are sharing something sensitive, say so in the first line and we’ll treat it with care. We check everything before we report it, and we don’t publish a tip without confirming it.</p>
        <h2 id="music">Music submissions</h2>
        <p>Artists, managers and labels can send new releases to <Mail subject="Music submissions">{BUSINESS_EMAIL}</Mail>. Please include:</p>
        <ul className="info-list">
          <li>A private or public streaming link (no attachments, please)</li>
          <li>The release date and the label, if there is one</li>
          <li>A short paragraph about the artist and the release</li>
          <li>A press photo link and any tour dates</li>
        </ul>
        <p>Send releases at least two weeks before they come out if you can. We listen to everything, but we can’t reply to every submission, and a submission is not a guarantee of coverage.</p>
        <h2>What we don’t accept</h2>
        <p>Paid placement in our editorial coverage. If you want to advertise, see <Page slug="work-with-us">Work with OGCW</Page>.</p>
      </>
    ),
  },
  // ------------------------------------------------------------------ Company
  "work-with-us": {
    kicker: "Company",
    title: "Work with OGCW",
    intro: "For brands, artists, labels, PR agencies and partners.",
    body: (
      <>
        <p>OGCW reaches readers who care about music, games, streaming and culture. We work with partners who fit that audience, in ways that stay honest with it.</p>
        <h2>Advertising</h2>
        <p>Campaigns, sponsorships and branded content. Anything paid for is always clearly labelled as such, and it never appears as editorial. Email <Mail subject="Advertising">{BUSINESS_EMAIL}</Mail> with what you have in mind, your timing and your budget range.</p>
        <h2>Partnerships</h2>
        <p>Events, collaborations, series and long-term partners. Email <Mail subject="Partnerships">{BUSINESS_EMAIL}</Mail> with who you are and the idea.</p>
        <h2>Our editorial independence</h2>
        <ul className="info-list">
          <li>Advertisers and partners never decide what we report or how.</li>
          <li>Sponsored content is labelled on the page, every time.</li>
          <li>Paying for coverage in our news or reviews is not possible.</li>
        </ul>
      </>
    ),
  },
  newsletter: {
    kicker: "Company",
    title: "The OGCW newsletter",
    label: "Newsletter",
    intro: "Stay in the culture: the biggest stories from OGCW, straight to your inbox.",
    body: (
      <>
        <p>The day’s biggest stories in your inbox every morning. It’s free, and leaving takes one tap.</p>
        <h2>What’s in it</h2>
        <ul className="info-list">
          <li>The week’s biggest stories, and what’s trending</li>
          <li>New music, pop culture and fashion</li>
          <li>Film &amp; TV and sport</li>
          <li>OGCW exclusives and Originals</li>
        </ul>
        <h2>Sign up</h2>
        <div className="info-form"><NewsletterForm /></div>
        <p className="info-note">The newsletter launches soon. Until it does, this form doesn’t send or store your address. When it launches, we’ll only use your email to send the newsletter, as set out in the <Page slug="privacy">Privacy Policy</Page>.</p>
      </>
    ),
  },
  press: {
    kicker: "Company",
    title: "Press",
    intro: "Information for journalists and media about OGCW.",
    body: (
      <>
        <h2>About OGCW</h2>
        <p>OGCW, One Great Culture World, is an independent editorial platform covering music, games, streaming and culture. Every story is reported, written in our own words and published with its sources.</p>
        <h2>OGCW at a glance</h2>
        <ul className="info-list">
          <li>{ARTICLES.length} stories across {SECTION_IDS.length} sections: music, games, streaming and culture</li>
          <li>{EPISODES.length} episodes of OGCW Originals, our own video series</li>
          <li>The OGCW Shop: an edit from {SHOPS.length} retailers</li>
          <li>Available in four colour themes, free to read, with no account needed</li>
        </ul>
        <h2>Press enquiries</h2>
        <p>For interviews, comment or information about OGCW, email <Mail subject="Press">{BUSINESS_EMAIL}</Mail> with “Press” in the subject, your publication and your deadline.</p>
        <h2>Using our name and logo</h2>
        <p>See the <Page slug="brand">brand page</Page> for how to write and show OGCW, and ask us for logo files.</p>
      </>
    ),
  },
  brand: {
    kicker: "Company",
    title: "The OGCW brand",
    label: "Brand",
    intro: "How to write, show and colour OGCW.",
    body: (
      <>
        <h2>Name</h2>
        <p>Write OGCW in capitals. In full it’s One Great Culture World. Don’t add spaces or full stops (not O.G.C.W.).</p>
        <h2>Colours</h2>
        <ul className="info-swatches">
          {[
            ["#0D0D0D", "Background"],
            ["#1A1A1A", "Surface and cards"],
            ["#292929", "Borders"],
            ["#E4E1DA", "Primary text"],
            ["#A3A3A3", "Secondary text"],
            ["#FFE600", "OGCW yellow (accents only)"],
          ].map(([hex, name]) => (
            <li key={hex}><span style={{ background: hex }} aria-hidden="true" /><strong>{hex}</strong> {name}</li>
          ))}
        </ul>
        <p>Yellow is for accents: buttons, active states and labels. It is never a background for long text.</p>
        <h2>Type</h2>
        <p>Source Serif 4 for headlines and reading text; Inter for labels, navigation and buttons.</p>
        <h2>Assets</h2>
        <p>For logos and brand files, email <Mail subject="Brand assets">{BUSINESS_EMAIL}</Mail> with “Brand assets” in the subject.</p>
      </>
    ),
  },
  testimonials: {
    kicker: "Company",
    title: "Testimonials",
    intro: "What artists, brands and readers say about working with OGCW.",
    body: (
      <>
        <p>We only publish testimonials that are real and that people have agreed to let us share. We’re collecting the first ones now, and they will appear here.</p>
        <p>Worked with us, or been featured on OGCW? We’d love to hear how it went. Email <Mail subject="Testimonial">{BUSINESS_EMAIL}</Mail> and tell us whether we may publish your words and your name.</p>
      </>
    ),
  },
  // ------------------------------------------------------------------ Legal
  terms: {
    kicker: "Legal",
    title: "Terms of Service",
    label: "Terms",
    intro: "The rules for using OGCW. Please read them: by using the site you agree to them.",
    updated: UPDATED,
    body: (
      <>
        <h2>1. Who we are</h2>
        <p>OGCW (One Great Culture World) publishes this website. You can reach us at <Mail subject="Terms of Service">{BUSINESS_EMAIL}</Mail>. The <Page slug="legal">legal notice</Page> has our full details.</p>
        <h2>2. Using OGCW</h2>
        <p>You may read, share links to and enjoy OGCW for your own personal, non-commercial use. You don’t need an account. Please don’t:</p>
        <ul className="info-list">
          <li>copy or republish our stories, or large parts of them, without permission (quoting a short extract with a link is fine);</li>
          <li>scrape, crawl or harvest the site for commercial use or to train software;</li>
          <li>try to disrupt, overload or break into the site or its systems;</li>
          <li>use the site for anything unlawful, or to harass or harm anyone.</li>
        </ul>
        <h2>3. Our content</h2>
        <p>The text, design and OGCW Originals are ours, or used with permission. Photos are credited where they appear and on our <Page slug="credits">photo credits</Page> page, and remain the property of their photographers under their licences. Names and logos of other brands belong to their owners.</p>
        <h2>4. What you send us</h2>
        <p>When you send us a tip, a submission, a note under a story or a vote, you confirm that you have the right to share it and that it isn’t unlawful or harmful. You allow us to use it to run OGCW and to report stories. We won’t publish your name or your words without asking, except where you have sent them to us for publication.</p>
        <h2>5. Polls and questions</h2>
        <p>Polls and the questions at the end of stories count one answer per browser. They are for fun and conversation, not scientific surveys. We may remove answers that look automated or manipulated, and we may reset or close a poll.</p>
        <h2>6. The OGCW Shop and other websites</h2>
        <p>OGCW doesn’t sell products. The OGCW Shop is our edit of products from other retailers; when you buy, you buy from that retailer, on its terms, and it is responsible for stock, prices, payment, delivery and returns. Prices on OGCW are guides. If a link ever earns us a commission, we will label it. We are not responsible for the content or practices of other websites we link to.</p>
        <h2>7. Accuracy</h2>
        <p>We work hard to get things right and we link to our sources. If we get something wrong, we correct it. Our stories are information, not professional advice, and things can change after publication, such as dates, prices and line-ups.</p>
        <h2>8. Availability and changes</h2>
        <p>We may change, pause or remove parts of the site at any time. We may update these terms; the date at the top shows the latest version, and using the site after a change means you accept it.</p>
        <h2>9. Liability</h2>
        <p>We provide OGCW as it is. As far as the law allows, we are not liable for indirect losses or for losses caused by relying on the site. Nothing in these terms limits any rights you have by law as a consumer, or our liability where the law does not allow it to be limited.</p>
        <h2>10. The law that applies</h2>
        <p>These terms are governed by the law of the country where OGCW is established, without taking away the protection of the mandatory consumer laws of the country where you live.</p>
        <h2>11. Contact</h2>
        <p>Questions about these terms: <Mail subject="Terms of Service">{BUSINESS_EMAIL}</Mail>.</p>
      </>
    ),
  },
  privacy: {
    kicker: "Legal",
    title: "Privacy Policy",
    label: "Privacy",
    intro: "What personal data OGCW collects, why, and the rights you have.",
    updated: UPDATED,
    body: (
      <>
        <p>We collect as little as we can. You can read OGCW without an account, and we don’t use analytics, advertising or tracking cookies.</p>
        <h2>1. Who is responsible</h2>
        <p>OGCW (One Great Culture World) is responsible for your personal data on this site. Contact us about privacy at <Mail subject="Privacy request">{BUSINESS_EMAIL}</Mail>.</p>
        <h2>2. What we collect, and why</h2>
        <table className="info-table">
          <thead><tr><th>What</th><th>Why</th><th>Legal basis</th></tr></thead>
          <tbody>
            <tr><td>Technical data your browser sends when you visit, such as your IP address, browser type and the pages you request</td><td>To deliver the site, keep it secure and fix problems. Our hosting provider processes this data for us.</td><td>Our legitimate interest in running a secure website</td></tr>
            <tr><td>Your answers to polls and to the questions at the end of stories</td><td>To count them and show the results. They are counted without your name.</td><td>Our legitimate interest in running polls you choose to take part in</td></tr>
            <tr><td>Notes you write under a story</td><td>To read your feedback. Notes are stored with the story and the time, and never published.</td><td>Our legitimate interest in improving our reporting</td></tr>
            <tr><td>Your email address, when the newsletter launches</td><td>To send you the newsletter.</td><td>Your consent, which you can withdraw at any time</td></tr>
            <tr><td>Emails you send us</td><td>To answer you and deal with your request.</td><td>Our legitimate interest in replying, or steps you ask us to take</td></tr>
            <tr><td>Preferences stored in your browser</td><td>To remember your theme, hero choice and answers.</td><td>Your consent (see the <Page slug="cookies">Cookie Policy</Page>)</td></tr>
          </tbody>
        </table>
        <h2>3. Content from other services</h2>
        <p>Some images on OGCW load from other services: YouTube (video thumbnails), Spotify (album covers) and Unsplash (photos). When your browser loads them, those services receive your IP address. We don’t embed their players or trackers. Links to other websites take you to their own privacy policies.</p>
        <h2>4. How long we keep it</h2>
        <ul className="info-list">
          <li>Technical logs: only as long as needed for security and fixing problems.</li>
          <li>Poll counts and answers: as long as the poll or story is online.</li>
          <li>Notes and emails: as long as needed to deal with them, then deleted.</li>
          <li>Newsletter address: until you unsubscribe.</li>
        </ul>
        <h2>5. Who we share it with</h2>
        <p>We never sell your data. We share it only with the service providers who help us run OGCW, such as hosting and email, under agreements that protect it, or where the law requires it. If a provider processes data outside the European Economic Area, we make sure appropriate safeguards are in place.</p>
        <h2>6. Your rights</h2>
        <p>You can ask to access, correct or delete your personal data, to restrict or object to how we use it, and to receive it in a portable format. Where we rely on your consent, you can withdraw it at any time. Email <Mail subject="Privacy request">{BUSINESS_EMAIL}</Mail>. You also have the right to complain to your local data protection authority.</p>
        <h2>7. Children</h2>
        <p>OGCW is a general-audience site. We don’t knowingly collect personal data from children under 13, and we ask younger readers not to send us their details.</p>
        <h2>8. Changes</h2>
        <p>We will update this policy when what we do changes, for example when the newsletter launches. The date at the top shows the latest version.</p>
      </>
    ),
  },
  cookies: {
    kicker: "Legal",
    title: "Cookie Policy",
    label: "Cookies",
    intro: "What OGCW stores in your browser, and how to change it.",
    updated: UPDATED,
    body: (
      <>
        <p>Cookies and similar technologies, such as your browser’s local storage, let a website remember small things between pages and visits. OGCW uses very few of them, and none for tracking you or showing you adverts.</p>
        <h2>What we use</h2>
        <table className="info-table">
          <thead><tr><th>Name</th><th>Type</th><th>What it does</th></tr></thead>
          <tbody>
            {STORAGE_ITEMS.map(([name, type, purpose]) => <tr key={name}><td><code>{name}</code></td><td>{type}</td><td>{purpose}</td></tr>)}
          </tbody>
        </table>
        <p>All of these are stored in your browser only, on this device, and stay until you clear them or change your choices. Items marked Preferences are only stored if you allow them.</p>
        <h2>What we don’t use</h2>
        <ul className="info-list">
          <li>No analytics cookies: we don’t measure your visits with cookies.</li>
          <li>No advertising or tracking cookies.</li>
          <li>No third-party cookies set by us. Images from YouTube, Spotify and Unsplash load from their servers, but we don’t embed their players or trackers.</li>
        </ul>
        <h2>Changing your choices</h2>
        <p>You can change your mind at any time. Turning Preferences off removes the preference items stored before.</p>
        <p><CookieSettingsButton className="og-cta">Change cookie settings</CookieSettingsButton></p>
        <p>You can also clear or block storage in your browser’s settings. The site still works, but it won’t remember your choices.</p>
        <p>Questions: <Mail subject="Cookies">{BUSINESS_EMAIL}</Mail>.</p>
      </>
    ),
  },
  legal: {
    kicker: "Legal",
    title: "Legal notice",
    label: "Legal notice",
    intro: "Who publishes OGCW, and the legal information about this site.",
    updated: UPDATED,
    body: (
      <>
        <h2>Publisher</h2>
        <p>OGCW — One Great Culture World<br />Email: <Mail subject="Legal">{BUSINESS_EMAIL}</Mail></p>
        <p>The registered company details (legal name, address and registration number) will be published here once registration is complete.</p>
        <h2>Editorial responsibility</h2>
        <p>The OGCW desk is responsible for the content of this site. Each story names its writer and lists its sources.</p>
        <h2>Corrections</h2>
        <p>If we get something wrong, we correct it. Email <Mail subject="Correction">{BUSINESS_EMAIL}</Mail> with the link and the correction.</p>
        <h2>Copyright</h2>
        <p>© {new Date().getFullYear()} One Great Culture World. Text and design are protected by copyright. Photos belong to their photographers and are used under the licences listed on our <Page slug="credits">photo credits</Page> page. To report a copyright issue, see <Page slug="copyright">Copyright and content removal</Page>.</p>
        <h2>Links to other websites</h2>
        <p>We link to other websites, including our sources and retailers. We are not responsible for their content, and a link doesn’t mean we endorse everything on them.</p>
        <h2>Legal documents</h2>
        <ul className="info-list">
          <li><Page slug="terms">Terms of Service</Page></li>
          <li><Page slug="privacy">Privacy Policy</Page></li>
          <li><Page slug="cookies">Cookie Policy</Page></li>
          <li><Page slug="copyright">Copyright and content removal</Page></li>
        </ul>
      </>
    ),
  },
  copyright: {
    kicker: "Legal",
    title: "Copyright and content removal",
    label: "Copyright",
    intro: "How rights holders can ask us to credit, change or remove something.",
    updated: UPDATED,
    body: (
      <>
        <p>We respect the work of photographers, artists and writers. Every photo we use is credited, and we act quickly when someone tells us about a problem.</p>
        <h2>How to send a notice</h2>
        <p>Email <Mail subject="Copyright / Content removal">{BUSINESS_EMAIL}</Mail> with “Copyright / Content removal” in the subject, and include:</p>
        <ul className="info-list">
          <li>Your name and how to contact you, and whether you act for someone else</li>
          <li>The work you own, with a link or a description</li>
          <li>The link to the page on OGCW where it appears</li>
          <li>What you want: a credit, a correction or removal</li>
          <li>A statement that you believe in good faith the use isn’t authorised, and that the information in your notice is accurate</li>
        </ul>
        <h2>What happens next</h2>
        <p>We aim to reply within five working days. While we look into a notice, we may take the content down. If the notice is valid, we will credit, change or remove the content. If we think the use is allowed, for example under a Creative Commons licence or as a short quotation, we will explain why.</p>
        <h2>If your content was removed</h2>
        <p>If something you gave us was removed and you believe that was a mistake, reply to our message with your reasons and we will look at it again.</p>
        <h2>Misuse</h2>
        <p>Please only send notices for work you own or represent. False notices can have legal consequences.</p>
      </>
    ),
  },
  // Attribution the Creative Commons licences require
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
        <p>Video thumbnails (streamers, music videos, and trailers and showcases from Capcom, PlayStation, Xbox, Nintendo, Netflix, Ketchup Entertainment, CD Projekt Red, Mojang and the ONE PIECE channel) belong to the channels that published them and link to the videos on YouTube. Album covers belong to the artists and labels, and link to the songs on Spotify. The Nike, Adidas, StockX and Uniqlo logos are their owners’ trademarks, shown to link to their shops (logo files via Wikimedia Commons).</p>
        <p>Shop, hero, Originals and some news photos (sneakers, the cinema, the controller) come from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a> under the Unsplash License, including shop photos by Paul Steuber (Nike), Sou Jest (Adidas), Irene Kredenets (StockX) and Howen (Uniqlo), and a PlayStation controller by User_Pascal.</p>
        <p>Is one of your photos on OGCW without the right credit? Email <Mail subject="Photo credit">{BUSINESS_EMAIL}</Mail> and we’ll fix it.</p>
      </>
    ),
  },
};

export const isInfoSlug = (slug: string): slug is InfoSlug => slug in infoPages;

/** The info pages by group, for the side column and the menu */
export const INFO_GROUPS: { group: InfoGroup; pages: InfoSlug[] }[] = [
  { group: "Help", pages: ["help", "faq", "contact", "submissions"] },
  { group: "Company", pages: ["press", "brand", "work-with-us", "newsletter", "testimonials"] },
  { group: "Legal", pages: ["terms", "privacy", "cookies", "legal", "copyright", "credits"] },
];
export const infoLabel = (slug: InfoSlug) => infoPages[slug].label ?? infoPages[slug].title;
