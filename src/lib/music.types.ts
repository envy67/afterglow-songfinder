export type Track = {
  videoId: string;
  title: string;
  artists: string;
  album?: string;
  duration?: string;
  thumbnail: string;
};

export type HistoryEntry = { track: Track; playedAt: number };

export type LyricLine = { time: number; text: string };

export type Lyrics = { synced: LyricLine[] | null; plain: string | null };

export function durationToSeconds(d?: string): number {
  if (!d) return 0;
  return d
    .split(":")
    .map((n) => Number(n) || 0)
    .reduce((acc, n) => acc * 60 + n, 0);
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
