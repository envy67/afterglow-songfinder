import { ChevronUp } from "lucide-react";
import { useProgress } from "@/lib/player-controller";
import { useCurrentTrack, usePlayer } from "@/store/player";
import { LikeButton, PlayPauseButton, RepeatButton, ShuffleButton, TransportControls, VolumeControl } from "./Controls";
import { ProgressBar } from "./ProgressBar";

export function PlayerBar() {
  const track = useCurrentTrack();
  const open = usePlayer((s) => s.nowPlayingOpen);
  const setOpen = usePlayer((s) => s.setNowPlayingOpen);
  if (!track || open) return null;
  return (
    <div className="surface pointer-events-auto relative animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-[26px] p-2 pr-3 md:rounded-[28px] md:px-4 md:py-3">
      <MiniProgress />
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:gap-6">
        <button type="button" onClick={() => setOpen(true)} className="flex min-w-0 items-center gap-3 text-left" aria-label="Open now playing">
          <img src={track.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover md:h-14 md:w-14" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{track.title}</span>
            <span className="block truncate text-sm text-muted-foreground">{track.artists}</span>
          </span>
        </button>

        <div className="hidden flex-col items-center gap-1.5 md:flex">
          <div className="flex items-center gap-2">
            <ShuffleButton className="h-9 w-9" />
            <TransportControls />
            <RepeatButton className="h-9 w-9" />
          </div>
          <ProgressBar className="w-full max-w-xl" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <LikeButton plain />
          <div className="md:hidden">
            <PlayPauseButton size="sm" />
          </div>
          <VolumeControl className="hidden lg:flex" />
          <button type="button" onClick={() => setOpen(true)} aria-label="Open now playing" className="glass-button hidden h-10 w-10 md:inline-flex">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Thin line along the bottom of the phone mini player. */
function MiniProgress() {
  const current = useProgress((s) => s.current);
  const duration = useProgress((s) => s.duration);
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  return (
    <span aria-hidden="true" className="absolute inset-x-5 bottom-0 h-[2px] overflow-hidden rounded-full bg-muted md:hidden">
      <span className="block h-full bg-foreground" style={{ width: `${pct}%` }} />
    </span>
  );
}
