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
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [noAdsMessage, setNoAdsMessage] = useState(false);
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

        // Vérifier s'il y a des éléments Wrapper ou Inline
        const wrappers = xml.querySelectorAll('Wrapper');
        const inlines = xml.querySelectorAll('InLine');
        console.log('Éléments Wrapper trouvés:', wrappers.length);
        console.log('Éléments InLine trouvés:', inlines.length);

        // Afficher la structure XML pour debug
        console.log('Structure XML VAST:', xml.documentElement.outerHTML.substring(0, 500) + '...');

        console.warn('Pas de Ad dans le VAST - Aucune publicité disponible');
        console.log('Affichage du message informatif');

        // Afficher un message informatif pendant 2 secondes
        setNoAdsMessage(true);
        setTimeout(() => {
          setNoAdsMessage(false);
          if (mainVideoRef.current) {
            mainVideoRef.current.src = videoUrl; // pas de pub, lance la vidéo normale
          }
          setIsLoading(false);
          setIsAdPlaying(false);
          setShowAd(false); // Masquer l'écran de pub
        }, 2000);

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
        console.warn('Pas de MediaFile dans le VAST - Aucune URL de publicité trouvée');
        console.log('URLs de pubs extraites:', adUrls);

        // Afficher un message informatif pendant 2 secondes
        setNoAdsMessage(true);
        setTimeout(() => {
          setNoAdsMessage(false);
          if (mainVideoRef.current) {
            mainVideoRef.current.src = videoUrl; // pas de pub, lance la vidéo normale
          }
          setIsLoading(false);
          setIsAdPlaying(false);
          setShowAd(false); // Masquer l'écran de pub
        }, 2000);

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

    setShowPlayButton(false); // Masquer le bouton play pour la nouvelle pub

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
        // Détecter si on est sur mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
          // Sur desktop, passer à la pub suivante
          currentAdIndexRef.current++;
          playNextAd();
        } else {
          // Sur mobile, si autoplay échoue, afficher le bouton play
          console.log('Autoplay échoué sur mobile, affichage du bouton play');
          setShowPlayButton(true);
          // Définir un timeout pour passer après 30 secondes si pas en lecture
          setTimeout(() => {
            if (videoEl && !videoEl.paused && videoEl.currentTime > 0) return; // Si l'utilisateur a commencé la lecture, ne pas passer
            currentAdIndexRef.current++;
            playNextAd();
          }, 30000);
        }
      });

      // Masquer le bouton play quand la vidéo commence à jouer
      videoEl.onplay = () => {
        setShowPlayButton(false);
        setIsAdPlaying(true);
      };

      // Incrémenter l'index pour la prochaine pub
      currentAdIndexRef.current++;
      
      // Masquer le bouton de skip pendant 5 secondes sur mobile, 10 sur desktop
      setShowSkipButton(false);
      if (skipButtonTimeoutRef.current) {
        clearTimeout(skipButtonTimeoutRef.current);
      }
      // Détecter si on est sur mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const skipDelay = isMobile ? 5000 : 10000; // 5 secondes sur mobile, 10 sur desktop
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

  // Handle video error
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.error('Erreur vidéo détectée:', e);
    console.error('Type d\'erreur:', (e.target as HTMLVideoElement).error);
    console.error('Code d\'erreur:', (e.target as HTMLVideoElement).error?.code);
    console.error('Message d\'erreur:', (e.target as HTMLVideoElement).error?.message);

    setIsLoading(false);

    // Message d'erreur spécifique selon le type d'appareil
    const errorMessage = isMobile
      ? 'Erreur de chargement vidéo sur mobile. Vérifiez votre connexion réseau.'
      : 'Failed to load video content';

    setError(errorMessage);
    onVideoError?.(errorMessage);
  };

  // Reset loading state when videoUrl changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    videoPreloadStartedRef.current = false; // Réinitialiser le flag de préchargement

    // Pour les URLs d'iframe, réduire le temps d'affichage du loader
    // Sur mobile, donner plus de temps pour le chargement
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const loaderDelay = isMobile ? 3000 : 2000; // 3 secondes sur mobile, 2 sur desktop

    console.log('Configuration du loader pour:', videoUrl, 'Mobile:', isMobile, 'Delay:', loaderDelay);
    console.log('Type de vidéo:', videoUrl.includes('embed') || videoUrl.includes('zupload') ? 'Iframe Zupload' : 'Vidéo directe');

    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      const loaderTimeout = setTimeout(() => {
        console.log('Masquage automatique du loader après timeout pour iframe');
        setIsLoading(false);
      }, loaderDelay);

      return () => clearTimeout(loaderTimeout);
    } else {
      // Pour les vidéos directes, vérifier la compatibilité du format sur mobile
      if (isMobile) {
        console.log('Vérification compatibilité format vidéo sur mobile');
        // Les formats MP4 sont généralement bien supportés, mais vérifions
        const isSupportedFormat = videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.m3u8');
        if (!isSupportedFormat) {
          console.warn('Format vidéo potentiellement non supporté sur mobile:', videoUrl);
        }
      }
    }
  }, [videoUrl]);

  // Vérifier la connectivité réseau sur mobile
  const checkNetworkConnectivity = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && 'navigator' in window && 'onLine' in navigator) {
      if (!navigator.onLine) {
        console.warn('Pas de connexion réseau détectée sur mobile');
        setError('Pas de connexion réseau. Vérifiez votre connexion internet.');
        setIsLoading(false);
        return false;
      }
    }
    return true;
  };

  // Handle ad for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !adSkipped) {
      // Vérifier la connectivité avant de charger les pubs
      if (!checkNetworkConnectivity()) return;

      setShowAd(true);
      loadVastAd();
      
      // Déterminer si on est sur mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Précharger la vidéo principale pendant la lecture de la pub
      // Sur mobile, commencer le préchargement plus tard pour économiser la bande passante
      const preloadDelay = isMobile ? 5000 : 3000; // 5 secondes sur mobile, 3 sur desktop
      
      setTimeout(() => {
        preloadMainVideo();
      }, preloadDelay);
      
      // Ajuster la durée de la pub selon le type d'appareil
      const adDuration = isMobile ? 30000 : 45000; // 30 secondes sur mobile, 45 sur desktop
      
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
        // Vérifier la connectivité réseau avant de charger la vidéo
        if (!checkNetworkConnectivity()) return;

        console.log('Chargement de la vidéo principale (pas de pub)');
        setIsLoading(true);
        // Précharger la vidéo immédiatement pour les utilisateurs authentifiés
        setTimeout(() => {
          preloadMainVideo();
        }, 100);

        // Détecter si on est sur mobile pour ajuster les timeouts
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Pour les URLs d'iframe, masquer le loader après un délai
        if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
          const iframeTimeout = isMobile ? 5000 : 3000; // 5s sur mobile, 3s sur desktop
          setTimeout(() => {
            console.log('Timeout du loader iframe atteint, masquage forcé');
            setIsLoading(false);
          }, iframeTimeout);
        } else {
          // Pour les vidéos directes, timeout plus long sur mobile
          const videoTimeout = isMobile ? 10000 : 5000; // 10s sur mobile, 5s sur desktop
          setTimeout(() => {
            console.log('Timeout du loader vidéo atteint, masquage forcé');
            setIsLoading(false);
          }, videoTimeout);
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
    setShowPlayButton(false);
    // Réinitialiser l'état de chargement après avoir passé la pub
    setIsLoading(false);
    
    // Nettoyer le timeout du bouton skip
    if (skipButtonTimeoutRef.current) {
      clearTimeout(skipButtonTimeoutRef.current);
    }
    setShowSkipButton(false);
  };

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
                className="w-full h-full touch-manipulation"
                onLoad={handleVideoLoad}
                onPlaying={handleVideoPlaying}
                onError={handleVideoError}
                onEnded={() => {
                  if (isAdPlaying) {
                    // Pub terminée, jouer la pub suivante ou la vidéo principale
                    playNextAd();
                  }
                }}
                playsInline
              />
            </div>
            {showSkipButton && (
              <button
                onClick={skipAd}
                className="absolute top-4 right-4 bg-black/80 text-white px-4 py-3 rounded-lg hover:bg-black/90 transition-colors z-40 text-base sm:text-lg sm:px-5 sm:py-3 md:px-6 md:py-4 font-medium"
              >
                Passer la pub
              </button>
            )}

            {showPlayButton && (
              <button
                onClick={() => {
                  if (adVideoRef.current) {
                    adVideoRef.current.play().catch(err => console.error('Erreur lors du clic play:', err));
                  }
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-35"
              >
                <div className="bg-white/90 rounded-full p-6 sm:p-8 md:p-10 hover:bg-white transition-colors">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </button>
            )}

            {noAdsMessage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
                <div className="text-center p-6 max-w-sm">
                  <div className="text-4xl mb-4">📺</div>
                  <h3 className="text-xl font-bold text-white mb-2">Aucune publicité disponible</h3>
                  <p className="text-gray-300 text-sm">Chargement de votre vidéo...</p>
                </div>
              </div>
            )}
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
                console.log('Iframe Zupload chargée avec succès');
                setIsLoading(false);
                setError(null);
              }}
              onError={(e) => {
                console.error('Erreur de chargement de l\'iframe Zupload:', e);
                console.error('URL de l\'iframe:', videoUrl);
                setIsLoading(false);
                setError('Impossible de charger la vidéo Zupload');
                onVideoError?.('Impossible de charger la vidéo Zupload');
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
              onLoad={() => {
                console.log('Vidéo directe chargée avec succès');
                handleVideoLoad();
              }}
              onPlaying={() => {
                console.log('Vidéo directe en lecture');
                handleVideoPlaying();
              }}
              onError={(e) => {
                console.error('Erreur de chargement de la vidéo directe:', e);
                console.error('URL de la vidéo:', videoUrl);
                handleVideoError(e);
              }}
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