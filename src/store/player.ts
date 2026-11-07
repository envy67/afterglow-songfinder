import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { HistoryEntry, Track } from "@/lib/music.types";
import { playerController } from "@/lib/player-controller";

type PlayerState = {
  queue: Track[];
  index: number;
  playing: boolean;
  buffering: boolean;
  history: HistoryEntry[];
  liked: Track[];
  recentSearches: string[];
  volume: number;
  autoplay: boolean;
  repeat: boolean;
  hydrated: boolean;
  nowPlayingOpen: boolean;

  playTrack: (track: Track, context?: Track[]) => void;
  playQueue: (tracks: Track[], start?: number) => void;
  jumpTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
  setPlaying: (p: boolean) => void;
  playNext: (t: Track) => void;
  addToQueue: (t: Track) => void;
  appendToQueue: (tracks: Track[]) => void;
  removeAt: (i: number) => void;
  clearUpNext: () => void;
  recordPlay: (t: Track) => void;
  clearHistory: () => void;
  toggleLike: (t: Track) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setVolume: (v: number) => void;
  setAutoplay: (v: boolean) => void;
  toggleRepeat: () => void;
  shuffleUpNext: () => void;
  setNowPlayingOpen: (v: boolean) => void;
};

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: 0,
      playing: false,
      buffering: false,
      history: [],
      liked: [],
      recentSearches: [],
      volume: 80,
      autoplay: true,
      repeat: false,
      hydrated: false,
      nowPlayingOpen: false,

      playTrack: (track, context) => {
        if (context?.length) {
          const i = context.findIndex((t) => t.videoId === track.videoId);
          set({ queue: context, index: Math.max(0, i), playing: true });
        } else {
          set({ queue: [track], index: 0, playing: true });
        }
      },
      playQueue: (tracks, start = 0) => {
        if (!tracks.length) return;
        set({ queue: tracks, index: start, playing: true });
      },
      jumpTo: (i) => {
        if (i >= 0 && i < get().queue.length) set({ index: i, playing: true });
      },
      next: () => {
        const { index, queue } = get();
        if (index < queue.length - 1) set({ index: index + 1, playing: true });
        else set({ playing: false });
      },
      prev: () => {
        const { index } = get();
        if (playerController.time() > 3 || index === 0) playerController.seek(0);
        else set({ index: index - 1, playing: true });
      },
      togglePlay: () => {
        if (get().queue.length) set({ playing: !get().playing });
      },
      setPlaying: (p) => set({ playing: p }),
      playNext: (t) => {
        const { queue, index } = get();
        if (!queue.length) {
          set({ queue: [t], index: 0, playing: true });
          return;
        }
        const q = queue.filter((x, i) => i <= index || x.videoId !== t.videoId);
        q.splice(index + 1, 0, t);
        set({ queue: q });
      },
      addToQueue: (t) => {
        const { queue } = get();
        if (!queue.length) {
          set({ queue: [t], index: 0, playing: true });
          return;
        }
        if (!queue.some((x) => x.videoId === t.videoId)) set({ queue: [...queue, t] });
      },
      appendToQueue: (tracks) => {
        const ids = new Set(get().queue.map((t) => t.videoId));
        const fresh = tracks.filter((t) => !ids.has(t.videoId));
        if (fresh.length) set({ queue: [...get().queue, ...fresh] });
      },
      removeAt: (i) => {
        const { queue, index } = get();
        if (i === index) return;
        set({ queue: queue.filter((_, j) => j !== i), index: i < index ? index - 1 : index });
      },
      clearUpNext: () => set({ queue: get().queue.slice(0, get().index + 1) }),
      recordPlay: (t) => {
        const history = get().history;
        if (history[0]?.track.videoId === t.videoId) return;
        set({ history: [{ track: t, playedAt: Date.now() }, ...history].slice(0, 300) });
      },
      clearHistory: () => set({ history: [] }),
      toggleLike: (t) => {
        const liked = get().liked;
        set({
          liked: liked.some((x) => x.videoId === t.videoId)
            ? liked.filter((x) => x.videoId !== t.videoId)
            : [t, ...liked],
        });
      },
      addRecentSearch: (q) => {
        const v = q.trim();
        if (!v) return;
        set({
          recentSearches: [
            v,
            ...get().recentSearches.filter((s) => s.toLowerCase() !== v.toLowerCase()),
          ].slice(0, 8),
        });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
      setVolume: (v) => set({ volume: v }),
      setAutoplay: (v) => set({ autoplay: v }),
      toggleRepeat: () => set({ repeat: !get().repeat }),
      shuffleUpNext: () => {
        const { queue, index } = get();
        const rest = queue.slice(index + 1);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j]!, rest[i]!];
        }
        set({ queue: [...queue.slice(0, index + 1), ...rest] });
      },
      setNowPlayingOpen: (v) => set({ nowPlayingOpen: v }),
    }),
    {
      name: "verre-player",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        queue: s.queue.slice(0, 200),
        index: s.index,
        history: s.history,
        liked: s.liked,
        recentSearches: s.recentSearches,
        volume: s.volume,
        autoplay: s.autoplay,
        repeat: s.repeat,
      }),
      onRehydrateStorage: () => () => {
        usePlayer.setState({ hydrated: true, playing: false });
      },
    },
  ),
);

export const useCurrentTrack = () => usePlayer((s) => s.queue[s.index] as Track | undefined);
export const useIsLiked = (id?: string) =>
  usePlayer((s) => !!id && s.liked.some((t) => t.videoId === id));
