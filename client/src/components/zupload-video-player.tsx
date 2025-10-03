import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { SkipForward, RotateCcw, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ZuploadVideoPlayerProps {
  videoUrl: string;
  title: string;
  onVideoEnd?: () => void;
  onVideoError?: (error: string) => void;
  onNextEpisode?: () => void;
  onSkipIntro?: () => void;
  currentSeason?: number;
  currentEpisode?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  onSeasonChange?: (season: number) => void;
  onEpisodeChange?: (episode: number) => void;
  onPreviousEpisode?: () => void;
}

const ZuploadVideoPlayer: React.FC<ZuploadVideoPlayerProps> = ({
  videoUrl,
  title,
  onVideoEnd,
  onVideoError,
  onNextEpisode,
  onSkipIntro,
  currentSeason = 1,
  currentEpisode = 1,
  totalSeasons = 1,
  totalEpisodes = 10,
  onSeasonChange,
  onEpisodeChange,
  onPreviousEpisode
}) => {
  const { isAuthenticated } = useAuth();
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreloadStartedRef = useRef(false); // Pour éviter le préchargement multiple

  // Script popunder pour les utilisateurs non authentifiés
  useEffect(() => {
    if (!isAuthenticated) {
      // Fonction pour injecter le script popunder
      const injectPopunderScript = () => {
        try {
          // Création d'une fonction IIFE (Immediately Invoked Function Expression)
          (function(mfyfr) {
            // Votre script popunder personnalisé ici
            var host = 'mfyfr.com';
            var slot = '484977';
            var form = '484977';
            
            var url = 'https://' + host + '/' + slot + '.js';
            var cdnUrl = 'https://pp.mfyfr.com/' + slot + '.js';
            
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            
            if (mfyfr[host] && mfyfr[host][slot]) {
              s.src = cdnUrl;
            } else {
              s.src = url;
            }
            
            document.head.appendChild(s);
          })({});
        } catch (err) {
          console.error('Error injecting popunder script:', err);
        }
      };
      
      // Injection du script popunder
      injectPopunderScript();
    }
  }, [isAuthenticated]);

  // Précharger la vidéo principale pour accélérer le chargement
  const preloadMainVideo = () => {
    // Ne pas tenter de précharger les URLs d'iframe (Zupload embed)
    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      console.log('Préchargement ignoré pour l\'URL d\'intégration:', videoUrl);
      return;
    }
    
    if (videoPreloadStartedRef.current || !mainVideoRef.current) return;
    
    videoPreloadStartedRef.current = true;
    console.log('Préchargement de la vidéo principale:', videoUrl);
    
    // Créer un objet vidéo temporaire pour le préchargement
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'auto';
    tempVideo.src = videoUrl;
    
    // Écouter les événements de chargement
    tempVideo.addEventListener('loadeddata', () => {
      console.log('Vidéo principale préchargée avec succès');
    });
    
    tempVideo.addEventListener('error', (e) => {
      console.error('Erreur de préchargement de la vidéo:', e);
    });
    
    // Nettoyer après 30 secondes si la vidéo n'est pas utilisée
    setTimeout(() => {
      tempVideo.remove();
    }, 30000);
  };

  // Handle video load
  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // Handle video playing - for better loading indication
  const handleVideoPlaying = () => {
    setIsLoading(false);
    setError(null);
  };

  // Handle video error
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsLoading(false);
    setError('Failed to load video content');
    onVideoError?.('Failed to load video content');
  };

  // Reset loading state when videoUrl changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    videoPreloadStartedRef.current = false; // Réinitialiser le flag de préchargement
    
    // Pour les URLs d'iframe, réduire le temps d'affichage du loader
    // Sur mobile, masquer encore plus rapidement
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const loaderDelay = isMobile ? 1000 : 2000; // 1 seconde sur mobile, 2 sur desktop
    
    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
      }, loaderDelay);
      
      return () => clearTimeout(loaderTimeout);
    }
  }, [videoUrl]);

  // Précharger la vidéo pour tous les utilisateurs
  useEffect(() => {
    setIsLoading(true);
    // Précharger la vidéo immédiatement
    setTimeout(() => {
      preloadMainVideo();
    }, 100);
    
    // Pour les URLs d'iframe, masquer rapidement le loader
    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [videoUrl]);

  // Handle touch events for mobile devices
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Sur mobile, garder les contrôles visibles plus longtemps
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000); // 5 secondes sur mobile au lieu de 3
  };

  // Show controls on mouse move (desktop) or touch (mobile)
  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Sur desktop, masquer plus rapidement
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // 3 secondes sur desktop
  };

  // Handle touch end event
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    // Ne pas masquer immédiatement les contrôles après un touch
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen bg-black"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={() => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 500);
        }
      }}
    >
      {/* Loading indicator - Optimized for mobile */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6 max-w-xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6 sm:mb-8"></div>
            <p className="text-white text-lg sm:text-xl px-4 font-medium">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display - Optimized for mobile */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-4">
          <div className="text-center p-8 sm:p-10 bg-black/90 rounded-2xl max-w-xs sm:max-w-md w-full">
            <div className="text-red-500 text-5xl sm:text-6xl mb-6 sm:mb-8">⚠️</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Erreur de chargement</h3>
            <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors text-lg sm:text-xl font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay for Zupload - Optimized for mobile */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Top Controls - Season and Episode Selection - Mobile optimized */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {onSeasonChange && (
              <Select 
                value={currentSeason.toString()} 
                onValueChange={(value) => onSeasonChange(parseInt(value))}
              >
                <SelectTrigger className="w-14 sm:w-16 md:w-24 bg-black/70 text-white border-white/20 text-xs sm:text-sm">
                  <SelectValue placeholder="S" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(seasonNum => (
                    <SelectItem key={seasonNum} value={seasonNum.toString()}>
                      S{seasonNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {onEpisodeChange && (
              <Select 
                value={currentEpisode.toString()} 
                onValueChange={(value) => onEpisodeChange(parseInt(value))}
              >
                <SelectTrigger className="w-14 sm:w-16 md:w-24 bg-black/70 text-white border-white/20 text-xs sm:text-sm">
                  <SelectValue placeholder="E" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map(episodeNum => (
                    <SelectItem key={episodeNum} value={episodeNum.toString()}>
                      E{episodeNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex space-x-1">
            {onSkipIntro && (
              <button
                onClick={onSkipIntro}
                className="bg-black/70 text-white px-4 py-3 rounded-lg hover:bg-black/90 transition-colors flex items-center text-sm sm:text-base font-medium"
              >
                <RotateCw className="w-5 h-5 mr-2" />
                <span className="hidden xs:inline sm:inline">Passer l'intro</span>
              </button>
            )}
            
            {onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="bg-black/70 text-white px-4 py-3 rounded-lg hover:bg-black/90 transition-colors flex items-center text-sm sm:text-base font-medium"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                <span className="hidden xs:inline sm:inline">Épisode suivant</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Middle Controls - Previous/Next Episode Navigation - Mobile optimized */}
        <div className="absolute top-1/2 left-3 sm:left-4 right-3 sm:right-4 transform -translate-y-1/2 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {onPreviousEpisode && (
              <Button
                onClick={onPreviousEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full"
                disabled={currentEpisode <= 1}
              >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {onNextEpisode && (
              <Button
                onClick={onNextEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full"
                disabled={currentEpisode >= totalEpisodes}
              >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {videoUrl.includes('embed') ? (
        <iframe
          src={videoUrl}
          className="w-full h-full touch-manipulation"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={title}
          loading="lazy"
          onLoad={() => {
            console.log('Iframe Zupload chargée');
            setIsLoading(false);
            setError(null);
          }}
          onError={(e) => {
            console.error('Erreur de chargement de l\'iframe Zupload:', e);
            setIsLoading(false);
            setError('Impossible de charger la vidéo');
            onVideoError?.('Impossible de charger la vidéo');
          }}
        />
      ) : (
        // For direct video files
        <video
          ref={mainVideoRef}
          controls
          width="100%"
          height="100%"
          preload="auto"
          className="w-full h-full touch-manipulation"
          onLoad={handleVideoLoad}
          onPlaying={handleVideoPlaying}
          onError={handleVideoError}
          onEnded={onVideoEnd}
          playsInline
        />
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;