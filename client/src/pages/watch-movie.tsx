import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Home, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Settings, SkipBack, SkipForward, RotateCcw, RotateCw, Download, Share2, CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tmdbService } from "@/lib/tmdb";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import AdvertisementBanner from "@/components/AdvertisementBanner";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useAuth } from "@/contexts/auth-context";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import ZuploadVideoPlayer from "@/components/zupload-video-player";
import WatchPartyEnhanced from "@/components/watch-party-enhanced";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function WatchMovie() {
   const { shouldShowAds } = useAuthCheck();
   const { isAuthenticated } = useAuth();
   const { features, planId, isLoading: planLoading } = usePlanFeatures();
   const { id } = useParams<{ id: string }>();
   const movieId = parseInt(id || "0");
   const playerRef = useRef<any>(null);
   const isMountedRef = useRef(true);
   const youtubePlayerRef = useRef<any>(null);
   const isMobile = useIsMobile(); // Détecter si l'appareil est mobile
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [subtitle, setSubtitle] = useState("off");
  const [relatedMovies, setRelatedMovies] = useState<any[]>([]);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [isZuploadVideo, setIsZuploadVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Watch Party state
  const [isWatchPartyActive, setIsWatchPartyActive] = useState(false);
  const [watchPartyRoomId, setWatchPartyRoomId] = useState<string>('');
  const [isWatchPartyHost, setIsWatchPartyHost] = useState(false);
  const [showWatchPartyPanel, setShowWatchPartyPanel] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up YouTube player if it exists
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (isMountedRef.current) {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const { data: movieDetails, isLoading: tmdbLoading } = useQuery({
    queryKey: [`/api/tmdb/movie/${movieId}`],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    enabled: !!movieId,
  });

  // Fetch content with video link
  const { data: contentWithVideo, isLoading: contentLoading, error: contentError } = useQuery({
    queryKey: [`/api/contents/tmdb/${movieId}`],
    queryFn: async () => {
      const response = await fetch(`/api/contents/tmdb/${movieId}`);
      if (!response.ok) {
        // Instead of throwing an error, return a default content object
        return {
          id: `tmdb-${movieId}`,
          tmdbId: movieId,
          odyseeUrl: "",
          active: false,
          createdAt: new Date().toISOString()
        };
      }
      return response.json();
    },
    enabled: !!movieId,
    retry: false // Don't retry on 404
  });

  const isLoading = tmdbLoading || contentLoading || planLoading;

  // Auto-hide controls after 3 seconds (or 5 seconds on mobile)
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (showControls && isPlaying) {
      const timeoutDuration = isMobile ? 5000 : 3000; // 5s for mobile, 3s for desktop
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setShowControls(false);
        }
      }, timeoutDuration);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying, isMobile]);

  // Check if video is YouTube or Zupload
  useEffect(() => {
    if (contentWithVideo?.odyseeUrl) {
      const url = contentWithVideo.odyseeUrl;
      setIsYouTubeVideo(url.includes("youtube.com") || url.includes("youtu.be"));
      setIsZuploadVideo(url.includes("zupload") || url.includes("frembed"));
      setVideoUrl(url);
    }
  }, [contentWithVideo]);

  // Check if video is Odysee
  const isOdyseeVideo = useMemo(() => {
    return contentWithVideo?.odyseeUrl && contentWithVideo.odyseeUrl.includes("odysee.com");
  }, [contentWithVideo?.odyseeUrl]);

  // Initialize YouTube player API when iframe is loaded
  useEffect(() => {
    if (!isYouTubeVideo || !contentWithVideo?.odyseeUrl) return;

    // Load YouTube iframe API if not already loaded
    if (!window.YT) {
      const scriptTag = document.createElement('script');
      scriptTag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(scriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer();
      };
    } else {
      // YouTube API already loaded
      initializeYouTubePlayer();
    }

    return () => {
      // Clean up YouTube player
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [isYouTubeVideo, contentWithVideo?.odyseeUrl]);

  const initializeYouTubePlayer = () => {
    if (youtubePlayerRef.current) return;

    const interval = setInterval(() => {
      const iframe = document.getElementById('youtube-player');
      if (iframe && window.YT) {
        clearInterval(interval);
        
        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
          events: {
            'onReady': (event: any) => {
              console.log('YouTube player ready');
              // Get duration
              const dur = event.target.getDuration();
              setDuration(dur || 0);
              setIsPlaying(event.target.getPlayerState() === 1);
            },
            'onStateChange': (event: any) => {
              switch (event.data) {
                case 1: // Playing
                  setIsPlaying(true);
                  break;
                case 2: // Paused
                  setIsPlaying(false);
                  break;
                case 0: // Ended
                  setIsPlaying(false);
                  break;
              }
            }
          }
        });

        // Start time update interval
        const timeInterval = setInterval(() => {
          if (youtubePlayerRef.current && isMountedRef.current) {
            const time = youtubePlayerRef.current.getCurrentTime();
            setCurrentTime(time || 0);
            
            const dur = youtubePlayerRef.current.getDuration();
            setDuration(dur || 0);
          }
        }, 1000);

        return () => clearInterval(timeInterval);
      }
    }, 500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMountedRef.current || e.target !== document.body || isTransitioning) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
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
          handleMute();
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
  }, [volume, isTransitioning]);

  // Video event handlers
  const handlePlayPause = useCallback(async () => {
    if (isTransitioning || !isMountedRef.current) return;
    
    setIsTransitioning(true);
    
    try {
      // Wait for any pending operations to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!isMountedRef.current) return;
      
      if (isYouTubeVideo && youtubePlayerRef.current) {
        // YouTube player controls
        if (isPlaying) {
          youtubePlayerRef.current.pauseVideo();
        } else {
          youtubePlayerRef.current.playVideo();
        }
      }
    } catch (error) {
      // Silently handle interrupted operations
      if (error instanceof Error && error.name !== 'AbortError') {
        console.log('Playback operation error:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsTransitioning(false);
          }
        }, 100);
      }
    }
  }, [isPlaying, isTransitioning, isYouTubeVideo]);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    if (!isMountedRef.current) return;
    
    setVolume(newVolume);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      const volumeValue = newVolume[0];
      youtubePlayerRef.current.setVolume(volumeValue);
      
      if (volumeValue === 0) {
        setIsMuted(true);
        youtubePlayerRef.current.mute();
      } else {
        setIsMuted(false);
        youtubePlayerRef.current.unMute();
      }
    }
  }, [isYouTubeVideo]);

  const handleMute = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newMutedState = !isMuted;
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      if (newMutedState) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
      }
    }
    
    setIsMuted(newMutedState);
  }, [isMuted, isYouTubeVideo]);

  const handleSeek = useCallback((newTime: number[]) => {
    if (!isMountedRef.current) return;
    
    const time = newTime[0];
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(time, true);
    }
    
    setCurrentTime(time);
  }, [isYouTubeVideo]);

  const skipBackward = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.max(0, currentTime - 10);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    }
    
    setCurrentTime(newTime);
  }, [currentTime, isYouTubeVideo]);

  const skipForward = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 10);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    }
    
    setCurrentTime(newTime);
  }, [currentTime, duration, isYouTubeVideo]);

  const rewind15 = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.max(0, currentTime - 15);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    }
    
    setCurrentTime(newTime);
  }, [currentTime, isYouTubeVideo]);

  const forward15 = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 15);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    }
    
    setCurrentTime(newTime);
  }, [currentTime, duration, isYouTubeVideo]);

  const toggleFullscreen = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const videoContainer = document.querySelector('.relative.w-full.h-screen');
    if (!videoContainer) return;
    
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Failed to exit fullscreen:', err);
      });
    }
  }, []);

  const handleGoHome = useCallback(() => {
    if (!isMountedRef.current) return;
    window.location.href = '/';
  }, []);

  const shareMovie = useCallback(() => {
    if (!isMountedRef.current || !movieDetails) return;
    
    const shareData = {
      title: movieDetails.movie.title,
      text: `Regardez ${movieDetails.movie.title} sur StreamKji`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Sharing failed:', err);
        }
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Lien copié dans le presse-papiers!');
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }, [movieDetails]);

  const downloadMovie = useCallback(() => {
    if (!isMountedRef.current) return;
    // In a real implementation, this would trigger a download
    alert('Fonction de téléchargement non disponible pour cette vidéo.');
  }, []);

  const handlePlaybackSpeedChange = useCallback((speed: string) => {
    if (!isMountedRef.current) return;
    
    const speedValue = parseFloat(speed);
    setPlaybackSpeed(speedValue);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.setPlaybackRate(speedValue);
    }
  }, [isYouTubeVideo]);

  const handleQualityChange = useCallback((quality: string) => {
    if (!isMountedRef.current) return;
    
    setQuality(quality);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      // Quality changes are handled automatically by YouTube player
      // based on bandwidth and screen size
    }
  }, [isYouTubeVideo]);

  const handleVideoError = useCallback((error: string) => {
    setVideoError(error);
  }, []);

  // Watch Party functions
  const handleVideoControl = useCallback((action: 'play' | 'pause' | 'seek', data?: any) => {
    console.log('Watch Party video control:', action, data);
    // This will be handled by the WatchParty component
  }, []);

  const handleVideoUrlChange = useCallback((url: string) => {
    console.log('Watch Party video URL change:', url);
    // This will be handled by the WatchParty component
  }, []);

  const toggleWatchParty = useCallback(() => {
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    if (isWatchPartyActive) {
      // Leave watch party
      setIsWatchPartyActive(false);
      setWatchPartyRoomId('');
      setIsWatchPartyHost(false);
      setShowWatchPartyPanel(false);
    } else {
      // Start watch party
      console.log('🎬 Starting Watch Party for:', {
        title: movieDetails?.movie?.title,
        videoUrl: videoUrl,
        movieId: movieId
      });
      
      setIsWatchPartyActive(true);
      setShowWatchPartyPanel(true);
      // Generate a unique room ID
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setWatchPartyRoomId(roomId);
      setIsWatchPartyHost(true);
    }
  }, [isWatchPartyActive, isAuthenticated, movieDetails?.movie?.title, videoUrl, movieId]);

  // Update showWatchPartyPanel when isWatchPartyActive changes
  useEffect(() => {
    setShowWatchPartyPanel(isWatchPartyActive);
  }, [isWatchPartyActive]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Chargement du film...</p>
        </div>
      </div>
    );
  }

  // Check if authenticated user has paid subscription
  if (isAuthenticated && planId === 'free') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md p-8">
          <div className="text-6xl mb-6">🎬</div>
          <h1 className="text-2xl font-bold mb-4">Abonnement requis</h1>
          <p className="text-gray-300 mb-6">
            Pour regarder ce film, vous devez souscrire à un abonnement payant.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = '/subscription'}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Voir les abonnements
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!movieDetails) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Film non trouvé</p>
          <p className="text-gray-400 mb-6">Désolé, nous n'avons pas trouvé les détails de ce film.</p>
          <Button onClick={handleGoHome} variant="default">
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Get the video URL, with fallback to sample video if none is provided
// Handle video error
  if (videoError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Erreur de chargement de la vidéo</p>
          <p className="text-gray-400 mb-6">{videoError}</p>
          <Button onClick={handleGoHome} variant="default">
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Video container */}
      <div className="relative w-full h-screen">
        {/* Zupload Video Player - Direct integration */}
        {isZuploadVideo && videoUrl ? (
          <div className="w-full h-full">
            <ZuploadVideoPlayer
              videoUrl={videoUrl}
              title={movieDetails?.movie?.title || "Film sans titre"}
              onVideoError={handleVideoError}
              onVideoEnd={() => console.log("Vidéo terminée")}
            />
          </div>
        ) : (
          // Other video types (YouTube, Odysee, etc.) or fallback message
          <>
            {/* Video player has been removed for non-Zupload videos */}
            <div className="w-full h-screen flex items-center justify-center bg-black">
              <div className="text-center p-8">
                <div className="text-4xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold mb-2">Lecteur de film non disponible</h2>
                <p className="text-gray-400 mb-4">Cette vidéo n'est pas disponible pour le moment.</p>
                <p className="text-gray-500 text-sm mb-6">Seules les vidéos Zupload sont actuellement supportées.</p>
                <Button onClick={handleGoHome} variant="default">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Watch Party Overlay - Available for all video types when Watch Party is active */}
        {isWatchPartyActive && (
          <div className="absolute inset-0 z-50 bg-black">
            <WatchPartyEnhanced
              videoUrl={videoUrl || ''}
              title={movieDetails.movie.title}
              onVideoControl={handleVideoControl}
              onVideoUrlChange={handleVideoUrlChange}
              isHost={isWatchPartyHost}
              setIsHost={setIsWatchPartyHost}
              currentVideoTime={currentTime}
              isVideoPlaying={isPlaying}
            />
          </div>
        )}
        
        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm">Chargement...</div>
            </div>
          </div>
        )}

        {/* Home Button - Fixed at top-left edge */}
        <Button 
          onClick={handleGoHome}
          variant="ghost" 
          size="sm" 
          className="absolute top-2 left-2 z-50 bg-black/70 text-white hover:bg-black/90 transition-all duration-200 border border-white/20 backdrop-blur-sm"
          title="Retour à l'accueil"
        >
          <Home className="w-4 h-4 mr-2" />
          Accueil
        </Button>

        {/* Controls Overlay - only show for non-Odysee and non-Zupload videos */}
        {!isOdyseeVideo && !isZuploadVideo && (
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            onMouseMove={() => {
              if (!isTransitioning && !isMobile) { // Only show on mouse move for desktop
                setShowControls(true);
              }
            }}
            onClick={() => { // Toggle controls on click/tap for mobile
              if (isMobile && !isTransitioning) {
                setShowControls(prev => !prev);
              }
            }}
          >
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between p-2 md:p-0">
              <div className="flex items-center space-x-4">
                {/* Empty space where home button was */}
              </div>
              <div className="text-white text-xl font-semibold text-center flex-1">
                {movieDetails.movie.title}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={shareMovie}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                {/* Watch Party Button - Available for all video types */}
                <Button
                  onClick={toggleWatchParty}
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-white/20 transition-all duration-200 ${isWatchPartyActive ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-white/20'}`}
                  title={isWatchPartyActive ? 'Quitter la Watch Party' : 'Créer une Watch Party'}
                >
                  <Users className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">
                    {isWatchPartyActive ? 'Quitter' : 'Watch Party'}
                  </span>
                </Button>
                {/* Removed download button for Zupload videos */}
                {!isZuploadVideo && (
                  <Button
                    onClick={downloadMovie}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Center Controls */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-4 md:space-x-8">
                <Button
                  onClick={rewind15}
                  variant="ghost"
                  size={isMobile ? "icon" : "lg"}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                </Button>
                
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size={isMobile ? "icon" : "lg"}
                  className="w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  {isPlaying ? <Pause className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" /> : <Play className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />}
                </Button>
                
                <Button
                  onClick={forward15}
                  variant="ghost"
                  size={isMobile ? "icon" : "lg"}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                </Button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-4 right-4 space-y-2 md:space-y-4">
              {/* Progress Bar - Optimized for mobile */}
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                <span className="text-white text-xs sm:text-sm md:text-base min-w-[50px] sm:min-w-[60px] md:min-w-[70px]">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration}
                  step={1}
                  className="flex-1 h-1 sm:h-2"
                />
                <span className="text-white text-xs sm:text-sm md:text-base min-w-[50px] sm:min-w-[60px] md:min-w-[70px]">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Button
                    onClick={handlePlayPause}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />}
                  </Button>
                  
                  <Button
                    onClick={skipBackward}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                  >
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </Button>
                  
                  <Button
                    onClick={skipForward}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                  >
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </Button>

                  <div className="flex items-center space-x-1 md:space-x-2 ml-2 md:ml-4">
                    <Button
                      onClick={handleMute}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />}
                    </Button>
                    <Slider
                      value={volume}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-20 sm:w-24 md:w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1 md:space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                      >
                        <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 sm:w-64 md:w-72 bg-black/90 border-white/20 p-4 sm:p-5 md:p-6" side="top">
                      <div className="space-y-4 sm:space-y-5 md:space-y-6">
                        <div>
                          <label className="text-white text-sm sm:text-base md:text-lg font-medium mb-2 block">Vitesse de lecture</label>
                          <Select value={playbackSpeed.toString()} onValueChange={handlePlaybackSpeedChange}>
                            <SelectTrigger className="w-full bg-black/50 text-white border-white/20 h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.25">0.25x</SelectItem>
                              <SelectItem value="0.5">0.5x</SelectItem>
                              <SelectItem value="0.75">0.75x</SelectItem>
                              <SelectItem value="1">Normal</SelectItem>
                              <SelectItem value="1.25">1.25x</SelectItem>
                              <SelectItem value="1.5">1.5x</SelectItem>
                              <SelectItem value="1.75">1.75x</SelectItem>
                              <SelectItem value="2">2x</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-white text-sm sm:text-base md:text-lg font-medium mb-2 block">Qualité</label>
                          <Select value={quality} onValueChange={handleQualityChange}>
                            <SelectTrigger className="w-full bg-black/50 text-white border-white/20 h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="240p">240p</SelectItem>
                              <SelectItem value="360p">360p</SelectItem>
                              <SelectItem value="480p">480p</SelectItem>
                              <SelectItem value="720p">720p HD</SelectItem>
                              <SelectItem value="1080p">1080p Full HD</SelectItem>
                              <SelectItem value="4k">4K Ultra HD</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help - only show for non-Odysee and non-Zupload videos on desktop */}
        {!isOdyseeVideo && !isZuploadVideo && !isMobile && (
          <div className="absolute bottom-20 left-4 text-white text-xs opacity-50">
            <p>Raccourcis: Espace/K (Play/Pause) • ← → (Navigation) • ↑ ↓ (Volume) • M (Muet) • F (Plein écran)</p>
          </div>
        )}

      </div>
      
      {/* Advertisement Banner */}
      {shouldShowAds && (
        <div className="py-4">
          <AdvertisementBanner />
        </div>
      )}
    </div>
  );
}
