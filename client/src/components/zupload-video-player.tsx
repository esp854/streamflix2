import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, SkipBack, SkipForward, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { isMobile } from "react-device-detect";
import { useFrembedMovieSources, useFrembedEpisodeSources } from "@/hooks/useFrembedSources";

interface VideoSource {
  id: string;
  name: string;
  url: string;
  type: 'direct' | 'embed';
}

interface ZuploadVideoPlayerProps {
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  videoUrl?: string;
  title?: string;
  onEnded?: () => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  className?: string;
}

export function ZuploadVideoPlayer({
  tmdbId,
  mediaType,
  seasonNumber,
  episodeNumber,
  videoUrl,
  title,
  onEnded,
  onNextEpisode,
  onPreviousEpisode,
  className = ""
}: ZuploadVideoPlayerProps) {
  const { toast } = useToast();
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [progress, setProgress] = useState([0]);
  const [buffered, setBuffered] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [showSettings, setShowSettings] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState([0]);
  const [showAd, setShowAd] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Frembed sources
  const { data: frembedMovieSources, isLoading: frembedMovieLoading } = useFrembedMovieSources(
    mediaType === 'movie' && tmdbId ? tmdbId : null
  );
  
  const { data: frembedEpisodeSources, isLoading: frembedEpisodeLoading } = useFrembedEpisodeSources(
    mediaType === 'tv' && tmdbId ? tmdbId : null,
    seasonNumber || null,
    episodeNumber || null
  );

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
    if (tmdbId) {
      const sources: VideoSource[] = [];
      
      // Source Frembed (prioritaire)
      // Note: Frembed nécessite une API key ou un compte, donc on vérifie si l'URL est déjà fournie
      if (videoUrl && videoUrl.includes('frembed')) {
        sources.push({
          id: 'frembed',
          name: 'Frembed',
          url: videoUrl,
          type: 'embed'
        });
      }
      
      // Add Frembed sources if available
      if (frembedMovieSources && frembedMovieSources.length > 0) {
        // Add the first available source from Frembed
        sources.push({
          id: 'frembed-api',
          name: 'Frembed (API)',
          url: frembedMovieSources[0].url,
          type: 'embed'
        });
      }
      
      if (frembedEpisodeSources && frembedEpisodeSources.length > 0) {
        // Add the first available source from Frembed
        sources.push({
          id: 'frembed-api',
          name: 'Frembed (API)',
          url: frembedEpisodeSources[0].url,
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
      
      // Source Zupload (actuelle)
      if (videoUrl) {
        sources.push({
          id: 'zupload',
          name: 'Zupload',
          url: videoUrl,
          type: videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.ogg') ? 'direct' : 'embed'
        });
      }
      
      // Source 2Embed
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
          url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source SuperEmbed
      if (mediaType === 'movie') {
        sources.push({
          id: 'superembed',
          name: 'SuperEmbed',
          url: `https://superembed.stream/e/?imdb=&tmdb=${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'superembed',
          name: 'SuperEmbed',
          url: `https://superembed.stream/e/?imdb=&tmdb=${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source FStream
      if (mediaType === 'movie') {
        sources.push({
          id: 'fstream',
          name: 'FStream',
          url: `https://fstream.pro/embed/movie?tmdb=${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'fstream',
          name: 'FStream',
          url: `https://fstream.pro/embed/tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source GoDrivePlayer
      if (mediaType === 'movie') {
        sources.push({
          id: 'godrive',
          name: 'GoDrivePlayer',
          url: `https://godriveplayer.com/embed/movie?tmdb=${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'godrive',
          name: 'GoDrivePlayer',
          url: `https://godriveplayer.com/embed/tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source Embed.su
      if (mediaType === 'movie') {
        sources.push({
          id: 'embedsu',
          name: 'Embed.su',
          url: `https://embed.su/embed/movie/${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'embedsu',
          name: 'Embed.su',
          url: `https://embed.su/embed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`,
          type: 'embed'
        });
      }
      
      // Source SmashyStream
      if (mediaType === 'movie') {
        sources.push({
          id: 'smashy',
          name: 'SmashyStream',
          url: `https://player.smashy.stream/movie/${tmdbId}`,
          type: 'embed'
        });
      } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        sources.push({
          id: 'smashy',
          name: 'SmashyStream',
          url: `https://player.smashy.stream/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`,
          type: 'embed'
        });
      }
      
      setVideoSources(sources);
      setCurrentSourceIndex(0); // Par défaut, utiliser la première source (Frembed si disponible)
    }
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, videoUrl, frembedMovieSources, frembedEpisodeSources]);

  // Changer de source vidéo
  const changeVideoSource = (index: number) => {
    setCurrentSourceIndex(index);
    setIsLoading(true);
    setError(null);
    
    // Réinitialiser l'état de lecture
    setIsPlaying(false);
    if (mainVideoRef.current) {
      mainVideoRef.current.pause();
    }
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
    
    // Pour les vidéos directes, on peut précharger
    const preloadVideo = document.createElement('video');
    preloadVideo.preload = 'metadata';
    preloadVideo.src = currentSource.url;
    preloadVideo.load();
    console.log('Préchargement démarré pour:', currentSource.url);
  };

  // Gestion du chargement de la vidéo
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(video.duration || 0);
    };

    const handleError = () => {
      console.error('Erreur de chargement de la vidéo:', video.error);
      setIsLoading(false);
      setError(`Erreur de chargement: ${video.error?.message || 'Erreur inconnue'}`);
      
      // Essayer la source suivante si disponible
      if (retryCount < 2 && videoSources.length > currentSourceIndex + 1) {
        toast({
          title: "Erreur de lecture",
          description: `Impossible de lire la vidéo. Tentative avec la source suivante...`,
          variant: "destructive"
        });
        setTimeout(() => {
          changeVideoSource(currentSourceIndex + 1);
          setRetryCount(prev => prev + 1);
        }, 2000);
      } else {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire la vidéo avec toutes les sources disponibles.",
          variant: "destructive"
        });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          setBuffered([Math.min(100, (bufferedEnd / duration) * 100)]);
        }
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
    };
  }, [currentSourceIndex, videoSources, retryCount, toast]);

  // Gestion de la lecture/ pause
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Erreur de lecture automatique:", error);
          setIsPlaying(false);
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Gestion du volume
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    video.volume = volume[0] / 100;
    video.muted = isMuted;
  }, [volume, isMuted]);

  // Gestion de la progression
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const updateTime = () => {
      if (video.duration) {
        const progressPercent = (video.currentTime / video.duration) * 100;
        setProgress([progressPercent]);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
    };
  }, []);

  // Gestion de la fin de la vidéo
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  // Auto-hide controls after 3 seconds (or 5 seconds on mobile)
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (showControls && isPlaying) {
      const timeoutDuration = isMobile ? 5000 : 3000; // 5s for mobile, 3s for desktop
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowControls(false);
        }
      }, timeoutDuration);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying, isMobile]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    setShowControls(true);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    setIsMuted(value[0] === 0);
    setShowControls(true);
  };

  // Handle progress change (seek)
  const handleProgressChange = (value: number[]) => {
    const video = mainVideoRef.current;
    if (!video) return;
    
    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setProgress(value);
    setShowControls(true);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
    setShowControls(true);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Retry loading the current source
  const retryLoad = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    
    // Force reload by changing the key
    const video = mainVideoRef.current;
    if (video) {
      video.load();
    }
  };

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMountedRef.current) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (mainVideoRef.current) {
            mainVideoRef.current.currentTime += 10;
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (mainVideoRef.current) {
            mainVideoRef.current.currentTime -= 10;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(100, volume[0] + 10)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume[0] - 10)]);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isPlaying]);

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
  };

  // Skip forward/backward
  const skipForward = () => {
    if (mainVideoRef.current) {
      mainVideoRef.current.currentTime += 10;
    }
  };

  const skipBackward = () => {
    if (mainVideoRef.current) {
      mainVideoRef.current.currentTime -= 10;
    }
  };

  const currentSource = videoSources[currentSourceIndex];

  return (
    <div 
      className={`relative w-full h-full bg-black ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-center max-w-md p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-2">Erreur de lecture</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button onClick={retryLoad} variant="default" className="mr-2">
              Réessayer
            </Button>
            {videoSources.length > currentSourceIndex + 1 && (
              <Button 
                onClick={() => changeVideoSource(currentSourceIndex + 1)} 
                variant="secondary"
              >
                Source suivante
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main video player - Handle both direct video URLs and iframe embeds */}
      {!showAd && (
        <>
          {/* For iframe embeds (Zupload, Frembed, VidSrc, etc.) - Mobile optimized */}
          {currentSource && currentSource.type === 'embed' ? (
            <>
              <iframe
                src={currentSource.url}
                className="w-full h-full touch-manipulation"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${title || 'Video'} - ${currentSource.name}`}
              />
              
              {/* Custom controls overlay for iframe (limited functionality) */}
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                  showControls ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={togglePlay}
                      variant="ghost"
                      size="icon"
                      className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="icon"
                      className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 rounded-full"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    <div className="flex items-center text-white text-sm">
                      <span>{formatTime((progress[0] / 100) * duration)}</span>
                      <span className="mx-1">/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={toggleFullscreen}
                      variant="ghost"
                      size="icon"
                      className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 rounded-full"
                    >
                      <Maximize className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-100"
                    style={{ width: `${progress[0]}%` }}
                  />
                  <div 
                    className="h-full bg-white/30 -mt-2 transition-all duration-100"
                    style={{ width: `${buffered[0]}%` }}
                  />
                </div>
              </div>
            </>
          ) : currentSource && currentSource.type === 'direct' ? (
            // For direct video URLs (MP4, WebM, etc.)
            <video
              ref={mainVideoRef}
              className="w-full h-full"
              preload="metadata"
              playsInline
            >
              <source src={currentSource.url} type={`video/${currentSource.url.split('.').pop()}`} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          ) : (
            // No source available
            <div className="w-full h-full flex items-center justify-center bg-black text-white">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-xl">Aucune source vidéo disponible</p>
                <p className="text-gray-400 mt-2">Veuillez vérifier la configuration ou ajouter une URL vidéo</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Controls for direct video URLs */}
      {currentSource && currentSource.type === 'direct' && !showAd && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4 cursor-pointer">
            <Slider
              value={progress}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div 
              className="h-full bg-white/30 -mt-2 transition-all duration-100"
              style={{ width: `${buffered[0]}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 rounded-full"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <Button
                onClick={skipBackward}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 rounded-full"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={skipForward}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 rounded-full"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 rounded-full"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
              
              <div className="flex items-center w-24 sm:w-32">
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="text-white text-sm hidden sm:block">
                <span>{formatTime((progress[0] / 100) * duration)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-10 h-10 rounded-full relative"
              >
                <Settings className="w-5 h-5" />
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-black/90 rounded-lg p-3 text-white text-sm z-20">
                    <div className="mb-2">
                      <label className="block mb-1">Vitesse</label>
                      <select 
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="w-full bg-gray-800 rounded p-1"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">Normal</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">Qualité</label>
                      <select 
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full bg-gray-800 rounded p-1"
                      >
                        <option value="auto">Auto</option>
                        <option value="1080">1080p</option>
                        <option value="720">720p</option>
                        <option value="480">480p</option>
                      </select>
                    </div>
                  </div>
                )}
              </Button>
              
              {videoSources.length > 1 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="bg-black/70 text-white hover:bg-black/90 rounded-full"
                  >
                    {currentSource?.name || 'Source'}
                  </Button>
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-black/90 rounded-lg p-2 z-20">
                    {videoSources.map((source, index) => (
                      <Button
                        key={source.id}
                        variant={index === currentSourceIndex ? "default" : "ghost"}
                        className="w-full justify-start mb-1 text-white hover:bg-white/20"
                        onClick={() => changeVideoSource(index)}
                      >
                        {source.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-12 h-12 rounded-full"
              >
                <Maximize className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}