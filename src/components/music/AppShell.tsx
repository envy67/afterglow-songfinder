import { Link } from "@tanstack/react-router";
import { Home, Library, Search, Settings } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { PRESET_BACKGROUNDS } from "@/lib/backgrounds";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/store/appearance";
import { usePlayer } from "@/store/player";
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
      <div className="relative z-10 flex h-dvh md:gap-4 md:p-4">
        <NavRail />
        <main
          className={cn(
            "thin-scrollbar min-w-0 flex-1 overflow-y-auto px-4 pt-5 md:px-6 md:pt-6",
            hasTrack ? "pb-48 md:pb-32" : "pb-28 md:pb-10",
          )}
        >
          {children}
        </main>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 space-y-2 px-3 pb-3 md:left-[7.5rem] md:right-4 md:px-0 md:pb-4">
        <PlayerBar />
        <TabBar />
      </div>
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

/** Computer: a slim dark glass bar down the left side. */
function NavRail() {
  return (
    <nav aria-label="Main" className="glass hidden w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-[30px] p-2.5 md:flex">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={cn("tab-link w-full py-3", to === "/settings" && "mt-auto")}
          activeOptions={{ exact: to === "/" }}
        >
          <Icon className="h-[22px] w-[22px]" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Phone: dark glass tab bar along the bottom, under the mini player. */
function TabBar() {
  return (
    <nav aria-label="Main" className="glass pointer-events-auto grid grid-cols-4 gap-1 rounded-[28px] p-1.5 md:hidden">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} className="tab-link" activeOptions={{ exact: to === "/" }}>
          <Icon className="h-[22px] w-[22px]" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
