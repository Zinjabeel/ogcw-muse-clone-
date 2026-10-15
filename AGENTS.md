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

- Keep the About page's 3D scene in a lazily imported client-only subtree so the editorial content remains server-rendered and WebGL never enters SSR.
- Read 3D material colors from semantic global CSS tokens so the scene and page share one palette.
- Keep the Impact Grid hero in the existing hero-switcher system and use the existing editorial story pool so older hero choices and studio edits remain available.
