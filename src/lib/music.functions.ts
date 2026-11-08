import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ArtistPage, ArtistSummary, Lyrics, Track } from "./music.types";
import { artistRaw, lyricsRaw, radioRaw, searchArtistsRaw, searchSongsRaw } from "./ytmusic.server";

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

const artistIdSchema = z.string().regex(/^[\w-]{10,64}$/);

export const searchArtists = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<{ artists: ArtistSummary[]; error: string | null }> => {
    try {
      return { artists: await searchArtistsRaw(data.query), error: null };
    } catch (e) {
      console.error(e);
      return { artists: [], error: "Search is unavailable right now." };
    }
  });

/** Looks up several artists by name at once; each slot is the best match or null. */
export const findArtists = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ names: z.array(z.string().trim().min(1).max(200)).min(1).max(24) }).parse(d),
  )
  .handler(async ({ data }): Promise<(ArtistSummary | null)[]> => {
    return Promise.all(
      data.names.map(async (name) => {
        try {
          const found = await searchArtistsRaw(name);
          return found.find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? found[0] ?? null;
        } catch (e) {
          console.error(e);
          return null;
        }
      }),
    );
  });

export const getArtist = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: artistIdSchema }).parse(d))
  .handler(async ({ data }): Promise<{ artist: ArtistPage | null; error: string | null }> => {
    try {
      return { artist: await artistRaw(data.id), error: null };
    } catch (e) {
      console.error(e);
      return { artist: null, error: "Couldn't load this artist." };
    }
  });
