import { Heart, Loader2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useCurrentTrack, useIsLiked, usePlayer } from "@/store/player";

export function PlayPauseButton({ size = "md" }: { size?: "md" | "lg" }) {
  const playing = usePlayer((s) => s.playing);
  const buffering = usePlayer((s) => s.buffering);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const icon = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={playing ? "Pause" : "Play"}
      className={cn("play-button", size === "lg" ? "h-18 w-18" : "h-11 w-11")}
    >
      {buffering && playing ? (
        <Loader2 className={cn(icon, "animate-spin")} />
      ) : playing ? (
        <Pause className={cn(icon, "fill-current")} />
      ) : (
        <Play className={cn(icon, "translate-x-[1px] fill-current")} />
      )}
    </button>
  );
}

export function TransportControls({ size = "md" }: { size?: "md" | "lg" }) {
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const btn = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const icon = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className={cn("flex items-center", size === "lg" ? "gap-6" : "gap-3")}>
      <button type="button" onClick={prev} aria-label="Previous song" className={cn("glass-button", btn)}>
        <SkipBack className={cn(icon, "fill-current")} />
      </button>
      <PlayPauseButton size={size} />
      <button type="button" onClick={next} aria-label="Next song" className={cn("glass-button", btn)}>
        <SkipForward className={cn(icon, "fill-current")} />
      </button>
    </div>
  );
}

export function LikeButton({ className }: { className?: string }) {
  const track = useCurrentTrack();
  const liked = useIsLiked(track?.videoId);
  const toggleLike = usePlayer((s) => s.toggleLike);
  if (!track) return null;
  return (
    <button
      type="button"
      onClick={() => toggleLike(track)}
      aria-label={liked ? "Remove from liked songs" : "Add to liked songs"}
      className={cn("glass-button h-10 w-10", liked && "text-live", className)}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
    </button>
  );
}

export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayer((s) => s.volume);
  const setVolume = usePlayer((s) => s.setVolume);
  const Icon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={volume === 0 ? "Unmute" : "Mute"}
        onClick={() => setVolume(volume === 0 ? 70 : 0)}
        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
      </button>
      <Slider aria-label="Volume" value={[volume]} max={100} step={1} onValueChange={([v]) => setVolume(v ?? 0)} className="w-24" />
    </div>
  );
}
