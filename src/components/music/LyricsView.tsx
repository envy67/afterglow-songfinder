import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { getLyrics } from "@/lib/music.functions";
import { durationToSeconds, type Track } from "@/lib/music.types";
import { playerController, useProgress } from "@/lib/player-controller";
import { cn } from "@/lib/utils";

export function LyricsView({ track }: { track: Track }) {
  const { data, isLoading } = useQuery({
    queryKey: ["lyrics", track.videoId],
    queryFn: () =>
      getLyrics({
        data: { title: track.title, artist: track.artists, duration: durationToSeconds(track.duration) },
      }),
    staleTime: Infinity,
  });
  const current = useProgress((s) => s.current);
  const lines = data?.synced;
  const active = useMemo(() => {
    if (!lines) return -1;
    let i = -1;
    lines.forEach((l, j) => {
      if (l.time <= current + 0.3) i = j;
    });
    return i;
  }, [lines, current]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-line="${active}"]`);
    const box = containerRef.current;
    if (el && box) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [active]);

  if (isLoading)
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-5 animate-pulse rounded-full bg-muted" style={{ width: `${50 + ((i * 37) % 45)}%` }} />
        ))}
      </div>
    );

  if (lines?.length)
    return (
      <div ref={containerRef} className="thin-scrollbar relative h-full overflow-y-auto overscroll-contain px-6 py-4">
        {lines.map((l, i) => (
          <button
            type="button"
            key={i}
            data-line={i}
            onClick={() => playerController.seek(l.time)}
            className={cn(
              "block w-full py-2 text-center font-display text-balance text-2xl font-semibold leading-snug transition-all duration-300",
              i === active ? "text-foreground text-glow" : "text-muted-foreground/60 hover:text-muted-foreground",
            )}
          >
            {l.text || "♪"}
          </button>
        ))}
      </div>
    );

  if (data?.plain)
    return (
      <div className="thin-scrollbar h-full overflow-y-auto overscroll-contain whitespace-pre-line p-6 text-center text-lg leading-relaxed text-muted-foreground">
        {data.plain}
      </div>
    );

  return (
    <div className="grid h-full place-items-center p-6 text-center text-muted-foreground">
      No lyrics found for this song.
    </div>
  );
}
