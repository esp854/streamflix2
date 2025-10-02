import { useState, useEffect, useCallback } from 'react';

interface ImageOptimizationOptions {
  quality?: 'low' | 'medium' | 'high';
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  width?: number;
  height?: number;
}

interface OptimizedImageResult {
  src: string;
  isLoading: boolean;
  error: string | null;
}

export function useImageOptimization(
  originalSrc: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageResult {
  const [result, setResult] = useState<OptimizedImageResult>({
    src: originalSrc,
    isLoading: false,
    error: null
  });

  const optimizeImage = useCallback(async () => {
    if (!originalSrc) {
      return;
    }

    // If the image is already optimized or from TMDB, don't optimize further
    if (originalSrc.includes('image.tmdb.org')) {
      setResult({
        src: originalSrc,
        isLoading: false,
        error: null
      });
      return;
    }

    // For local images, we can apply some basic optimizations
    if (originalSrc.startsWith('/') || originalSrc.startsWith('http://localhost') || originalSrc.startsWith('https://localhost')) {
      // In a real implementation, this would call an image optimization service
      // For now, we'll just return the original image
      setResult({
        src: originalSrc,
        isLoading: false,
        error: null
      });
      return;
    }

    // For other images, return the original
    setResult({
      src: originalSrc,
      isLoading: false,
      error: null
    });
  }, [originalSrc]);

  useEffect(() => {
    optimizeImage();
  }, [optimizeImage]);

  return result;
}

// Hook to get optimized image URL for TMDB images
export function useTMDBImage(
  imagePath: string | null | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
  if (!imagePath) {
    return '/placeholder-image.png';
  }
  
  // TMDB image base URL
  const baseURL = 'https://image.tmdb.org/t/p/';
  
  // Return the optimized image URL
  return `${baseURL}${size}${imagePath}`;
}

// Hook to get optimized backdrop image URL for TMDB
export function useTMDBBackdrop(
  imagePath: string | null | undefined,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string {
  if (!imagePath) {
    return '/placeholder-backdrop.png';
  }
  
  // TMDB image base URL
  const baseURL = 'https://image.tmdb.org/t/p/';
  
  // Return the optimized backdrop image URL
  return `${baseURL}${size}${imagePath}`;
}

// Hook to get optimized profile image URL for TMDB
export function useTMDBProfile(
  imagePath: string | null | undefined,
  size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'
): string {
  if (!imagePath) {
    return '/placeholder-profile.png';
  }
  
  // TMDB image base URL
  const baseURL = 'https://image.tmdb.org/t/p/';
  
  // Return the optimized profile image URL
  return `${baseURL}${size}${imagePath}`;
}