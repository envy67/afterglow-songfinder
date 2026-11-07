import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCurrentTrack, usePlayer } from "@/store/player";
import { LikeButton, TransportControls, VolumeControl } from "./Controls";
import { LiquidGlass } from "./LiquidGlass";
import { LyricsView } from "./LyricsView";
import { ProgressBar } from "./ProgressBar";
import { TrackRow } from "./TrackRow";

export function NowPlaying() {
  const open = usePlayer((s) => s.nowPlayingOpen);
  const setOpen = usePlayer((s) => s.setNowPlayingOpen);
  const track = useCurrentTrack();
  const [tab, setTab] = useState<"queue" | "lyrics">("queue");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open || !track) return null;

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-300 overflow-y-auto bg-scrim/35 backdrop-blur-2xl" role="dialog" aria-label="Now playing">
      <img src={track.thumbnail} alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl" />
      <div className="relative mx-auto grid min-h-full max-w-7xl gap-6 p-4 sm:p-8 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-center">
        <div className="flex flex-col items-center gap-6 pt-14 lg:pt-0">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close now playing" className="glass-button absolute left-4 top-4 h-11 w-11 sm:left-8 sm:top-8">
            <ChevronDown className="h-5 w-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Now playing</p>
          <LiquidGlass radius={48} className="aspect-square w-full max-w-[min(440px,70vw)] p-3">
            <img key={track.videoId} src={track.thumbnail} alt={`${track.title} cover`} className="h-full w-full animate-in zoom-in-95 fade-in duration-500 rounded-[38px] object-cover shadow-2xl" />
          </LiquidGlass>
          <div className="w-full max-w-md text-center">
            <h1 className="truncate text-3xl font-bold text-glow sm:text-4xl">{track.title}</h1>
            <p className="mt-1 truncate text-lg text-muted-foreground">
              {track.artists}
              {track.album ? ` · ${track.album}` : ""}
            </p>
          </div>
          <ProgressBar className="w-full max-w-md" />
          <div className="flex w-full max-w-md items-center justify-between">
            <LikeButton />
            <TransportControls size="lg" />
            <span className="h-10 w-10" />
          </div>
          <VolumeControl className="justify-center" />
        </div>

        <LiquidGlass radius={40} className="flex h-[min(78vh,720px)] flex-col overflow-hidden">
          <div className="flex gap-1 p-3">
            {(["queue", "lyrics"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                data-active={tab === t}
                className={cn("glass-button flex-1 py-2.5 text-sm font-semibold", tab !== t && "shadow-none")}
              >
                {t === "queue" ? "Up next" : "Lyrics"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">{tab === "queue" ? <UpNext /> : <LyricsView track={track} />}</div>
        </LiquidGlass>
      </div>
    </div>
  );
}

function UpNext() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const autoplay = usePlayer((s) => s.autoplay);
  const { jumpTo, removeAt, clearUpNext, setAutoplay } = usePlayer.getState();
  const upcoming = queue.length - index - 1;
  return (
    <div className="thin-scrollbar h-full overflow-y-auto px-3 pb-4">
      <label className="mx-1 mb-3 flex items-center justify-between gap-4 rounded-[22px] bg-muted p-4">
        <span>
          <span className="block font-semibold">Auto-play</span>
          <span className="block text-sm text-muted-foreground">Add similar music when this queue ends.</span>
        </span>
        <Switch checked={autoplay} onCheckedChange={setAutoplay} />
      </label>
      <div className="mb-2 flex items-center justify-between px-2 text-sm text-muted-foreground">
        <span>{upcoming} up next</span>
        {upcoming > 0 && (
          <button type="button" onClick={clearUpNext} className="hover:text-foreground">
            Clear queue
          </button>
        )}
      </div>
      <div className="space-y-1">
        {queue.slice(index).map((t, i) => (
          <TrackRow
            key={t.videoId}
            track={t}
            compact
            active={i === 0}
            onPlay={() => jumpTo(index + i)}
            onRemove={i === 0 ? undefined : () => removeAt(index + i)}
          />
        ))}
      </div>
    </div>
  );
}
