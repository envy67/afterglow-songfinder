import type { HistoryEntry, Track } from "./music.types";

/** Name of the main artist on a song, e.g. "Daft Punk" from "Daft Punk & The Weeknd". */
export function primaryArtistName(track: Track): string {
  if (track.artistName) return track.artistName;
  return (track.artists.split(/\s*(?:,|&|\bx\b|\bfeat\.?|\bft\.?)\s+/i)[0] ?? track.artists).trim();
}

export type YourArtist = {
  key: string;
  name: string;
  artistId?: string | undefined;
  plays: number;
  likes: number;
  lastPlayed: number;
  /** A cover from one of their songs, shown until the real picture loads. */
  cover: string;
};

const keyOf = (name: string) => name.trim().toLowerCase();

/**
 * The artists the user listens to most. Each play counts 1 and each liked song counts 2;
 * ties go to whoever was played most recently.
 */
export function rankArtists(history: HistoryEntry[], liked: Track[], limit = 18): YourArtist[] {
  const map = new Map<string, YourArtist>();
  const touch = (track: Track) => {
    const name = primaryArtistName(track);
    if (!name) return null;
    const key = keyOf(name);
    let a = map.get(key);
    if (!a) {
      a = { key, name, plays: 0, likes: 0, lastPlayed: 0, cover: track.thumbnail };
      map.set(key, a);
    }
    if (!a.artistId && track.artistId) a.artistId = track.artistId;
    return a;
  };
  for (const h of history) {
    const a = touch(h.track);
    if (!a) continue;
    a.plays += 1;
    a.lastPlayed = Math.max(a.lastPlayed, h.playedAt);
  }
  for (const t of liked) {
    const a = touch(t);
    if (a) a.likes += 1;
  }
  return [...map.values()]
    .sort((x, y) => y.plays + 2 * y.likes - (x.plays + 2 * x.likes) || y.lastPlayed - x.lastPlayed)
    .slice(0, limit);
}
