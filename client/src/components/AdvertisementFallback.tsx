import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AdvertisementFallbackProps {
  onSkip: () => void;
  videoTitle: string;
}

const AdvertisementFallback: React.FC<AdvertisementFallbackProps> = ({ 
  onSkip,
  videoTitle 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5); // 5 secondes avant de pouvoir passer

  useEffect(() => {
    // Démarrer le compte à rebours
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fermer automatiquement la bannière après 15 secondes
    const autoCloseTimer = setTimeout(() => {
      if (isVisible) {
        onSkip();
      }
    }, 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [isVisible, onSkip]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Bannière publicitaire statique */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 w-full max-w-2xl h-64 rounded-xl flex flex-col items-center justify-center p-6 text-center relative">
          <button
            onClick={() => {
              setIsVisible(false);
              onSkip();
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Fermer la publicité"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h3 className="text-2xl font-bold text-white mb-4">Publicité</h3>
          <p className="text-blue-200 mb-6">Cette publicité permet de financer le contenu gratuit</p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 w-full max-w-md">
            <p className="text-white font-medium">Streaming de "{videoTitle}"</p>
            <p className="text-blue-200 text-sm mt-1">Bientôt disponible après la publicité</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-blue-200 mb-4">
              {timeLeft > 0 
                ? `La vidéo démarrera automatiquement dans ${timeLeft} seconde${timeLeft > 1 ? 's' : ''}` 
                : 'La vidéo va démarrer...'}
            </p>
            
            <button
              onClick={onSkip}
              disabled={timeLeft > 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                timeLeft > 0 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-900 hover:bg-gray-200'
              }`}
            >
              {timeLeft > 0 ? `Passer (${timeLeft}s)` : 'Passer la publicité'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementFallback;