import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { SkipForward, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Settings, Subtitles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AdsenseAd from "@/components/adsense-ad";

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
  const [step, setStep] = useState<'banner1' | 'banner2' | 'video'>('banner1');
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreloadStartedRef = useRef(false); // Pour éviter le préchargement multiple

  /** --- Open Popunder Window --- **/
  const openPopunder = () => {
    // Avec AdSense, nous n'avons plus besoin du système popunder
    // Passer directement à la bannière 2
    setStep('banner2');
    return true;
  };

  /** --- Handlers --- **/
  const handleBanner1Click = () => {
    const success = openPopunder(); // Ouvrir le popunder
    console.log('Popunder open result:', success);
    
    // Passer à la bannière 2 immédiatement
    setStep('banner2');
  };

  const handleBanner2Click = () => {
    setStep('video'); // Lancer la vidéo
  };

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
    
    // Pour les utilisateurs authentifiés, passer directement à la vidéo
    if (isAuthenticated) {
      setStep('video');
    }
  }, [videoUrl, isAuthenticated]);

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
      {/* Première bannière pop-up - pour les utilisateurs non authentifiés */}
      {step === 'banner1' && !isAuthenticated && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 z-30">
          <div className="bg-blue-900/90 rounded-xl p-4 max-w-md w-full mx-2 my-4 sm:mx-4 sm:my-8 sm:p-6">
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 text-center">Juste une petite étape avant de lancer la vidéo...</h2>
            <p className="mb-4 sm:mb-6 text-gray-200 text-center text-xs sm:text-sm">
              Pour continuer, clique simplement sur le bouton ci-dessous. Une publicité va s'afficher : tu peux la fermer dès qu'elle apparaît. Ce petit geste nous aide à garder StreamFlix gratuit et sans coupure pour tout le monde ! Merci 🙏
            </p>
            
            {/* Publicité AdSense intégrée */}
            <div className="mb-4 sm:mb-6">
              <AdsenseAd 
                adSlot="YOUR_AD_SLOT_HERE" 
                adFormat="rectangle" 
                fullWidthResponsive={false}
                style={{ 
                  width: '300px', 
                  height: '250px',
                  margin: '0 auto'
                }}
                className="flex justify-center"
              />
            </div>
            
            <div className="bg-yellow-900/50 border-l-4 border-yellow-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg">
              <div className="flex items-start">
                <span className="text-yellow-500 text-base sm:text-lg mr-1 sm:mr-2">⚠️</span>
                <div>
                  <p className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Ce qu'il NE FAUT SURTOUT PAS FAIRE</p>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    <li>NE CLIQUE PAS n'importe où sur la page de pub</li>
                    <li>NE SCANNE AUCUN QR code</li>
                    <li>NE TÉLÉCHARGE RIEN</li>
                  </ul>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm">Referme la page de pub dès qu'elle s'affiche. Merci pour ta vigilance ! 🙏</p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm">
                    <span className="font-bold">🚫</span> Cette publicité peut contenir des images ou contenus réservés à un public averti. Ferme la page dès qu'elle s'affiche si tu préfères éviter ce type de contenu.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <button
                onClick={handleBanner1Click}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center justify-center text-sm sm:text-base"
              >
                <span>Voir une publicité</span>
              </button>
              
              <p className="text-gray-300 text-xs sm:text-sm text-center">
                💡 Tu peux fermer la pub dès qu'elle s'affiche !
              </p>
              
              <button
                onClick={handleBanner2Click}
                className="text-gray-400 hover:text-white transition text-xs sm:text-sm"
              >
                Passer et continuer sans publicité
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seconde bannière - après retour sur la page */}
      {step === 'banner2' && !isAuthenticated && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 z-30">
          <div className="bg-blue-900/90 rounded-xl p-4 max-w-md w-full mx-2 my-4 sm:mx-4 sm:my-8 sm:p-6">
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 text-center">Merci pour ton aide ! 🙏</h2>
            <p className="mb-4 sm:mb-6 text-gray-200 text-center text-xs sm:text-sm">
              Merci d'avoir soutenu StreamFlix ! 🎉 Ton action nous permet de maintenir la plateforme gratuite et sans interruption. Profite bien de ton film et oublie pas si tu veux changer la langue des sous titres, utilise le boutton sous titres sur le lecteur si disponible 🍿
            </p>
            
            {/* Publicité AdSense intégrée optionnelle */}
            <div className="mb-4 sm:mb-6">
              <AdsenseAd 
                adSlot="YOUR_SECONDARY_AD_SLOT_HERE" 
                adFormat="rectangle" 
                fullWidthResponsive={false}
                style={{ 
                  width: '300px', 
                  height: '250px',
                  margin: '0 auto'
                }}
                className="flex justify-center"
              />
            </div>
            
            <div className="bg-blue-800/50 border-l-4 border-blue-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg">
              <p className="font-bold mb-2 text-sm sm:text-base">Astuces pour une meilleure expérience :</p>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="flex items-center font-medium text-xs sm:text-sm">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Pour les lecteurs HLS (Nightflix) :
                  </p>
                  <ul className="list-disc list-inside mt-1 text-xs sm:text-sm ml-4 sm:ml-6 space-y-1">
                    <li>Change tes DNS pour accéder sans problème à ces lecteurs</li>
                    <li>Utilise le bouton engrenage ⚙️ pour changer de source</li>
                    <li>Si une source HLS ne fonctionne pas, clique sur le bouton engrenage ⚙️ pour changer de source</li>
                  </ul>
                </div>
                
                <div>
                  <p className="flex items-center font-medium text-xs sm:text-sm">
                    <Subtitles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Pour les lecteurs classiques :
                  </p>
                  <ul className="list-disc list-inside mt-1 text-xs sm:text-sm ml-4 sm:ml-6 space-y-1">
                    <li>Utilise le bouton source en haut à droite pour changer de source</li>
                    <li>Change de source avec le boutton sources en haut à droite si une source ne fonctionne pas</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleBanner2Click}
              className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-green-600 rounded-lg hover:bg-green-700 transition text-sm sm:text-base"
            >
              Lecture
            </button>
          </div>
        </div>
      )}

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

      {/* Custom Controls Overlay for Zupload - Optimized for mobile */}
      {step === 'video' && (
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

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {step === 'video' && videoUrl.includes('embed') ? (
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
      ) : step === 'video' ? (
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
    </div>
  );
};

export default ZuploadVideoPlayer;