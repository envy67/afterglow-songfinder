import { Play } from "lucide-react";
import type { Track } from "@/lib/music.types";
import { usePlayer } from "@/store/player";
import { Equalizer } from "./Equalizer";

export function TrackTile({ track, context }: { track: Track; context?: Track[] }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const isCurrent = usePlayer((s) => s.queue[s.index]?.videoId === track.videoId);
  const playing = usePlayer((s) => s.playing);
  return (
    <button
      type="button"
      onClick={() => playTrack(track, context)}
      className="group w-40 shrink-0 text-left sm:w-44"
    >
      <div className="liquid-glass relative aspect-square overflow-hidden rounded-[28px] p-1.5">
        <img
          src={track.thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full rounded-[22px] object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="play-button absolute bottom-3 right-3 h-10 w-10 translate-y-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-4 w-4 fill-current" />
        </span>
        {isCurrent && (
          <span className="glass-button absolute left-3 top-3 h-8 w-8">
            <Equalizer playing={playing} />
          </span>
        )}
      </div>
      <p className="mt-2.5 truncate font-medium text-glow">{track.title}</p>
      <p className="truncate text-sm text-muted-foreground">{track.artists}</p>
    </button>
  );
}

export function TrackTileSkeleton() {
  return (
    <div className="w-40 shrink-0 sm:w-44">
      <div className="liquid-glass aspect-square animate-pulse rounded-[28px]" />
      <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded-full bg-muted" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
