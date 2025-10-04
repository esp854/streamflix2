import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { SkipForward, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Settings, Subtitles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import VASTVideoPlayer from './vast-video-player';

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
  const [step, setStep] = useState<'ad' | 'video'>(isAuthenticated ? 'video' : 'ad');
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreloadStartedRef = useRef(false); // Pour éviter le préchargement multiple

  // VAST URL for advertisements
  const VAST_URL = "https://selfishzone.com/d.mqFkzHdMGxNZvKZVGfUL/jeIm/9puTZTUSl/kuPZTQYc2hN/jvY_waNfTokUtRNzjnYO2qNvjWAU2-MkAf";

  // Handle ad completion
  const handleAdComplete = () => {
    setStep('video');
    // Précharger la vidéo principale après les publicités
    setTimeout(() => {
      preloadMainVideo();
    }, 100);
  };

  // Handle ad error
  const handleAdError = (errorMessage: string) => {
    console.error('Ad error:', errorMessage);
    // Proceed to video content even if ad fails
    setStep('video');
    // Précharger la vidéo principale après les publicités
    setTimeout(() => {
      preloadMainVideo();
    }, 100);
  };

  // Précharger la vidéo pour tous les utilisateurs
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
      {isLoading && step === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-4 sm:p-6 max-w-xs">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
            <p className="text-white text-base sm:text-lg px-2 sm:px-4 font-medium">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display - Optimized for mobile */}
      {error && step === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-2 sm:p-4">
          <div className="text-center p-6 sm:p-8 bg-black/90 rounded-2xl max-w-xs sm:max-w-md w-full">
            <div className="text-red-500 text-4xl sm:text-5xl mb-4 sm:mb-6">⚠️</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Erreur de chargement</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors text-base sm:text-lg font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* VAST Ad Player - Only for non-authenticated users */}
      {step === 'ad' && !isAuthenticated && (
        <VASTVideoPlayer 
          vastUrl={VAST_URL}
          onAdComplete={handleAdComplete}
          onAdError={handleAdError}
        />
      )}

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {(step === 'video' || isAuthenticated) && videoUrl.includes('embed') ? (
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
      ) : (step === 'video' || isAuthenticated) ? (
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
      ) : null}

      {/* Custom Controls Overlay for Zupload - Optimized for mobile */}
      {(step === 'video' || isAuthenticated) && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Top Controls - Season and Episode Selection - Mobile optimized */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex justify-between items-center pointer-events-auto">
            <div className="flex items-center space-x-1">
              {onSeasonChange && (
                <Select 
                  value={currentSeason.toString()} 
                  onValueChange={(value) => onSeasonChange(parseInt(value))}
                >
                  <SelectTrigger className="w-12 sm:w-14 bg-black/70 text-white border-white/20 text-xs">
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
                  <SelectTrigger className="w-12 sm:w-14 bg-black/70 text-white border-white/20 text-xs">
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
                  className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-black/90 transition-colors flex items-center text-xs sm:text-sm font-medium"
                >
                  <RotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden xs:inline">Passer l'intro</span>
                </button>
              )}
              
              {onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-black/90 transition-colors flex items-center text-xs sm:text-sm font-medium"
                >
                  <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden xs:inline">Épisode suivant</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Middle Controls - Previous/Next Episode Navigation - Mobile optimized */}
          <div className="absolute top-1/2 left-2 sm:left-3 right-2 sm:right-3 transform -translate-y-1/2 flex justify-between items-center pointer-events-auto">
            <div className="flex items-center space-x-1">
              {onPreviousEpisode && (
                <Button
                  onClick={onPreviousEpisode}
                  variant="ghost"
                  size="icon"
                  className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full"
                  disabled={currentEpisode <= 1}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {onNextEpisode && (
                <Button
                  onClick={onNextEpisode}
                  variant="ghost"
                  size="icon"
                  className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full"
                  disabled={currentEpisode >= totalEpisodes}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;