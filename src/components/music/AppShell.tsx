import { Link } from "@tanstack/react-router";
import { Home, Library, Search, Settings } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { PRESET_BACKGROUNDS } from "@/lib/backgrounds";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/store/appearance";
import { usePlayer } from "@/store/player";
import { LiquidGlass } from "./LiquidGlass";
import { NowPlaying } from "./NowPlaying";
import { PlayerBar } from "./PlayerBar";
import { YouTubeEngine } from "./YouTubeEngine";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void usePlayer.persist.rehydrate();
    void useAppearance.persist.rehydrate();
  }, []);
  const hasTrack = usePlayer((s) => s.queue.length > 0);

  return (
    <>
      <Backdrop />
      <div className="relative z-10 flex h-dvh gap-4 p-3 md:p-4">
        <Sidebar />
        <main className={cn("thin-scrollbar min-w-0 flex-1 overflow-y-auto px-2 md:px-4", hasTrack ? "pb-40" : "pb-12")}>
          <MobileNav />
          {children}
        </main>
      </div>
      <PlayerBar />
      <NowPlaying />
      <YouTubeEngine />
    </>
  );
}

function Backdrop() {
  const background = useAppearance((s) => s.background);
  const customImage = useAppearance((s) => s.customImage);
  const blur = useAppearance((s) => s.blur);
  const dim = useAppearance((s) => s.dim);
  const src =
    background === "custom" && customImage
      ? customImage
      : (PRESET_BACKGROUNDS.find((b) => b.id === background) ?? PRESET_BACKGROUNDS[0]).src;
  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden bg-background">
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover transition-[filter] duration-500"
        style={{ filter: `blur(${blur}px)` }}
      />
      <div className="absolute inset-0 bg-scrim transition-opacity duration-500" style={{ opacity: dim }} />
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <span className="liquid-glass grid h-9 w-9 place-items-center rounded-full font-display text-lg font-bold">v</span>
      <span className="font-display text-2xl font-bold tracking-tight text-glow">verre</span>
    </Link>
  );
}

function Sidebar() {
  const recent = usePlayer((s) => s.history);
  const playTrack = usePlayer((s) => s.playTrack);
  const seen = new Set<string>();
  const last = recent.filter((h) => (seen.has(h.track.videoId) ? false : (seen.add(h.track.videoId), true))).slice(0, 5);
  return (
    <LiquidGlass as="aside" radius={36} className="hidden w-64 shrink-0 flex-col p-4 md:flex">
      <div className="py-2">
        <Logo />
      </div>
      <nav className="mt-6 space-y-1" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="nav-link" activeOptions={{ exact: to === "/" }}>
            <Icon className="h-[18px] w-[18px]" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>
      {last.length > 0 && (
        <div className="mt-8 min-h-0 flex-1 overflow-hidden">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Played last</p>
          <div className="mt-3 space-y-1">
            {last.map(({ track }) => (
              <button
                key={track.videoId}
                type="button"
                onClick={() => playTrack(track)}
                className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left transition hover:bg-accent"
              >
                <img src={track.thumbnail} alt="" className="h-9 w-9 rounded-xl object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{track.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{track.artists}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-auto px-3 pt-4 text-xs text-muted-foreground">Your listening history stays on this device.</p>
    </LiquidGlass>
  );
}

function MobileNav() {
  return (
    <div className="sticky top-0 z-30 mb-2 flex items-center justify-between gap-2 pt-1 md:hidden">
      <Logo />
      <LiquidGlass as="nav" radius={999} className="flex gap-1 p-1" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} aria-label={label} className="nav-link p-2.5" activeOptions={{ exact: to === "/" }}>
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        ))}
      </LiquidGlass>
    </div>
  );
}
