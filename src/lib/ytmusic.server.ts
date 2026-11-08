import type { ArtistPage, ArtistSummary, LyricLine, Lyrics, Track } from "./music.types";

// YouTube Music's own web API (the same source desktop players like Meiro use).
const BASE = "https://music.youtube.com/youtubei/v1/";
const CONTEXT = {
  client: { clientName: "WEB_REMIX", clientVersion: "1.20241106.01.00", hl: "en", gl: "US" },
};
const SONGS_FILTER = "EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D";
const ARTISTS_FILTER = "EgWKAQIgAWoKEAkQBRAKEAMQBA%3D%3D";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type J = any;
type Run = { text: string; navigationEndpoint?: J };

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

/** The first artist named in a line of text, with the id of their page. */
function firstArtist(runs: Run[] | undefined): { artistId?: string; artistName?: string } {
  const r = runs?.find(
    (x) =>
      x.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
        ?.browseEndpointContextMusicConfig?.pageType === "MUSIC_PAGE_TYPE_ARTIST",
  );
  return r ? { artistId: r.navigationEndpoint.browseEndpoint.browseId, artistName: r.text } : {};
}

function parseListItem(r: J): Track | null {
  const cols: J[] = (r?.flexColumns ?? []).map((c: J) => c?.musicResponsiveListItemFlexColumnRenderer?.text?.runs);
  const titleRun = cols[0]?.[0];
  const videoId =
    r?.playlistItemData?.videoId ?? titleRun?.navigationEndpoint?.watchEndpoint?.videoId;
  if (!videoId || !titleRun?.text) return null;
  const meta = groups(cols[1]);
  const fixed = r?.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;
  const duration = meta.find(isDuration) ?? (fixed && isDuration(fixed) ? fixed : undefined);
  const rest = meta.filter((m) => !isDuration(m));
  // Artist pages and playlists put the album in its own last column.
  const album = rest[1] ?? (cols.length > 2 ? cols[cols.length - 1]?.[0]?.text : undefined);
  return {
    videoId,
    title: titleRun.text,
    artists: rest[0] ?? "",
    album,
    duration,
    thumbnail: bigThumb(r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails),
    ...firstArtist(cols[1]),
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
      ...firstArtist(v?.longBylineText?.runs),
    });
  }
  return tracks;
}

export async function searchArtistsRaw(query: string): Promise<ArtistSummary[]> {
  const json = await innertube("search", { query, params: ARTISTS_FILTER });
  const sections: J[] =
    json?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content
      ?.sectionListRenderer?.contents ?? [];
  const out: ArtistSummary[] = [];
  for (const s of sections) {
    for (const item of s?.musicShelfRenderer?.contents ?? []) {
      const r = item?.musicResponsiveListItemRenderer;
      const id = r?.navigationEndpoint?.browseEndpoint?.browseId;
      const name = r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
      if (!id || !name) continue;
      const sub = groups(r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs).filter(
        (g) => g !== "Artist",
      );
      out.push({
        id,
        name,
        subtitle: sub[0],
        thumbnail: bigThumb(r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails),
      });
    }
  }
  return out;
}

function parseArtistTile(item: J): ArtistSummary | null {
  const r = item?.musicTwoRowItemRenderer;
  const id = r?.navigationEndpoint?.browseEndpoint?.browseId;
  const name = r?.title?.runs?.[0]?.text;
  if (!id || !name || !String(id).startsWith("UC")) return null;
  return {
    id,
    name,
    subtitle: r?.subtitle?.runs?.map((x: Run) => x.text).join(""),
    thumbnail: bigThumb(r?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails),
  };
}

export async function artistRaw(id: string): Promise<ArtistPage> {
  const json = await innertube("browse", { browseId: id });
  const h = json?.header?.musicImmersiveHeaderRenderer ?? json?.header?.musicVisualHeaderRenderer;
  const name = h?.title?.runs?.[0]?.text;
  if (!name) throw new Error("Artist not found");
  const thumbs: { url: string }[] = h?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ?? [];
  const sections: J[] =
    json?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
      ?.contents ?? [];

  const shelf = sections.find((s) => s?.musicShelfRenderer)?.musicShelfRenderer;
  let songs: Track[] = (shelf?.contents ?? []).map((i: J) => parseListItem(i?.musicResponsiveListItemRenderer)).filter(Boolean);
  // The artist page only lists 5 songs; the full "Top songs" list lives in a playlist.
  const allSongsId = shelf?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
  if (allSongsId) {
    try {
      const pl = await innertube("browse", { browseId: allSongsId });
      const items: J[] =
        pl?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents?.[0]
          ?.musicPlaylistShelfRenderer?.contents ?? [];
      const more = items.map((i) => parseListItem(i?.musicResponsiveListItemRenderer)).filter(Boolean) as Track[];
      if (more.length > songs.length) songs = more.slice(0, 50);
    } catch (e) {
      console.error(e);
    }
  }

  const related: ArtistSummary[] = [];
  for (const s of sections) {
    const c = s?.musicCarouselShelfRenderer;
    const title = c?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text ?? "";
    if (!/fans might also like/i.test(title)) continue;
    for (const item of c?.contents ?? []) {
      const a = parseArtistTile(item);
      if (a) related.push(a);
    }
  }

  return {
    id,
    name,
    image: thumbs[thumbs.length - 1]?.url ?? "",
    audience:
      h?.monthlyListenerCount?.runs?.[0]?.text ??
      (h?.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.[0]?.text
        ? `${h.subscriptionButton.subscribeButtonRenderer.subscriberCountText.runs[0].text} subscribers`
        : undefined),
    description: h?.description?.runs?.map((x: Run) => x.text).join("") || undefined,
    songs,
    related,
  };
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
