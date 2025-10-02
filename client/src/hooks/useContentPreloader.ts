import { useEffect, useCallback } from 'react';
import { usePWA } from './usePWA';

interface PreloadableContent {
  id: string;
  type: 'movie' | 'tv' | 'page';
  url: string;
  priority: 'high' | 'medium' | 'low';
}

export function useContentPreloader() {
  const { prefetchContent } = usePWA();

  // Précharger les pages les plus fréquemment visitées
  const preloadFrequentPages = useCallback(() => {
    const frequentPages = [
      '/api/tmdb/trending',
      '/api/tmdb/popular',
      '/api/tmdb/top-rated',
      '/src/pages/home.tsx',
      '/src/pages/search.tsx',
      '/src/pages/favorites.tsx'
    ];
    
    prefetchContent(frequentPages);
  }, [prefetchContent]);

  // Précharger le contenu d'un film ou d'une série spécifique
  const preloadContent = useCallback((content: PreloadableContent) => {
    const urlsToPreload: string[] = [];
    
    // Ajouter l'URL de base du contenu
    urlsToPreload.push(content.url);
    
    // Pour les films/séries, ajouter les URLs associées
    if (content.type === 'movie' || content.type === 'tv') {
      urlsToPreload.push(`/api/tmdb/${content.type}/${content.id}`);
      urlsToPreload.push(`/api/content/tmdb/${content.id}`);
      
      // Pour les séries, ajouter les saisons
      if (content.type === 'tv') {
        urlsToPreload.push(`/api/tmdb/tv/${content.id}/season/1`);
      }
    }
    
    // Envoyer au service worker pour préchargement
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        command: 'PRELOAD_CONTENT',
        urls: urlsToPreload
      });
    }
  }, []);

  // Précharger les contenus similaires
  const preloadSimilarContent = useCallback((contentId: string, contentType: 'movie' | 'tv') => {
    const similarUrls = [
      `/api/tmdb/${contentType}/${contentId}/similar`,
      `/api/tmdb/${contentType}/${contentId}/recommendations`
    ];
    
    prefetchContent(similarUrls);
  }, [prefetchContent]);

  // Précharger les images critiques
  const preloadCriticalImages = useCallback((imageUrls: string[]) => {
    // Filtrer les URLs valides
    const validUrls = imageUrls.filter(url => 
      url && (url.startsWith('http') || url.startsWith('/'))
    );
    
    if (validUrls.length > 0) {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          command: 'PRELOAD_CONTENT',
          urls: validUrls
        });
      }
    }
  }, []);

  // Effet pour précharger les pages fréquentes au chargement de l'application
  useEffect(() => {
    // Délai pour ne pas surcharger le réseau au démarrage
    const timer = setTimeout(() => {
      preloadFrequentPages();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [preloadFrequentPages]);

  return {
    preloadContent,
    preloadSimilarContent,
    preloadCriticalImages,
    preloadFrequentPages
  };
}