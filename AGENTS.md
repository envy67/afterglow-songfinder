<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Music data (search, similar songs) comes from YouTube Music's web API, called only from `src/lib/ytmusic.server.ts` via server functions in `src/lib/music.functions.ts`; the browser never calls it directly (no CORS, keeps parsing in one place).
- Playback goes through a single off-screen YouTube iframe player (`YouTubeEngine`), driven by the `usePlayer` store; components change the store, never the player — one source of truth for queue/play state.
- Listening history, likes, queue and appearance live in localStorage via zustand `persist` with `skipHydration`, rehydrated in `AppShell`'s effect — avoids SSR hydration mismatches and needs no account.
- Home recommendations are pure functions in `src/lib/recommend.ts` (covered by `recommend.test.ts`); keep ranking logic there, not in components.
- Styling uses CSS classes in `src/styles.css`: `.surface` for solid dark panels, `.glass`/`.glass-button` for dark frosted buttons and navigation, `.btn-solid`/`.play-button` for primary actions — keeps the look consistent and themeable from one file.
- Lyrics come from lrclib.net through the `getLyrics` server function.
