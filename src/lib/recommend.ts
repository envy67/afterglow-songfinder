import type { HistoryEntry, Track } from "./music.types";

/** Most recently played distinct songs, newest first. History is stored newest first. */
export function pickSeeds(history: HistoryEntry[], max = 4): Track[] {
  const seen = new Set<string>();
  const seeds: Track[] = [];
  for (const h of history) {
    if (seen.has(h.track.videoId)) continue;
    seen.add(h.track.videoId);
    seeds.push(h.track);
    if (seeds.length >= max) break;
  }
  return seeds;
}

/** Songs played recently enough that recommending them again would feel repetitive. */
export function recentlyPlayedIds(history: HistoryEntry[], window = 30): Set<string> {
  return new Set(history.slice(0, window).map((h) => h.track.videoId));
}

/**
 * Mix the "similar songs" lists of each recent play, taking one song from each in turn,
 * so the newest plays lead and no single song dominates. Songs played recently are skipped.
 */
export function buildRecommendations(
  seedRadios: { seed: Track; tracks: Track[] }[],
  history: HistoryEntry[],
  limit = 20,
): Track[] {
  const exclude = recentlyPlayedIds(history);
  for (const s of seedRadios) exclude.add(s.seed.videoId);
  const lists = seedRadios.map((s) => s.tracks.filter((t) => !exclude.has(t.videoId)));
  const out: Track[] = [];
  const used = new Set<string>();
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of lists) {
      const t = list[i];
      if (!t || used.has(t.videoId)) continue;
      used.add(t.videoId);
      out.push(t);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Distinct recently played songs, newest first. */
export function recentDistinct(history: HistoryEntry[], max = 12): Track[] {
  return pickSeeds(history, max);
}
