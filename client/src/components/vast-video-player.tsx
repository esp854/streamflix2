import React, { useState, useEffect, useRef } from 'react';

interface VASTVideoPlayerProps {
  vastUrl: string;
  onAdComplete: () => void;
  onAdError?: (error: string) => void;
}

const VASTVideoPlayer: React.FC<VASTVideoPlayerProps> = ({
  vastUrl,
  onAdComplete,
  onAdError
}) => {
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [isAdCompleted, setIsAdCompleted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [adDuration, setAdDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse VAST XML and extract ad information
  const parseVAST = async (vastUrl: string) => {
    try {
      const response = await fetch(vastUrl);
      const vastXML = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(vastXML, 'text/xml');
      
      // Extract media file URL from VAST
      const mediaFile = xmlDoc.querySelector('MediaFile');
      const mediaUrl = mediaFile?.textContent?.trim();
      
      if (mediaUrl) {
        return mediaUrl;
      } else {
        throw new Error('No media file found in VAST response');
      }
    } catch (error) {
      console.error('Error parsing VAST:', error);
      throw error;
    }
  };

  // Load and play ad
  const loadAndPlayAd = async () => {
    try {
      setIsAdPlaying(true);
      const adMediaUrl = await parseVAST(vastUrl);
      
      if (videoRef.current) {
        videoRef.current.src = adMediaUrl;
        videoRef.current.load();
        
        // Set up event listeners
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setAdDuration(videoRef.current.duration);
            setTimeRemaining(Math.ceil(videoRef.current.duration));
          }
        };
        
        videoRef.current.onended = () => {
          handleAdComplete();
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Ad video error:', e);
          handleAdError('Failed to load advertisement');
        };
        
        // Start playing the ad
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error loading ad:', error);
      handleAdError('Failed to load advertisement');
    }
  };

  // Handle ad completion
  const handleAdComplete = () => {
    setIsAdPlaying(false);
    setIsAdCompleted(true);
    cleanupTimeouts();
    onAdComplete();
  };

  // Handle ad error
  const handleAdError = (errorMessage: string) => {
    setIsAdPlaying(false);
    cleanupTimeouts();
    onAdError?.(errorMessage);
    onAdComplete(); // Proceed to content even if ad fails
  };

  // Skip ad function
  const skipAd = () => {
    if (canSkip && videoRef.current) {
      handleAdComplete();
    }
  };

  // Cleanup timeouts
  const cleanupTimeouts = () => {
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
      adTimeoutRef.current = null;
    }
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
  };

  // Set up skip timer (5 seconds)
  useEffect(() => {
    if (isAdPlaying) {
      // Enable skip after 5 seconds
      skipTimeoutRef.current = setTimeout(() => {
        setCanSkip(true);
      }, 5000);
      
      // Auto-skip after 30 seconds if ad is too long
      adTimeoutRef.current = setTimeout(() => {
        if (isAdPlaying) {
          handleAdComplete();
        }
      }, 30000);
    }
    
    return cleanupTimeouts;
  }, [isAdPlaying]);

  // Update time remaining
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAdPlaying && adDuration > 0) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const remaining = Math.ceil(adDuration - videoRef.current.currentTime);
          setTimeRemaining(remaining > 0 ? remaining : 0);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAdPlaying, adDuration]);

  // Load ad when component mounts
  useEffect(() => {
    loadAndPlayAd();
    
    return cleanupTimeouts;
  }, [vastUrl]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Ad Video Player */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={false}
        playsInline
      />
      
      {/* Ad UI Overlay */}
      {isAdPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Skip Button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={skipAd}
              disabled={!canSkip}
              className={`px-4 py-2 rounded bg-black/70 text-white text-sm font-medium pointer-events-auto ${
                canSkip 
                  ? 'hover:bg-black/90 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {canSkip ? `Passer (${timeRemaining}s)` : `Publicité · ${timeRemaining}s`}
            </button>
          </div>
          
          {/* Ad Indicator */}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Publicité
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {!isAdPlaying && !isAdCompleted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p>Chargement de la publicité...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VASTVideoPlayer;