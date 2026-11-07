import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Clock, Loader2, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LiquidGlass } from "@/components/music/LiquidGlass";
import { TrackRow } from "@/components/music/TrackRow";
import { searchSongs } from "@/lib/music.functions";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: "Search · Verre" },
      { name: "description", content: "Search songs and artists and play them instantly." },
      { property: "og:title", content: "Search · Verre" },
      { property: "og:description", content: "Search songs and artists and play them instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [text, setText] = useState(q);
  const recentSearches = usePlayer((s) => s.recentSearches);
  const hydrated = usePlayer((s) => s.hydrated);
  const currentId = usePlayer((s) => s.queue[s.index]?.videoId);
  const { playTrack, addRecentSearch, clearRecentSearches } = usePlayer.getState();

  useEffect(() => {
    const t = setTimeout(() => {
      if (text.trim() !== q) navigate({ search: { q: text.trim() }, replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [text, q, navigate]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchSongs({ data: { query: q } }),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });
  const tracks = q ? (data?.tracks ?? []) : [];

  return (
    <div className="mx-auto max-w-4xl pt-4 md:pt-8">
      <h1 className="px-1 text-4xl font-bold text-glow sm:text-5xl">Search</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addRecentSearch(text);
          navigate({ search: { q: text.trim() }, replace: true });
        }}
      >
        <LiquidGlass radius={999} className="mt-6 flex items-center gap-3 px-5 py-4">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Songs, artists, albums…"
            aria-label="Search songs"
            className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {text && (
            <button type="button" aria-label="Clear search" onClick={() => setText("")} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </LiquidGlass>
      </form>

      {!q && hydrated && recentSearches.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold">Recent searches</h2>
            <button type="button" onClick={clearRecentSearches} className="text-sm text-muted-foreground hover:text-foreground">
              Clear
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button key={s} type="button" onClick={() => setText(s)} className="glass-button px-4 py-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {q && data?.error && <p className="mt-8 px-1 text-muted-foreground">{data.error}</p>}
      {q && !isFetching && data && !data.error && tracks.length === 0 && (
        <p className="mt-8 px-1 text-muted-foreground">No songs found for “{q}”.</p>
      )}

      {tracks.length > 0 && (
        <LiquidGlass radius={36} refract={false} className="mt-6 space-y-1 p-2">
          {tracks.map((t) => (
            <TrackRow
              key={t.videoId}
              track={t}
              active={t.videoId === currentId}
              onPlay={() => {
                addRecentSearch(q);
                playTrack(t);
              }}
            />
          ))}
        </LiquidGlass>
      )}
    </div>
  );
}
