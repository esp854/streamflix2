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
import SubscriptionGuard from "@/components/subscription-guard";
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

export default function WatchTV() {
  return (
    <SubscriptionGuard>
      <WatchTVContent />
    </SubscriptionGuard>
  );
}

function WatchTVContent() {
    const { shouldShowAds } = useAuthCheck();
    const { isAuthenticated } = useAuth();
    const { features, planId, isLoading: planLoading } = usePlanFeatures();
    const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
    const { hasAccess, accessType } = useSubscriptionCheck();
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

  const handlePlaybackSpeedChange = useCallback((value: string) => {
    if (!isMountedRef.current) return;
    
    const speed = parseFloat(value);
    setPlaybackSpeed(speed);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.setPlaybackRate(speed);
    }
  }, [isYouTubeVideo]);

  const handleQualityChange = useCallback((value: string) => {
    if (!isMountedRef.current) return;
    
    setQuality(value);
    // Quality change logic would go here
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Navigation functions
  const goToNextEpisode = useCallback(() => {
    if (!isMountedRef.current || !tvDetails || !seasonDetails) return;
    
    // Check if there's a next episode in the current season
    if (currentEpisode < seasonDetails.episodes.length) {
      // Navigate to next episode in same season
      window.location.href = `/watch/tv/${tvId}/${currentSeason}/${currentEpisode + 1}`;
    } else if (currentSeason < tvDetails.number_of_seasons) {
      // Navigate to first episode of next season
      window.location.href = `/watch/tv/${tvId}/${currentSeason + 1}/1`;
    }
  }, [tvId, currentSeason, currentEpisode, tvDetails, seasonDetails]);

  const goToPreviousEpisode = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Check if there's a previous episode in the current season
    if (currentEpisode > 1) {
      // Navigate to previous episode in same season
      window.location.href = `/watch/tv/${tvId}/${currentSeason}/${currentEpisode - 1}`;
    } else if (currentSeason > 1) {
      // Navigate to last episode of previous season
      // We need to fetch the previous season details to get the episode count
      fetch(`/api/tmdb/tv/${tvId}/season/${currentSeason - 1}`)
        .then(res => res.json())
        .then(prevSeasonData => {
          const lastEpisode = prevSeasonData.episodes.length;
          window.location.href = `/watch/tv/${tvId}/${currentSeason - 1}/${lastEpisode}`;
        })
        .catch(err => {
          console.error('Error fetching previous season:', err);
          // Fallback to first episode of previous season if we can't get the count
          window.location.href = `/watch/tv/${tvId}/${currentSeason - 1}/1`;
        });
    }
  }, [tvId, currentSeason, currentEpisode]);



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center">
          <div className="loader-wrapper">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
          <p className="mt-4 text-white">Chargement de la série...</p>
        </div>
      </div>
    );
  }

  // Handle YouTube video
  if (isYouTubeVideo) {
    return (
      <div className="flex flex-col min-h-screen bg-black">
        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            id="youtube-player"
            src={`https://www.youtube.com/embed/${new URL(videoUrl!).searchParams.get('v')}?enablejsapi=1`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={tvDetails?.name || "YouTube Video"}
          ></iframe>
          
          {/* YouTube Player Controls Overlay */}
          {showControls && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end pointer-events-none">
              <div className="p-4 pointer-events-auto">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between items-center text-white text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 pointer-events-auto">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Button
                    onClick={handlePlayPause}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 md:w-6 md:h-6" /> : <Play className="w-4 h-4 md:w-6 md:h-6" />}
                  </Button>
                  
                  <div className="flex items-center space-x-2">
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
                          <label className="text-white text-xs md:text-sm font-medium">Vitesse de lecture</label>
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
          )}
        </div>
        
        {/* TV Show Details */}
        <div className="container mx-auto px-4 py-6 flex-grow">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {tvDetails?.name} - S{currentSeason} E{currentEpisode}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-4">
                <span>{tvDetails?.first_air_date?.substring(0, 4)}</span>
                <span>•</span>
                {tvDetails?.genres?.map((genre: any) => genre.name).join(', ')}
              </div>
              
              <p className="text-gray-300 mb-6">{episodeData?.overview || tvDetails?.overview}</p>
              
              <div className="flex items-center gap-4 mb-6">
                <Button
                  onClick={handleFavoriteToggle}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </Button>
                
                <Button
                  onClick={goToPreviousEpisode}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={currentSeason === 1 && currentEpisode === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Épisode précédent
                </Button>
                
                <Button
                  onClick={goToNextEpisode}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Épisode suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="md:w-1/3">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-bold text-white mb-4">Détails</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Note:</span>
                    <span className="text-white ml-2">{tvDetails?.vote_average?.toFixed(1)}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Popularité:</span>
                    <span className="text-white ml-2">{tvDetails?.popularity}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Statut:</span>
                    <span className="text-white ml-2">{tvDetails?.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Langue:</span>
                    <span className="text-white ml-2">{tvDetails?.original_language}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

  // Handle Zupload video
  if (isZuploadVideo) {
    return (
      <div className="flex flex-col min-h-screen bg-black">
        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black">
          <ZuploadVideoPlayer 
            videoUrl={videoUrl!} 
            title={`${tvDetails?.name} - S${currentSeason} E${currentEpisode}` || "Épisode"}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            totalSeasons={tvDetails?.number_of_seasons || 1}
            totalEpisodes={seasonDetails?.episodes?.length || 10}
            onSeasonChange={(season) => window.location.href = `/watch/tv/${tvId}/${season}/1`}
            onEpisodeChange={(episode) => window.location.href = `/watch/tv/${tvId}/${currentSeason}/${episode}`}
            onNextEpisode={goToNextEpisode}
            onPreviousEpisode={goToPreviousEpisode}
          />
          
          {/* Video Controls Overlay */}
          {showControls && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
              <div className="p-4">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between items-center text-white text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Button
                    onClick={handlePlayPause}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 md:w-6 md:h-6" /> : <Play className="w-4 h-4 md:w-6 md:h-6" />}
                  </Button>
                  
                  <div className="flex items-center space-x-2">
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
                          <label className="text-white text-xs md:text-sm font-medium">Vitesse de lecture</label>
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
                          <label className="text-white text-xs md:text-sm font-medium">Qualité</label>
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
          )}
        </div>
        
        {/* TV Show Details */}
        <div className="container mx-auto px-4 py-6 flex-grow">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {tvDetails?.name} - S{currentSeason} E{currentEpisode}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-4">
                <span>{tvDetails?.first_air_date?.substring(0, 4)}</span>
                <span>•</span>
                {tvDetails?.genres?.map((genre: any) => genre.name).join(', ')}
              </div>
              
              <p className="text-gray-300 mb-6">{episodeData?.overview || tvDetails?.overview}</p>
              
              <div className="flex items-center gap-4 mb-6">
                <Button
                  onClick={handleFavoriteToggle}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </Button>
                
                <Button
                  onClick={goToPreviousEpisode}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={currentSeason === 1 && currentEpisode === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Épisode précédent
                </Button>
                
                <Button
                  onClick={goToNextEpisode}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Épisode suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="md:w-1/3">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-bold text-white mb-4">Détails</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Note:</span>
                    <span className="text-white ml-2">{tvDetails?.vote_average?.toFixed(1)}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Popularité:</span>
                    <span className="text-white ml-2">{tvDetails?.popularity}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Statut:</span>
                    <span className="text-white ml-2">{tvDetails?.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Langue:</span>
                    <span className="text-white ml-2">{tvDetails?.original_language}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

  // Handle regular video
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Zupload Video Player Only */}
      <div className="relative w-full aspect-video bg-black">
        {contentWithVideo?.odyseeUrl ? (
          <ZuploadVideoPlayer 
            videoUrl={contentWithVideo.odyseeUrl} 
            title={`${tvDetails?.name} - S${currentSeason} E${currentEpisode}` || "Épisode"}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            totalSeasons={tvDetails?.number_of_seasons || 1}
            totalEpisodes={seasonDetails?.episodes?.length || 10}
            onSeasonChange={(season) => window.location.href = `/watch/tv/${tvId}/${season}/1`}
            onEpisodeChange={(episode) => window.location.href = `/watch/tv/${tvId}/${currentSeason}/${episode}`}
            onNextEpisode={goToNextEpisode}
            onPreviousEpisode={goToPreviousEpisode}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <p className="text-white text-lg">Aucune vidéo disponible pour cette série</p>
              <Link to="/">
                <Button variant="outline" className="mt-4">Retour à l'accueil</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}