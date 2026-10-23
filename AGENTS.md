> [!NOTE]
> **This repository is a standalone clone** of OGCW (One Great Culture World),
> made on 7 October 2026 from Zinjabeel/ogcw-muse for design experiments.
> It is **not** connected to Lovable and must never be pushed to
> Zinjabeel/ogcw-muse. The Lovable note below applies to the original only.
> It uses its OWN Sanity dataset, `staging` (a copy of production made on
> 7 Oct 2026; see src/sanity/env.ts), so stories and site edits here don't
> touch the live site. It still shares the Supabase project (accounts,
> ratings) with the real site: don't change existing tables or data there.
> Run it with `node --use-system-ca .claude/dev.mjs` (port 5174).
> [!NOTE]
> **The redesign in this clone (7 Oct 2026)**
> - Front page: src/components/front-page.tsx + src/styles/front.css. Bands
>   take turns white/black (`data-band`), gold for labels and buttons. Gold is
>   now the default theme (src/components/theme-switcher.tsx). Each band has
>   its own spots in the studio (src/data/placements.ts; `section` limits a
>   spot to one section), so no story shows twice.
> - Sports section (SectionId "sports", /sports); four sourced stories are in
>   the staging dataset only.
> - Release calendar, big nights and official videos: src/data/drops.ts.
> - Shop as a store: src/data/shop.ts (27 brands, 66 products; Commons photos
>   credited per product; prices are guides, or "Price at the retailer"),
>   src/components/shop-kit.tsx, src/routes/shop.*, src/styles/shop.css.
> - OGCW 10 reader vote: src/lib/ranking-votes.ts (Supabase vote_ranking /
>   ranking_totals, table ranking_votes).
> - Forum (replaces the blog; /blog redirects): src/lib/forum.ts,
>   src/components/forum-kit.tsx, src/routes/forum.*, src/styles/forum.css
>   (Supabase forum_threads / forum_replies / forum_votes, RLS: public read,
>   signed-in posting). These Supabase tables are new and shared with the
>   live project; the live site doesn't use them.
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
