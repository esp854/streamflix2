import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import TVRow from "@/components/tv-row";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Info, Pause, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import { TMDBTVSeries } from "@/types/movie";

// Add this interface for local content (matching TVRow exactly)
interface LocalContent {
  id: string;
  tmdbId: number;
  title: string;
  name?: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: 'tv';
  odyseeUrl?: string;
  active: boolean;
}

// Create a type that combines both interfaces
type TVSeriesType = TMDBTVSeries | LocalContent;

export default function Series() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Gestion des requêtes avec des options de retry
  const queryOptions = {
    retry: 2, // Augmenter les tentatives de retry
    retryDelay: 1500,
    // Réduire le temps de cache pour obtenir des données plus fraîches
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  };

  const { data: popularSeries, isLoading: popularLoading, isError: popularError, error: popularErrorMsg } = useQuery({
    queryKey: ["/api/tmdb/tv/popular"],
    queryFn: async () => {
      console.log("Fetching popular TV shows...");
      try {
        const result = await tmdbService.getPopularTVShows();
        console.log("Popular TV shows result:", result);
        return result;
      } catch (error) {
        console.error("Error fetching popular TV shows:", error);
        throw error;
      }
    },
    ...queryOptions,
  });

  const { data: topRatedSeries, isLoading: topRatedLoading, isError: topRatedError } = useQuery({
    queryKey: ["/api/tmdb/tv/top_rated"],
    queryFn: () => tmdbService.getTopRatedTVShows(),
    ...queryOptions,
  });

  const { data: onTheAirSeries, isLoading: onTheAirLoading, isError: onTheAirError } = useQuery({
    queryKey: ["/api/tmdb/tv/on_the_air"],
    queryFn: () => tmdbService.getOnTheAirTVShows(),
    ...queryOptions,
  });

  const { data: airingTodaySeries, isLoading: airingTodayLoading, isError: airingTodayError } = useQuery({
    queryKey: ["/api/tmdb/tv/airing_today"],
    queryFn: () => tmdbService.getAiringTodayTVShows(),
    ...queryOptions,
  });

  const { data: dramaSeries, isLoading: dramaLoading, isError: dramaError } = useQuery({
    queryKey: ["/api/tmdb/tv/genre/18"],
    queryFn: () => tmdbService.getTVShowsByGenre(18),
    ...queryOptions,
  });

  const { data: comedySeries, isLoading: comedyLoading, isError: comedyError } = useQuery({
    queryKey: ["/api/tmdb/tv/genre/35"],
    queryFn: () => tmdbService.getTVShowsByGenre(35),
    ...queryOptions,
  });

  // New query to fetch ALL local content (including content without video links)
  const { data: localContent, isLoading: localContentLoading, isError: localContentError } = useQuery({
    queryKey: ["local-all-content"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/content");
        if (!response.ok) {
          // Pour toutes les erreurs (y compris 401/403), retourner un tableau vide
          // Le serveur renverra maintenant le contenu actif même pour les utilisateurs non-admin
          console.log("Erreur lors de la récupération du contenu local, statut:", response.status);
          // Même en cas d'erreur, on continue avec un tableau vide pour ne pas bloquer l'affichage
          return [];
        }
        const data = await response.json();
        // Filter only TV series (both with and without video links)
        // Assurez-vous que les contenus locaux sont correctement filtrés
        return data.filter((item: LocalContent) => 
          item.mediaType === 'tv' && 
          (item.active === undefined || item.active === true) // Inclure les contenus actifs
        );
      } catch (error) {
        console.error("Error fetching local content:", error);
        // Return empty array instead of throwing error to prevent complete failure
        return [];
      }
    },
    ...queryOptions,
  });

  // Gestion globale des états de chargement
  const isLoading = popularLoading || topRatedLoading || onTheAirLoading || 
                   airingTodayLoading || dramaLoading || comedyLoading || localContentLoading;

  // Gestion globale des erreurs
  const isError = popularError || topRatedError || onTheAirError || 
                 airingTodayError || dramaError || comedyError || localContentError;

  // Combine TMDB series with ALL local content (including those without video links)
  const allPopularSeries: TVSeriesType[] = popularSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...popularSeries].slice(0, 20) 
    : (localContent || []);

  // Also combine local content with other series sections
  const allTopRatedSeries: TVSeriesType[] = topRatedSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...topRatedSeries].slice(0, 20) 
    : (localContent || []);

  const allOnTheAirSeries: TVSeriesType[] = onTheAirSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...onTheAirSeries].slice(0, 20) 
    : (localContent || []);

  const allAiringTodaySeries: TVSeriesType[] = airingTodaySeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...airingTodaySeries].slice(0, 20) 
    : (localContent || []);

  const allDramaSeries: TVSeriesType[] = dramaSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...dramaSeries].slice(0, 20) 
    : (localContent || []);

  const allComedySeries: TVSeriesType[] = comedySeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...comedySeries].slice(0, 20) 
    : (localContent || []);

  // Combiner toutes les séries pour le carrousel (avec plus d'options)
  const heroSeries: TVSeriesType[] = allPopularSeries?.slice(0, 10) || []; // Augmenter à 10 séries

  // Ajouter un useEffect pour déboguer les contenus locaux
  useEffect(() => {
    if (localContent && localContent.length > 0) {
      console.log("Contenus locaux récupérés:", localContent);
    }
  }, [localContent]);

  useEffect(() => {
    if (!isPlaying || heroSeries.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSeries.length);
    }, 8000); // Augmenter à 8 secondes pour une meilleure expérience

    return () => clearInterval(interval);
  }, [isPlaying, heroSeries.length]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <section className="relative h-screen overflow-hidden bg-muted animate-pulse" data-testid="series-hero-loading">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des séries...</p>
          </div>
        </div>
      </section>
    );
  }

  // Handle error state - mais seulement si toutes les sources de données échouent
  const hasAnyData = popularSeries || topRatedSeries || onTheAirSeries || 
                     airingTodaySeries || dramaSeries || comedySeries || 
                     (localContent && localContent.length > 0);

  if (isError && !hasAnyData) {
    console.error("Error loading series data:", {
      popularError: popularErrorMsg,
      topRatedError,
      onTheAirError,
      airingTodayError,
      dramaError,
      comedyError,
      localContentError
    });
    
    return (
      <section className="relative h-screen overflow-hidden bg-muted flex items-center justify-center" data-testid="series-hero-error">
        <div className="text-center p-8">
          <p className="text-xl text-muted-foreground mb-4">Erreur lors du chargement des séries</p>
          <p className="text-sm text-muted-foreground mb-4">Détails: {popularErrorMsg?.message || "Erreur inconnue"}</p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Réessayer
          </Button>
        </div>
      </section>
    );
  }

  // Si aucune série n'est disponible, afficher un message approprié
  if (!heroSeries.length && !hasAnyData) {
    return (
      <section className="relative h-screen overflow-hidden bg-muted flex items-center justify-center" data-testid="series-hero-error">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Aucune série disponible</p>
          <Button onClick={() => window.location.reload()} variant="secondary" className="mt-4">
            Réessayer
          </Button>
        </div>
      </section>
    );
  }

  const currentSeries = heroSeries[currentSlide];

  return (
    <div className="min-h-screen bg-background" data-testid="series-page">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden" data-testid="series-hero">
        {/* Background Images */}
        <div className="absolute inset-0">
          {heroSeries.map((series: TVSeriesType, index: number) => (
            <div
              key={'tmdbId' in series ? series.tmdbId : series.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
              data-testid={`series-hero-slide-${index}`}
            >
              <img
                src={
                  'backdropPath' in series && series.backdropPath
                    ? tmdbService.getBackdropUrl(series.backdropPath)
                    : 'backdrop_path' in series && series.backdrop_path
                    ? tmdbService.getBackdropUrl(series.backdrop_path)
                    : "/placeholder-backdrop.jpg"
                }
                alt={'name' in series ? series.name : series.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-backdrop.jpg";
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 gradient-overlay"></div>
              <div className="absolute inset-0 gradient-bottom"></div>
            </div>
          ))}
        </div>
        
        {/* Content */}
        <div className="absolute bottom-1/4 left-8 md:left-16 max-w-lg z-10" data-testid="series-hero-content">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-white" data-testid="series-hero-title">
            {'name' in currentSeries ? currentSeries.name : currentSeries.title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-6 leading-relaxed line-clamp-3" data-testid="series-hero-overview">
            {currentSeries.overview}
          </p>
          <div className="flex space-x-4" data-testid="series-hero-actions">
            <Link href={`/tv/${'tmdbId' in currentSeries ? currentSeries.tmdbId : currentSeries.id}`}>
              <Button className="btn-primary flex items-center space-x-2" data-testid="button-watch-series">
                <Play className="w-5 h-5" />
                <span>Regarder</span>
              </Button>
            </Link>
            <Link href={`/tv/${'tmdbId' in currentSeries ? currentSeries.tmdbId : currentSeries.id}`}>
              <Button className="btn-secondary flex items-center space-x-2" data-testid="button-info-series">
                <Info className="w-5 h-5" />
                <span>Plus d'infos</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-8 right-8 flex space-x-2 z-20" data-testid="series-carousel-controls">
          <Button
            variant="secondary"
            size="icon"
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary/70"
            data-testid="series-carousel-play-pause"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20" data-testid="series-carousel-indicators">
          {heroSeries.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentSlide ? "bg-primary" : "bg-white/50"
              }`}
              data-testid={`series-carousel-indicator-${index}`}
            />
          ))}
        </div>
      </section>
      
      {/* TV Series Sections */}
      <div className="space-y-8 py-12">
        <TVRow
          title="Séries Populaires"
          series={allPopularSeries || []}
          isLoading={popularLoading || localContentLoading}
        />
        
        <TVRow
          title="Meilleures Séries"
          series={allTopRatedSeries || []}
          isLoading={topRatedLoading || localContentLoading}
        />
        
        <TVRow
          title="En Cours de Diffusion"
          series={allOnTheAirSeries || []}
          isLoading={onTheAirLoading || localContentLoading}
        />
        
        <TVRow
          title="Diffusées Aujourd'hui"
          series={allAiringTodaySeries || []}
          isLoading={airingTodayLoading || localContentLoading}
        />
        
        <TVRow
          title="Séries Dramatiques"
          series={allDramaSeries || []}
          isLoading={dramaLoading || localContentLoading}
        />
        
        <TVRow
          title="Séries Comiques"
          series={allComedySeries || []}
          isLoading={comedyLoading || localContentLoading}
        />
      </div>
    </div>
  );
}
