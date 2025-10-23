import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lazy?: boolean;
  webpSrc?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  lazy = true, 
  webpSrc,
  className = '',
  onLoad,
  onError,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // If WebP source is provided, try to use it first
    if (webpSrc) {
      setImageSrc(webpSrc);
    } else {
      // Convert to WebP if possible
      const webpVersion = src.replace(/\.(jpg|jpeg|png)/i, '.webp');
      setImageSrc(webpVersion);
    }
  }, [src, webpSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // If WebP failed, fallback to original format
    if (imageSrc !== src && !hasError) {
      setImageSrc(src);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  // Add loading and loaded classes for animations
  const imageClasses = `${className} transition-opacity duration-300 ${
    isLoaded ? 'opacity-100' : 'opacity-0'
  }`;

  // Loading placeholder
  if (!isLoaded && !hasError) {
    return (
      <div 
        className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse`}
        style={{ 
          backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'loading 1.5s infinite'
        }}
      />
    );
  }

  // Error placeholder
  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        <svg 
          className="w-1/3 h-1/3 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      className={imageClasses}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default OptimizedImage;