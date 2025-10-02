import { useCallback } from 'react';
import { usePWA } from './usePWA';

interface ShareableContent {
  id: string;
  title: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  contentType: 'movie' | 'tv';
  url: string;
}

export function useOfflineShare() {
  const { share, canShare, isOnline } = usePWA();

  // Préparer le contenu pour le partage
  const prepareShareData = useCallback((content: ShareableContent) => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
    const contentUrl = `${baseUrl}${content.url}`;
    
    // Données de base pour le partage
    const shareData = {
      title: content.title,
      text: content.overview || `Découvrez ${content.title} sur StreamFlix`,
      url: contentUrl
    };

    // Ajouter l'image si disponible et si l'API le supporte
    if (content.poster_path && navigator.canShare && navigator.canShare({ files: [] })) {
      // Note: Le partage d'images nécessite une implémentation plus complexe
      // car il faut convertir l'URL en Blob. Pour simplifier, on se contente
      // du partage de texte et d'URL.
    }

    return shareData;
  }, []);

  // Partager le contenu
  const shareContent = useCallback(async (content: ShareableContent) => {
    try {
      // Préparer les données de partage
      const shareData = prepareShareData(content);
      
      // Tenter de partager via l'API Web Share
      const success = await share(shareData);
      
      if (success) {
        console.log('[OfflineShare] Content shared successfully:', content.title);
        return { success: true, method: 'web-share' };
      }
      
      // Si le partage échoue ou n'est pas supporté, retourner une erreur
      console.warn('[OfflineShare] Web Share API not available or failed');
      return { success: false, method: 'web-share', error: 'Web Share API not available' };
    } catch (error: any) {
      console.error('[OfflineShare] Failed to share content:', error);
      return { success: false, method: 'web-share', error: error.message || 'Unknown error' };
    }
  }, [share, prepareShareData]);

  // Copier le lien dans le presse-papiers
  const copyLinkToClipboard = useCallback(async (content: ShareableContent) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
      const contentUrl = `${baseUrl}${content.url}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(contentUrl);
        return { success: true, method: 'clipboard' };
      } else {
        // Fallback pour les anciens navigateurs
        const textArea = document.createElement('textarea');
        textArea.value = contentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true, method: 'clipboard-fallback' };
      }
    } catch (error: any) {
      console.error('[OfflineShare] Failed to copy link to clipboard:', error);
      return { success: false, method: 'clipboard', error: error.message || 'Unknown error' };
    }
  }, []);

  // Partager via les réseaux sociaux (fallback)
  const shareToSocialMedia = useCallback((content: ShareableContent, platform: 'facebook' | 'twitter' | 'whatsapp') => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
      const contentUrl = encodeURIComponent(`${baseUrl}${content.url}`);
      const title = encodeURIComponent(content.title);
      
      let shareUrl = '';
      
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${contentUrl}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${contentUrl}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${title}%20${contentUrl}`;
          break;
        default:
          return { success: false, error: 'Unsupported platform' };
      }
      
      // Ouvrir dans une nouvelle fenêtre
      window.open(shareUrl, '_blank', 'width=600,height=400');
      return { success: true, method: platform };
    } catch (error: any) {
      console.error('[OfflineShare] Failed to share to social media:', error);
      return { success: false, method: platform, error: error.message || 'Unknown error' };
    }
  }, []);

  // Partager le contenu avec fallback
  const shareContentWithFallback = useCallback(async (content: ShareableContent) => {
    // Si on est en ligne et que l'API Web Share est disponible, l'utiliser
    if (isOnline && canShare) {
      const result = await shareContent(content);
      if (result.success) {
        return result;
      }
    }
    
    // Sinon, copier le lien dans le presse-papiers
    const clipboardResult = await copyLinkToClipboard(content);
    if (clipboardResult.success) {
      return { ...clipboardResult, fallback: true };
    }
    
    // En dernier recours, retourner une erreur
    return { success: false, error: 'Unable to share content' };
  }, [isOnline, canShare, shareContent, copyLinkToClipboard]);

  return {
    shareContent,
    shareContentWithFallback,
    copyLinkToClipboard,
    shareToSocialMedia,
    canShare,
    isOnline
  };
}