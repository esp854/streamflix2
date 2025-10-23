import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import HeroCarousel from "@/components/hero-carousel";
import MovieRow from "@/components/movie-row";
import CategoryGrid from "@/components/category-grid";
import TelegramBanner from "@/components/telegram-banner";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useEffect, useState } from "react";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { TMDBMovie } from "@/types/movie";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";

// Add this interface for local content
interface LocalContent {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  mediaType: 'movie';
  odyseeUrl?: string;
  active: boolean;
}

export default function Home() {
  const { shouldShowAds } = useAuthCheck();
  const { isAuthenticated } = useAuth();
  const [activeSections, setActiveSections] = useState<string[]>([]);

  // Balisage JSON-LD pour la page d'accueil
  const homeData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "StreamFlix",
    "url": "https://streamflix2-o7vx.onrender.com/",
    "description": "Plateforme de streaming légal pour films et séries en haute qualité",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://streamflix2-o7vx.onrender.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

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
    // Reduce cache time to save memory on mobile devices
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // New query to fetch ALL local content (including content without video links)
  const { data: localContent, isLoading: localContentLoading } = useQuery({
    queryKey: ["local-all-content"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/content");
        if (!response.ok) return [];
        const data = await response.json();
        // Filter only movies (both with and without video links)
        return data.filter((item: LocalContent) => item.mediaType === 'movie');
      } catch (error) {
        console.error("Error fetching local content:", error);
        return [];
      }
    },
    // Reduce cache time to save memory on mobile devices
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Combine TMDB movies with ALL local content (including those without video links)
  const allPopularMovies = popularMovies 
    ? [...(localContent || []), ...popularMovies].slice(0, 20) 
    : popularMovies;

  const { data: actionMovies, isLoading: actionLoading, isError: actionError } = useQuery({
    queryKey: ["/api/tmdb/genre/28"],
    queryFn: () => tmdbService.getMoviesByGenre(28),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('action'), // Only fetch when section is active
    // Reduce cache time to save memory on mobile devices
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: comedyMovies, isLoading: comedyLoading, isError: comedyError } = useQuery({
    queryKey: ["/api/tmdb/genre/35"],
    queryFn: () => tmdbService.getMoviesByGenre(35),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('comedy'), // Only fetch when section is active
    // Reduce cache time to save memory on mobile devices
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: horrorMovies, isLoading: horrorLoading, isError: horrorError } = useQuery({
    queryKey: ["/api/tmdb/genre/27"],
    queryFn: () => tmdbService.getMoviesByGenre(27),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeSections.includes('horror'), // Only fetch when section is active
    // Reduce cache time to save memory on mobile devices
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle loading state
  if (popularLoading || localContentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (popularError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Erreur lors du chargement des films</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json">
        {JSON.stringify(homeData)}
      </script>
      {/* Hero Section - Carousel */}
      <HeroCarousel />
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Telegram Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <TelegramBanner />
      </div>

      {/* Movie Sections */}
      <div className="space-y-6 sm:space-y-8">
        <MovieRow
          title="Films Populaires"
          movies={allPopularMovies || []}
          isLoading={popularLoading || localContentLoading}
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