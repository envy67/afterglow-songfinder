import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Lyrics, Track } from "./music.types";
import { lyricsRaw, radioRaw, searchSongsRaw } from "./ytmusic.server";

const videoIdSchema = z.string().regex(/^[\w-]{11}$/);

export const searchSongs = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<{ tracks: Track[]; error: string | null }> => {
    try {
      return { tracks: await searchSongsRaw(data.query), error: null };
    } catch (e) {
      console.error(e);
      return { tracks: [], error: "Search is unavailable right now." };
    }
  });

export const getRadio = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ videoId: videoIdSchema }).parse(d))
  .handler(async ({ data }): Promise<{ tracks: Track[]; error: string | null }> => {
    try {
      return { tracks: await radioRaw(data.videoId), error: null };
    } catch (e) {
      console.error(e);
      return { tracks: [], error: "Couldn't load similar songs." };
    }
  });

export const getLyrics = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(300),
        artist: z.string().max(300),
        duration: z.number().min(0).max(36000),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<Lyrics> => {
    try {
      return await lyricsRaw(data.title, data.artist, data.duration);
    } catch (e) {
      console.error(e);
      return { synced: null, plain: null };
    }
  });
