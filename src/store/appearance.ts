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
      blur: 28,
      dim: 0.62,
      setBackground: (id) => set({ background: id }),
      setCustomImage: (dataUrl) => set({ customImage: dataUrl, background: "custom" }),
      setBlur: (v) => set({ blur: v }),
      setDim: (v) => set({ dim: v }),
    }),
    {
      name: "verre-appearance",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      // v1 switched to the dark theme: darker, blurrier background by default.
      migrate: (persisted, version) => {
        const p = persisted as Partial<AppearanceState>;
        return version < 1 ? { ...p, blur: Math.max(p.blur ?? 28, 28), dim: Math.max(p.dim ?? 0.62, 0.62) } : p;
      },
      partialize: (s) => ({
        background: s.background,
        customImage: s.customImage,
        blur: s.blur,
        dim: s.dim,
      }),
    },
  ),
);
