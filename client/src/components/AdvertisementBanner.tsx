import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const AdvertisementBanner: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Ne charger les publicités que pour les utilisateurs non authentifiés
    if (!isAuthenticated) {
      // Créer un conteneur pour la publicité In-Page Push
      const adContainer = document.createElement('div');
      adContainer.id = 'inpage-push-ad';
      adContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        width: 300px;
        height: 250px;
        border: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 8px;
        overflow: hidden;
      `;
      
      // Ajout de styles spécifiques pour mobile
      const mobileStyles = `
        @media (max-width: 768px) {
          #inpage-push-ad {
            width: 90% !important;
            height: 150px !important;
            bottom: 10px !important;
            right: 5% !important;
            left: 5% !important;
          }
        }
      `;
      
      // Créer une balise style pour les media queries
      const styleElement = document.createElement('style');
      styleElement.textContent = mobileStyles;
      document.head.appendChild(styleElement);
      
      // Ajouter le conteneur au body
      document.body.appendChild(adContainer);
      
      // Charger le script de publicité In-Page Push
      const script = document.createElement('script');
      script.src = 'https://example.com/inpage-push-ad.js'; // Remplacer par l'URL réelle
      script.async = true;
      script.onload = () => {
        // Initialiser la publicité une fois le script chargé
        if (window.initInPagePushAd) {
          window.initInPagePushAd('#inpage-push-ad');
        }
      };
      
      document.head.appendChild(script);
      
      // Nettoyer lors du démontage
      return () => {
        if (adContainer.parentNode) {
          adContainer.parentNode.removeChild(adContainer);
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      };
    }
  }, [isAuthenticated]);

  // Pour les utilisateurs authentifiés, ne rien afficher
  if (isAuthenticated) {
    return null;
  }

  // Pour les utilisateurs non authentifiés, afficher un conteneur vide
  return (
    <div 
      id="ad-container" 
      style={{ 
        width: '100%', 
        height: '250px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        margin: '16px 0'
      }}
    >
      <div style={{ textAlign: 'center', color: '#666' }}>
        <p>Publicité</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>Contenu sponsorisé</p>
      </div>
    </div>
  );
};

// Déclaration globale pour éviter les erreurs TypeScript
declare global {
  interface Window {
    initInPagePushAd?: (selector: string) => void;
  }
}

export default AdvertisementBanner;