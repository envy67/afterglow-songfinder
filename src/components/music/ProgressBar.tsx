import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/music.types";
import { playerController, useProgress } from "@/lib/player-controller";
import { cn } from "@/lib/utils";

export function ProgressBar({ className }: { className?: string }) {
  const current = useProgress((s) => s.current);
  const duration = useProgress((s) => s.duration);
  const [drag, setDrag] = useState<number | null>(null);
  const value = Math.min(drag ?? current, duration || 0);
  return (
    <div className={cn("flex items-center gap-3 text-xs tabular-nums text-muted-foreground", className)}>
      <span className="w-9 text-right">{formatTime(value)}</span>
      <Slider
        aria-label="Song position"
        value={[value]}
        max={Math.max(1, duration)}
        step={1}
        onValueChange={([v]) => setDrag(v)}
        onValueCommit={([v]) => {
          playerController.seek(v);
          setDrag(null);
        }}
        className="flex-1"
      />
      <span className="w-9">{formatTime(duration)}</span>
    </div>
  );
}
