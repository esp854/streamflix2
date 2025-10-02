import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { SkipForward, RotateCcw, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads';
import 'videojs-ima';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(!isAuthenticated);
  const [adSkipped, setAdSkipped] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Video.js player with IMA plugin
  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;
    
    // Create Video.js player
    const player = videojs(videoElement, {
      controls: true,
      preload: 'auto',
      fluid: true,
      responsive: true,
    });

    playerRef.current = player;

    // Initialize IMA plugin for VAST ads
    if (!isAuthenticated) {
      player.ima({
        adTagUrl: 'https://selfishzone.com/demnFEzUd.GdNDvxZCGLUk/uexm/9buUZDU/lLkbPlTdYK2kNDj/YawqNwTJkltNNejoYh2-NGjtA/2/M/Ay',
        // Additional IMA options
        debug: true,
      });

      // Start ad display
      player.ready(() => {
        player.ima.initializeAdDisplayContainer();
        player.ima.requestAds();
      });
    }

    // Handle player events
    player.on('loadstart', () => {
      setIsLoading(true);
      setError(null);
    });

    player.on('loadeddata', () => {
      setIsLoading(false);
    });

    player.on('error', () => {
      setIsLoading(false);
      setError('Failed to load video content');
      onVideoError?.('Failed to load video content');
    });

    player.on('ended', () => {
      onVideoEnd?.();
    });

    // Cleanup player on unmount
    return () => {
      if (player) {
        player.dispose();
      }
    };
  }, [videoUrl, isAuthenticated, onVideoEnd, onVideoError]);

  // Handle ad for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !adSkipped) {
      setShowAd(true);
      const timer = setTimeout(() => {
        setShowAd(false);
        setAdSkipped(true);
      }, 30000); // 30 seconds ad
      return () => clearTimeout(timer);
    } else {
      setShowAd(false);
    }
  }, [isAuthenticated, adSkipped]);

  const skipAd = () => {
    setShowAd(false);
    setAdSkipped(true);
    
    // Skip the ad in Video.js player if it exists
    if (playerRef.current) {
      playerRef.current.ima.skipAd();
    }
  };

  // Show controls on mouse move and auto-hide after 3 seconds
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen bg-black"
      onMouseMove={handleMouseMove}
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
            {/* Video.js player with VAST ads will be shown here */}
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={skipAd}
                className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded hover:bg-black/90 transition-colors z-40"
              >
                Passer la pub (30s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !showAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !showAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6 bg-black/80 rounded-lg max-w-md">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Erreur de chargement</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
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
                <SelectTrigger className="w-16 md:w-24 bg-black/70 text-white border-white/20 text-xs md:text-sm">
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
                <SelectTrigger className="w-16 md:w-24 bg-black/70 text-white border-white/20 text-xs md:text-sm">
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
          
          <div className="flex space-x-1 md:space-x-2">
            {onSkipIntro && (
              <button
                onClick={onSkipIntro}
                className="bg-black/70 text-white px-2 py-1 md:px-3 md:py-1 rounded hover:bg-black/90 transition-colors flex items-center text-xs md:text-sm"
              >
                <RotateCw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden md:inline">Passer l'intro</span>
              </button>
            )}
            
            {onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="bg-black/70 text-white px-2 py-1 md:px-3 md:py-1 rounded hover:bg-black/90 transition-colors flex items-center text-xs md:text-sm"
              >
                <SkipForward className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden md:inline">Épisode suivant</span>
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
                className="bg-black/70 text-white hover:bg-black/90 w-8 h-8 md:w-10 md:h-10 rounded-full"
                disabled={currentEpisode <= 1}
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onNextEpisode && (
              <Button
                onClick={onNextEpisode}
                variant="ghost"
                size="icon"
                className="bg-black/70 text-white hover:bg-black/90 w-8 h-8 md:w-10 md:h-10 rounded-full"
                disabled={currentEpisode >= totalEpisodes}
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Video.js player container */}
      {!showAd && (
        <div data-vjs-player className="w-full h-full">
          <video
            ref={videoRef}
            className="video-js vjs-default-skin w-full h-full"
            playsInline
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;