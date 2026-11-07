import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getRadio } from "@/lib/music.functions";
import { durationToSeconds } from "@/lib/music.types";
import { playerController, useProgress } from "@/lib/player-controller";
import { usePlayer } from "@/store/player";

type YTPlayer = {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (v: number) => void;
  destroy: () => void;
};
type YTNamespace = {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
const ENDED = 0;

let apiPromise: Promise<void> | null = null;
function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return apiPromise;
}

/** Plays the audio of the current song through YouTube's player, kept out of sight. */
export function YouTubeEngine() {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loadedId = useRef<string | null>(null);
  const recordedId = useRef<string | null>(null);
  const radioFetched = useRef(new Set<string>());
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const hydrated = usePlayer((s) => s.hydrated);
  const radio = useServerFn(getRadio);

  // Create the player once.
  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      const el = document.createElement("div");
      hostRef.current.appendChild(el);
      playerRef.current = new window.YT.Player(el, {
        width: 200,
        height: 200,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3 },
        events: {
          onReady: () => {
            playerController.register({
              seek: (s) => playerRef.current?.seekTo(s, true),
              time: () => playerRef.current?.getCurrentTime?.() ?? 0,
            });
            playerRef.current?.setVolume(usePlayer.getState().volume);
            setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            const st = usePlayer.getState();
            if (e.data === PLAYING) {
              usePlayer.setState({ playing: true, buffering: false });
              const t = st.queue[st.index];
              if (t && recordedId.current !== t.videoId) {
                recordedId.current = t.videoId;
                st.recordPlay(t);
              }
            } else if (e.data === PAUSED) usePlayer.setState({ playing: false, buffering: false });
            else if (e.data === BUFFERING) usePlayer.setState({ buffering: true });
            else if (e.data === ENDED) st.next();
          },
          onError: () => {
            toast("This song can't be played here, skipping to the next one.");
            usePlayer.setState({ buffering: false });
            usePlayer.getState().next();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerController.register(null);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  // Keep the player in step with the queue, play/pause and volume.
  useEffect(() => {
    if (!ready || !hydrated) return;
    const apply = (s: ReturnType<typeof usePlayer.getState>) => {
      const p = playerRef.current;
      if (!p) return;
      const t = s.queue[s.index];
      if (!t) {
        if (loadedId.current) p.stopVideo();
        loadedId.current = null;
        return;
      }
      if (loadedId.current !== t.videoId) {
        loadedId.current = t.videoId;
        recordedId.current = null;
        useProgress.setState({ current: 0, duration: durationToSeconds(t.duration) });
        if (stallTimer.current) clearTimeout(stallTimer.current);
        if (s.playing) {
          p.loadVideoById(t.videoId);
          // If nothing starts after a while, let the listener know instead of failing silently.
          stallTimer.current = setTimeout(() => {
            const st = usePlayer.getState();
            if (st.playing && st.queue[st.index]?.videoId === t.videoId && p.getPlayerState() !== PLAYING)
              toast("This song is taking a while to start. Try another one or check your connection.");
          }, 15000);
        } else p.cueVideoById(t.videoId);
        return;
      }
      const state = p.getPlayerState();
      if (s.playing && state !== PLAYING && state !== BUFFERING) p.playVideo();
      if (!s.playing && (state === PLAYING || state === BUFFERING)) p.pauseVideo();
    };
    apply(usePlayer.getState());
    return usePlayer.subscribe((s, prev) => {
      if (
        s.queue[s.index]?.videoId !== prev.queue[prev.index]?.videoId ||
        s.playing !== prev.playing
      )
        apply(s);
      if (s.volume !== prev.volume) playerRef.current?.setVolume(s.volume);
    });
  }, [ready, hydrated]);

  // Time and length of the current song.
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const c = p.getCurrentTime() || 0;
      const d = p.getDuration() || 0;
      const cur = useProgress.getState();
      if (Math.abs(cur.current - c) > 0.2 || (d > 0 && Math.abs(d - cur.duration) > 0.5))
        useProgress.setState({ current: c, duration: d > 0 ? d : cur.duration });
    }, 250);
    return () => clearInterval(timer);
  }, [ready]);

  // Auto-play: add similar songs when the queue is about to run out.
  useEffect(() => {
    if (!hydrated) return;
    const check = async (s: ReturnType<typeof usePlayer.getState>) => {
      const t = s.queue[s.index];
      if (!s.autoplay || !t || s.queue.length - s.index - 1 >= 3) return;
      if (radioFetched.current.has(t.videoId)) return;
      radioFetched.current.add(t.videoId);
      const res = await radio({ data: { videoId: t.videoId } });
      const before = usePlayer.getState();
      const wasAtEnd = !before.playing && before.index === before.queue.length - 1;
      before.appendToQueue(res.tracks);
      if (wasAtEnd && loadedId.current === t.videoId && useProgress.getState().current > 1) {
        // The queue ran out while we were fetching; keep the music going.
        const now = usePlayer.getState();
        if (now.queue.length > now.index + 1 && playerRef.current?.getPlayerState() === ENDED)
          now.next();
      }
    };
    void check(usePlayer.getState());
    return usePlayer.subscribe((s, prev) => {
      if (s.index !== prev.index || s.queue !== prev.queue || s.autoplay !== prev.autoplay)
        void check(s);
    });
  }, [hydrated, radio]);

  // Space bar toggles play/pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.code !== "Space" || el?.closest("input, textarea, button, [role=slider], [contenteditable]"))
        return;
      e.preventDefault();
      usePlayer.getState().togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="yt-host" />;
}
