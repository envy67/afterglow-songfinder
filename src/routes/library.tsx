import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Heart, History, Play } from "lucide-react";
import { useState } from "react";
import { LiquidGlass } from "@/components/music/LiquidGlass";
import { TrackRow } from "@/components/music/TrackRow";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library · Verre" },
      { name: "description", content: "Your liked songs and listening history." },
      { property: "og:title", content: "Library · Verre" },
      { property: "og:description", content: "Your liked songs and listening history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [tab, setTab] = useState<"liked" | "history">("liked");
  const hydrated = usePlayer((s) => s.hydrated);
  const liked = usePlayer((s) => s.liked);
  const history = usePlayer((s) => s.history);
  const currentId = usePlayer((s) => s.queue[s.index]?.videoId);
  const { playTrack, playQueue, clearHistory } = usePlayer.getState();
  const historyTracks = history.map((h) => h.track);

  return (
    <div className="mx-auto max-w-4xl pt-4 md:pt-8">
      <h1 className="px-1 text-4xl font-bold text-glow sm:text-5xl">Library</h1>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" data-active={tab === "liked"} onClick={() => setTab("liked")} className="glass-button px-5 py-2.5 text-sm font-semibold">
          <Heart className="h-4 w-4" /> Liked songs {hydrated && <span className="opacity-60">{liked.length}</span>}
        </button>
        <button type="button" data-active={tab === "history"} onClick={() => setTab("history")} className="glass-button px-5 py-2.5 text-sm font-semibold">
          <History className="h-4 w-4" /> History
        </button>
        <span className="flex-1" />
        {tab === "liked" && liked.length > 0 && (
          <button type="button" onClick={() => playQueue(liked)} className="play-button gap-2 px-5 py-2.5 text-sm font-semibold">
            <Play className="h-4 w-4 fill-current" /> Play all
          </button>
        )}
        {tab === "history" && history.length > 0 && (
          <button type="button" onClick={clearHistory} className="glass-button px-5 py-2.5 text-sm">
            Clear history
          </button>
        )}
      </div>

      {hydrated && (
        <LiquidGlass radius={36} refract={false} className={cn("mt-6 p-2", "space-y-1")}>
          {tab === "liked" &&
            (liked.length ? (
              liked.map((t) => (
                <TrackRow key={t.videoId} track={t} active={t.videoId === currentId} onPlay={() => playTrack(t, liked)} />
              ))
            ) : (
              <Empty text="Tap the heart on any song to keep it here." />
            ))}
          {tab === "history" &&
            (history.length ? (
              history.map((h, i) => (
                <TrackRow
                  key={`${h.track.videoId}-${h.playedAt}`}
                  track={h.track}
                  active={i === 0 && h.track.videoId === currentId}
                  meta={formatDistanceToNow(h.playedAt, { addSuffix: true })}
                  onPlay={() => playTrack(h.track, historyTracks.slice(i).filter((t, j, a) => a.findIndex((x) => x.videoId === t.videoId) === j))}
                />
              ))
            ) : (
              <Empty text="Songs you play show up here, and shape your picks on Home." />
            ))}
        </LiquidGlass>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="p-8 text-center text-muted-foreground">{text}</p>;
}
