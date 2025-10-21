import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { SkipForward, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Server, Play, Pause, Volume2, Maximize, Minimize } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFrembedSources } from '@/hooks/useFrembedSources'; // Ajout de l'import

interface VideoSource {
  id: string;
  name: string;
  url: string;
  type: 'embed' | 'direct';
}

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
  tmdbId?: number; // Pour générer les URLs de différentes sources
  mediaType?: 'movie' | 'tv'; // Pour différencier films et séries
  seasonNumber?: number; // Pour les séries
  episodeNumber?: number; // Pour les séries
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
  onPreviousEpisode,
  tmdbId,
  mediaType = 'movie',
  seasonNumber = 1,
  episodeNumber = 1,
}) => {
  const { isAuthenticated } = useAuth();
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false); // Toujours false - pas de pubs
  const [adSkipped, setAdSkipped] = useState(true); // Toujours true - pubs désactivées
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

  // Nouvel état pour la gestion des sources
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  
  // État pour suivre si la source initiale a été chargée
  const [initialSourceLoaded, setInitialSourceLoaded] = useState(false);

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

  // URL VAST de HilltopAds - non utilisée
  const vastTag = '';

  // Générer les sources vidéo à partir du TMDB ID
  useEffect(() => {
    const sources: VideoSource[] = [];
    
    // Source Zupload (prioritaire) - toujours inclure la source fournie
    if (videoUrl) {
      sources.push({
        id: 'zupload',
        name: 'Zupload',
        url: videoUrl,
        type: videoUrl.includes('embed') ? 'embed' : 'direct'
      });
    }
    
    // Ajouter les sources alternatives seulement si tmdbId est disponible
    if (tmdbId) {
      // Source SuperEmbed (fonctionne bien)
      if (mediaType === 'movie') {
        sources.push({
          id: 'superembed',
          name: 'SuperEmbed',
          url: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&s=1&e=1`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'superembed',
          name: 'SuperEmbed',
          url: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source VidSrc
      if (mediaType === 'movie') {
        sources.push({
          id: 'vidsrc',
          name: 'VidSrc',
          url: `https://vidsrc-embed.ru/embed/movie?tmdb=${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'vidsrc',
          name: 'VidSrc',
          url: `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source 2Embed (fonctionne moyennement)
      if (mediaType === 'movie') {
        sources.push({
          id: '2embed',
          name: '2Embed',
          url: `https://www.2embed.cc/embed/${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: '2embed',
          name: '2Embed',
          url: `https://www.2embed.cc/embedtv/${tmdbId}/${seasonNumber}/${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Services de streaming alternatifs
      if (mediaType === 'movie') {
        // FilmZer - Remplacement de French Stream
        sources.push({
          id: 'filmzer',
          name: 'FilmZer',
          url: `https://www.filmzer.com/film-${tmdbId}.html`,
          type: 'embed'
        });
        
        // Alternatives fonctionnelles
        sources.push({
          id: 'voirseries',
          name: 'VoirSeries',
          url: `https://www.voirseries.co/film-${tmdbId}.html`,
          type: 'embed'
        });
        
        sources.push({
          id: 'skstream',
          name: 'SkStream',
          url: `https://www.skstream.co/film-${tmdbId}.html`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        // FilmZer pour séries - Remplacement de French Stream
        sources.push({
          id: 'filmzer-tv',
          name: 'FilmZer',
          url: `https://www.filmzer.com/serie-${tmdbId}-s${seasonNumber}e${episodeNumber}.html`,
          type: 'embed'
        });
        
        // Alternatives fonctionnelles pour séries
        sources.push({
          id: 'voirseries-tv',
          name: 'VoirSeries',
          url: `https://www.voirseries.co/serie-${tmdbId}-s${seasonNumber}e${episodeNumber}.html`,
          type: 'embed'
        });
        
        sources.push({
          id: 'skstream-tv',
          name: 'SkStream',
          url: `https://www.skstream.co/serie-${tmdbId}-s${seasonNumber}e${episodeNumber}.html`,
          type: 'embed'
        });
      }
    }
    
    console.log('Sources vidéo générées:', sources);
    setVideoSources(sources);
    setCurrentSourceIndex(0); // Par défaut, utiliser la première source (Zupload si disponible)
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, videoUrl]);

  // Utilisation du hook useFrembedSources - déplacé au niveau approprié
  const { data: frembedSources } = useFrembedSources(
    tmdbId || 0, 
    mediaType === 'tv' ? seasonNumber : undefined, 
    mediaType === 'tv' ? episodeNumber : undefined
  );

  // Effet pour ajouter la source Frembed quand elle est disponible
  useEffect(() => {
    if (frembedSources && frembedSources.length > 0 && tmdbId) {
      setVideoSources(prevSources => {
        // Vérifier si la source Frembed existe déjà
        const existingFrembedIndex = prevSources.findIndex(source => source.id === 'frembed');
        
        if (existingFrembedIndex >= 0) {
          // Mettre à jour la source existante
          const updatedSources = [...prevSources];
          updatedSources[existingFrembedIndex] = {
            ...updatedSources[existingFrembedIndex],
            url: frembedSources[0].url
          };
          return updatedSources;
        } else {
          // Ajouter la nouvelle source
          return [
            ...prevSources,
            {
              id: 'frembed',
              name: 'Frembed',
              url: frembedSources[0].url,
              type: 'embed'
            }
          ];
        }
      });
    }
  }, [frembedSources, tmdbId, mediaType, seasonNumber, episodeNumber]);

  // Changer de source vidéo
  const changeVideoSource = (index: number) => {
    console.log(`Changement de source: ${index} (${videoSources[index]?.name})`);
    setCurrentSourceIndex(index);
    setIsLoading(true);
    setError(null);
    
    // Réinitialiser l'état de lecture
    setIsPlaying(false);
    if (mainVideoRef.current) {
      mainVideoRef.current.pause();
    }
    
    // Réinitialiser le flag de préchargement pour la nouvelle source
    videoPreloadStartedRef.current = false;
    
    // Réinitialiser l'état de chargement initial
    setInitialSourceLoaded(false);
  };

  // Précharger la vidéo principale pour accélérer le chargement
  const preloadMainVideo = () => {
    const currentSource = videoSources[currentSourceIndex];
    if (!currentSource) return;
    
    // Ne pas tenter de précharger les URLs d'iframe (Zupload embed)
    if (currentSource.type === 'embed') {
      console.log('Préchargement ignoré pour l\'URL d\'intégration:', currentSource.url);
      return;
    }
    
    if (videoPreloadStartedRef.current || !mainVideoRef.current) return;
    
    videoPreloadStartedRef.current = true;
    console.log('Préchargement de la vidéo principale:', currentSource.url);
    
    // Créer un objet vidéo temporaire pour le préchargement
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'auto';
    tempVideo.src = currentSource.url;
    
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

  // Fonction vide pour charger la pub VAST - désactivée
  async function loadVastAd() {
    // Ne rien faire - les pubs sont désactivées
    console.log('Publicités désactivées - accès direct au contenu');
    setShowAd(false);
    setAdSkipped(true);
    setInitialSourceLoaded(true);
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
      setIsPlaying(true);
    }
  };

  // Handle video error
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Erreur de chargement de la vidéo:', e);
    setIsLoading(false);
    setIsPlaying(false);
    
    // Essayer la source suivante si disponible
    if (videoSources.length > 1 && currentSourceIndex < videoSources.length - 1) {
      console.log('Tentative de la source suivante...');
      // Attendre un peu avant de changer de source pour éviter les boucles rapides
      setTimeout(() => {
        changeVideoSource(currentSourceIndex + 1);
      }, 1000);
    } else {
      // Sur mobile, certaines URLs peuvent échouer à charger, on tente un fallback
      if (isMobileDevice && videoSources[currentSourceIndex]?.url.includes('embed')) {
        setError('Le contenu mobile n\'est pas disponible. Veuillez réessayer plus tard.');
      } else {
        setError('Impossible de charger la vidéo. Veuillez vérifier votre connexion.');
      }
      onVideoError?.('Failed to load video content');
    }
  };

  // Reset loading state when videoUrl changes
  useEffect(() => {
    // Ne pas réinitialiser le chargement si nous avons déjà chargé la source initiale
    if (initialSourceLoaded) return;
    
    setIsLoading(true);
    setError(null);
    videoPreloadStartedRef.current = false; // Réinitialiser le flag de préchargement
    
    // Pour les URLs d'iframe, réduire le temps d'affichage du loader
    // Sur mobile, masquer encore plus rapidement
    const loaderDelay = isMobileDevice ? 1000 : 2000; // 1 seconde sur mobile, 2 sur desktop
    
    // Ajustement pour s'assurer que le loader s'affiche correctement
    const currentSource = videoSources[currentSourceIndex];
    if (currentSource && currentSource.type === 'embed') {
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
        setInitialSourceLoaded(true);
      }, loaderDelay);
      
      return () => clearTimeout(loaderTimeout);
    } else {
      // Pour les vidéos directes, masquer le loader après un court délai
      const loaderTimeout = setTimeout(() => {
        setIsLoading(false);
        setInitialSourceLoaded(true);
      }, isMobileDevice ? 500 : 1000);
      
      return () => clearTimeout(loaderTimeout);
    }
  }, [videoSources, currentSourceIndex, isMobileDevice, initialSourceLoaded]);

  // Handle ad for non-authenticated users - désactivé
  useEffect(() => {
    // Toujours désactiver les pubs
    setShowAd(false);
    setAdSkipped(true);
    
    // S'assurer que l'état de chargement est réinitialisé
    if (!initialSourceLoaded) {
      setIsLoading(true);
    }
    
    // Précharger la vidéo immédiatement
    setTimeout(() => {
      preloadMainVideo();
    }, 100);
    
    // Pour les URLs d'iframe, masquer rapidement le loader
    const currentSource = videoSources[currentSourceIndex];
    if (currentSource && currentSource.type === 'embed') {
      setTimeout(() => {
        setIsLoading(false);
        setInitialSourceLoaded(true);
      }, 1000);
    }
    // Sur mobile, on masque le loader immédiatement
    else if (isMobileDevice) {
      setIsLoading(false);
      setInitialSourceLoaded(true);
    }
  }, [videoSources, currentSourceIndex, isMobileDevice, initialSourceLoaded]);

  const skipAd = () => {
    // Ne rien faire - les pubs sont déjà désactivées
    console.log('Passage des publicités - fonction désactivée');
    setInitialSourceLoaded(true);
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
  
  // Réinitialiser initialSourceLoaded quand les sources changent
  useEffect(() => {
    setInitialSourceLoaded(false);
  }, [videoUrl, tmdbId]);

  // Gestion de la lecture/pause
  const togglePlayPause = () => {
    if (!mainVideoRef.current) return;
    
    if (isPlaying) {
      mainVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      mainVideoRef.current.play().catch(error => {
        console.error('Erreur de lecture:', error);
      });
      setIsPlaying(true);
    }
  };

  // Gestion du son
  const toggleMute = () => {
    if (!mainVideoRef.current) return;
    
    mainVideoRef.current.muted = !mainVideoRef.current.muted;
    setIsMuted(mainVideoRef.current.muted);
  };

  // Gestion du volume
  const handleVolumeChange = (newVolume: number) => {
    if (!mainVideoRef.current) return;
    
    mainVideoRef.current.volume = newVolume / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const currentSource = videoSources[currentSourceIndex];
  
  // Afficher un message si aucune source n'est disponible
  if (videoSources.length === 0) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8 sm:p-10 bg-black/90 rounded-2xl max-w-xs sm:max-w-md w-full">
          <div className="text-red-500 text-5xl sm:text-6xl mb-6 sm:mb-8">⚠️</div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Aucune source vidéo disponible</h3>
          <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg">Aucun lien vidéo n'a été trouvé pour ce contenu.</p>
          <button
            onClick={() => {
              window.location.reload();
              setInitialSourceLoaded(false);
            }}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors text-lg sm:text-xl font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

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
                    // Pub terminée, passer directement à la vidéo principale
                    // Ne rien faire - les pubs sont désactivées
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
                      // Ne rien faire - les pubs sont désactivées
                      setInitialSourceLoaded(true);
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
              onClick={() => {
                window.location.reload();
                setInitialSourceLoaded(false);
              }}
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
            {/* Bouton Source - Nouveau bouton pour changer de source */}
            {videoSources.length > 1 && (
              <Select 
                value={currentSourceIndex.toString()} 
                onValueChange={(value) => changeVideoSource(parseInt(value))}
              >
                <SelectTrigger 
                  className="bg-black/70 text-white border-white/20 text-xs sm:text-sm flex items-center touch-manipulation"
                  // Ajout d'attributs pour améliorer la compatibilité mobile
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Server className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent
                  // Ajout d'attributs pour améliorer la compatibilité mobile
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {videoSources.map((source, index) => (
                    <SelectItem 
                      key={source.id} 
                      value={index.toString()}
                      // Ajout d'attributs pour améliorer la compatibilité mobile
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Bouton Plein écran */}
            
            {onSkipIntro && (
              <button
                onClick={onSkipIntro}
                className="bg-black/70 text-white px-3 py-2 rounded-lg hover:bg-black/90 transition-colors flex items-center text-xs sm:text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Passer l'intro</span>
              </button>
            )}
            
            {onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="bg-black/70 text-white px-3 py-2 rounded-lg hover:bg-black/90 transition-colors flex items-center text-xs sm:text-sm font-medium"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Épisode suivant</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Middle Controls - Previous/Next Episode Navigation - Mobile optimized */}
        <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center">
            {onPreviousEpisode && (
              <Button
                onClick={onPreviousEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                disabled={currentEpisode <= 1}
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center">
            {onNextEpisode && (
              <Button
                onClick={onNextEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                disabled={currentEpisode >= totalEpisodes}
              >
                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Bottom Controls - Play/Pause, Volume, etc. */}
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center items-center space-x-4 pointer-events-auto">

          </div>
        )}
      </div>

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {!showAd && (
        <>
          {/* For iframe embeds (Zupload, Frembed, VidSrc, etc.) - Mobile optimized */}
          {currentSource && currentSource.type === 'embed' ? (
            <>
              <iframe
                src={currentSource.url}
                className="w-full h-full touch-manipulation"
                frameBorder="0"
                // Attributs par défaut pour les iframes
                {...!(currentSource.name === 'Frembed') && {
                  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen",
                  allowFullScreen: true
                }}
                title={`${title} - ${currentSource.name}`}
                loading="lazy"
                onLoad={() => {
                  console.log('Iframe chargée:', currentSource.url);
                  setIsLoading(false);
                  setError(null);
                  setInitialSourceLoaded(true);
                }}
                onError={(e) => {
                  console.error('Erreur de chargement de l\'iframe:', e);
                  setIsLoading(false);
                  // Essayer la source suivante si disponible
                  if (videoSources.length > 1 && currentSourceIndex < videoSources.length - 1) {
                    console.log('Tentative de la source suivante pour l\'iframe...');
                    changeVideoSource(currentSourceIndex + 1);
                  } else {
                    // Sur mobile, on affiche un message plus spécifique
                    if (isMobileDevice) {
                      setError('Le contenu mobile n\'est pas disponible pour le moment. Veuillez réessayer plus tard ou utiliser un ordinateur.');
                    } else {
                      setError('Impossible de charger la vidéo');
                    }
                    onVideoError?.('Impossible de charger la vidéo');
                  }
                }}
                // Ajout de propriétés pour améliorer la compatibilité mobile
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: isMobileDevice ? '200px' : 'auto'
                }}
                // Pour Frembed, utiliser les contrôles natifs - configuration optimisée
                {...(currentSource.name === 'Frembed' && {
                  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; xr-spatial-tracking; web-share; cross-origin-isolated;",
                  allowFullScreen: true
                })}
              />
              {/* Overlay to prevent download button action - targeted at download button area */}
              <div
                className="absolute bottom-5 right-5 w-10 h-10 bg-transparent z-50 pointer-events-auto cursor-not-allowed"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                aria-label="Téléchargement désactivé"
                title="Téléchargement désactivé"
                style={{
                  position: 'absolute',
                  bottom: '2.5rem',
                  right: '2.5rem',
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'transparent',
                  zIndex: 50,
                  pointerEvents: 'auto',
                  cursor: 'not-allowed'
                }}
              />

              {/* Message d'instruction pour Frembed - afficher uniquement pour Frembed */}
              {currentSource.name === 'Frembed' && (
                <div 
                  className="absolute bottom-4 left-4 bg-black/70 text-white text-xs sm:text-sm px-2 py-1 rounded z-40"
                  style={{ maxWidth: '200px' }}
                >
                  Cliquez sur le bouton plein écran dans l'iframe
                </div>
              )}
            </>
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
              onLoadedData={() => {
                console.log('Vidéo chargée:', currentSource.url);
                setIsLoading(false);
                setError(null);
                setInitialSourceLoaded(true);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={(e) => {
                const video = e.target as HTMLVideoElement;
                setVolume(video.volume * 100);
                setIsMuted(video.muted);
              }}
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