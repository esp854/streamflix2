import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { SkipForward, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Settings, Subtitles } from 'lucide-react';
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
  const [step, setStep] = useState<'banner1' | 'banner2' | 'video'>('banner1');
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreloadStartedRef = useRef(false); // Pour éviter le préchargement multiple

  /** --- Open Popunder Window --- **/
  const openPopunder = () => {
    try {
      // URL de la publicité popunder
      const popunderUrl = "https://selfishzone.com/bB3CV_0.PE2FlGjHP-XJBKzLJMm_9O0PPQURN-nTSUlVRWU_aYEZlaKbW-Wd5eKfdgl_liXjUkmll-ZnVozpVqr_Ss2tluCva-Ex0yyzWAT_FCODMEkFp-pHWIlJRKJ_eMFNlO6PU-mRxSNTeUk_FW6XTYnZp-rbecUd1eq_agGhhiajR-GlMmznTo0_RqorbsUt1-qvSwTxBya_RAEBNCUDd-2FZG6HRI0_JKqLaMlNA-1PdQ0RUSt_JUnVJWyXa-WZQa9bMcm_Me4fMgGhN-ljZkDlAm1_MojpFqirO-GtMu2vNwz_BymzMADBB-iDZEWFMGz_YImJVKiLY-zNMO4PNQD_kSmTdUnVQ-9XMYTZca1_OcTdQe1fM-zhMizjMkS_1mlnMoDpB-hrYsmtUux_NwjxAyxzN-TBZCjDMET_YG4HMIGJY-1LYMWNFOi_YQTRES2TM-zVUW3XOYT_JakbYcidZ-6fbg2h5il_akWlQm9nN-jpYq2rNsj_Iu4vOwSx0-2zNAjBYC2_MEjFkGwH";
      
      // Ouvrir la fenêtre popunder
      const popup = window.open(popunderUrl, '_blank', 'width=1001,height=800,scrollbars=yes,resizable=yes');
      
      if (popup) {
        console.log('Popunder window opened successfully');
        // Essayer de mettre la fenêtre en arrière-plan
        popup.blur();
        window.focus();
        return true;
      } else {
        console.log('Popunder blocked by browser');
        return false;
      }
    } catch (err) {
      console.error('Error opening popunder:', err);
      return false;
    }
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 rounded-lg z-30 overflow-y-auto">
          <div className="bg-blue-900/90 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl mb-4 text-center">Juste une petite étape avant de lancer la vidéo...</h2>
            <p className="mb-6 text-gray-200 text-center">
              Pour continuer, clique simplement sur le bouton ci-dessous. Une fenêtre publicitaire va s'ouvrir : tu peux la fermer dès qu'elle apparaît. Ce petit geste nous aide à garder Movix gratuit et sans coupure pour tout le monde ! Merci 🙏
            </p>
            
            <div className="bg-yellow-900/50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
              <div className="flex items-start">
                <span className="text-yellow-500 text-lg mr-2">⚠️</span>
                <div>
                  <p className="font-bold mb-2">Ce qu'il NE FAUT SURTOUT PAS FAIRE</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>NE CLIQUE PAS n'importe où sur la page de pub</li>
                    <li>NE SCANNE AUCUN QR code</li>
                    <li>NE TÉLÉCHARGE RIEN</li>
                  </ul>
                  <p className="mt-2 text-sm">Referme la page de pub dès qu'elle s'affiche. Merci pour ta vigilance ! 🙏</p>
                  <p className="mt-2 text-sm">
                    <span className="font-bold">🚫</span> Cette publicité peut contenir des images ou contenus réservés à un public averti. Ferme la page dès qu'elle s'affiche si tu préfères éviter ce type de contenu.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleBanner1Click}
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
              >
                <span>Voir une publicité</span>
              </button>
              
              <p className="text-gray-300 text-sm text-center">
                💡 Tu peux fermer la pub dès qu'elle s'affiche !
              </p>
              
              <button
                onClick={handleBanner2Click}
                className="text-gray-400 hover:text-white transition text-sm"
              >
                Passer et continuer sans publicité
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seconde bannière - après retour sur la page */}
      {step === 'banner2' && !isAuthenticated && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 rounded-lg z-30 overflow-y-auto">
          <div className="bg-blue-900/90 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl mb-4 text-center">Merci pour ton aide ! 🙏</h2>
            <p className="mb-6 text-gray-200 text-center">
              Merci d'avoir soutenu Streamflix ! 🎉 Ton action nous permet de maintenir la plateforme gratuite et sans interruption. Profite bien de ton film et oublie pas si tu veux changer la langue des sous titres, utilise le boutton sous titres sur le lecteur si disponible 🍿
            </p>
            
            <div className="bg-blue-800/50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg">
              <p className="font-bold mb-2">Astuces pour une meilleure expérience :</p>
              <div className="space-y-3">
                <div>
                  <p className="flex items-center font-medium">
                    <Settings className="w-4 h-4 mr-2" />
                    Pour les lecteurs HLS (Nightflix) :
                  </p>
                  <ul className="list-disc list-inside mt-1 text-sm ml-6 space-y-1">
                    <li>Change tes DNS pour accéder sans problème à ces lecteurs</li>
                    <li>Utilise le bouton engrenage ⚙️ pour changer de source</li>
                    <li>Si une source HLS ne fonctionne pas, clique sur le bouton engrenage ⚙️ pour changer de source</li>
                  </ul>
                </div>
                
                <div>
                  <p className="flex items-center font-medium">
                    <Subtitles className="w-4 h-4 mr-2" />
                    Pour les lecteurs classiques :
                  </p>
                  <ul className="list-disc list-inside mt-1 text-sm ml-6 space-y-1">
                    <li>Utilise le bouton source en haut à droite pour changer de source</li>
                    <li>Change de source avec le boutton sources en haut à droite si une source ne fonctionne pas</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleBanner2Click}
              className="w-full px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              Lecture
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator - Optimized for mobile */}
      {isLoading && step === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6 max-w-xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6 sm:mb-8"></div>
            <p className="text-white text-lg sm:text-xl px-4 font-medium">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display - Optimized for mobile */}
      {error && step === 'video' && (
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
      {step === 'video' && (
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