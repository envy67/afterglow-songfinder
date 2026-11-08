import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, MicVocal, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArtistTile, ArtistTileSkeleton } from "@/components/music/ArtistTile";
import { rankArtists } from "@/lib/artists";
import { findArtists, searchArtists } from "@/lib/music.functions";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/artists/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } =>
    typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {},
  head: () => ({
    meta: [
      { title: "Artists · Verre" },
      { name: "description", content: "The artists you listen to most, and a search to find any other." },
      { property: "og:title", content: "Artists · Verre" },
      { property: "og:description", content: "The artists you listen to most, and a search to find any other." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArtistsPage,
});

const GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

function ArtistsPage() {
  const q = Route.useSearch().q ?? "";
  const navigate = useNavigate({ from: "/artists/" });
  const [text, setText] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => {
      if (text.trim() !== q) void navigate({ search: text.trim() ? { q: text.trim() } : {}, replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [text, q, navigate]);

  const { data, isFetching } = useQuery({
    queryKey: ["search-artists", q],
    queryFn: () => searchArtists({ data: { query: q } }),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });
  const results = q ? (data?.artists ?? []) : [];

  return (
    <div className="mx-auto max-w-6xl pt-4 md:pt-8">
      <h1 className="px-1 text-4xl font-bold sm:text-5xl">Artists</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ search: text.trim() ? { q: text.trim() } : {}, replace: true });
        }}
      >
        <div className="surface mt-6 flex items-center gap-3 rounded-[22px] px-5 py-4 focus-within:ring-2 focus-within:ring-ring">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Find an artist…"
            aria-label="Search artists"
            className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {text && (
            <button type="button" aria-label="Clear search" onClick={() => setText("")} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {q ? (
        <>
          {data?.error && <p className="mt-8 px-1 text-muted-foreground">{data.error}</p>}
          {!isFetching && data && !data.error && results.length === 0 && (
            <p className="mt-8 px-1 text-muted-foreground">No artists found for “{q}”.</p>
          )}
          {results.length > 0 && (
            <div className={`${GRID} mt-8`}>
              {results.map((a) => (
                <ArtistTile key={a.id} artist={a} />
              ))}
            </div>
          )}
        </>
      ) : (
        <YourArtists />
      )}
    </div>
  );
}

function YourArtists() {
  const hydrated = usePlayer((s) => s.hydrated);
  const history = usePlayer((s) => s.history);
  const liked = usePlayer((s) => s.liked);
  const ranked = useMemo(() => rankArtists(history, liked, 18), [history, liked]);
  const names = ranked.map((a) => a.name);

  const { data: found, isLoading } = useQuery({
    queryKey: ["find-artists", names],
    queryFn: () => findArtists({ data: { names } }),
    enabled: names.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  if (!hydrated) return null;
  if (ranked.length === 0) {
    return (
      <section className="surface mt-8 flex flex-col items-center gap-4 rounded-[28px] p-8 text-center">
        <span className="glass-button h-14 w-14 rounded-2xl">
          <MicVocal className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold">Your artists show up here</h2>
          <p className="mt-1 text-muted-foreground">Play a few songs and the artists you listen to most appear on this page.</p>
        </div>
        <Link to="/search" className="btn-solid px-6 py-3">
          <SearchIcon className="h-4 w-4" /> Find a song
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="mb-5 px-1 text-2xl font-bold">Your artists</h2>
      <div className={GRID}>
        {ranked.map((a) => {
          const match = found?.[names.indexOf(a.name)];
          const plays = `${a.plays} ${a.plays === 1 ? "play" : "plays"}`;
          if (match) return <ArtistTile key={a.key} artist={{ ...match, id: a.artistId ?? match.id }} note={plays} />;
          if (isLoading) return <ArtistTileSkeleton key={a.key} name={a.name} />;
          return null;
        })}
      </div>
    </section>
  );
}
