import { cn } from "@/lib/utils";

export function Equalizer({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-3.5 items-end gap-[2px]", !playing && "eq-paused", className)} aria-hidden="true">
      <span className="eq-bar h-full w-[3px] rounded-full bg-live" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-live" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-live" />
    </span>
  );
}
