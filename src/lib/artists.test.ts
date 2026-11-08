import { describe, expect, it } from "vitest";
import { primaryArtistName, rankArtists } from "./artists";
import type { HistoryEntry, Track } from "./music.types";

const t = (id: string, artists: string, extra: Partial<Track> = {}): Track => ({
  videoId: id.padEnd(11, "x"),
  title: id,
  artists,
  thumbnail: "",
  ...extra,
});
const h = (track: Track, at: number): HistoryEntry => ({ track, playedAt: at });

describe("your artists", () => {
  it("rank artists by how often their songs were played", () => {
    const history = [h(t("a", "Drake"), 5), h(t("b", "SZA"), 4), h(t("c", "SZA"), 3)];
    expect(rankArtists(history, []).map((a) => a.name)).toEqual(["SZA", "Drake"]);
  });

  it("count a liked song as two plays", () => {
    const history = [h(t("a", "Drake"), 5), h(t("b", "Drake"), 4), h(t("c", "SZA"), 3)];
    expect(rankArtists(history, [t("d", "SZA")]).map((a) => a.name)).toEqual(["SZA", "Drake"]);
  });

  it("put the most recently played artist first on a tie", () => {
    const history = [h(t("a", "Drake"), 9), h(t("b", "SZA"), 1)];
    expect(rankArtists(history, []).map((a) => a.name)).toEqual(["Drake", "SZA"]);
  });

  it("group songs with featured artists under the main artist", () => {
    const history = [h(t("a", "Daft Punk & The Weeknd"), 2), h(t("b", "Daft Punk"), 1)];
    const ranked = rankArtists(history, []);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.plays).toBe(2);
  });

  it("prefer the artist name YouTube Music credits", () => {
    expect(primaryArtistName(t("a", "Tyler, The Creator", { artistName: "Tyler, The Creator" }))).toBe(
      "Tyler, The Creator",
    );
  });
});
