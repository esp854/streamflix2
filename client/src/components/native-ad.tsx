import React, { useEffect } from 'react';
import { useAdaptiveAd } from '@/hooks/use-adaptive-ad';

interface NativeAdProps {
  autoShow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const NativeAd: React.FC<NativeAdProps> = ({ 
  autoShow = false,
  className = '',
  style = {}
}) => {
  const { isMobile, isInPagePushReady, isVASTReady, isLoading, showAdaptiveAd } = useAdaptiveAd();

  useEffect(() => {
    if (autoShow && !isLoading) {
      // Afficher automatiquement la publicité appropriée après un court délai
      const timer = setTimeout(() => {
        showAdaptiveAd();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow, isLoading, showAdaptiveAd]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="text-gray-400">Chargement de la publicité...</div>
      </div>
    );
  }

  const adType = isMobile ? 'In-Page Push' : 'VAST';
  const isAdReady = isMobile ? isInPagePushReady : isVASTReady;

  if (!isAdReady) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="text-gray-400">Publicités {adType} non disponibles</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`} style={style}>
      <button
        onClick={() => showAdaptiveAd()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Voir une publicité
      </button>
      <p className="text-gray-400 text-xs mt-2 text-center">
        Soutenez StreamFlix en regardant une publicité
      </p>
    </div>
  );
};

export default NativeAd;