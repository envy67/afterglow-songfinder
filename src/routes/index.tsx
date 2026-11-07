import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Play, Search, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { LiquidGlass } from "@/components/music/LiquidGlass";
import { Shelf } from "@/components/music/Shelf";
import { getRadio, searchSongs } from "@/lib/music.functions";
import type { Track } from "@/lib/music.types";
import { buildRecommendations, pickSeeds, recentDistinct, recentlyPlayedIds } from "@/lib/recommend";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · Verre" },
      { name: "description", content: "Songs picked for you from what you played last, in a liquid-glass music player." },
      { property: "og:title", content: "Home · Verre" },
      { property: "og:description", content: "Songs picked for you from what you played last." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DISCOVER = [
  { title: "Start with the hits", query: "today's biggest hits" },
  { title: "Something calm", query: "chill lofi beats" },
  { title: "Throwbacks", query: "2000s pop hits" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Home() {
  const hydrated = usePlayer((s) => s.hydrated);
  const history = usePlayer((s) => s.history);
  const playQueue = usePlayer((s) => s.playQueue);
  const seeds = useMemo(() => pickSeeds(history, 4), [history]);
  const hasHistory = hydrated && history.length > 0;

  const radios = useQueries({
    queries: seeds.map((seed) => ({
      queryKey: ["radio", seed.videoId],
      queryFn: () => getRadio({ data: { videoId: seed.videoId } }),
      staleTime: 30 * 60 * 1000,
    })),
  });
  const discover = useQueries({
    queries: DISCOVER.map((d) => ({
      queryKey: ["search", d.query],
      queryFn: () => searchSongs({ data: { query: d.query } }),
      staleTime: 60 * 60 * 1000,
      enabled: hydrated && history.length === 0,
    })),
  });

  const radioData = radios.map((r) => r.data?.tracks ?? []);
  const radioKey = radioData.map((r) => r.length).join(",");
  const seedRadios = useMemo(
    () => seeds.map((seed, i) => ({ seed, tracks: radioData[i] ?? [] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seeds, radioKey],
  );
  const forYou = useMemo(() => buildRecommendations(seedRadios, history, 20), [seedRadios, history]);
  const recent = useMemo(() => recentDistinct(history, 14), [history]);
  const exclude = useMemo(() => recentlyPlayedIds(history), [history]);
  const radiosLoading = radios.some((r) => r.isLoading);

  return (
    <div className="mx-auto max-w-6xl pt-4 md:pt-8">
      <header className="px-1">
        <p className="text-sm font-medium text-muted-foreground">{hydrated ? greeting() : "\u00a0"}</p>
        <h1 className="mt-1 text-4xl font-bold text-glow sm:text-5xl">
          {hasHistory ? "Made from what you played last" : "Music, through glass"}
        </h1>
      </header>

      {!hydrated ? null : hasHistory ? (
        <>
          <MixCard tracks={forYou} seeds={seeds} loading={radiosLoading} onPlay={() => playQueue(forYou)} />
          <Shelf title="Picked for you" subtitle="A blend of songs like your recent plays" tracks={forYou} loading={radiosLoading} />
          <Shelf title="Played last" tracks={recent} />
          {seedRadios.slice(0, 3).map(({ seed, tracks }, i) => (
            <Shelf
              key={seed.videoId}
              title={`Because you played ${seed.title}`}
              subtitle={seed.artists}
              tracks={tracks.filter((t) => !exclude.has(t.videoId)).slice(0, 14)}
              loading={radios[i]?.isLoading}
            />
          ))}
        </>
      ) : (
        <>
          <LiquidGlass radius={44} className="mt-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="glass-button h-14 w-14 shrink-0">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">Your picks start with your first song</h2>
              <p className="mt-1 text-muted-foreground">
                Play anything you like. This page then fills with songs similar to what you played last.
              </p>
            </div>
            <Link to="/search" className="play-button gap-2 px-6 py-3 font-semibold">
              <Search className="h-4 w-4" /> Find a song
            </Link>
          </LiquidGlass>
          {DISCOVER.map((d, i) => (
            <Shelf key={d.query} title={d.title} tracks={discover[i].data?.tracks.slice(0, 14) ?? []} loading={discover[i].isLoading} />
          ))}
        </>
      )}
    </div>
  );
}

function MixCard({ tracks, seeds, loading, onPlay }: { tracks: Track[]; seeds: Track[]; loading: boolean; onPlay: () => void }) {
  const covers = tracks.slice(0, 4);
  const names = Array.from(new Set(seeds.map((s) => s.artists.split(",")[0]).filter(Boolean))).slice(0, 3);
  return (
    <LiquidGlass radius={48} className="mt-8 flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="grid aspect-square w-full max-w-[220px] shrink-0 grid-cols-2 gap-1.5 overflow-hidden rounded-[34px]">
        {loading && covers.length === 0
          ? Array.from({ length: 4 }, (_, i) => <div key={i} className="animate-pulse bg-muted" />)
          : covers.map((t) => <img key={t.videoId} src={t.thumbnail} alt="" className="h-full w-full object-cover" />)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Your mix</p>
        <h2 className="mt-2 text-3xl font-bold text-glow sm:text-4xl">Picked from your last plays</h2>
        <p className="mt-2 text-muted-foreground">
          {tracks.length ? `${tracks.length} songs` : "Gathering songs"}
          {names.length ? ` inspired by ${names.join(", ")}` : ""}
        </p>
        <button type="button" onClick={onPlay} disabled={!tracks.length} className="play-button mt-5 gap-2 px-6 py-3 font-semibold disabled:opacity-50">
          <Play className="h-4 w-4 fill-current" /> Play mix
        </button>
      </div>
    </LiquidGlass>
  );
}
