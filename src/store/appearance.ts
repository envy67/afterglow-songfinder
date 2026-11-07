import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppearanceState = {
  background: string; // preset id or "custom"
  customImage: string | null;
  blur: number; // px
  dim: number; // 0..0.8
  setBackground: (id: string) => void;
  setCustomImage: (dataUrl: string) => void;
  setBlur: (v: number) => void;
  setDim: (v: number) => void;
};

export const useAppearance = create<AppearanceState>()(
  persist(
    (set) => ({
      background: "dunes",
      customImage: null,
      blur: 14,
      dim: 0.3,
      setBackground: (id) => set({ background: id }),
      setCustomImage: (dataUrl) => set({ customImage: dataUrl, background: "custom" }),
      setBlur: (v) => set({ blur: v }),
      setDim: (v) => set({ dim: v }),
    }),
    {
      name: "verre-appearance",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        background: s.background,
        customImage: s.customImage,
        blur: s.blur,
        dim: s.dim,
      }),
    },
  ),
);
