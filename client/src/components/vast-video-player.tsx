import React, { useState, useEffect, useRef } from 'react';

interface VASTVideoPlayerProps {
  vastUrl: string;
  onAdComplete?: () => void;
  onAdError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const VASTVideoPlayer: React.FC<VASTVideoPlayerProps> = ({ 
  vastUrl, 
  onAdComplete, 
  onAdError,
  className = '',
  style = {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);

  // Fonction pour parser le XML VAST et extraire l'URL de la vidéo
  const parseVAST = async (url: string) => {
    try {
      const response = await fetch(url);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Chercher l'URL de la vidéo dans le VAST
      const mediaFile = xmlDoc.querySelector('MediaFile');
      if (mediaFile) {
        return mediaFile.textContent;
      }
      
      // Si pas de MediaFile, chercher d'autres formats possibles
      const videoClicks = xmlDoc.querySelector('VideoClicks ClickThrough');
      if (videoClicks) {
        return videoClicks.textContent;
      }
      
      throw new Error('No media file found in VAST response');
    } catch (err) {
      console.error('Error parsing VAST:', err);
      throw err;
    }
  };

  // Charger et jouer la publicité VAST
  const loadVASTAd = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parser le VAST pour obtenir l'URL de la vidéo
      const videoUrl = await parseVAST(vastUrl);
      
      if (videoRef.current) {
        videoRef.current.src = videoUrl || vastUrl;
        videoRef.current.load();
        
        // Essayer de jouer automatiquement
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Auto-play prevented:', error);
            // Afficher les contrôles si l'autoplay est bloqué
            if (videoRef.current) {
              videoRef.current.controls = true;
            }
          });
        }
      }
    } catch (err) {
      console.error('Error loading VAST ad:', err);
      setError('Impossible de charger la publicité');
      onAdError?.('Impossible de charger la publicité');
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la fin de la publicité
  const handleAdEnded = () => {
    onAdComplete?.();
  };

  // Gérer les erreurs de lecture
  const handleAdError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('VAST ad error:', e);
    setError('Erreur de lecture de la publicité');
    onAdError?.('Erreur de lecture de la publicité');
  };

  // Charger la publicité quand le composant est monté
  useEffect(() => {
    loadVASTAd();
  }, [vastUrl]);

  return (
    <div 
      ref={adContainerRef}
      className={`relative bg-black ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        ...style
      }}
    >
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement de la publicité...</p>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6 bg-black/90 rounded-2xl max-w-xs">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-3">Erreur</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={loadVASTAd}
              className="px-4 py-2 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Lecteur vidéo pour la publicité */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        onEnded={handleAdEnded}
        onError={handleAdError}
        onLoadedData={() => setIsLoading(false)}
      />

      {/* Overlay avec informations */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          Publicité
        </div>
        <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          StreamFlix
        </div>
      </div>
    </div>
  );
};

export default VASTVideoPlayer;