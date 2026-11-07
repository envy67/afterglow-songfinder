import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatTime } from "@/lib/music.types";
import { playerController, useProgress } from "@/lib/player-controller";
import { cn } from "@/lib/utils";

/** Bar heights (0..1) that look like a waveform; the same song always gets the same shape. */
function bars(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const r = (h >>> 8) / 0xffffff;
    const shape = 0.45 + 0.55 * Math.sin((i / count) * Math.PI);
    return 0.14 + r * 0.86 * shape;
  });
}

/** Song position shown as a waveform you can tap or drag to jump around. */
export function Waveform({ seed, count = 64, className }: { seed: string; count?: number; className?: string }) {
  const current = useProgress((s) => s.current);
  const duration = useProgress((s) => s.duration);
  const heights = useMemo(() => bars(seed, count), [seed, count]);
  const [drag, setDrag] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const ratio = drag ?? (duration ? Math.min(1, current / duration) : 0);

  const at = (x: number) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? Math.min(1, Math.max(0, (x - r.left) / r.width)) : 0;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(at(e.clientX));
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag !== null) setDrag(at(e.clientX));
  };
  const onUp = () => {
    if (drag !== null && duration) playerController.seek(drag * duration);
    setDrag(null);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") playerController.seek(Math.min(duration, current + 5));
    else if (e.key === "ArrowLeft") playerController.seek(Math.max(0, current - 5));
    else return;
    e.preventDefault();
  };

  return (
    <div className={className}>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Song position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(ratio * duration)}
        aria-valuetext={formatTime(ratio * duration)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={onKey}
        className="flex h-14 cursor-pointer touch-none items-center gap-[2px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {heights.map((h, i) => (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors duration-150",
              (i + 0.5) / count <= ratio ? "bg-foreground" : "bg-muted-foreground/30",
            )}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
        <span className="text-foreground">{formatTime(ratio * duration)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
