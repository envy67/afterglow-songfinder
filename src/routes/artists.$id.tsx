import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Play, Shuffle } from "lucide-react";
import { useState } from "react";
import { ArtistTile } from "@/components/music/ArtistTile";
import { TrackRow } from "@/components/music/TrackRow";
import { getArtist } from "@/lib/music.functions";
import { cn, shuffled } from "@/lib/utils";
import { usePlayer } from "@/store/player";

const artistQuery = (id: string) =>
  queryOptions({
    queryKey: ["artist", id],
    queryFn: () => getArtist({ data: { id } }),
    staleTime: 60 * 60 * 1000,
  });

export const Route = createFileRoute("/artists/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(artistQuery(params.id)),
  head: ({ loaderData }) => {
    const a = loaderData?.artist;
    const title = a ? `${a.name} · Verre` : "Artist · Verre";
    const description = a
      ? `Top songs by ${a.name} and artists fans also like.`
      : "Top songs and similar artists.";
    const image = a?.image?.startsWith("https://") ? a.image : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  pendingComponent: ArtistSkeleton,
  component: ArtistPageView,
});

function BackLink() {
  return (
    <Link to="/artists" search={{}} className="glass-button h-11 w-11" aria-label="Back to artists">
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );
}

function ArtistPageView() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(artistQuery(id));
  const [showAll, setShowAll] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const currentId = usePlayer((s) => s.queue[s.index]?.videoId);
  const { playQueue, playTrack } = usePlayer.getState();

  const artist = data.artist;
  if (!artist) {
    return (
      <div className="mx-auto max-w-6xl pt-4 md:pt-8">
        <BackLink />
        <p className="surface mt-6 rounded-[28px] p-8 text-center text-muted-foreground">{data.error ?? "Artist not found."}</p>
      </div>
    );
  }
  const songs = artist.songs;
  const shown = showAll ? songs : songs.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl pt-1 md:pt-2">
      <section className="relative overflow-hidden rounded-[32px] bg-muted shadow-[var(--shadow-art)]">
        {artist.image && (
          <img src={artist.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/40 to-transparent" />
        <div className="relative flex min-h-[320px] flex-col justify-between p-4 sm:min-h-[380px] sm:p-8">
          <BackLink />
          <div>
            {artist.audience && <p className="text-sm font-medium text-muted-foreground">{artist.audience}</p>}
            <h1 className="mt-1 text-5xl font-bold sm:text-7xl">{artist.name}</h1>
            {songs.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:flex">
                <button type="button" onClick={() => playQueue(songs)} className="btn-solid px-7 py-3">
                  <Play className="h-4 w-4 fill-current" /> Play
                </button>
                <button type="button" onClick={() => playQueue(shuffled(songs))} className="glass-button rounded-2xl px-7 py-3 font-semibold">
                  <Shuffle className="h-4 w-4" /> Shuffle
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {songs.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between px-1">
            <h2 className="text-2xl font-bold">Top songs</h2>
            {songs.length > 10 && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground">
                {showAll ? "Show less" : `Show all ${songs.length}`}
              </button>
            )}
          </div>
          <div className="surface grid gap-x-2 gap-y-0.5 rounded-[28px] p-2 lg:grid-cols-2">
            {shown.map((t, i) => (
              <TrackRow key={t.videoId} track={t} number={i + 1} active={t.videoId === currentId} onPlay={() => playTrack(t, songs)} />
            ))}
          </div>
        </section>
      )}

      {artist.related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 px-1 text-2xl font-bold">Fans also like</h2>
          <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 pb-3 pt-1">
            {artist.related.map((a) => (
              <div key={a.id} className="w-32 shrink-0 sm:w-40">
                <ArtistTile artist={a} />
              </div>
            ))}
          </div>
        </section>
      )}

      {artist.description && (
        <section className="mt-10">
          <h2 className="mb-3 px-1 text-2xl font-bold">About</h2>
          <button
            type="button"
            onClick={() => setAboutOpen((v) => !v)}
            className="surface block w-full rounded-[28px] p-6 text-left"
          >
            <p className={cn("whitespace-pre-line text-muted-foreground", !aboutOpen && "line-clamp-4")}>{artist.description}</p>
            <span className="mt-3 block text-sm font-semibold">{aboutOpen ? "Show less" : "Read more"}</span>
          </button>
        </section>
      )}
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="mx-auto max-w-6xl pt-1 md:pt-2">
      <div className="h-[320px] animate-pulse rounded-[32px] bg-muted sm:h-[380px]" />
      <div className="mt-10 h-7 w-40 animate-pulse rounded-full bg-muted" />
      <div className="surface mt-3 grid gap-2 rounded-[28px] p-2 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-[20px] bg-muted" />
        ))}
      </div>
    </div>
  );
}
