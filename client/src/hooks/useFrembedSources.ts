import { useQuery } from "@tanstack/react-query";

interface FrembedSource {
  url: string;
  quality: string;
  type: string;
}

export const useFrembedMovieSources = (tmdbId: number | null) => {
  return useQuery({
    queryKey: ["frembed-movie-sources", tmdbId],
    queryFn: async (): Promise<FrembedSource[] | null> => {
      if (!tmdbId) {
        return null;
      }

      const response = await fetch(`/api/frembed/movie/${tmdbId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch Frembed movie sources");
      }
      
      const data = await response.json();
      return data.sources;
    },
    enabled: !!tmdbId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFrembedEpisodeSources = (
  tmdbId: number | null,
  seasonNumber: number | null,
  episodeNumber: number | null
) => {
  return useQuery({
    queryKey: ["frembed-episode-sources", tmdbId, seasonNumber, episodeNumber],
    queryFn: async (): Promise<FrembedSource[] | null> => {
      if (!tmdbId || !seasonNumber || !episodeNumber) {
        return null;
      }

      const response = await fetch(
        `/api/frembed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch Frembed episode sources");
      }
      
      const data = await response.json();
      return data.sources;
    },
    enabled: !!(tmdbId && seasonNumber && episodeNumber),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};