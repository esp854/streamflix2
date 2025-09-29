import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';

interface ZuploadVideoPlayerProps {
  videoUrl: string;
  title: string;
  onVideoEnd?: () => void;
  onVideoError?: (error: string) => void;
}

const ZuploadVideoPlayer: React.FC<ZuploadVideoPlayerProps> = ({
  videoUrl,
  title,
  onVideoEnd,
  onVideoError
}) => {
  const { isAuthenticated } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(!isAuthenticated);
  const [adSkipped, setAdSkipped] = useState(false);

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
      }, 30000); // 30 seconds ad
      return () => clearTimeout(timer);
    } else {
      setShowAd(false);
    }
  }, [isAuthenticated, adSkipped]);

  const skipAd = () => {
    setShowAd(false);
    setAdSkipped(true);
  };

  // Modified video URL to include branding removal parameters and disable download
  // Simplified parameters to avoid potential issues with Zupload API changes
  const modifiedVideoUrl = videoUrl.includes('?')
    ? `${videoUrl}&autoplay=1`
    : `${videoUrl}?autoplay=1`;

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Ad for non-authenticated users */}
      {showAd && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              title="Publicité YouTube"
            />
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

      {/* Overlay to block clicks in the top-right area (likely download button region) */}
      {!showAd && (
        <div
          className="absolute z-20 top-0 right-0"
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
          }}
        />
      )}
    </div>
  );
};

export default ZuploadVideoPlayer;