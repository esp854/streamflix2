import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipForward, RotateCcw, Server, Maximize, Minimize } from 'lucide-react';

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
  seasonEpisodes?: number;
  onSeasonChange?: (season: number) => void;
  onEpisodeChange?: (episode: number) => void;
  onPreviousEpisode?: () => void;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
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
  seasonEpisodes,
  onSeasonChange,
  onEpisodeChange,
  onPreviousEpisode,
  tmdbId,
  mediaType = 'movie',
  seasonNumber = 1,
  episodeNumber = 1,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    setIsLoading(false);
    setError('Failed to load video content');
    console.error('Video error:', e);
    onVideoError?.('Failed to load video content');
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    const element = iframeRef.current?.parentElement;
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.error('Failed to enter fullscreen:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error('Failed to exit fullscreen:', err);
        });
      }
    }
  };

  // Handle fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reset loading state when videoUrl changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [videoUrl]);

  // Générer les sources vidéo à partir du TMDB ID
  useEffect(() => {
    const sources: VideoSource[] = [];
    
    // Source Zupload (prioritaire) - toujours inclure la source fournie
    if (videoUrl && videoUrl.trim() !== '') {
      sources.push({
        id: 'zupload',
        name: 'Zupload',
        url: videoUrl,
        type: videoUrl.includes('embed') ? 'embed' : 'direct'
      });
    }
    
    // Ajouter les sources alternatives seulement si tmdbId est disponible
    if (tmdbId && tmdbId > 0) {
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
          url: `https://www.2embed.cc/embedtv/${tmdbId}/${seasonNumber}/${episodeNumber}`,
          type: 'embed'
        });
      }
    }
    
    // Si aucune source n'est disponible, afficher un message d'erreur
    if (sources.length === 0) {
      setError('Aucune source vidéo disponible. Veuillez réessayer plus tard.');
      setIsLoading(false);
      return;
    }
    
    setVideoSources(sources);
    setCurrentSourceIndex(0); // Par défaut, utiliser la première source (Zupload si disponible)
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, videoUrl]);

  // Changer de source vidéo
  const changeVideoSource = (index: number) => {
    setCurrentSourceIndex(index);
    setIsLoading(true);
    setError(null);
  };

  // Modified video URL to include branding removal parameters and disable download
  const currentSource = videoSources[currentSourceIndex];
  const modifiedVideoUrl = currentSource?.url && currentSource.url.includes('?') 
    ? `${currentSource.url}&branding=0&show_title=0&show_info=0&disable_download=1&no_download=1` 
    : currentSource?.url 
    ? `${currentSource?.url}?branding=0&show_title=0&show_info=0&disable_download=1&no_download=1`
    : '';

  // Si aucune URL n'est disponible, ne pas afficher l'iframe
  if (!modifiedVideoUrl) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center p-6 bg-black/80 rounded-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">Vidéo non disponible</h3>
          <p className="text-gray-300 mb-4">
            {error || "Aucune source vidéo n'est disponible pour ce contenu."}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !isLoading && (
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

      {/* Overlay to block clicks in the top-right area (likely download button region) */}
      <div
        className="absolute z-20 top-0 right-0"
        style={{ width: '12rem', height: '3rem', cursor: 'default' }}
        onClick={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={(e) => e.preventDefault()}
        onDoubleClick={(e) => e.preventDefault()}
      />
      
      {/* Top Controls - Season and Episode Selection - Petits boutons */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
        <div className="flex items-center space-x-2">
          {onSeasonChange && (
            <Select 
              value={currentSeason.toString()} 
              onValueChange={(value) => onSeasonChange(parseInt(value))}
            >
              <SelectTrigger className="w-16 bg-black/70 text-white border-white/20 text-xs px-2 py-1">
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
              <SelectTrigger className="w-16 bg-black/70 text-white border-white/20 text-xs px-2 py-1">
                <SelectValue placeholder="E" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: seasonEpisodes || totalEpisodes }, (_, i) => i + 1).map(episodeNum => (
                  <SelectItem key={episodeNum} value={episodeNum.toString()}>
                    E{episodeNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Bouton plein écran */}
          <Button
            onClick={toggleFullscreen}
            className="bg-black/70 text-white hover:bg-black/90 text-xs px-2 py-1 h-8"
          >
            {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
          </Button>
          
          {/* Bouton Source - Nouveau bouton pour changer de source */}
          {videoSources.length > 1 && (
            <Select 
              value={currentSourceIndex.toString()} 
              onValueChange={(value) => changeVideoSource(parseInt(value))}
            >
              <SelectTrigger className="bg-black/70 text-white border-white/20 text-xs px-2 py-1 flex items-center">
                <Server className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {videoSources.map((source, index) => (
                  <SelectItem key={source.id} value={index.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {onSkipIntro && (
            <Button
              onClick={onSkipIntro}
              className="bg-black/70 text-white hover:bg-black/90 text-xs px-2 py-1 h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Passer l'intro</span>
            </Button>
          )}
          
          {onNextEpisode && (
            <Button
              onClick={onNextEpisode}
              className="bg-black/70 text-white hover:bg-black/90 text-xs px-2 py-1 h-8"
            >
              <SkipForward className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Épisode suivant</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Middle Controls - Previous/Next Episode Navigation - Petits boutons */}
      <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 flex justify-between items-center z-30">
        <div className="flex items-center">
          {onPreviousEpisode && (
            <Button
              onClick={onPreviousEpisode}
              variant="ghost"
              size="icon"
              className="bg-black/70 text-white hover:bg-black/90 w-8 h-8 rounded-full"
              disabled={currentEpisode <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center">
          {onNextEpisode && (
            <Button
              onClick={onNextEpisode}
              variant="ghost"
              size="icon"
              className="bg-black/70 text-white hover:bg-black/90 w-8 h-8 rounded-full"
              disabled={currentEpisode >= (seasonEpisodes || totalEpisodes)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Direct Zupload iframe integration without custom controls */}
      <iframe
        ref={iframeRef}
        src={modifiedVideoUrl}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; bluetooth; deviceorientation; devicemotion"
        allowFullScreen
        title={`Lecture de ${title}`}
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
        }}
      />
    </div>
  );
};

export default ZuploadVideoPlayer;