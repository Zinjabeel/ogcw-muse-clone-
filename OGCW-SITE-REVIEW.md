# OGCW — Site Review and Brief

**Prepared for:** ChatGPT 6 Astra (and anyone else working in this clone)
**Prepared by:** Claude, the site's previous developer, at the owner's request
**Date:** 7 October 2026
**Codebase state:** identical to the live site at commit `a26516e` (Zinjabeel/ogcw-muse, main)

This document describes the OGCW website exactly as it is today, assesses
it objectively, and recommends what to improve, what could be removed and
what could be added. Read section 1 before changing anything: the clone
shares live services with the real site.

---

## 1. Read this first: guardrails

1. **This repository is a clone for design experiments.** It is not
   connected to Lovable and must never be pushed to `Zinjabeel/ogcw-muse`.
2. **The clone uses the live Sanity and Supabase projects.** Code and design
   changes are safe. Content and data changes are not: editing stories,
   using "Edit site", changing placements, creating test accounts, voting or
   rating all change the real, public site. Use read-only access, or ask the
   owner to create separate Sanity/Supabase projects for the clone first.
3. **Facts must be real and sourced.** Every story names its source; no
   invented authors, quotes, ratings, sales figures or dates. Reader ratings
   are real 1–5 star votes (shown only after 3 votes). If a fact can't be
   verified, leave it out or label it clearly (e.g. "alleged", "unconfirmed").
4. **Keep everything editable.** Any fixed text added to the site must be
   wrapped in `<T>` (or `<S>` for a story's label/headline/summary) and sit
   inside an `<EditSection name="…">`, so admins can change it on the page
   (see 4.4). Photos that should be swappable use `<EditableImage>`.
5. **Respect reduced motion and keyboard users.** Every animation in the
   codebase has a `prefers-reduced-motion` fallback; keep it that way.
6. **Never commit secrets.** The Sanity project ID and the Supabase
   publishable key in the code are public by design; nothing else should be.

---

## 2. What OGCW is

**One Great Culture World (OGCW)** is an independent culture news site. The
brand line is "Culture, Unfiltered". It covers four desks:

| Desk | Focus |
|---|---|
| **Music** | Global rap and hip-hop with a **strong Swedish focus**, plus pop, tours and awards |
| **Games** | Launches, showcases, sales and the industry |
| **Streaming** | Creators, records and platforms (Twitch, YouTube, Kick, VTubers) |
| **Culture** | Fashion, film and TV, sneakers |

Around the news sit Originals (video), a Shop (curated products bought from
retailers), Trends, a Blog/journal (to become a community forum), Explore,
and About.

**Audience:** young, culture-literate readers (rap, games, streetwear,
streaming), mostly on phones.

**Positioning:** a professional newsroom feel (broadsheet grids, serif
headlines, sources linked) with a modern, energetic culture-magazine edge.
The owner's own words: "it should fit a professional news website" and "the
most important thing is that it looks good and everything is neat".

### How the owner works (important)

- Works independently and visually: they review screenshots and redirect.
  Build what is asked directly, verify it, then report. Don't present lists
  of options unless asked.
- Prefers real, current content over placeholders, and sourced facts only.
- Likes: cinematic dark heroes, bold editorial typography, subtle motion,
  photos that fill their frames edge to edge, carousels that **keep moving
  under the pointer**, small "premium" touches (card spotlight, gentle zoom).
- Dislikes (explicitly rejected before): "vibe-coded" looks, ticket shapes,
  pulsing or glowing dots, gimmicky counters like "24 picks", widgets that
  feel like templates, and anything that looks copied from another site.
- A large animated redesign was tried and **reverted** on 4 Oct 2026. The
  owner kept only card photo zoom on hover and the pointer spotlight/tilt.
  Rejected: a "Latest" ticker under the header, scroll-reveal animations, a
  header that hides on scroll, a reading-progress line, a back-to-top ring,
  page/photo view transitions, a floating share rail, drop caps, and a
  moving footer wordmark. Don't reintroduce these unasked.

---

## 3. Technology

| Layer | What is used |
|---|---|
| Framework | **TanStack Start** (React 19, file-based routes in `src/routes`, server functions via `createServerFn`) on **Vite 8** |
| Styling | **Tailwind CSS 4** (tokens mapped to the theme variables) plus one large hand-written stylesheet, `src/styles.css` (~3,100 lines) |
| CMS | **Sanity** (project `z0ih0mun`, dataset `production`); the Studio is embedded in the site at `/admin` |
| Accounts and data | **Supabase** (project `dkzjgjerfaxtjyeixpqe`): reader accounts and story ratings |
| UI parts | shadcn/Radix components in `src/components/ui`, Lucide icons |
| Hosting | Built with Nitro for Cloudflare (`npm run build`); the original is synced with Lovable |
| Types | Strict TypeScript, including `exactOptionalPropertyTypes` |

**Run it:** `npm install`, then `npm run dev`, and open `http://localhost:5173`.
`npx tsc --noEmit` type-checks the project; `npm run build` builds it.
(Lovable uses `bun.lock`; keep it updated if dependencies change.)

### Where things live

```
src/routes/            pages (index, news, news.$slug, music/games/streaming/culture,
                       originals, shop, trends, blog, about, explore, info.$slug,
                       tour.bts-arirang, login, signup, reset-password, work, admin.$)
src/components/        page sections (hero-*, news-front, news-week, keep-exploring,
                       explore-mix, upcoming-events, nav-drawer, ogcw-layout, …)
src/components/site-text.tsx   the on-page editor (T, S, EditableImage, EditSection, SiteEditor)
src/lib/               data access (sanity-stories, stories, auth, work, ratings,
                       consent, site-text, site-sections, feedback, rap-poll)
src/data/              static data: content.ts (events, songs, shops, rap poll…),
                       placements.ts (front-page spots), trends.ts, tours.ts,
                       stories/* (fallback copies of the stories)
src/sanity/            Studio config, schemas, the visual story editor, placements dialog
src/assets/            local images (hero art, news photos, shop, brands)
```

---

## 4. How the site works

### 4.1 Stories (Sanity)

- **64 published stories.** Sanity is the source of truth; `src/data/stories`
  is only a fallback when Sanity can't be reached.
- The root loader fetches all story summaries, the front-page layout, reader
  ratings and site edits on every page (cached for about 10–15 seconds).
- Story fields: headline, slug, label (kicker), summary (deck), section,
  date, "Latest update" date, source credit, CERTIFIED flag, lead photo, and
  a rich body. The body has blocks for photos (sized: inline, wide, full,
  beside), two-photo rows, key facts, checklists, Q&A, "What this story
  answers", summary, timeline, related stories, pull quotes and button links.
- **Labels:** CERTIFIED (set by the editor, or earned at ≥5 ratings averaging
  ≥4.5), NEWEST (the 6 most recent) and TRENDIEST (in the trending list).
- **The Studio** (`/admin`) opens each story as a visual "Page" view laid out
  like the real article, with click-to-type fields. A "Where it appears"
  dialog places a story into any front-page spot or list, swaps stories, or
  keeps one to the News page only.

### 4.2 Front-page placements

`src/data/placements.ts` defines every spot on the home page (hero, This
week, Big news, headline front, Explore, Keep exploring…). Each spot has
defaults in code; the Studio's `frontPage` document overrides them. Empty
places fill with the newest stories that aren't already on the page.

### 4.3 Accounts and access

- **Readers** sign up and log in with email (Supabase) at `/signup` and
  `/login`. Email confirmation is on.
- **Work login** (`/work`): GitHub logs in through Sanity's own login; only
  members of the Sanity project get the admin dashboard. Google and email
  are reader accounts. `/admin` sends everyone else to `/work`.
- **Ratings:** readers rate stories 1–5 stars, stored in Supabase through
  security-definer functions.

### 4.4 The on-page site editor

Admins see an **Edit** button when they point at any text. They change it
in place and approve it with **Save changes**.

- `<T>` wraps fixed site text (key optional; without one the key comes from
  the wording and its part of the site).
- `<S story f="title">` edits a story's label, headline or summary, and
  saves to the story itself.
- `<EditableImage>` swaps photos.
- Every edit is saved as its own `siteEdit` document, filed under the part
  of the site it's in. The `EditSection` names are listed in
  `src/lib/site-sections.ts` (Hero, OGCW News, Explore, Footer…). In the
  Studio they appear under **Site edits**, one folder per part.
- Every save is also kept as a version in **Site history** for 30 days,
  with a Restore button.

### 4.5 Themes

There are four colour themes, switchable from the header: **Night**
(default: charcoal `#303030` and yellow `#FFE600`), **Gold** (soft white,
with a black hero), **Navy** and **Aurora**. They are defined as `--ogcw-*`
tokens on `html[data-theme]`. All CSS must use these tokens, never raw hex
values, so it works in every theme. Fonts: **Source Serif 4** for headlines
and body text, **Inter** for labels, navigation and buttons.

### 4.6 Privacy

There are no analytics or advertising cookies. A cookie consent card (in
the layout of 21st.dev's "cookie-consent") stores the reader's choice; it
allows only "preferences" (theme, hero choice, votes). The Cookie Policy
says so, so any analytics added later must update the policy and the
consent categories.

---

## 5. The site, page by page

### Global (every page)

- **Header:** fixed. At the top of a page it is tall, with "OGCW" large in
  the centre and the sections (News, Music, Games, Streaming, Culture,
  Originals, Brand deals, Trends, Blog, About, More) in a row underneath. On
  scroll it shrinks smoothly into the usual slim bar by the first section
  after the hero. On the left is the menu button; on the right, the hero
  switcher (home only), theme switcher, search and account. The section
  links show a pressed pill on hover.
- **Menu ("The OGCW Index"):** a full-screen drawer with numbered sections,
  a preview of each section's latest stories, upcoming events, the smaller
  pages, legal links and socials.
- **Search:** a full-screen overlay.
- **Footer:** company, explore, support and legal columns, socials,
  "Coming soon" app badges.
- **Cookie consent:** shown on the first visit; reopened from "Cookie
  settings".
- **Card hover:** photos lean in slightly, a soft accent light follows the
  pointer across tiles, and big cards tilt a few degrees.

### Home page (top to bottom)

1. **Hero:** four designs, chosen with the hero switcher. The default is
   **Impact**:
   - A large lead card for **Doja Cat's Tour Ma Vie**: copy and a "Tour
     dates & tickets" button on the left, and the poster on the right,
     framed in the poster's own dark red-brown.
   - Three "doors" beside it: Today's news; the Shop (the OGCW × Nike,
     StockX, Uniqlo, Red Bull artwork, with a Jordan release-date headline
     that fades out mid-word); and the Newsletter (the OGCW campaign photo).
   - As you scroll past, the hero blurs very slightly. In the Gold theme it
     is black.
   - The other three designs are Cover, Gallery and Gallery 2.
2. **OGCW News masthead:** "One Great Culture World", the date, "Certified
   news", and a section bar (All news, Socials, Stories, Stream, Culture,
   Upcoming, Shop, Explore).
3. **This week:** a lead story, three stories threaded under it, a middle
   column, a "connected" link and an In brief list of five.
   **Big news** follows: three places that each fade between two stories
   every 4 seconds, one place at a time.
4. **Headline front:** a lead story with "Check out this song" (Spotify) and
   its playlist; secondary and side stories; and the **Upcoming events**
   rail (tinted cards with a photo or icon and a countdown).
5. **More news:** a carousel that glides continuously, with arrows.
6. **Content of the month:** The Streamer Awards ranking.
7. **Shop promo:** a single card into `/shop`.
8. **Explore:** a mixed grid (editor's pick, trending, follow, streamer to
   watch, song, shop picks, reading list).
9. **Keep exploring:** a feature and tiles; the rap desk (a "Who's the
   No. 1 rapper right now?" vote plus On the rap beat); and **More to
   explore**.
10. **Connect band:** about, newsletter sign-up and work with OGCW.

### Other pages

| Route | What it is |
|---|---|
| `/news` | All stories in a broadsheet grid with section filters |
| `/music` `/games` `/streaming` `/culture` | Section fronts: lead story, live listing, songs, originals, more stories |
| `/news/:slug` | The article: kicker and label badge, headline, summary, sourced byline, lead photo, rich body, sources, "In this story" contents, most read, reader rating, a yes/no question, related and more news |
| `/originals`, `/originals/:slug` | OGCW video episodes (currently "premieres soon" placeholders) |
| `/shop`, `/shop/:slug` | Curated shops (Nike, Adidas, StockX, Uniqlo) with guide prices that link out to retailers |
| `/trends` | Trending topics, trends gone wrong, what people are buying, and videos |
| `/blog` | The journal: long reads and essays in progress; planned to become a forum |
| `/about` | Position, desks, sources, how we work, Follow OGCW socials, contact |
| `/explore` | Search, reading lists and the site directory |
| `/info/:slug` | FAQ, help, contact, press, brand, terms, privacy, cookies, legal notice, credits |
| `/tour/bts-arirang` | A guide to the BTS world tour |
| `/login`, `/signup`, `/reset-password`, `/work` | Accounts and the work login |
| `/admin` | The Sanity Studio (admins only) |

---

## 6. Objective assessment

### What works well

- **Credibility:** every story is sourced, dates are real, and labels are
  earned, not decorative. This is OGCW's strongest asset.
- **Editorial tooling:** the visual story editor, the placements dialog,
  on-page editing of every text and the 30-day site history give a small
  team real control without a developer.
- **A distinct look:** serif broadsheet structure plus a dark, cinematic
  hero sets OGCW apart from generic culture blogs.
- **Accessibility basics:** reduced-motion fallbacks, focus states,
  semantic headings and alt text are largely in place.
- **Theming:** the token system makes the four themes consistent.

### What objectively needs to change

Ordered by priority.

**P0: Promises the site doesn't keep (trust and correctness)**

1. **The newsletter isn't connected.** The hero door and the Connect band
   both invite sign-ups, but the form only says "Thanks! The newsletter
   launches soon." Wire it to a real list (for example a Supabase table plus
   an email provider such as Resend or Buttondown, with double opt-in), or
   change the copy until it exists.
2. **The social links are placeholders** (`instagram.com/`, `tiktok.com/`,
   `youtube.com/`, `x.com/`) in `src/components/socials.tsx`. They need the
   real OGCW profiles, which the owner will supply, or should be hidden
   until then.
3. **Votes and story feedback reset on every restart.** The rap poll counts
   (`src/lib/rap-poll.ts`) and the yes/no answers under articles
   (`src/lib/feedback.ts`) are kept in server memory. Move them to Supabase,
   as was already done for ratings.
4. **Originals has no videos yet.** Every episode shows "premieres soon".
   Either publish real episodes or hide the section from navigation until
   it has them.
5. **Production setup is incomplete:**
   - Supabase's Site URL and redirect URLs need the live domain.
   - Google/GitHub reader logins aren't switched on.
   - Email needs a custom SMTP sender.
   - Leaked-password protection is off.
   - Sanity CORS lists only localhost, so the live domain must be added for
     the Studio and the work login to function there.
6. **The legal pages are drafts** and need review by someone qualified,
   with the company's real registration details.

**P1: Structure and user experience**

7. **The home page is too long and repeats itself.** There are ten major
   blocks, and several overlap: Explore, Keep exploring and More to explore
   all show story tiles; More news and This week overlap; there is a shop
   promo plus a shop door in the hero. Aim for about six blocks with clear
   jobs: Hero → This week/Big news → Headline front + events → More news →
   one combined Explore (including the rap desk) → Connect.
8. **There are four parallel navigation systems with inconsistent labels.**
   - The header says "Brand deals" for the Shop.
   - The News bar says "Socials" (it goes to About), "Stories" (Originals)
     and "Upcoming" (events).
   - The drawer and footer use other names again.

   Agree one vocabulary and use it everywhere.
9. **Four hero designs is a maintenance cost.** Impact is the default and
   the strongest. Cover, Gallery and Gallery 2 (and the hero switcher in the
   header) could be retired, or kept as admin-only options.
10. **Static content belongs in the CMS.** Events, songs, shops and products,
    trends, the rap poll, Content of the month, tour data and the hero's
    Tour Ma Vie text live in `src/data/*` or in components. Editors can
    change words via the site editor but can't add, remove or reorder items
    without a developer. Model them in Sanity.
11. **Content goes stale.** Upcoming events must be pruned after their date,
    the BTS tour page and Tour Ma Vie lead have end dates, and the Jordan
    dates on the shop door are a snapshot. Add dates to these items so they
    retire themselves.

**P2: Performance, SEO and maintainability**

12. **SEO basics are missing.** There is no sitemap, no RSS feed and no
    `NewsArticle` structured data (JSON-LD). Article pages should also get
    their own Open Graph images. All of these are high value for a news
    site and cheap to add.
13. **Images:**
    - Many photos are hot-linked from Wikimedia Commons, Unsplash or
      YouTube, or served at full size. Serve them through Sanity's image
      CDN with `srcset`/`sizes` and WebP/AVIF.
    - Lazy-load everything below the fold.
    - Reserve each image's aspect ratio to avoid layout shift.
14. **CSS architecture:** `src/styles.css` is one ~3,100-line file built up
    by appending, with later overrides. Split it by feature (header, hero,
    broadsheet, article, shop…) and remove dead rules (for example the old
    `.consent` panel styles and superseded hero rules).
15. **Leftovers:** the blog still computes reading minutes ("min read" was
    retired). Some comments refer to removed features.
16. **Accessibility follow-ups:**
    - Auto-rotating content (Big news, the More news glide, the cover rail)
      needs a visible pause control; WCAG 2.2.2 asks for one on anything
      that moves for more than five seconds.
    - Check Gold-theme accent text for contrast.
    - Make sure hover-only reveals (the "See the drops" arrows) have
      keyboard equivalents.

### What could be removed

- The Cover, Gallery and Gallery 2 heroes, and the hero switcher (see 9).
- The Aurora theme, if analytics never show it being used. Four themes
  quadruple the visual QA.
- The Explore/Keep exploring duplication (merge into one section).
- Content of the month, if it won't be updated monthly.
- The `/tour/bts-arirang` page once the tour ends, or turn it into a
  reusable tour template.
- The "Coming soon" App Store and Google Play badges, until an app exists.

---

## 7. New ideas (in line with the brand)

1. **Community forum (planned):** replace the Blog with a forum.
   - Categories: Rap, Swedish rap, Streaming, Games, Culture, Off-topic.
   - Threads with replies, and possibly a live chat room.
   - Mini-games: head-to-head votes on rappers and streamers, and "Who is
     #1?" rankings, with comments.
   - Moderation tools for admins.
   - Supabase (tables + row-level security + realtime) fits this well.
   - **The owner wants to discuss the details before it's built.**
2. **A Swedish rap hub:** a dedicated page with the latest Swedish rap
   news, a release calendar, artist pages and a curated playlist. This is
   OGCW's clearest point of difference.
3. **Release calendars as structured data:** Jordan and sneaker drops, album
   release dates and game launches in one filterable calendar. It feeds the
   hero doors, the events rail and the shop automatically, with the source
   per item.
4. **Tour pages as a template:** generalise the BTS tour guide (dates map,
   "next up", setlist, Q&A) so any tour (Tour Ma Vie next) is a CMS entry,
   not a coded page.
5. **Live coverage:** a live-blog story type for award nights, showcases and
   drops, with timestamped updates.
6. **Story series and topics:** follow a running story (a court case, a
   tour, an album rollout) on one topic page with a timeline.
7. **Personalisation without tracking:** let signed-in readers follow
   desks or topics and get a "For you" row, stored in their own account
   rather than in cookies.
8. **A newsletter archive:** a public page of past issues, which doubles as
   SEO content.
9. **Source pages:** "Where the news comes from" already lists sources. A
   page per source (with all stories citing it) strengthens transparency.
10. **Video:** short vertical explainers for the biggest stories, embedded
    in articles and the Originals page, once Originals has real output.
11. **The pending design tasks from the owner's brief:**
    - restyle `/login` and `/signup` in the 21st.dev "register card" look;
    - refresh the About page;
    - Explore ideas such as "Who is #1?", product drops labelled NEW RELEASE
      / BACK IN STOCK, Games to Watch with "READ IT HERE", "On the Rap
      Beat — NOT EVERYDAY NEWS!", and More to Explore tiles labelled READ
      THIS / HOTTEST LATELY;
    - rebuild older stories into the richer article blocks.

---

## 8. Suggested working method for this clone

1. Run the site locally and read `src/routes/index.tsx`,
   `src/components/ogcw-layout.tsx` and `src/styles.css` (theme tokens at the
   top) before designing anything.
2. Make design changes in code. Don't edit Sanity content or Supabase data
   from the clone (see section 1).
3. Keep to the brand: theme tokens, Source Serif 4 and Inter, real photos,
   a professional news tone.
4. Verify every change visually at phone (390px), laptop (1440px) and wide
   (1850px+) widths, in the Night and Gold themes, and with reduced motion
   on.
5. Run `npx tsc --noEmit` and `npm run build` before each commit.
6. Commit in small, clearly described steps so the owner can compare and
   pick what to bring back to the real site.
