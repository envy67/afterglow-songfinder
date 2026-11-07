import { createFileRoute } from "@tanstack/react-router";
import { Check, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { LiquidGlass } from "@/components/music/LiquidGlass";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { compressImage, PRESET_BACKGROUNDS } from "@/lib/backgrounds";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/store/appearance";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Verre" },
      { name: "description", content: "Pick your background image, its blur and how the player behaves." },
      { property: "og:title", content: "Settings · Verre" },
      { property: "og:description", content: "Pick your background image, its blur and how the player behaves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { background, customImage, blur, dim, setBackground, setCustomImage, setBlur, setDim } = useAppearance();
  const autoplay = usePlayer((s) => s.autoplay);
  const { setAutoplay, clearHistory, clearRecentSearches } = usePlayer.getState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Please choose an image file.");
    setBusy(true);
    try {
      setCustomImage(await compressImage(file));
      toast("Background updated.");
    } catch {
      toast("That image couldn't be used. Try another one.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const tiles = [
    ...PRESET_BACKGROUNDS.map((b) => ({ id: b.id as string, label: b.label as string, src: b.src as string })),
    ...(customImage ? [{ id: "custom", label: "Your photo", src: customImage }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl pt-4 md:pt-8">
      <h1 className="px-1 text-4xl font-bold text-glow sm:text-5xl">Settings</h1>

      <LiquidGlass radius={40} className="mt-6 p-6">
        <h2 className="text-xl font-semibold">Background</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a picture to sit behind the glass, or use your own.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBackground(t.id)}
              className={cn(
                "group relative aspect-video overflow-hidden rounded-[22px] ring-2 ring-transparent transition",
                background === t.id && "ring-primary",
              )}
            >
              <img src={t.src} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-full bg-scrim/50 px-3 py-1 text-xs font-medium backdrop-blur-md">
                {t.label}
                {background === t.id && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="glass-button aspect-video flex-col rounded-[22px] text-sm font-medium"
          >
            <ImagePlus className="h-5 w-5" />
            {busy ? "Preparing…" : customImage ? "Change photo" : "Upload photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="flex justify-between text-sm font-medium">
              Blur <span className="text-muted-foreground">{blur}px</span>
            </span>
            <Slider aria-label="Background blur" value={[blur]} max={40} step={1} onValueChange={([v]) => setBlur(v)} className="mt-2" />
          </label>
          <label className="block">
            <span className="flex justify-between text-sm font-medium">
              Darken <span className="text-muted-foreground">{Math.round(dim * 100)}%</span>
            </span>
            <Slider aria-label="Background darkness" value={[dim * 100]} max={80} step={1} onValueChange={([v]) => setDim(v / 100)} className="mt-2" />
          </label>
        </div>
      </LiquidGlass>

      <LiquidGlass radius={40} className="mt-6 space-y-5 p-6">
        <h2 className="text-xl font-semibold">Playback</h2>
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block font-medium">Auto-play</span>
            <span className="block text-sm text-muted-foreground">Add similar music when your queue ends.</span>
          </span>
          <Switch checked={autoplay} onCheckedChange={setAutoplay} />
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              clearHistory();
              toast("Listening history cleared.");
            }}
            className="glass-button px-4 py-2 text-sm"
          >
            Clear listening history
          </button>
          <button
            type="button"
            onClick={() => {
              clearRecentSearches();
              toast("Recent searches cleared.");
            }}
            className="glass-button px-4 py-2 text-sm"
          >
            Clear recent searches
          </button>
        </div>
      </LiquidGlass>
    </div>
  );
}
