import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import HeroCarousel from "@/components/hero-carousel";
import MovieRow from "@/components/movie-row";
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
    
    // Load popular movies first (they're shown first)
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'popular']);
    }, 100));
    
    // Load other sections with delays
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'action']);
    }, 300));
    
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'comedy']);
    }, 500));
    
    timers.push(setTimeout(() => {
      setActiveSections(prev => [...prev, 'horror']);
    }, 700));
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  const { data: popularMovies, isLoading: popularLoading, isError: popularError } = useQuery({
    queryKey: ["/api/tmdb/popular"],
    queryFn: () => tmdbService.getPopular(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('popular'), // Only fetch when section is active
  });

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
        <MovieRow
          title="Films Populaires"
          movies={popularMovies || []}
          isLoading={popularLoading}
        />
        
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