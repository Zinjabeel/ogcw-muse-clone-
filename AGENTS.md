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
