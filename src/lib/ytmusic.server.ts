import type { LyricLine, Lyrics, Track } from "./music.types";

// YouTube Music's own web API (the same source desktop players like Meiro use).
const BASE = "https://music.youtube.com/youtubei/v1/";
const CONTEXT = {
  client: { clientName: "WEB_REMIX", clientVersion: "1.20241106.01.00", hl: "en", gl: "US" },
};
const SONGS_FILTER = "EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type J = any;
type Run = { text: string };

async function innertube(endpoint: string, body: Record<string, unknown>): Promise<J> {
  const res = await fetch(`${BASE}${endpoint}?prettyPrint=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://music.youtube.com",
      Referer: "https://music.youtube.com/",
      "User-Agent": UA,
    },
    body: JSON.stringify({ ...body, context: CONTEXT }),
  });
  if (!res.ok) throw new Error(`YouTube Music ${endpoint} failed: ${res.status}`);
  return res.json();
}

function bigThumb(thumbs: { url: string }[] | undefined): string {
  const url = thumbs?.[thumbs.length - 1]?.url ?? "";
  return url.replace(/=w\d+-h\d+/, "=w544-h544");
}

function groups(runs: Run[] | undefined): string[] {
  const out: string[][] = [[]];
  for (const r of runs ?? []) {
    if (r.text.trim() === "•") out.push([]);
    else out[out.length - 1]?.push(r.text);
  }
  return out.map((g) => g.join("").trim()).filter(Boolean);
}

const isDuration = (s: string) => /^\d+(:\d{2}){1,2}$/.test(s);

function parseListItem(r: J): Track | null {
  const cols = r?.flexColumns ?? [];
  const titleRun = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0];
  const videoId =
    r?.playlistItemData?.videoId ?? titleRun?.navigationEndpoint?.watchEndpoint?.videoId;
  if (!videoId || !titleRun?.text) return null;
  const meta = groups(cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs);
  const duration = meta.find(isDuration);
  const rest = meta.filter((m) => !isDuration(m));
  return {
    videoId,
    title: titleRun.text,
    artists: rest[0] ?? "",
    album: rest[1],
    duration,
    thumbnail: bigThumb(r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails),
  };
}

export async function searchSongsRaw(query: string): Promise<Track[]> {
  const json = await innertube("search", { query, params: SONGS_FILTER });
  const sections: J[] =
    json?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content
      ?.sectionListRenderer?.contents ?? [];
  const tracks: Track[] = [];
  for (const s of sections) {
    for (const item of s?.musicShelfRenderer?.contents ?? []) {
      const t = parseListItem(item?.musicResponsiveListItemRenderer);
      if (t) tracks.push(t);
    }
  }
  return tracks;
}

export async function radioRaw(videoId: string): Promise<Track[]> {
  const json = await innertube("next", {
    videoId,
    playlistId: `RDAMVM${videoId}`,
    isAudioOnly: true,
  });
  const contents: J[] =
    json?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
      ?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer
      ?.content?.playlistPanelRenderer?.contents ?? [];
  const tracks: Track[] = [];
  for (const c of contents) {
    const v =
      c?.playlistPanelVideoRenderer ??
      c?.playlistPanelVideoWrapperRenderer?.primaryRenderer?.playlistPanelVideoRenderer;
    if (!v?.videoId) continue;
    const meta = groups(v?.longBylineText?.runs);
    tracks.push({
      videoId: v.videoId,
      title: v?.title?.runs?.[0]?.text ?? "Unknown",
      artists: meta[0] ?? "",
      album: meta[1] && !/^\d{4}$/.test(meta[1]) ? meta[1] : undefined,
      duration: v?.lengthText?.runs?.[0]?.text,
      thumbnail: bigThumb(v?.thumbnail?.thumbnails),
    });
  }
  return tracks;
}

function cleanTitle(t: string) {
  return t
    .replace(/\s*[([](feat|ft|from|with|prod)[^)\]]*[)\]]/gi, "")
    .replace(/\s*-\s*(remaster(ed)?|live).*$/i, "")
    .trim();
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split("\n")) {
    const m = raw.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (m) lines.push({ time: Number(m[1]) * 60 + Number(m[2]), text: (m[3] ?? "").trim() });
  }
  return lines;
}

export async function lyricsRaw(title: string, artist: string, duration: number): Promise<Lyrics> {
  const headers = { "User-Agent": "Verre music player (https://lovable.dev)" };
  const track = cleanTitle(title);
  const firstArtist = (artist.split(/,|&| x /i)[0] ?? "").trim();
  type L = { syncedLyrics?: string | null; plainLyrics?: string | null; duration?: number };
  let hit: L | null = null;
  const qs = new URLSearchParams({ track_name: track, artist_name: firstArtist });
  if (duration > 0) qs.set("duration", String(Math.round(duration)));
  const exact = await fetch(`https://lrclib.net/api/get?${qs}`, { headers });
  if (exact.ok) hit = await exact.json();
  if (!hit?.syncedLyrics && !hit?.plainLyrics) {
    const s = await fetch(
      `https://lrclib.net/api/search?${new URLSearchParams({ track_name: track, artist_name: firstArtist })}`,
      { headers },
    );
    if (s.ok) {
      const list: L[] = await s.json();
      hit = list.find((l) => l.syncedLyrics) ?? list[0] ?? null;
    }
  }
  return {
    synced: hit?.syncedLyrics ? parseLrc(hit.syncedLyrics) : null,
    plain: hit?.plainLyrics ?? null,
  };
}
