import { ChevronUp, SkipForward } from "lucide-react";
import { useCurrentTrack, usePlayer } from "@/store/player";
import { LikeButton, PlayPauseButton, TransportControls, VolumeControl } from "./Controls";
import { LiquidGlass } from "./LiquidGlass";
import { ProgressBar } from "./ProgressBar";

export function PlayerBar() {
  const track = useCurrentTrack();
  const open = usePlayer((s) => s.nowPlayingOpen);
  const setOpen = usePlayer((s) => s.setNowPlayingOpen);
  const next = usePlayer((s) => s.next);
  if (!track || open) return null;
  return (
    <LiquidGlass
      radius={36}
      className="fixed bottom-3 left-3 right-3 z-40 animate-in fade-in slide-in-from-bottom-4 px-3 py-2.5 md:bottom-4 md:left-[18rem] md:right-4"
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:gap-6">
        <button type="button" onClick={() => setOpen(true)} className="flex min-w-0 items-center gap-3 text-left" aria-label="Open now playing">
          <img src={track.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-[20px] object-cover shadow-lg" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-glow">{track.title}</span>
            <span className="block truncate text-sm text-muted-foreground">{track.artists}</span>
          </span>
        </button>

        <div className="hidden flex-col items-center gap-1 md:flex">
          <TransportControls />
          <ProgressBar className="w-full max-w-xl" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <PlayPauseButton />
            <button type="button" onClick={next} aria-label="Next song" className="glass-button h-10 w-10">
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
          </div>
          <LikeButton className="hidden md:inline-flex" />
          <VolumeControl className="hidden lg:flex" />
          <button type="button" onClick={() => setOpen(true)} aria-label="Open now playing" className="glass-button hidden h-10 w-10 md:inline-flex">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </LiquidGlass>
  );
}
