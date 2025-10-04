import { useState, useEffect } from 'react';

declare global {
  interface Window {
    jfj?: any;
  }
}

export function useNativeAd() {
  const [isAdReady, setIsAdReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si le script In-Page Push est chargé
    const checkAdScript = () => {
      if (typeof window !== 'undefined' && window.jfj) {
        setIsAdReady(true);
        setIsLoading(false);
      } else {
        // Réessayer après un court délai
        const timer = setTimeout(checkAdScript, 500);
        return () => clearTimeout(timer);
      }
    };

    checkAdScript();
  }, []);

  const showNativeAd = async () => {
    try {
      if (!isAdReady) {
        console.warn('In-Page Push script not ready');
        return false;
      }

      // Le script gère automatiquement l'affichage
      // On peut éventuellement déclencher des événements spécifiques si le script le permet
      console.log('In-Page Push ad should be displayed');
      return true;
    } catch (error) {
      console.error('Error showing In-Page Push ad:', error);
      return false;
    }
  };

  return {
    isAdReady,
    isLoading,
    showNativeAd
  };
}