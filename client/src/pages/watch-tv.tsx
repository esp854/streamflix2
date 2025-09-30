import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Home, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Settings, SkipBack, SkipForward, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Download, Share2, CreditCard, Heart } from "lucide-react";
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
import { useFavorites } from "@/hooks/use-favorites";
import ZuploadVideoPlayer from "@/components/zupload-video-player"; // Import ZuploadVideoPlayer
import { useIsMobile } from "@/hooks/use-mobile";

export default function WatchTV() {
    const { shouldShowAds } = useAuthCheck();
    const { isAuthenticated } = useAuth();
    const { features, planId, isLoading: planLoading } = usePlanFeatures();
    const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
    const { id, season = "1", episode = "1" } = useParams<{ id: string; season?: string; episode?: string }>();
    const tvId = parseInt(id || "0");
    const currentSeason = parseInt(season);
    const currentEpisode = parseInt(episode);
 
 const videoRef = useRef<HTMLVideoElement>(null);
 const isMountedRef = useRef(true);
 // Add YouTube player ref
 const youtubePlayerRef = useRef<any>(null);
 const isMobile = useIsMobile(); // Détecter si l'appareil est mobile
 
 const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("1080p");
  const [isBuffering, setIsBuffering] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Add YouTube and Zupload video detection states
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [isZuploadVideo, setIsZuploadVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Add videoUrl state
  const [videoError, setVideoError] = useState<string | null>(null); // Add videoError state

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

  const { data: tvDetails, isLoading: tmdbLoading } = useQuery({
    queryKey: [`/api/tmdb/tv/${tvId}`],
    queryFn: () => tmdbService.getTVShowDetails(tvId),
    enabled: !!tvId,
  });

  // Fetch season details for accurate episode count
  const { data: seasonDetails } = useQuery({
    queryKey: [`/api/tmdb/tv/${tvId}/season/${currentSeason}`],
    queryFn: () => tmdbService.getTVSeasonDetails(tvId, currentSeason),
    enabled: !!tvId && !!tvDetails, // Only fetch when TV details are loaded
  });

  // Fetch episode data for series
  const { data: episodeData, isLoading: episodeLoading } = useQuery({
    queryKey: [`/api/episodes/tv/${tvId}/${currentSeason}/${currentEpisode}`],
    queryFn: async () => {
      console.log(`[DEBUG] Fetching episode data: /api/episodes/tv/${tvId}/${currentSeason}/${currentEpisode}`);
      const response = await fetch(`/api/episodes/tv/${tvId}/${currentSeason}/${currentEpisode}`);
      console.log(`[DEBUG] Episode API response status: ${response.status}`);
      if (!response.ok) {
        console.log('[WatchTV] Episode not found, falling back to main content');
        const errorText = await response.text();
        console.log(`[DEBUG] Episode API error response: ${errorText}`);
        return null;
      }
      const data = await response.json();
      console.log(`[DEBUG] Episode data received:`, data);
      return data;
    },
    enabled: !!tvId,
    retry: false,
  });

  // Fetch content with video link (fallback for series without episode data)
  const { data: contentWithVideo, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/contents/tmdb/${tvId}`],
    queryFn: async () => {
      const response = await fetch(`/api/contents/tmdb/${tvId}`);
      if (!response.ok) {
        // Instead of throwing an error, return a default content object
        return {
          id: `tmdb-${tvId}`,
          tmdbId: tvId,
          odyseeUrl: "",
          active: false,
          createdAt: new Date().toISOString()
        };
      }
      return response.json();
    },
    enabled: !!tvId && !episodeData, // Only fetch if no episode data
    retry: false, // Don't retry on 404
  });

  // Check if series is favorite
  const { data: favoriteStatus } = checkFavorite(tvId);
  const isFavorite = favoriteStatus?.isFavorite || false;

  const isLoading = tmdbLoading || contentLoading || episodeLoading || planLoading;

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
        case 'n':
          e.preventDefault();
          goToNextEpisode();
          break;
        case 'p':
          e.preventDefault();
          goToPreviousEpisode();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isTransitioning]);

  // Check if video is YouTube or Zupload
  useEffect(() => {
    // Prioritize episode data over main content data for series
    const videoData = episodeData?.episode || contentWithVideo;

    if (videoData?.odyseeUrl) {
      const url = videoData.odyseeUrl;
      setIsYouTubeVideo(url.includes("youtube.com") || url.includes("youtu.be"));
      setIsZuploadVideo(url.includes("zupload"));
      setVideoUrl(url); // Set videoUrl here
    }
  }, [episodeData, contentWithVideo]);

  // Check if video is Odysee
  const isOdyseeVideo = useMemo(() => {
    const videoData = episodeData?.episode || contentWithVideo;
    return videoData?.odyseeUrl && videoData.odyseeUrl.includes("odysee.com");
  }, [episodeData, contentWithVideo]);

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
        // Clean up time interval if it exists
        const timeInterval = (youtubePlayerRef.current as any)._timeInterval;
        if (timeInterval) {
          clearInterval(timeInterval);
        }
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

        // Store the interval ID in the player ref for cleanup
        if (youtubePlayerRef.current) {
          (youtubePlayerRef.current as any)._timeInterval = timeInterval;
        }

        return () => clearInterval(timeInterval);
      }
    }, 500);
  };

  // Video event handlers
  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current || isTransitioning || !isMountedRef.current) return;
    
    setIsTransitioning(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!isMountedRef.current) return;
      
      if (isYouTubeVideo && youtubePlayerRef.current) {
        // YouTube player controls
        if (isPlaying) {
          youtubePlayerRef.current.pauseVideo();
        } else {
          youtubePlayerRef.current.playVideo();
        }
      } else {
        // Regular video element controls
        if (isPlaying) {
          const pausePromise = videoRef.current.pause();
          if (pausePromise !== undefined) {
            await pausePromise;
          }
        } else {
          await videoRef.current.play();
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.log('Playback operation error:', error);
      }
      if (videoRef.current && isMountedRef.current) {
        setIsPlaying(!videoRef.current.paused);
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
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume[0] / 100;
      if (newVolume[0] === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  }, [isYouTubeVideo]);

  const handleMute = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const newMutedState = !isMuted;
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      if (newMutedState) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
      }
    } else if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
    
    setIsMuted(newMutedState);
  }, [isMuted, isYouTubeVideo]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    setDuration(videoRef.current.duration);
  }, []);

  const handleSeek = useCallback((newTime: number[]) => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const time = newTime[0];
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(time, true);
    } else {
      videoRef.current.currentTime = time;
    }
    
    setCurrentTime(time);
  }, [isYouTubeVideo]);

  const skipBackward = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const newTime = Math.max(0, currentTime - 10);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else {
      videoRef.current.currentTime = newTime;
    }
    
    setCurrentTime(newTime);
  }, [currentTime, isYouTubeVideo]);

  const skipForward = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 10);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else {
      videoRef.current.currentTime = newTime;
    }
    
    setCurrentTime(newTime);
  }, [currentTime, duration, isYouTubeVideo]);

  const rewind15 = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const newTime = Math.max(0, currentTime - 15);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else {
      videoRef.current.currentTime = newTime;
    }
    
    setCurrentTime(newTime);
  }, [currentTime, isYouTubeVideo]);

  const forward15 = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 15);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else {
      videoRef.current.currentTime = newTime;
    }
    
    setCurrentTime(newTime);
  }, [currentTime, duration, isYouTubeVideo]);

  const handlePlaybackSpeedChange = useCallback((speed: string) => {
    if (!isMountedRef.current) return;
    
    const speedValue = parseFloat(speed);
    setPlaybackSpeed(speedValue);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.setPlaybackRate(speedValue);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speedValue;
    }
  }, [isYouTubeVideo]);

  const handleQualityChange = useCallback((newQuality: string) => {
    if (!isMountedRef.current) return;
    
    setQuality(newQuality);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      // Quality changes are handled automatically by YouTube player
      // based on bandwidth and screen size
    }
    // In a real app, you would switch video sources here for regular videos
    console.log(`Quality changed to: ${newQuality}`);
  }, [isYouTubeVideo]);

  const goToPreviousEpisode = useCallback(() => {
    if (!isMountedRef.current || currentEpisode <= 1) return;

    const newEpisode = currentEpisode - 1;
    const newUrl = `/watch/tv/${tvId}/${currentSeason}/${newEpisode}`;
    window.location.href = newUrl;
  }, [tvId, currentSeason, currentEpisode]);

  const goToNextEpisode = useCallback(() => {
    if (!isMountedRef.current) return;

    // Use actual episode count from season details, fallback to 10
    const maxEpisodes = seasonDetails?.episodes?.length || 10;
    let newEpisode = currentEpisode + 1;
    let newSeason = currentSeason;

    if (newEpisode > maxEpisodes) {
      newEpisode = 1;
      newSeason = currentSeason + 1;
    }

    const newUrl = `/watch/tv/${tvId}/${newSeason}/${newEpisode}`;
    window.location.href = newUrl;
  }, [tvId, currentSeason, currentEpisode, seasonDetails]);

  const handleGoHome = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isMountedRef.current) return;
    
    // Exit fullscreen if we're in it
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        if (isMountedRef.current) {
          window.location.href = '/';
        }
      }).catch(() => {
        if (isMountedRef.current) {
          window.location.href = '/';
        }
      });
    } else {
      window.location.href = '/';
    }
  }, []);

  const downloadEpisode = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // In a real app, this would trigger a download
    console.log('Download requested for episode');
  }, []);

  const shareShow = useCallback(() => {
    if (!isMountedRef.current) return;

    // In a real app, this would open share options
    if (navigator.share) {
      navigator.share({
        title: tvDetails?.name,
        url: window.location.href,
      }).catch(err => console.log('Share failed:', err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => console.log('Link copied to clipboard'))
        .catch(err => console.log('Copy failed:', err));
    }
  }, [tvDetails?.name]);

  const handleToggleFavorite = useCallback(async () => {
    if (!isMountedRef.current || !tvDetails) return;

    await toggleFavorite(tvDetails, 'tv');
  }, [tvDetails, toggleFavorite]);

  const toggleFullscreen = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (!document.fullscreenElement) {
      if (videoRef.current) {
        videoRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Function to skip intro (jump 90 seconds forward)
  const skipIntro = useCallback(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 90);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else {
      videoRef.current.currentTime = newTime;
    }
    
    setCurrentTime(newTime);
  }, [currentTime, duration, isYouTubeVideo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement de la série...</p>
        </div>
      </div>
    );
  }

  // Check if authenticated user has paid subscription
  if (isAuthenticated && planId === 'free') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md p-8">
          <div className="text-6xl mb-6">📺</div>
          <h1 className="text-2xl font-bold mb-4">Abonnement requis</h1>
          <p className="text-gray-300 mb-6">
            Pour regarder cette série, vous devez souscrire à un abonnement payant.
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
              onClick={(e) => handleGoHome(e)}
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

  // Show message if content exists but no video link is available
  if (tvDetails && !contentWithVideo && !contentLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md p-4">
          <h1 className="text-2xl font-bold mb-4">Lien vidéo non disponible</h1>
          <p className="mb-6 text-muted-foreground">
            Cette vidéo n'est pas encore disponible. Veuillez revenir plus tard.
          </p>
          <Link href="/series">
            <Button variant="secondary">Retour aux séries</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!tvDetails) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Série non trouvée</h1>
          <Link href="/series">
            <Button variant="secondary">Retour aux séries</Button>
          </Link>
        </div>
      </div>
    );
  }

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

  // Progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Video container */}
      <div className="relative w-full h-screen">
        {/* Zupload Video Player */}
        {isZuploadVideo && videoUrl && (
          <ZuploadVideoPlayer 
            videoUrl={videoUrl}
            title={`${tvDetails.name} - S${currentSeason} E${currentEpisode}`}
            onVideoEnd={goToNextEpisode}
          />
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
          onClick={(e) => handleGoHome(e)}
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 z-50 bg-black/70 text-white hover:bg-black/90 transition-all duration-200 border border-white/20 backdrop-blur-sm"
          title="Retour à l'accueil"
        >
          <Home className="w-4 h-4 mr-2" />
          Accueil
        </Button>

        {/* Controls Overlay - show for all video types except Odysee */}
        {!isOdyseeVideo && (
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
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
              <div className="text-white text-center">
                <div className="text-xl font-semibold">{tvDetails.name}</div>
                <div className="text-sm text-gray-300">Season {currentSeason} • Episode {currentEpisode}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleToggleFavorite}
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-white/20 ${isFavorite ? 'bg-primary/20' : ''}`}
                  disabled={isAddingToFavorites}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  onClick={shareShow}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={downloadEpisode}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                <Select
                  value={currentSeason.toString()}
                  onValueChange={(value) => {
                    const newSeason = parseInt(value);
                    const newUrl = `/watch/tv/${tvId}/${newSeason}/${currentEpisode}`;
                    window.location.href = newUrl;
                  }}
                >
                  <SelectTrigger className="w-20 md:w-24 bg-black/50 text-white border-white/20 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: tvDetails.number_of_seasons || 1 }, (_, i) => i + 1).map(seasonNum => (
                      <SelectItem key={seasonNum} value={seasonNum.toString()}>
                        S{seasonNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentEpisode.toString()}
                  onValueChange={(value) => {
                    const newEpisode = parseInt(value);
                    const newUrl = `/watch/tv/${tvId}/${currentSeason}/${newEpisode}`;
                    window.location.href = newUrl;
                  }}
                >
                  <SelectTrigger className="w-20 md:w-24 bg-black/50 text-white border-white/20 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: seasonDetails?.episodes?.length || 10 }, (_, i) => i + 1).map(episodeNum => (
                      <SelectItem key={episodeNum} value={episodeNum.toString()}>
                        E{episodeNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Center Controls */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-4 md:space-x-8">
                <Button
                  onClick={rewind15}
                  variant="ghost"
                  size={isMobile ? "icon" : "lg"}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
                
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size={isMobile ? "icon" : "lg"}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8" /> : <Play className="w-6 h-6 md:w-8 md:h-8" />}
                </Button>
                
                <Button
                  onClick={forward15}
                  variant="ghost"
                  size={isMobile ? "icon" : "lg"}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <RotateCw className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>

            {/* Episode Navigation */}
            <div className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2">
              <Button
                onClick={goToPreviousEpisode}
                variant="ghost"
                size={isMobile ? "icon" : "lg"}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                disabled={currentEpisode <= 1}
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
            
            <div className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2">
              <Button
                onClick={goToNextEpisode}
                variant="ghost"
                size={isMobile ? "icon" : "lg"}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                disabled={currentEpisode >= (seasonDetails?.episodes?.length || tvDetails?.number_of_episodes || 1)}
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-4 right-4 space-y-2 md:space-y-4">
              {/* Progress Bar */}
              <div className="flex items-center space-x-2 md:space-x-4">
                <span className="text-white text-xs md:text-sm min-w-[45px] md:min-w-[60px]">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration}
                  step={1}
                  className="flex-1"
                />
                <span className="text-white text-xs md:text-sm min-w-[45px] md:min-w-[60px]">
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
                    className="text-white hover:bg-white/20 w-8 h-8 md:w-9 md:h-9"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5" />}
                  </Button>
                  
                  <Button
                    onClick={skipBackward}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-8 h-8 md:w-9 md:h-9"
                  >
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  
                  <Button
                    onClick={skipForward}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-8 h-8 md:w-9 md:h-9"
                  >
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>

                  <div className="flex items-center space-x-1 md:space-x-2 ml-2 md:ml-4">
                    <Button
                      onClick={handleMute}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 w-8 h-8 md:w-9 md:h-9"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                    </Button>
                    <Slider
                      value={volume}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-16 md:w-24"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1 md:space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 w-8 h-8 md:w-9 md:h-9"
                      >
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 md:w-56 bg-black/90 border-white/20 p-3 md:p-4" side="top">
                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <label className="text-white text-xs md:text-sm font-medium block mb-2">Vitesse de lecture</label>
                          <Select value={playbackSpeed.toString()} onValueChange={handlePlaybackSpeedChange}>
                            <SelectTrigger className="w-full bg-black/50 text-white border-white/20 h-8 md:h-9 text-xs md:text-sm">
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
                          <label className="text-white text-xs md:text-sm font-medium block mb-2">Qualité</label>
                          <Select value={quality} onValueChange={handleQualityChange}>
                            <SelectTrigger className="w-full bg-black/50 text-white border-white/20 h-8 md:h-9 text-xs md:text-sm">
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
                    className="text-white hover:bg-white/20 w-8 h-8 md:w-9 md:h-9"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help - show for all video types except Odysee on desktop */}
        {!isOdyseeVideo && !isMobile && (
          <div className="absolute bottom-20 left-4 text-white text-xs opacity-50">
            <p>Raccourcis: Espace/K (Play/Pause) • ← → (Navigation) • ↑ ↓ (Volume) • M (Muet) • F (Plein écran) • N (Épisode suivant) • P (Épisode précédent)</p>
          </div>
        )}

      </div>
    </div>
  );
}