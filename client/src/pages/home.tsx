import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import HeroCarousel from "@/components/hero-carousel";
import MovieRow from "@/components/movie-row";
import TVRow from "@/components/tv-row";
import CategoryGrid from "@/components/category-grid";
import TelegramBanner from "@/components/telegram-banner";
import SubscriptionBanner from "@/components/subscription-banner";
import AdvertisementBanner from "@/components/AdvertisementBanner";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useEffect, useState } from "react";

export default function Home() {
  const { shouldShowAds } = useAuthCheck();
  const [activeSections, setActiveSections] = useState<string[]>([]);
  
  // Stagger the loading of different sections to reduce initial API load
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Load featured content first (they're shown first)
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'featured']);
    }, 100));
    
    // Load other sections with delays
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'movies']);
    }, 300));
    
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'tv']);
    }, 500));
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Use the new featured content endpoint instead of popular movies
  const { data: featuredContent, isLoading: featuredLoading, isError: featuredError } = useQuery({
    queryKey: ["/api/tmdb/featured-content"],
    queryFn: () => tmdbService.getFeaturedContent(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('featured'), // Only fetch when section is active
  });

  // We can still keep the other queries for fallback or additional sections
  const { data: actionMovies, isLoading: actionLoading, isError: actionError } = useQuery({
    queryKey: ["/api/tmdb/genre/28"],
    queryFn: () => tmdbService.getMoviesByGenre(28),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('action'), // Only fetch when section is active
  });

  const { data: comedyMovies, isLoading: comedyLoading, isError: comedyError } = useQuery({
    queryKey: ["/api/tmdb/genre/35"],
    queryFn: () => tmdbService.getMoviesByGenre(35),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('comedy'), // Only fetch when section is active
  });

  const { data: horrorMovies, isLoading: horrorLoading, isError: horrorError } = useQuery({
    queryKey: ["/api/tmdb/genre/27"],
    queryFn: () => tmdbService.getMoviesByGenre(27),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('horror'), // Only fetch when section is active
  });

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Hero Section */}
      <HeroCarousel />
      
      {/* Advertisement Banner for unauthenticated users */}
      {shouldShowAds && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <AdvertisementBanner />
        </div>
      )}

      {/* Telegram Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <TelegramBanner />
      </div>

      {/* Subscription Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <SubscriptionBanner />
      </div>

      {/* Movie Sections */}
      <div className="space-y-6 sm:space-y-8">
        {/* Featured Content Section - Show content with links */}
        <MovieRow
          title="Films Disponibles"
          movies={featuredContent?.movies || []}
          isLoading={featuredLoading}
        />
        
        {/* TV Shows Section - Show TV shows with links */}
        {activeSections.includes('tv') && featuredContent?.tvShows && (
          <TVRow
            title="Séries Disponibles"
            shows={featuredContent.tvShows || []}
            isLoading={featuredLoading}
          />
        )}
        
        {/* Fallback sections for when we don't have enough custom content */}
        {activeSections.includes('action') && (
          <MovieRow
            title="Films d'Action"
            movies={actionMovies || []}
            isLoading={actionLoading}
          />
        )}
        
        {activeSections.includes('comedy') && (
          <MovieRow
            title="Comédies"
            movies={comedyMovies || []}
            isLoading={comedyLoading}
          />
        )}
        
        {activeSections.includes('horror') && (
          <MovieRow
            title="Films d'Horreur"
            movies={horrorMovies || []}
            isLoading={horrorLoading}
          />
        )}
      </div>
      
      {/* Categories */}
      <CategoryGrid />
    </div>
  );
}