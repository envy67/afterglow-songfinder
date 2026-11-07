import { create } from "zustand";

type Ctl = { seek: (s: number) => void; time: () => number };
let ctl: Ctl | null = null;

export const playerController = {
  register(c: Ctl | null) {
    ctl = c;
  },
  seek(s: number) {
    ctl?.seek(s);
    useProgress.setState({ current: s });
  },
  time() {
    return ctl?.time() ?? 0;
  },
};

export const useProgress = create<{ current: number; duration: number }>(() => ({
  current: 0,
  duration: 0,
}));
