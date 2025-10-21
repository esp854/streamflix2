import { useQuery } from "@tanstack/react-query";

// Interface pour les sources vidéo
interface VideoSource {
  id: string;
  url: string;
  quality: string;
  language: string;
  provider: string;
}

// Hook personnalisé pour récupérer les sources Frembed uniquement pour les contenus qui n'en ont pas
export const useFrembedSources = (
  tmdbId: number, 
  season?: number, 
  episode?: number,
  hasExistingSources?: boolean // Nouveau paramètre pour vérifier si des sources existent déjà
) => {
  const fetchFrembedSources = async (): Promise<VideoSource[]> => {
    try {
      // Validation des paramètres
      if (!tmdbId) {
        throw new Error("TMDB ID is required");
      }

      // Ne pas récupérer les sources si le contenu en a déjà
      if (hasExistingSources) {
        console.log("Le contenu a déjà des sources vidéo, Frembed non nécessaire");
        return [];
      }

      // Utiliser l'endpoint API pour récupérer les liens Frembed
      let url = `/api/frembed/video-link/${tmdbId}`;
      
      // Pour les séries (avec saison et épisode)
      if (season !== undefined && episode !== undefined) {
        url += `?mediaType=tv&season=${season}&episode=${episode}`;
      } else {
        url += `?mediaType=movie`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Frembed sources: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Si on a utilisé un lien existant, le retourner
      if (data.usedExisting && data.videoUrl) {
        return [{
          id: season !== undefined && episode !== undefined 
            ? `frembed-${tmdbId}-${season}-${episode}` 
            : `frembed-${tmdbId}`,
          url: data.videoUrl,
          quality: "HD",
          language: "VF",
          provider: "Existing"
        }];
      }
      
      // Si on a un nouveau lien Frembed, le retourner
      if (!data.usedExisting && data.videoUrl) {
        return [{
          id: season !== undefined && episode !== undefined 
            ? `frembed-${tmdbId}-${season}-${episode}` 
            : `frembed-${tmdbId}`,
          url: data.videoUrl,
          quality: "HD",
          language: "VF",
          provider: "Frembed"
        }];
      }
      
      // Aucun lien trouvé
      throw new Error("No video link found");
    } catch (error) {
      console.error("Error fetching Frembed sources:", error);
      // Retourner un tableau vide pour permettre le fallback
      return [];
    }
  };

  return useQuery({
    queryKey: ["frembed-sources", tmdbId, season, episode, hasExistingSources],
    queryFn: fetchFrembedSources,
    enabled: !!tmdbId && !hasExistingSources, // Ne pas activer la requête si des sources existent déjà
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Réessayer 2 fois en cas d'erreur
    retryDelay: 1000, // Attendre 1 seconde entre les tentatives
  });
};