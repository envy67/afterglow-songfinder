import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Play, Search, Shuffle, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Shelf } from "@/components/music/Shelf";
import { TrackRow } from "@/components/music/TrackRow";
import { getRadio, searchSongs } from "@/lib/music.functions";
import type { Track } from "@/lib/music.types";
import { buildRecommendations, pickSeeds, recentDistinct, recentlyPlayedIds } from "@/lib/recommend";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · Verre" },
      { name: "description", content: "Songs picked for you from what you played last, in a dark music player." },
      { property: "og:title", content: "Home · Verre" },
      { property: "og:description", content: "Songs picked for you from what you played last." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

// Before any history exists, each shelf is the "similar songs" list of one well-known song.
const DISCOVER = [
  { title: "Start with the hits", query: "Blinding Lights The Weeknd" },
  { title: "Something calm", query: "Sunset Lover Petit Biscuit" },
  { title: "Throwbacks", query: "Mr. Brightside The Killers" },
];

async function discoverShelf(query: string): Promise<Track[]> {
  const found = await searchSongs({ data: { query } });
  const first = found.tracks[0];
  if (!first) return [];
  const similar = await getRadio({ data: { videoId: first.videoId } });
  return similar.tracks.length ? similar.tracks : found.tracks;
}

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
      queryKey: ["discover", d.query],
      queryFn: () => discoverShelf(d.query),
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

  const currentId = usePlayer((s) => s.queue[s.index]?.videoId);
  const playTrack = usePlayer((s) => s.playTrack);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="px-1 text-sm font-medium text-muted-foreground">{hydrated ? greeting() : "\u00a0"}</p>

      {!hydrated ? null : hasHistory ? (
        <>
          <MixHeader
            tracks={forYou}
            seeds={seeds}
            loading={radiosLoading}
            onPlay={() => playQueue(forYou)}
            onShuffle={() => playQueue(shuffled(forYou))}
          />
          {(radiosLoading || forYou.length > 0) && (
            <section className="mt-10">
              <h2 className="mb-3 px-1 text-2xl font-bold">Picked for you</h2>
              <div className="surface grid gap-x-2 gap-y-0.5 rounded-[28px] p-2 lg:grid-cols-2">
                {radiosLoading && forYou.length === 0
                  ? Array.from({ length: 6 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-[20px] bg-muted" />)
                  : forYou.slice(0, 10).map((t, i) => (
                      <TrackRow key={t.videoId} track={t} number={i + 1} active={t.videoId === currentId} onPlay={() => playTrack(t, forYou)} />
                    ))}
              </div>
            </section>
          )}
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
          <section className="surface mt-4 flex flex-col gap-5 rounded-[28px] p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="glass-button h-14 w-14 shrink-0 rounded-2xl">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold sm:text-4xl">Your picks start with your first song</h1>
              <p className="mt-1 text-muted-foreground">
                Play anything you like. This page then fills with songs similar to what you played last.
              </p>
            </div>
            <Link to="/search" className="btn-solid px-6 py-3">
              <Search className="h-4 w-4" /> Find a song
            </Link>
          </section>
          {DISCOVER.map((d, i) => (
            <Shelf key={d.query} title={d.title} tracks={discover[i]?.data?.slice(0, 14) ?? []} loading={discover[i]?.isLoading} />
          ))}
        </>
      )}
    </div>
  );
}

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Album-style header for the mix: cover, title, then Play and Shuffle. */
function MixHeader({
  tracks,
  seeds,
  loading,
  onPlay,
  onShuffle,
}: {
  tracks: Track[];
  seeds: Track[];
  loading: boolean;
  onPlay: () => void;
  onShuffle: () => void;
}) {
  const covers = tracks.slice(0, 4);
  const names = Array.from(new Set(seeds.map((s) => s.artists.split(",")[0]).filter(Boolean))).slice(0, 3);
  return (
    <section className="mt-4">
      <div className="flex items-center gap-5 sm:items-end sm:gap-8">
        <div className="grid aspect-square w-32 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-[24px] shadow-[var(--shadow-art)] sm:w-56 sm:rounded-[32px]">
          {loading && covers.length === 0
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="animate-pulse bg-muted" />)
            : covers.map((t) => <img key={t.videoId} src={t.thumbnail} alt="" className="h-full w-full object-cover" />)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            Mix · {tracks.length ? `${tracks.length} songs` : "gathering songs"}
          </p>
          <h1 className="mt-1 text-4xl font-bold sm:text-6xl">Your mix</h1>
          {names.length > 0 && (
            <p className="mt-1 truncate text-muted-foreground underline decoration-dotted underline-offset-4">
              Inspired by {names.join(", ")}
            </p>
          )}
          <div className="mt-5 hidden gap-3 sm:flex">
            <MixButtons disabled={!tracks.length} onPlay={onPlay} onShuffle={onShuffle} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
        <MixButtons disabled={!tracks.length} onPlay={onPlay} onShuffle={onShuffle} />
      </div>
    </section>
  );
}

function MixButtons({ disabled, onPlay, onShuffle }: { disabled: boolean; onPlay: () => void; onShuffle: () => void }) {
  return (
    <>
      <button type="button" onClick={onPlay} disabled={disabled} className="btn-solid px-7 py-3 disabled:opacity-50">
        <Play className="h-4 w-4 fill-current" /> Play
      </button>
      <button type="button" onClick={onShuffle} disabled={disabled} className="glass-button rounded-2xl px-7 py-3 font-semibold disabled:opacity-50">
        <Shuffle className="h-4 w-4" /> Shuffle
      </button>
    </>
  );
}
