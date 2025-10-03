import React, { useEffect, useRef } from 'react';

interface AdsenseAdProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AdsenseAd: React.FC<AdsenseAdProps> = ({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = {}
}) => {
  const adsContainerRef = useRef<HTMLDivElement>(null);
  const adsenseScriptLoadedRef = useRef(false);

  useEffect(() => {
    // Vérifier si le script AdSense est déjà chargé
    if (typeof (window as any).adsbygoogle !== 'undefined') {
      adsenseScriptLoadedRef.current = true;
      try {
        // Initialiser l'annonce AdSense
        (window as any).adsbygoogle.push({});
      } catch (err) {
        console.error('Error initializing AdSense ad:', err);
      }
    } else {
      // Si le script n'est pas encore chargé, attendre et réessayer
      const checkInterval = setInterval(() => {
        if (typeof (window as any).adsbygoogle !== 'undefined') {
          clearInterval(checkInterval);
          adsenseScriptLoadedRef.current = true;
          try {
            (window as any).adsbygoogle.push({});
          } catch (err) {
            console.error('Error initializing AdSense ad:', err);
          }
        }
      }, 100);

      // Arrêter la vérification après 5 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);
    }

    return () => {
      // Nettoyage si nécessaire
    };
  }, [adSlot]);

  return (
    <div 
      ref={adsContainerRef}
      className={`adsense-ad-container ${className}`}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5922849545514008"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      ></ins>
    </div>
  );
};

export default AdsenseAd;