import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Home, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Settings, SkipBack, SkipForward, RotateCcw, RotateCw, Download, Share2, CreditCard } from "lucide-react";
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
  const [isZuploadVideo, setIsZuploadVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
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

  // Check if video is Odysee
  const isOdyseeVideo = useMemo(() => {
    return contentWithVideo?.odyseeUrl && contentWithVideo.odyseeUrl.includes("odysee.com");
  }, [contentWithVideo?.odyseeUrl]);

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
  }, [isPlaying, isTransitioning]);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    if (!isMountedRef.current) return;
    
    setVolume(newVolume);
    
  }, []);

  const handleMute = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newMutedState = !isMuted;
    
    setIsMuted(newMutedState);
  }, [isMuted]);

  const handleSeek = useCallback((newTime: number[]) => {
    if (!isMountedRef.current) return;
    
    const time = newTime[0];
    
    setCurrentTime(time);
  }, []);

  const skipBackward = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.max(0, currentTime - 10);
    
    setCurrentTime(newTime);
  }, [currentTime]);

  const skipForward = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 10);
    
    setCurrentTime(newTime);
  }, [currentTime, duration]);

  const rewind15 = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.max(0, currentTime - 15);
    
    setCurrentTime(newTime);
  }, [currentTime]);

  const forward15 = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 15);
    
    setCurrentTime(newTime);
  }, [currentTime, duration]);

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
    
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    if (!isMountedRef.current) return;
    
    setQuality(quality);
    
  }, []);

  const handleVideoError = useCallback((error: string) => {
    setVideoError(error);
  }, []);

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
              title={movieDetails.movie.title}
              onVideoError={handleVideoError}
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
