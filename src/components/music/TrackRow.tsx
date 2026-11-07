import { Heart, ListEnd, ListPlus, MoreHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Track } from "@/lib/music.types";
import { cn } from "@/lib/utils";
import { useIsLiked, usePlayer } from "@/store/player";
import { Equalizer } from "./Equalizer";

type Props = {
  track: Track;
  onPlay: () => void;
  active?: boolean | undefined;
  meta?: ReactNode;
  onRemove?: (() => void) | undefined;
  compact?: boolean | undefined;
  /** Shows a "01"-style number in front, like an album track list. */
  number?: number | undefined;
};

export function TrackRow({ track, onPlay, active, meta, onRemove, compact, number }: Props) {
  const liked = useIsLiked(track.videoId);
  const playing = usePlayer((s) => s.playing);
  const { toggleLike, playNext, addToQueue } = usePlayer.getState();
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-[20px] p-2 pr-2 transition-colors hover:bg-accent",
        active && "bg-accent",
      )}
    >
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {number !== undefined && (
          <span className="grid w-7 shrink-0 place-items-center text-sm font-medium tabular-nums text-muted-foreground">
            {active ? <Equalizer playing={playing} /> : String(number).padStart(2, "0")}
          </span>
        )}
        <span className="relative shrink-0">
          <img
            src={track.thumbnail}
            alt=""
            loading="lazy"
            className={cn("rounded-2xl object-cover", compact ? "h-11 w-11" : "h-12 w-12")}
          />
          {active && number === undefined && (
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-scrim/60">
              <Equalizer playing={playing} />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{track.title}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {track.artists}
            {track.duration ? ` · ${track.duration}` : ""}
          </span>
        </span>
      </button>
      {meta && <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{meta}</span>}
      {track.album && !compact && !/views?$/i.test(track.album) && (
        <span className="hidden max-w-[30%] shrink truncate text-sm text-muted-foreground lg:block">{track.album}</span>
      )}
      <button
        type="button"
        onClick={() => toggleLike(track)}
        aria-label={liked ? "Remove from liked songs" : "Add to liked songs"}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-accent",
          liked ? "text-live" : "hidden text-muted-foreground opacity-0 group-hover:opacity-100 sm:grid",
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from queue"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-accent group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More options"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-border bg-popover backdrop-blur-xl">
            <DropdownMenuItem onClick={() => playNext(track)}>
              <ListPlus className="mr-2 h-4 w-4" /> Play next
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addToQueue(track)}>
              <ListEnd className="mr-2 h-4 w-4" /> Add to queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleLike(track)}>
              <Heart className="mr-2 h-4 w-4" /> {liked ? "Unlike" : "Like"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
