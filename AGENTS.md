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

- Post image is composed client-side on a canvas (src/lib/render-post.ts) so template switching is instant; AI (server route /api/generate) only writes text.
- Generation rate limit is an in-memory per-IP map in the server route — simple, resets on worker restart.
