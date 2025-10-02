import { useCallback, useEffect, useState } from 'react';

interface OfflineContent {
  id: string;
  title: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  contentType: 'movie' | 'tv';
  savedAt: string;
}

export function useOfflineContent() {
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier si l'API de service worker est supportée
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      
      // Écouter les messages du service worker
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'OFFLINE_CONTENT_LIST') {
          setOfflineContent(event.data.contentList);
        }
        
        if (event.data.type === 'OFFLINE_CONTENT_SAVED') {
          // Rafraîchir la liste du contenu hors-ligne
          getOfflineContent();
        }
        
        if (event.data.type === 'OFFLINE_CONTENT_REMOVED') {
          // Rafraîchir la liste du contenu hors-ligne
          getOfflineContent();
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      // Récupérer la liste initiale du contenu hors-ligne
      getOfflineContent();
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    } else {
      setIsSupported(false);
    }
  }, []);

  const getOfflineContent = useCallback(() => {
    if (!isSupported) return;
    
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({
        command: 'GET_OFFLINE_CONTENT'
      });
    });
  }, [isSupported]);

  const saveForOffline = useCallback((content: any) => {
    if (!isSupported) return Promise.reject('Service Worker not supported');
    
    return navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({
        command: 'SAVE_FOR_OFFLINE',
        content: {
          ...content,
          savedAt: new Date().toISOString()
        }
      });
    });
  }, [isSupported]);

  const removeOfflineContent = useCallback((contentId: string) => {
    if (!isSupported) return Promise.reject('Service Worker not supported');
    
    return navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({
        command: 'REMOVE_OFFLINE_CONTENT',
        contentId
      });
    });
  }, [isSupported]);

  const isContentSavedOffline = useCallback((contentId: string) => {
    return offlineContent.some(content => content.id === contentId);
  }, [offlineContent]);

  return {
    offlineContent,
    isSupported,
    saveForOffline,
    removeOfflineContent,
    isContentSavedOffline,
    refresh: getOfflineContent
  };
}