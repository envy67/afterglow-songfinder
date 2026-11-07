import { Play } from "lucide-react";
import type { ReactNode } from "react";
import type { Track } from "@/lib/music.types";
import { usePlayer } from "@/store/player";
import { TrackTile, TrackTileSkeleton } from "./TrackTile";

export function Shelf({
  title,
  subtitle,
  tracks,
  loading,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  tracks: Track[];
  loading?: boolean;
}) {
  const playQueue = usePlayer((s) => s.playQueue);
  if (!loading && tracks.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-glow">{title}</h2>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {tracks.length > 0 && (
          <button type="button" onClick={() => playQueue(tracks)} className="glass-button shrink-0 px-4 py-2 text-sm font-medium">
            <Play className="h-3.5 w-3.5 fill-current" /> Play all
          </button>
        )}
      </div>
      <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 pb-3 pt-1">
        {loading && tracks.length === 0
          ? Array.from({ length: 6 }, (_, i) => <TrackTileSkeleton key={i} />)
          : tracks.map((t) => <TrackTile key={t.videoId} track={t} context={tracks} />)}
      </div>
    </section>
  );
}
