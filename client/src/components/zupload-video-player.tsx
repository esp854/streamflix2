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
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(!isAuthenticated);
  const [adSkipped, setAdSkipped] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adQueueRef = useRef<string[]>([]); // File d'attente des pubs
  const currentAdIndexRef = useRef(0); // Index de la pub actuelle
  const videoPreloadStartedRef = useRef(false); // Pour éviter le préchargement multiple

  // URL VAST de HilltopAds
  const vastTag = 'https://selfishzone.com/demnFEzUd.GdNDvxZCGLUk/uexm/9buUZDU/lLkbPlTdYK2kNDj/YawqNwTJkltNNejoYh2-NGjtA/2/M/Ay';

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

  // Fonction pour charger la pub VAST via IMA
  async function loadVastAd() {
    if (!adVideoRef.current) return;

    const videoEl = adVideoRef.current;

    try {
      console.log('Chargement du tag VAST:', vastTag);
      const response = await fetch(vastTag);
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        console.warn('Erreur HTTP lors du chargement du VAST:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      console.log('Réponse VAST reçue:', xmlText.substring(0, 200) + '...'); // Afficher les 200 premiers caractères
      
      // Vérifier si la réponse est vide ou invalide
      if (!xmlText || xmlText.trim().length === 0) {
        console.warn('Réponse VAST vide');
        throw new Error('Réponse VAST vide');
      }
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "text/xml");
      
      // Vérifier les erreurs de parsing XML
      const parserError = xml.querySelector('parsererror');
      if (parserError) {
        console.warn('Erreur de parsing XML VAST:', parserError.textContent);
        throw new Error('Erreur de parsing XML VAST');
      }

      // Récupère tous les Ad du VAST
      const ads = xml.querySelectorAll('Ad');
      console.log('Nombre de balises Ad trouvées:', ads.length);
      
      if (!ads.length) {
        // Vérifier s'il y a d'autres éléments qui pourraient indiquer une erreur
        const errorElements = xml.querySelectorAll('Error');
        if (errorElements.length > 0) {
          console.warn('Éléments Error trouvés dans le VAST:', errorElements.length);
          errorElements.forEach((errorEl, index) => {
            console.warn(`Error ${index + 1}:`, errorEl.textContent);
          });
        }
        
        console.warn('Pas de Ad dans le VAST');
        if (mainVideoRef.current) {
          mainVideoRef.current.src = videoUrl; // pas de pub, lance la vidéo normale
        }
        setIsLoading(false);
        setIsAdPlaying(false);
        return;
      }

      // Récupère tous les MediaFile des pubs
      const adUrls: string[] = [];
      ads.forEach((ad, index) => {
        console.log(`Traitement de l'Ad ${index + 1}:`, ad);
        const mediaFile = ad.querySelector('MediaFile');
        if (mediaFile) {
          const adUrl = mediaFile.textContent?.trim();
          if (adUrl) {
            console.log(`MediaFile trouvé pour Ad ${index + 1}:`, adUrl);
            adUrls.push(adUrl);
          } else {
            console.warn(`MediaFile vide pour Ad ${index + 1}`);
          }
        } else {
          console.warn(`Aucun MediaFile trouvé pour Ad ${index + 1}`);
        }
      });

      if (!adUrls.length) {
        console.warn('Pas de MediaFile dans le VAST');
        if (mainVideoRef.current) {
          mainVideoRef.current.src = videoUrl; // pas de pub, lance la vidéo normale
        }
        setIsLoading(false);
        setIsAdPlaying(false);
        return;
      }

      // Initialiser la file d'attente des pubs
      adQueueRef.current = adUrls;
      currentAdIndexRef.current = 0;
      console.log('File d\'attente des pubs initialisée:', adUrls);

      // Lecture de la première pub
      playNextAd();
    } catch (err) {
      console.error('Erreur chargement VAST:', err);
      // En cas d'erreur, passer directement à la vidéo principale
      if (mainVideoRef.current) {
        mainVideoRef.current.src = videoUrl;
        // Pour les URLs d'iframe, ne pas tenter de jouer automatiquement
        if (!(videoUrl.includes('embed') || videoUrl.includes('zupload'))) {
          mainVideoRef.current.play().catch(playError => {
            console.error('Erreur de lecture automatique de la vidéo:', playError);
          });
        }
      }
      setIsAdPlaying(false);
      setIsLoading(false);
      setShowAd(false);
      setAdSkipped(true);
    }
  }

  // Fonction pour jouer la pub suivante
  const playNextAd = () => {
    if (!adVideoRef.current) return;

    const videoEl = adVideoRef.current;
    
    // Vérifier s'il y a une pub suivante
    if (currentAdIndexRef.current < adQueueRef.current.length) {
      const adUrl = adQueueRef.current[currentAdIndexRef.current];
      console.log('Lecture de la publicité:', currentAdIndexRef.current + 1, '/', adQueueRef.current.length, adUrl);
      
      // Lecture de la pub
      videoEl.src = adUrl;
      setIsAdPlaying(true);
      
      // Ajouter un gestionnaire d'erreurs pour la lecture
      videoEl.oncanplay = () => {
        console.log('La publicité peut être lue');
      };
      
      videoEl.onerror = (e) => {
        console.error('Erreur de chargement de la publicité:', e);
        // Passer à la pub suivante ou à la vidéo principale
        currentAdIndexRef.current++;
        playNextAd();
      };
      
      videoEl.play().catch(error => {
        console.error('Erreur de lecture de la pub:', error);
        // Passer à la pub suivante ou à la vidéo principale
        currentAdIndexRef.current++;
        playNextAd();
      });
      
      // Incrémenter l'index pour la prochaine pub
      currentAdIndexRef.current++;
      
      // Masquer le bouton de skip pendant 15 secondes
      setShowSkipButton(false);
      if (skipButtonTimeoutRef.current) {
        clearTimeout(skipButtonTimeoutRef.current);
      }
      skipButtonTimeoutRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, 15000); // 15 secondes
    } else {
      console.log('Toutes les publicités ont été jouées, lecture de la vidéo principale');
      // Toutes les pubs ont été jouées, lancer la vidéo principale
      if (mainVideoRef.current) {
        mainVideoRef.current.src = videoUrl;
        mainVideoRef.current.play().catch(error => {
          console.error('Erreur de lecture de la vidéo principale:', error);
          // Pour les URLs d'iframe, l'erreur est normale, masquer le loader
          if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
            setIsLoading(false);
          }
        });
      }
      setIsAdPlaying(false);
      setIsLoading(false);
      
      // Nettoyer le timeout du bouton skip
      if (skipButtonTimeoutRef.current) {
        clearTimeout(skipButtonTimeoutRef.current);
      }
      setShowSkipButton(false);
    }
  };

  // Handle video load
  const handleVideoLoad = () => {
    if (!isAdPlaying) {
      setIsLoading(false);
    }
  };

  // Handle video playing - for better loading indication
  const handleVideoPlaying = () => {
    if (!isAdPlaying) {
      setIsLoading(false);
      setError(null);
    }
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
    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Masquer le loader après 3 secondes pour les iframes
      
      return () => clearTimeout(loaderTimeout);
    }
  }, [videoUrl]);

  // Handle ad for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !adSkipped) {
      setShowAd(true);
      loadVastAd();
      
      // Précharger la vidéo principale pendant la lecture de la pub
      setTimeout(() => {
        preloadMainVideo();
      }, 2000); // Commencer le préchargement après 2 secondes
      
      const timer = setTimeout(() => {
        setShowAd(false);
        setAdSkipped(true);
        // Réinitialiser l'état de chargement après la fin de la pub
        setIsLoading(true);
        
        // Pour les URLs d'iframe, masquer rapidement le loader
        if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      }, 60000); // 60 seconds ad (augmenté pour gérer plusieurs pubs)
      return () => {
        clearTimeout(timer);
        if (skipButtonTimeoutRef.current) {
          clearTimeout(skipButtonTimeoutRef.current);
        }
      };
    } else {
      setShowAd(false);
      // S'assurer que l'état de chargement est réinitialisé quand il n'y a pas de pub
      if (!isAuthenticated || adSkipped) {
        setIsLoading(true);
        // Précharger la vidéo immédiatement pour les utilisateurs authentifiés
        setTimeout(() => {
          preloadMainVideo();
        }, 100);
        
        // Pour les URLs d'iframe, masquer rapidement le loader
        if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      }
    }
  }, [isAuthenticated, adSkipped]);

  const skipAd = () => {
    console.log('Passage des publicités demandé par l\'utilisateur');
    
    if (adVideoRef.current) {
      // Arrêter la lecture de la pub
      adVideoRef.current.pause();
      adVideoRef.current.oncanplay = null;
      adVideoRef.current.onerror = null;
    }
    
    // Passer toutes les pubs restantes et lancer la vidéo principale
    if (mainVideoRef.current) {
      mainVideoRef.current.src = videoUrl;
      
      // Pour les URLs d'iframe, ne pas tenter de jouer automatiquement
      if (!(videoUrl.includes('embed') || videoUrl.includes('zupload'))) {
        mainVideoRef.current.play().catch(error => {
          console.error('Erreur de lecture après avoir passé la pub:', error);
        });
      }
    }
    
    // Vider la file d'attente des pubs
    adQueueRef.current = [];
    currentAdIndexRef.current = 0;
    
    setIsAdPlaying(false);
    setShowAd(false);
    setAdSkipped(true);
    // Réinitialiser l'état de chargement après avoir passé la pub
    setIsLoading(false);
    
    // Nettoyer le timeout du bouton skip
    if (skipButtonTimeoutRef.current) {
      clearTimeout(skipButtonTimeoutRef.current);
    }
    setShowSkipButton(false);
  };

  // Show controls on mouse move and auto-hide after 3 seconds
  // Also handle touch events for mobile
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Handle touch events for mobile devices
  const handleTouch = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (skipButtonTimeoutRef.current) {
        clearTimeout(skipButtonTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen bg-black"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onMouseLeave={() => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 500);
        }
      }}
    >
      {/* Ad for non-authenticated users - HilltopAds VAST integration */}
      {showAd && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* HilltopAds VAST integration */}
            <div className="w-full h-full flex items-center justify-center">
              <video
                ref={adVideoRef}
                controls
                width="100%"
                height="100%"
                preload="auto"
                className="w-full h-full"
                onLoad={handleVideoLoad}
                onPlaying={handleVideoPlaying}
                onError={handleVideoError}
                onEnded={() => {
                  if (isAdPlaying) {
                    // Pub terminée, jouer la pub suivante ou la vidéo principale
                    playNextAd();
                  }
                }}
              />
            </div>
            {showSkipButton && (
              <button
                onClick={skipAd}
                className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded hover:bg-black/90 transition-colors z-40"
              >
                Passer la pub
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !showAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm sm:text-base">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !showAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-4">
          <div className="text-center p-6 bg-black/80 rounded-lg max-w-md w-full">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Erreur de chargement</h3>
            <p className="text-gray-300 mb-4 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay for Zupload - Always visible but with transparency */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Top Controls - Season and Episode Selection */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center space-x-2">
            {onSeasonChange && (
              <Select 
                value={currentSeason.toString()} 
                onValueChange={(value) => onSeasonChange(parseInt(value))}
              >
                <SelectTrigger className="w-16 md:w-24 bg-black/70 text-white border-white/20 text-xs sm:text-sm">
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
                <SelectTrigger className="w-16 md:w-24 bg-black/70 text-white border-white/20 text-xs sm:text-sm">
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
          
          <div className="flex space-x-1 sm:space-x-2">
            {onSkipIntro && (
              <button
                onClick={onSkipIntro}
                className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-black/90 transition-colors flex items-center text-xs sm:text-sm"
              >
                <RotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Passer l'intro</span>
                <span className="sm:hidden">Intro</span>
              </button>
            )}
            
            {onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-black/90 transition-colors flex items-center text-xs sm:text-sm"
              >
                <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Épisode suivant</span>
                <span className="sm:hidden">Suiv.</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Middle Controls - Previous/Next Episode Navigation */}
        <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center space-x-2">
            {onPreviousEpisode && (
              <Button
                onClick={onPreviousEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                disabled={currentEpisode <= 1}
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onNextEpisode && (
              <Button
                onClick={onNextEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                disabled={currentEpisode >= totalEpisodes}
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {!showAd && (
        <>
          {/* For iframe embeds (Zupload) */}
          {videoUrl.includes('embed') ? (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
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
              className="w-full h-full"
              onLoad={handleVideoLoad}
              onPlaying={handleVideoPlaying}
              onError={handleVideoError}
              onEnded={onVideoEnd}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;