import { ChevronDown, ListMusic, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useOpenArtist } from "@/hooks/use-open-artist";
import { cn } from "@/lib/utils";
import { useCurrentTrack, usePlayer } from "@/store/player";
import { LikeButton, TransportControls, VolumeControl } from "./Controls";
import { LyricsView } from "./LyricsView";
import { TrackRow } from "./TrackRow";
import { Waveform } from "./Waveform";

export function NowPlaying() {
  const open = usePlayer((s) => s.nowPlayingOpen);
  const setOpen = usePlayer((s) => s.setNowPlayingOpen);
  const track = useCurrentTrack();
  const openArtist = useOpenArtist();
  const [tab, setTab] = useState<"queue" | "lyrics">("queue");
  // On phones the list replaces the artwork; on computers both show side by side.
  const [panelOnPhone, setPanelOnPhone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open || !track) return null;

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-300 overflow-hidden overscroll-none bg-background" role="dialog" aria-label="Now playing">
      <img src={track.thumbnail} alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full scale-125 object-cover opacity-20 blur-3xl" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col p-4 sm:p-6 lg:p-8">
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close now playing" className="glass-button h-11 w-11">
            <ChevronDown className="h-5 w-5" />
          </button>
          <p className="text-center font-semibold">Now Playing</p>
          <button
            type="button"
            onClick={() => setPanelOnPhone((v) => !v)}
            aria-label={panelOnPhone ? "Show artwork" : "Show up next and lyrics"}
            data-active={panelOnPhone}
            className="glass-button h-11 w-11 lg:invisible"
          >
            {panelOnPhone ? <X className="h-5 w-5" /> : <ListMusic className="h-5 w-5" />}
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-1 gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14">
          <div className={cn("mx-auto min-h-0 w-full max-w-[440px] flex-col items-center justify-center", panelOnPhone ? "hidden lg:flex" : "flex")}>
            {/* The cover shrinks to whatever room is left, so the screen never needs scrolling. */}
            <div className="grid min-h-0 w-full max-h-[440px] flex-1 place-items-center" style={{ containerType: "size" }}>
            <img
              key={track.videoId}
              src={track.thumbnail}
              alt={`${track.title} cover`}
              style={{ width: "min(100cqw, 100cqh)" }}
              className="aspect-square animate-in zoom-in-95 fade-in rounded-[28px] object-cover duration-500 shadow-[var(--shadow-art)]"
            />
            </div>
            <div className="mt-5 grid w-full shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
              <LikeButton plain />
              <div className="min-w-0 text-center">
                <h1 className="truncate text-3xl font-bold sm:text-4xl">{track.title}</h1>
                <p className="mt-1 truncate text-lg text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => void openArtist(track)}
                    className="underline-offset-4 transition hover:text-foreground hover:underline"
                  >
                    {track.artists}
                  </button>
                  {track.album ? ` · ${track.album}` : ""}
                </p>
              </div>
              <span />
            </div>
            <Waveform seed={track.videoId} className="mt-3 w-full shrink-0" />
            <div className="mt-3 w-full shrink-0">
              <TransportControls size="lg" extras />
            </div>
            <VolumeControl className="mt-5 hidden shrink-0 justify-center sm:flex [@media(max-height:640px)]:hidden" />
          </div>

          <section
            aria-label="Up next and lyrics"
            className={cn("surface min-h-0 max-h-[720px] flex-col self-stretch overflow-hidden rounded-[32px] lg:self-center lg:h-full", panelOnPhone ? "flex" : "hidden lg:flex")}
          >
            <div className="glass m-3 flex gap-1 rounded-full p-1">
              {(["queue", "lyrics"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-full py-2 text-sm font-semibold transition",
                    tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "queue" ? "Up next" : "Lyrics"}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">{tab === "queue" ? <UpNext /> : <LyricsView track={track} />}</div>
          </section>
        </div>
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
    <div className="thin-scrollbar h-full overflow-y-auto overscroll-contain px-3 pb-4">
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
      <div className="space-y-0.5">
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
