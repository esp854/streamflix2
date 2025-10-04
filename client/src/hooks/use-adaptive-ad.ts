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
      // Créer un conteneur pour la publicité VAST
      const adContainer = document.createElement('div');
      adContainer.id = 'vast-ad-container';
      adContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        width: 640px;
        height: 480px;
        background: #000;
        border: 2px solid #fff;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      
      // Ajouter un bouton de fermeture
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 20px;
        cursor: pointer;
        z-index: 10001;
      `;
      
      closeBtn.onclick = () => {
        document.body.removeChild(adContainer);
      };
      
      adContainer.appendChild(closeBtn);
      
      // Créer un conteneur pour le lecteur VAST
      const playerContainer = document.createElement('div');
      playerContainer.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
      `;
      
      // Créer un iframe pour le lecteur VAST avec l'URL VAST
      const iframe = document.createElement('iframe');
      iframe.src = `/vast-player.html?vastUrl=${encodeURIComponent(VAST_URL)}`;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;
      
      playerContainer.appendChild(iframe);
      adContainer.appendChild(playerContainer);
      document.body.appendChild(adContainer);
      
      console.log('VAST ad displayed with video player');
      return true;
    } catch (error) {
      console.error('Error showing VAST ad:', error);
      return false;
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
        console.log('Showing VAST ad for desktop device');
        if (isVASTReady) {
          // Afficher la publicité VAST
          const success = await showVASTAd();
          return { success, type: 'vast' };
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