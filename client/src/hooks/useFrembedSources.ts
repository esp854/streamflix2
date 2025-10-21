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
      // Validation des paramètres
      if (!tmdbId) {
        throw new Error("TMDB ID is required");
      }

      let url = `https://frembed.fun/api/embed/${tmdbId}`;
      
      // Pour les séries (avec saison et épisode)
      if (season !== undefined && episode !== undefined) {
        url += `?s=${season}&e=${episode}`;
      }

      // Utiliser l'endpoint Frembed directement
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Streamflix/1.0',
          'Accept': 'application/json',
        },
        // Ajout d'un timeout
        signal: AbortSignal.timeout(10000) // 10 secondes
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Frembed sources: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validation de la réponse
      if (!data || !data.link) {
        throw new Error("Invalid response from Frembed API");
      }
      
      // Retourner les sources au format attendu
      return [{
        id: season !== undefined && episode !== undefined 
          ? `frembed-${tmdbId}-${season}-${episode}` 
          : `frembed-${tmdbId}`,
        url: data.link,
        quality: data.quality || "HD",
        language: data.language || "VF",
        provider: "Frembed"
      }];
    } catch (error) {
      console.error("Error fetching Frembed sources:", error);
      // Retourner un tableau vide pour permettre le fallback
      return [];
    }
  };

  return useQuery({
    queryKey: ["frembed-sources", tmdbId, season, episode],
    queryFn: fetchFrembedSources,
    enabled: !!tmdbId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Réessayer 2 fois en cas d'erreur
    retryDelay: 1000, // Attendre 1 seconde entre les tentatives
  });
};