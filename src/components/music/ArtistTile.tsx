import { Link } from "@tanstack/react-router";
import type { ArtistSummary } from "@/lib/music.types";

export function ArtistTile({ artist, note }: { artist: ArtistSummary; note?: string | undefined }) {
  return (
    <Link to="/artists/$id" params={{ id: artist.id }} className="group block w-full min-w-0 text-center">
      <div className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-muted shadow-[var(--shadow-surface)]">
        {artist.thumbnail && (
          <img
            src={artist.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        )}
      </div>
      <p className="mt-3 truncate font-semibold">{artist.name}</p>
      {(note ?? artist.subtitle) && <p className="truncate text-sm text-muted-foreground">{note ?? artist.subtitle}</p>}
    </Link>
  );
}

export function ArtistTileSkeleton({ name }: { name?: string }) {
  return (
    <div className="w-full min-w-0 text-center">
      <div className="aspect-square w-full animate-pulse rounded-full bg-muted" />
      {name ? (
        <p className="mt-3 truncate font-semibold text-muted-foreground">{name}</p>
      ) : (
        <div className="mx-auto mt-3 h-3.5 w-2/3 animate-pulse rounded-full bg-muted" />
      )}
    </div>
  );
}
