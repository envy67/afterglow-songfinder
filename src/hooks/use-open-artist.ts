import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { primaryArtistName } from "@/lib/artists";
import { findArtists } from "@/lib/music.functions";
import type { Track } from "@/lib/music.types";
import { usePlayer } from "@/store/player";

/** Opens the page of a song's main artist, looking the artist up by name when needed. */
export function useOpenArtist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async (track: Track) => {
    let id = track.artistId;
    if (!id) {
      const name = primaryArtistName(track);
      const found = await queryClient.fetchQuery({
        queryKey: ["find-artists", [name]],
        queryFn: () => findArtists({ data: { names: [name] } }),
        staleTime: 24 * 60 * 60 * 1000,
      });
      id = found[0]?.id;
    }
    if (!id) {
      toast.error("Couldn't find this artist.");
      return;
    }
    usePlayer.getState().setNowPlayingOpen(false);
    void navigate({ to: "/artists/$id", params: { id } });
  };
}
