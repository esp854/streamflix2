import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderSrc?: string;
  threshold?: number;
  blur?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholderSrc = '/placeholder-image.png',
  threshold = 0.1,
  blur = true,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, threshold]);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // If image is in view or has error, render the actual image
  if (isInView || hasError) {
    return (
      <img
        ref={imgRef}
        src={hasError ? placeholderSrc : src}
        alt={alt}
        className={`${className || ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} ${blur ? 'blur-sm' : ''} transition-all duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  }

  // Otherwise, render a placeholder
  return (
    <img
      ref={imgRef}
      src={placeholderSrc}
      alt={alt}
      className={`${className || ''} opacity-100`}
      {...props}
    />
  );
};

export default LazyImage;