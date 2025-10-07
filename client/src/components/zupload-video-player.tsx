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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adQueueRef = useRef<string[]>([]); // File d'attente des pubs
  const currentAdIndexRef = useRef(0); // Index de la pub actuelle
  const videoPreloadStartedRef = useRef(false); // Pour éviter le préchargement multiple
  const userPausedRef = useRef(false); // Pour détecter les interruptions

  // Fonction utilitaire pour détecter les appareils mobiles
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Détecter la connexion lente
  const isSlowConnection = () => {
    const connection = (navigator as any).connection;
    return connection && (connection.effectiveType === 'slow-2g' ||
           connection.effectiveType === '2g' ||
           connection.downlink < 1);
  };

  // Stratégie autoplay selon le navigateur
  const getAutoplayStrategy = () => {
    const ua = navigator.userAgent;

    if (ua.includes('Safari') && !ua.includes('Chrome')) {
      return 'user-gesture-required'; // iOS Safari
    }
    if (ua.includes('Mobile') && ua.includes('Chrome')) {
      return 'muted-autoplay-allowed'; // Android Chrome
    }
    return 'standard-autoplay'; // Desktop
  };

  const autoplayStrategy = getAutoplayStrategy();

  // URL VAST de HilltopAds
  const vastTag = 'https://silkyspite.com/dum.Flzod/GONlvhZdGIUd/Iebmf9UuFZqUllZktPNTWYx2jNhjiYNwbN/TqkethN/jbY/2pNWj-AN2aMaAc';

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
      // Ajout d'options pour améliorer la compatibilité mobile
      const response = await fetch(vastTag, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'User-Agent': navigator.userAgent,
        }
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        console.warn('Erreur HTTP lors du chargement du VAST:', response.status, response.statusText);
        // Sur mobile, on continue vers la vidéo principale en cas d'erreur
        if (isMobileDevice) {
          console.log('Erreur VAST sur mobile, passage à la vidéo principale');
          if (mainVideoRef.current) {
            mainVideoRef.current.src = videoUrl;
            setIsLoading(false);
            setIsAdPlaying(false);
            setShowAd(false);
            setAdSkipped(true);
          }
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      console.log('Réponse VAST reçue:', xmlText.substring(0, 200) + '...'); // Afficher les 200 premiers caractères
      
      // Vérifier si la réponse est vide ou invalide
      if (!xmlText || xmlText.trim().length === 0) {
        console.warn('Réponse VAST vide');
        // Sur mobile, on continue vers la vidéo principale en cas d'erreur
        if (isMobileDevice) {
          console.log('Réponse VAST vide sur mobile, passage à la vidéo principale');
          if (mainVideoRef.current) {
            mainVideoRef.current.src = videoUrl;
            setIsLoading(false);
            setIsAdPlaying(false);
            setShowAd(false);
            setAdSkipped(true);
          }
          return;
        }
        throw new Error('Réponse VAST vide');
      }
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "text/xml");
      
      // Vérifier les erreurs de parsing XML
      const parserError = xml.querySelector('parsererror');
      if (parserError) {
        console.warn('Erreur de parsing XML VAST:', parserError.textContent);
        // Sur mobile, on continue vers la vidéo principale en cas d'erreur
        if (isMobileDevice) {
          console.log('Erreur de parsing XML VAST sur mobile, passage à la vidéo principale');
          if (mainVideoRef.current) {
            mainVideoRef.current.src = videoUrl;
            setIsLoading(false);
            setIsAdPlaying(false);
            setShowAd(false);
            setAdSkipped(true);
          }
          return;
        }
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
        // Sur mobile, on continue vers la vidéo principale en cas d'erreur
        if (isMobileDevice) {
          console.log('Pas de Ad dans le VAST sur mobile, passage à la vidéo principale');
          // Afficher un message plus clair à l'utilisateur
          setError('Aucune publicité disponible pour le moment. La lecture va commencer.');
          setTimeout(() => {
            if (mainVideoRef.current) {
              mainVideoRef.current.src = videoUrl;
              setIsLoading(false);
              setIsAdPlaying(false);
              setShowAd(false);
              setAdSkipped(true);
            }
          }, 2000); // Attendre 2 secondes pour que l'utilisateur puisse lire le message
          return;
        }
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
        // Sur mobile, on continue vers la vidéo principale en cas d'erreur
        if (isMobileDevice) {
          console.log('Pas de MediaFile dans le VAST sur mobile, passage à la vidéo principale');
          if (mainVideoRef.current) {
            mainVideoRef.current.src = videoUrl;
            setIsLoading(false);
            setIsAdPlaying(false);
            setShowAd(false);
            setAdSkipped(true);
          }
          return;
        }
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
            // Sur mobile, on ignore cette erreur
            if (isMobileDevice) {
              console.log('Erreur de lecture automatique ignorée sur mobile');
            }
          });
        }
      }
      setIsAdPlaying(false);
      setIsLoading(false);
      setShowAd(false);
      setAdSkipped(true);
      // Sur mobile, on affiche un message d'erreur plus spécifique si nécessaire
      if (isMobileDevice) {
        setError('Aucune publicité disponible. La lecture va commencer.');
        // Masquer l'erreur après 2 secondes et continuer vers la vidéo
        setTimeout(() => {
          setError(null);
          setIsLoading(false);
        }, 2000);
      }
    }
  }

  // Fonction pour essayer le format suivant si le premier échoue
  const tryNextFormat = (adIndex: number) => {
    if (!adVideoRef.current) return;

    const videoEl = adVideoRef.current;
    const ad = adQueueRef.current[adIndex];

    if (!ad) {
      skipAd();
      return;
    }

    // Sur mobile, essayer MP4 d'abord (plus compatible)
    let formatUrl = ad;
    if (isMobileDevice) {
      // Préférer MP4 sur mobile
      formatUrl = ad.replace('.webm', '.mp4').replace('.flv', '.mp4');
    }

    // Pour connexion lente, utiliser qualité inférieure
    if (isMobileDevice && isSlowConnection()) {
      formatUrl = formatUrl.replace('720', '480');
    }

    console.log('Tentative de lecture avec format:', formatUrl);
    videoEl.src = formatUrl;
    setIsAdPlaying(true);
    videoEl.muted = true;

    videoEl.onerror = () => {
      console.log('Format actuel échoué, tentative avec format alternatif');

      // Essayer le format alternatif
      let altFormat = ad;
      if (formatUrl.includes('.mp4')) {
        altFormat = ad.replace('.mp4', '.webm');
      } else if (formatUrl.includes('.webm')) {
        altFormat = ad.replace('.webm', '.mp4');
      }

      if (altFormat !== formatUrl) {
        videoEl.src = altFormat;
        videoEl.onerror = () => {
          console.log('Format alternatif échoué, passage à la pub suivante');
          currentAdIndexRef.current++;
          playNextAd();
        };
      } else {
        // Pas de format alternatif, passer à la suivante
        currentAdIndexRef.current++;
        playNextAd();
      }
    };
  };

  // Fonction pour jouer la pub suivante
  const playNextAd = () => {
    if (!adVideoRef.current) return;

    const videoEl = adVideoRef.current;

    // Vérifier s'il y a une pub suivante
    if (currentAdIndexRef.current < adQueueRef.current.length) {
      const adUrl = adQueueRef.current[currentAdIndexRef.current];
      console.log('Lecture de la publicité:', currentAdIndexRef.current + 1, '/', adQueueRef.current.length, adUrl);

      // Utiliser la fonction améliorée pour les formats
      tryNextFormat(currentAdIndexRef.current);
      
      // Ajouter un gestionnaire d'erreurs pour la lecture
      videoEl.oncanplay = () => {
        console.log('La publicité peut être lue');
      };
      
      videoEl.onerror = (e) => {
        console.error('Erreur de chargement de la publicité:', e);
        // Sur mobile, on continue quand même vers la vidéo principale
        if (isMobileDevice) {
          console.log('Erreur de publicité sur mobile, passage à la vidéo principale');
          skipAd();
          return;
        }
        // Passer à la pub suivante ou à la vidéo principale
        currentAdIndexRef.current++;
        playNextAd();
      };
      
      // Gestion améliorée de l'autoplay selon la stratégie
      if (autoplayStrategy === 'user-gesture-required') {
        // iOS Safari : nécessite une interaction explicite
        console.log('Stratégie iOS Safari : interaction utilisateur requise');
        // L'overlay sera affiché, pas d'autoplay automatique
      } else if (autoplayStrategy === 'muted-autoplay-allowed') {
        // Android Chrome : autoplay muet autorisé
        console.log('Stratégie Android Chrome : autoplay muet');
        videoEl.setAttribute('autoplay', 'true');
        videoEl.setAttribute('muted', 'true');
        videoEl.setAttribute('playsinline', 'true');

        videoEl.play().catch(err => {
          console.log('Autoplay Android échoué:', err);
          // Fallback vers interaction utilisateur
        });
      } else {
        // Desktop : jouer directement
        videoEl.play().catch(error => {
          console.error('Erreur de lecture de la pub:', error);
          currentAdIndexRef.current++;
          playNextAd();
        });
      }

      // Gestion des interruptions (appels, notifications)
      videoEl.onpause = () => {
        if (isAdPlaying && !userPausedRef.current) {
          console.log('Interruption détectée, tentative de reprise');
          setTimeout(() => {
            if (adVideoRef.current && isAdPlaying) {
              adVideoRef.current.play().catch(() => {
                console.log('Reprise échouée, passage à la vidéo principale');
                skipAd();
              });
            }
          }, 2000);
        }
      };

      videoEl.onplay = () => {
        userPausedRef.current = false;
      };
      
      // Incrémenter l'index pour la prochaine pub
      currentAdIndexRef.current++;
      
      // Masquer le bouton de skip pendant 5 secondes sur mobile, 10 sur desktop
      setShowSkipButton(false);
      if (skipButtonTimeoutRef.current) {
        clearTimeout(skipButtonTimeoutRef.current);
      }
      // Détecter si on est sur mobile
      const skipDelay = isMobileDevice ? 5000 : 10000; // 5 secondes sur mobile, 10 sur desktop
      skipButtonTimeoutRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, skipDelay);
    } else {
      console.log('Toutes les publicités ont été jouées, lecture de la vidéo principale');
      // Toutes les pubs ont été jouées, lancer la vidéo principale
      if (mainVideoRef.current) {
        mainVideoRef.current.src = videoUrl;
        // Ajout d'attributs pour améliorer la compatibilité mobile
        if (isMobileDevice) {
          mainVideoRef.current.setAttribute('playsinline', 'true');
          mainVideoRef.current.setAttribute('muted', 'false'); // La vidéo principale peut avoir le son
        }
        
        mainVideoRef.current.play().catch(error => {
          console.error('Erreur de lecture de la vidéo principale:', error);
          // Pour les URLs d'iframe, l'erreur est normale, masquer le loader
          if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
            setIsLoading(false);
          }
          // Sur mobile, on continue malgré l'erreur
          if (isMobileDevice) {
            console.log('Erreur de lecture principale ignorée sur mobile');
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
    console.error('Erreur de chargement de la vidéo:', e);
    setIsLoading(false);
    // Sur mobile, certaines URLs peuvent échouer à charger, on tente un fallback
    if (isMobileDevice && videoUrl.includes('embed')) {
      setError('Le contenu mobile n\'est pas disponible. Veuillez réessayer plus tard.');
    } else {
      setError('Impossible de charger la vidéo. Veuillez vérifier votre connexion.');
    }
    onVideoError?.('Failed to load video content');
  };

  // Reset loading state when videoUrl changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    videoPreloadStartedRef.current = false; // Réinitialiser le flag de préchargement
    
    // Pour les URLs d'iframe, réduire le temps d'affichage du loader
    // Sur mobile, masquer encore plus rapidement
    const loaderDelay = isMobileDevice ? 1000 : 2000; // 1 seconde sur mobile, 2 sur desktop
    
    // Ajustement pour s'assurer que le loader s'affiche correctement
    if (videoUrl.includes('embed') || videoUrl.includes('zupload')) {
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
      }, loaderDelay);
      
      return () => clearTimeout(loaderTimeout);
    } else {
      // Pour les vidéos directes, masquer le loader après un court délai
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
      }, isMobileDevice ? 500 : 1000);
      
      return () => clearTimeout(loaderTimeout);
    }
  }, [videoUrl]);

  // Handle ad for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !adSkipped) {
      setShowAd(true);
      loadVastAd();
      
      // Précharger la vidéo principale pendant la lecture de la pub
      // Sur mobile, commencer le préchargement plus tard pour économiser la bande passante
      const preloadDelay = isMobileDevice ? 5000 : 3000; // 5 secondes sur mobile, 3 sur desktop
      
      // Réactivation du préchargement avec des ajustements pour mobile
      setTimeout(() => {
        preloadMainVideo();
      }, preloadDelay);
      
      // Ajuster la durée de la pub selon le type d'appareil
      const adDuration = isMobileDevice ? 30000 : 45000; // 30 secondes sur mobile, 45 sur desktop
      
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
        // Sur mobile, on masque le loader immédiatement pour les utilisateurs authentifiés
        else if (isMobileDevice) {
          setIsLoading(false);
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

    // Marquer l'interaction utilisateur pour les pubs
    if (isMobileDevice && !hasUserInteracted) {
      setHasUserInteracted(true);
    }
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

  // Reset user interaction state when ad changes
  useEffect(() => {
    if (!showAd) {
      setHasUserInteracted(false);
      userPausedRef.current = false;
    }
  }, [showAd]);

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
                muted
                // Ajout d'attributs supplémentaires pour améliorer la compatibilité mobile
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: 'black'
                }}
                // Sur mobile, s'assurer que la vidéo est visible
                {...(isMobileDevice && {
                  playsInline: true,
                  muted: true,
                  autoPlay: true,
                  controls: true
                })}
              />
            </div>

            {/* Overlay "Tap to Play" pour iOS Safari */}
            {isMobileDevice && autoplayStrategy === 'user-gesture-required' && !hasUserInteracted && (
              <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center">
                <div className="text-center p-8 max-w-sm">
                  <div className="text-white text-4xl mb-6">📱</div>
                  <h3 className="text-white text-xl font-bold mb-4">Touchez pour commencer</h3>
                  <p className="text-gray-300 mb-6 text-sm">
                    Les publicités vont démarrer après votre interaction
                  </p>
                  <button
                    onClick={() => {
                      setHasUserInteracted(true);
                      playNextAd();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                  >
                    Commencer la lecture
                  </button>
                </div>
              </div>
            )}

            {/* Bouton skip amélioré pour mobile */}
            {showSkipButton && (
              <button
                onClick={skipAd}
                className={`${
                  isMobileDevice
                    ? "absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-8 py-4 rounded-lg text-xl font-bold z-40 border-2 border-white/20"
                    : "absolute top-4 right-4 bg-black/80 text-white px-4 py-3 rounded-lg hover:bg-black/90 transition-colors z-40 text-base sm:text-lg sm:px-5 sm:py-3 md:px-6 md:py-4 font-medium"
                }`}
              >
                {isMobileDevice ? "⏭️ Passer la pub" : "Passer la pub"}
              </button>
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
                console.log('Iframe Zupload chargée');
                setIsLoading(false);
                setError(null);
              }}
              onError={(e) => {
                console.error('Erreur de chargement de l\'iframe Zupload:', e);
                setIsLoading(false);
                // Sur mobile, on affiche un message plus spécifique
                if (isMobileDevice) {
                  setError('Le contenu mobile n\'est pas disponible pour le moment. Veuillez réessayer plus tard ou utiliser un ordinateur.');
                } else {
                  setError('Impossible de charger la vidéo');
                }
                onVideoError?.('Impossible de charger la vidéo');
              }}
              // Ajout de propriétés pour améliorer la compatibilité mobile
              style={{ 
                width: '100%', 
                height: '100%',
                minHeight: isMobileDevice ? '200px' : 'auto'
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
              // Ajout de propriétés pour améliorer la compatibilité mobile
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'cover'
              }}
              // Sur mobile, on tente de forcer le chargement
              {...(isMobileDevice && { autoPlay: true, muted: true })}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;