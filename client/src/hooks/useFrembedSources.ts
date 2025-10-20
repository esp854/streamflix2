import { useQuery } from "@tanstack/react-query";

// Interface pour les sources vidéo
interface VideoSource {
  id: string;
  url: string;
  quality: string;
  language: string;
  provider: string;
}

// Hook personnalisé pour récupérer les sources Frembed
export const useFrembedSources = (tmdbId: number, season?: number, episode?: number) => {
  const fetchFrembedSources = async (): Promise<VideoSource[]> => {
    try {
      // Pour les séries (avec saison et épisode)
      if (season !== undefined && episode !== undefined) {
        // Utiliser l'endpoint Frembed directement
        const response = await fetch(`https://frembed.fun/api/embed/${tmdbId}?s=${season}&e=${episode}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch Frembed sources: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Retourner les sources au format attendu
        return [{
          id: `frembed-${tmdbId}-${season}-${episode}`,
          url: data.link,
          quality: data.quality || "HD",
          language: data.language || "VF",
          provider: "Frembed"
        }];
      }
      // Pour les films
      else {
        // Utiliser l'endpoint Frembed directement
        const response = await fetch(`https://frembed.fun/api/embed/${tmdbId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch Frembed sources: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Retourner les sources au format attendu
        return [{
          id: `frembed-${tmdbId}`,
          url: data.link,
          quality: data.quality || "HD",
          language: data.language || "VF",
          provider: "Frembed"
        }];
      }
    } catch (error) {
      console.error("Error fetching Frembed sources:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["frembed-sources", tmdbId, season, episode],
    queryFn: fetchFrembedSources,
    enabled: !!tmdbId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};