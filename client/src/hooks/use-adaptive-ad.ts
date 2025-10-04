import { useState, useEffect } from 'react';

declare global {
  interface Window {
    jfj?: any;
    google?: any;
  }
}

export function useAdaptiveAd() {
  const [isInPagePushReady, setIsInPagePushReady] = useState(false);
  const [isVASTReady, setIsVASTReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // URL VAST fournie
  const VAST_URL = "https://selfishzone.com/d.mqFkzHdMGxNZvKZVGfUL/jeIm/9puTZTUSl/kuPZTQYc2hN/jvY_waNfTokUtRNzjnYO2qNvjWAU2-MkAf";

  useEffect(() => {
    // Déterminer si l'utilisateur est sur mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      return mobile;
    };

    checkMobile();

    // Vérifier si le script In-Page Push est chargé
    const checkInPagePushScript = () => {
      if (typeof window !== 'undefined' && window.jfj) {
        setIsInPagePushReady(true);
      }
    };

    // Vérifier si VAST est prêt (simulation)
    const checkVASTReady = () => {
      // Dans une implémentation réelle, vous vérifieriez si le SDK VAST est chargé
      // Pour l'instant, nous considérons que VAST est toujours prêt
      setIsVASTReady(true);
    };

    checkInPagePushScript();
    checkVASTReady();
    setIsLoading(false);

    // Réessayer si nécessaire
    const timer = setTimeout(() => {
      if (!isInPagePushReady) {
        checkInPagePushScript();
      }
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isInPagePushReady]);

  const showInPagePushAd = async () => {
    try {
      if (isInPagePushReady && window.jfj) {
        // Déclencher l'affichage de l'In-Page Push
        // Le script fancyresponse gère automatiquement l'affichage
        console.log('In-Page Push ad should be displayed');
        
        // Dans une implémentation réelle, vous appelleriez les fonctions appropriées du SDK
        // Par exemple: window.jfj.showNotification() ou une autre méthode du SDK
        // Pour l'instant, nous simulons l'affichage
        return { success: true, type: 'in-page-push' };
      } else {
        console.warn('In-Page Push script not ready');
        return { success: false, type: 'in-page-push' };
      }
    } catch (error) {
      console.error('Error showing In-Page Push ad:', error);
      return { success: false, type: 'error' };
    }
  };

  const showVASTAd = async () => {
    try {
      // Retourner l'URL VAST pour que le composant puisse l'utiliser
      return { success: true, type: 'vast', url: VAST_URL };
    } catch (error) {
      console.error('Error preparing VAST ad:', error);
      return { success: false, type: 'error' };
    }
  };

  const showAdaptiveAd = async () => {
    try {
      const isCurrentlyMobile = isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isCurrentlyMobile) {
        // Pour mobile, utiliser In-Page Push
        console.log('Showing In-Page Push ad for mobile device');
        return await showInPagePushAd();
      } else {
        // Pour desktop, utiliser VAST
        console.log('Preparing VAST ad for desktop device');
        if (isVASTReady) {
          // Retourner l'URL VAST pour affichage intégré
          const result = await showVASTAd();
          return result;
        } else {
          console.warn('VAST not ready');
          return { success: false, type: 'vast' };
        }
      }
    } catch (error) {
      console.error('Error showing adaptive ad:', error);
      return { success: false, type: 'error' };
    }
  };

  return {
    isMobile,
    isInPagePushReady,
    isVASTReady,
    isLoading,
    showAdaptiveAd
  };
}