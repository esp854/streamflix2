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
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { TMDBMovie } from "@/types/movie";
import { Link } from "wouter";
import { UNIVERSE_TRAILERS, getYoutubeEmbedUrl } from "@/lib/universe-trailers";

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
  const [activeSections, setActiveSections] = useState<string[]>([]);

  // Nouvel état pour gérer les univers
  const [universes] = useState([
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '/logos/netflix.jpeg',
      color: 'bg-red-600',
      trailer: '/trailers/netflix.mp4'
    },
    {
      id: 'disney',
      name: 'Disney+',
      logo: '/logos/disney.jpeg',
      color: 'bg-blue-600',
      trailer: '/trailers/disney.mp4'
    },
    {
      id: 'prime',
      name: 'Prime Video',
      logo: '/logos/prime.jpeg',
      color: 'bg-blue-400',
      trailer: '/trailers/prime.mp4'
    },
    {
      id: 'paramount',
      name: 'Paramount+',
      logo: '/logos/paramount.jpeg',
      color: 'bg-blue-800',
      trailer: '/trailers/paramount.mp4'
    },
    {
      id: 'apple',
      name: 'Apple TV+',
      logo: '/logos/apple.jpeg',
      color: 'bg-gray-800',
      trailer: '/trailers/apple.mp4'
    },
    {
      id: 'marvel',
      name: 'Marvel',
      logo: '/logos/marvel.jpeg',
      color: 'bg-red-700',
      trailer: '/trailers/marvel.mp4'
    },
    {
      id: 'dc',
      name: 'DC',
      logo: '/logos/dc.jpeg',
      color: 'bg-blue-900',
      trailer: '/trailers/dc.mp4'
    }
  ]);

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
      {/* Hero Section - Carousel */}
      <HeroCarousel />
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />
      
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

      {/* Univers Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">Univers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {universes.map((universe) => (
            <Link 
              key={universe.id} 
              href={`/universe/${universe.id}`}
              className="group relative overflow-hidden rounded-xl aspect-square cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/90 z-10"></div>
              <div className={`absolute inset-0 ${universe.color} z-0`}></div>
              <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
                <img 
                  src={universe.logo} 
                  alt={universe.name} 
                  className="w-24 h-24 object-contain filter brightness-0 invert"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <iframe
                  src={getYoutubeEmbedUrl(UNIVERSE_TRAILERS[universe.id as keyof typeof UNIVERSE_TRAILERS]?.youtubeId || '')}
                  className="w-full h-full object-cover"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${universe.name} trailer`}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white text-lg font-bold text-center">{universe.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

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