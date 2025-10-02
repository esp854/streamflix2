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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(!isAuthenticated);
  const [adSkipped, setAdSkipped] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    setIsLoading(false);
    setError('Failed to load video content');
    onVideoError?.('Failed to load video content');
  };

  // Reset loading state when videoUrl changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [videoUrl]);

  // Handle ad for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !adSkipped) {
      setShowAd(true);
      const timer = setTimeout(() => {
        setShowAd(false);
        setAdSkipped(true);
        // Réinitialiser l'état de chargement après la fin de la pub
        setIsLoading(true);
      }, 30000); // 30 seconds ad
      return () => clearTimeout(timer);
    } else {
      setShowAd(false);
      // S'assurer que l'état de chargement est réinitialisé quand il n'y a pas de pub
      if (!isAuthenticated || adSkipped) {
        setIsLoading(true);
      }
    }
  }, [isAuthenticated, adSkipped]);

  const skipAd = () => {
    setShowAd(false);
    setAdSkipped(true);
    // Réinitialiser l'état de chargement après avoir passé la pub
    setIsLoading(true);
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

  // Modified video URL to include branding removal parameters and disable download
  // Simplified parameters to avoid potential issues with Zupload API changes
  const modifiedVideoUrl = videoUrl.includes('?')
    ? `${videoUrl}&autoplay=1`
    : `${videoUrl}?autoplay=1`;

  // URL VAST de HilltopAds
  const vastTagUrl = 'https://selfishzone.com/demnFEzUd.GdNDvxZCGLUk/uexm/9buUZDU/lLkbPlTdYK2kNDj/YawqNwTJkltNNejoYh2-NGjtA/2/M/Ay';

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
            {/* HilltopAds VAST integration */}
            <div 
              id="hilltopads-zone-1" 
              className="w-full h-full flex items-center justify-center"
            >
              {/* Conteneur pour HilltopAds VAST */}
              <div dangerouslySetInnerHTML={{ 
                __html: `
                <script type="text/javascript">
                  // Création du lecteur Zupload avec intégration VAST
                  if (window.ZuploadPlayer) {
                    const player = new ZuploadPlayer({
                      container: '#hilltopads-zone-1',
                      vastTag: '${vastTagUrl}',
                      autoplay: true,
                      controls: true
                    });
                    player.init();
                  } else {
                    // Fallback si ZuploadPlayer n'est pas disponible
                    var atOptions = {
                      'key' : 'd0a26cf005980043c2e129630f0053e0',
                      'format' : 'iframe',
                      'height' : '100%',
                      'width' : '100%',
                      'params' : {}
                    };
                    if (document.getElementById('hilltopads-script-1')) {
                      document.getElementById('hilltopads-script-1').remove();
                    }
                    var script = document.createElement('script');
                    script.id = 'hilltopads-script-1';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.src = 'https://hilltopads.net/pcode/adult.php?' + Math.floor(Math.random()*99999999999);
                    document.getElementById('hilltopads-zone-1').appendChild(script);
                  }
                </script>
                `
              }} />
            </div>
            <button
              onClick={skipAd}
              className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded hover:bg-black/90 transition-colors z-40"
            >
              Passer la pub (30s)
            </button>
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

      {/* Overlay to block clicks in the top-right area (likely download button region) */}
      {!showAd && (
        <div
          className="absolute z-10 top-0 right-0"
          style={{ width: '12rem', height: '3rem', cursor: 'default' }}
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.preventDefault()}
          onDoubleClick={(e) => e.preventDefault()}
        />
      )}
      
      {/* Direct Zupload iframe integration without custom controls */}
      {!showAd && (
        <iframe
          ref={iframeRef}
          src={modifiedVideoUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          title={`Lecture de ${title}`}
          // More restrictive sandbox to prevent downloads
          sandbox="allow-scripts allow-same-origin allow-presentation"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          loading="lazy"
          // Additional attributes to prevent downloads
          referrerPolicy="no-referrer"
          // Styling to blend seamlessly
          style={{
            backgroundColor: 'black',
            border: 'none',
            outline: 'none',
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;