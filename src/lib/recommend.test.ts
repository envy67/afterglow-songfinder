import { describe, expect, it } from "vitest";
import type { HistoryEntry, Track } from "./music.types";
import { buildRecommendations, pickSeeds } from "./recommend";

const t = (id: string): Track => ({ videoId: id.padEnd(11, "x"), title: id, artists: "A", thumbnail: "" });
const h = (id: string, at: number): HistoryEntry => ({ track: t(id), playedAt: at });

describe("home recommendations", () => {
  it("are seeded by the most recently played distinct songs, newest first", () => {
    const history = [h("b", 4), h("a", 3), h("b", 2), h("c", 1)];
    expect(pickSeeds(history, 4).map((s) => s.title)).toEqual(["b", "a", "c"]);
  });

  it("never suggest a song the user just played", () => {
    const history = [h("a", 2), h("played", 1)];
    const recs = buildRecommendations([{ seed: t("a"), tracks: [t("a"), t("played"), t("new")] }], history);
    expect(recs.map((r) => r.title)).toEqual(["new"]);
  });

  it("mix songs from every recent play in turn", () => {
    const history = [h("a", 2), h("b", 1)];
    const recs = buildRecommendations(
      [
        { seed: t("a"), tracks: [t("a1"), t("a2")] },
        { seed: t("b"), tracks: [t("b1"), t("b2")] },
      ],
      history,
    );
    expect(recs.map((r) => r.title)).toEqual(["a1", "b1", "a2", "b2"]);
  });
});
