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
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adDuration, setAdDuration] = useState(15); // Durée par défaut de 15 secondes
  const [adExpanded, setAdExpanded] = useState(false); // Nouvel état pour gérer l'expansion de la pub
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
        // Démarrer la lecture automatiquement sur mobile
        if (isMobileDevice()) {
          videoEl.play().catch(error => {
            console.error('Erreur de lecture automatique de la pub sur mobile:', error);
          });
        }
      };
      
      videoEl.onerror = (e) => {
        console.error('Erreur de chargement de la publicité:', e);
        // Passer à la pub suivante ou à la vidéo principale
        currentAdIndexRef.current++;
        playNextAd();
      };
      
      // Sur mobile, essayer de jouer automatiquement
      if (!isMobileDevice()) {
        videoEl.play().catch(error => {
          console.error('Erreur de lecture de la pub:', error);
          // Passer à la pub suivante ou à la vidéo principale
          currentAdIndexRef.current++;
          playNextAd();
        });
      }
      
      // Incrémenter l'index pour la prochaine pub
      currentAdIndexRef.current++;
      
      // Masquer le bouton de skip pendant 3 secondes sur mobile, 3 sur desktop (expérience utilisateur améliorée)
      setShowSkipButton(false);
      if (skipButtonTimeoutRef.current) {
        clearTimeout(skipButtonTimeoutRef.current);
      }
      // Détecter si on est sur mobile
      const isMobile = isMobileDevice();
      const skipDelay = isMobile ? 3000 : 3000; // 3 secondes pour tous les appareils
      skipButtonTimeoutRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, skipDelay);
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

  // Handle ad time update
  const handleAdTimeUpdate = () => {
    if (adVideoRef.current && isAdPlaying) {
      setAdCurrentTime(adVideoRef.current.currentTime);
      
      // Mettre à jour la durée si elle n'est pas encore définie
      if (adVideoRef.current.duration && adVideoRef.current.duration > 0 && adDuration === 15) {
        setAdDuration(adVideoRef.current.duration);
      }
    }
  };

  // Handle ad loaded metadata
  const handleAdLoadedMetadata = () => {
    if (adVideoRef.current && isAdPlaying) {
      // Mettre à jour la durée de la pub
      if (adVideoRef.current.duration && adVideoRef.current.duration > 0) {
        setAdDuration(adVideoRef.current.duration);
      }
    }
  };

  // Fonction pour agrandir/réduire la publicité
  const toggleAdExpand = () => {
    setAdExpanded(!adExpanded);
  };

  // Effet pour mettre à jour le temps de la pub
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAdPlaying && adVideoRef.current) {
      interval = setInterval(() => {
        if (adVideoRef.current) {
          setAdCurrentTime(adVideoRef.current.currentTime);
          
          // Mettre à jour la durée si elle n'est pas encore définie
          if (adVideoRef.current.duration && adVideoRef.current.duration > 0 && adDuration === 15) {
            setAdDuration(adVideoRef.current.duration);
          }
        }
      }, 100);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAdPlaying, adDuration]);

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
    // Optimisation du loader pour une meilleure expérience utilisateur
    const loaderDelay = isMobileDevice() ? 800 : 800; // 0.8 seconde pour tous les appareils
    
    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
      }, loaderDelay);
      
      return () => clearTimeout(loaderTimeout);
    }
  }, [videoUrl]);

  // Handle ad for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !adSkipped) {
      setShowAd(true);
      loadVastAd();
      
      // Déterminer si on est sur mobile
      const isMobile = isMobileDevice();
      
      // Précharger la vidéo principale pendant la lecture de la pub
      // Préchargement optimisé pour tous les appareils
      const preloadDelay = isMobile ? 2500 : 2500; // 2.5 secondes pour tous les appareils
      
      setTimeout(() => {
        preloadMainVideo();
      }, preloadDelay);
      
      // Ajuster la durée de la pub - expérience utilisateur équilibrée
      const adDuration = isMobile ? 20000 : 20000; // 20 secondes pour tous les appareils
      
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
      }, adDuration);
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

  // Handle touch events for all devices with tap detection
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    tapCountRef.current++;
    
    if (tapCountRef.current === 1) {
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap - show controls
        setShowControls(true);
        
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        
        // Pour tous les appareils tactiles, garder les contrôles visibles plus longtemps
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 4000); // 4 secondes pour tous les appareils tactiles
        
        tapCountRef.current = 0;
      }, 300);
    } else if (tapCountRef.current === 2) {
      // Double tap - play/pause
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      
      if (!isAdPlaying && !showAd) {
        togglePlayPause();
      } else if (isAdPlaying && showAd) {
        // Si une pub est en cours, toggle play/pause aussi
        togglePlayPause();
      }
      
      tapCountRef.current = 0;
    }
  };

  // Show controls on mouse move (desktop) or touch (mobile)
  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Pour les appareils de bureau, masquer plus rapidement
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // 3 secondes sur desktop
  };

  // Handle touch end event
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    // Ne pas masquer immédiatement les contrôles après un touch
  };

  // Fonction play/pause pour le lecteur vidéo
  const togglePlayPause = () => {
    if (mainVideoRef.current) {
      if (mainVideoRef.current.paused) {
        mainVideoRef.current.play().catch(error => {
          console.error('Erreur de lecture:', error);
        });
      } else {
        mainVideoRef.current.pause();
      }
    }
    
    if (adVideoRef.current && isAdPlaying) {
      if (adVideoRef.current.paused) {
        adVideoRef.current.play().catch(error => {
          console.error('Erreur de lecture de la pub:', error);
        });
      } else {
        adVideoRef.current.pause();
      }
    }
  };

  // Amélioration de la détection mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen bg-black transition-colors duration-3300"
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
      {/* Ad expansion overlay */}
      {showAd && adExpanded && (
        <div 
          className="ad-expanded-overlay"
          onClick={() => setAdExpanded(false)}
        />
      )}
      
      {/* Ad for non-authenticated users - HilltopAds VAST integration in enhanced banner with animations */}
      {showAd && (
        <div className={`absolute ${adExpanded ? 'inset-0 sm:inset-4 md:inset-8 lg:inset-12' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'} z-30 bg-gradient-to-r from-black/90 to-gray-900/90 rounded-xl border-4 border-red-500 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:shadow-2xl animate-fade-in advertising-container`}>
          <div className="advertising-label">PUBLICITÉ</div>
          <div className="relative w-full flex items-center justify-between p-3 sm:p-4">
            {/* Enhanced ad player with loading indicator and progress bar */}
            <div className="flex-1 min-w-0 mr-3 sm:mr-4">
              <div className="bg-black rounded-lg overflow-hidden relative mx-auto" style={{ height: adExpanded ? '250px' : '150px', width: adExpanded ? '250px' : '150px' }}>
                <video
                  ref={adVideoRef}
                  controls={false}
                  width="100%"
                  height="100%"
                  preload="auto"
                  className="w-full h-full touch-manipulation object-cover transition-opacity duration-300"
                  onLoad={handleVideoLoad}
                  onPlaying={handleVideoPlaying}
                  onError={handleVideoError}
                  onTimeUpdate={handleAdTimeUpdate}
                  onLoadedMetadata={handleAdLoadedMetadata}
                  onEnded={() => {
                    if (isAdPlaying) {
                      // Pub terminée, jouer la pub suivante ou la vidéo principale
                      playNextAd();
                    }
                  }}
                  playsInline
                  muted
                  autoPlay
                />
                {/* Progress bar for ad */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300 rounded-r"
                    style={{ width: `${(adCurrentTime / adDuration) * 100}%` }}
                  ></div>
                </div>
                {/* Ad loading overlay */}
                {isAdPlaying && adCurrentTime === 0 && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Ad controls with improved UX and animations */}
            <div className="flex flex-col items-center space-y-2 sm:space-y-3">
              {showSkipButton ? (
                <button
                  onClick={skipAd}
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-orange-600 transition-all duration-200 text-sm font-bold whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
                >
                  <span>Passer</span>
                  <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded font-bold">
                    {Math.ceil(adDuration - adCurrentTime)}s
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-700 text-gray-400 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-bold whitespace-nowrap shadow-md opacity-70 flex items-center"
                >
                  <span>Passer</span>
                  <span className="ml-2 text-xs bg-black/30 px-1.5 py-0.5 rounded font-bold">
                    {Math.ceil(adDuration - adCurrentTime)}s
                  </span>
                </button>
              )}
              <button
                onClick={toggleAdExpand}
                className="bg-white/10 text-white px-3 py-1 rounded-lg hover:bg-white/20 transition-all duration-200 text-xs font-medium whitespace-nowrap border border-white/30 hover:border-white/50 transform hover:scale-105"
              >
                {adExpanded ? 'Réduire' : 'Voir la pub'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator - Optimized for mobile */}
      {isLoading && !showAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6 max-w-xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6 sm:mb-8"></div>
            <p className="text-white text-lg sm:text-xl px-4 font-medium">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display - Optimized for mobile */}
      {error && !showAd && (
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

      {/* Custom Controls Overlay for Zupload - Enhanced for all devices */}
      <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300">
        {/* Top Controls - Season and Episode Selection - Enhanced for all devices */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center pointer-events-auto transition-all duration-300">
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
                className="bg-black/70 text-white px-2 py-1 rounded hover:bg-black/90 transition-colors flex items-center text-xs"
              >
                <RotateCw className="w-3 h-3 mr-1" />
                <span className="hidden xs:inline">Intro</span>
              </button>
            )}
            
            {onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="bg-black/70 text-white px-2 py-1 rounded hover:bg-black/90 transition-colors flex items-center text-xs"
              >
                <SkipForward className="w-3 h-3 mr-1" />
                <span className="hidden xs:inline">Suiv.</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Middle Controls - Previous/Next Episode Navigation - Enhanced for all devices */}
        <div className="absolute top-1/2 left-3 sm:left-4 right-3 sm:right-4 transform -translate-y-1/2 flex justify-between items-center pointer-events-auto transition-all duration-300">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {onPreviousEpisode && (
              <Button
                onClick={onPreviousEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full"
                disabled={currentEpisode <= 1}
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {onNextEpisode && (
              <Button
                onClick={onNextEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full"
                disabled={currentEpisode >= totalEpisodes}
              >
                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {!showAd && (
        <>
          {/* For iframe embeds (Zupload) - Mobile optimized */}
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
        </>
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;