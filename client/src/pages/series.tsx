import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import TVRow from "@/components/tv-row";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Info, Pause, PlayIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { TMDBTVSeries } from "@/types/movie";
import { Helmet } from "react-helmet";
import { SEO_CONFIG } from "@/lib/seo-config";

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
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Balisage JSON-LD pour la collection de séries
  const collectionData = {
    "@context": "https://schema.org",
    "@type": "MediaGallery",
    "name": "Séries StreamFlix",
    "description": "Découvrez notre collection de séries en streaming",
    "url": "https://streamflix2.site/series",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://streamflix2.site/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

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
  // Amélioration de la combinaison pour mieux gérer les séries ajoutées manuellement
  const allPopularSeries: TVSeriesType[] = popularSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...popularSeries].slice(0, 20) 
    : (localContent && localContent.length > 0 ? localContent : []);

  // Also combine local content with other series sections
  const allTopRatedSeries: TVSeriesType[] = topRatedSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...topRatedSeries].slice(0, 20) 
    : (localContent && localContent.length > 0 ? localContent : []);

  const allOnTheAirSeries: TVSeriesType[] = onTheAirSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...onTheAirSeries].slice(0, 20) 
    : (localContent && localContent.length > 0 ? localContent : []);

  const allAiringTodaySeries: TVSeriesType[] = airingTodaySeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...airingTodaySeries].slice(0, 20) 
    : (localContent && localContent.length > 0 ? localContent : []);

  const allDramaSeries: TVSeriesType[] = dramaSeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...dramaSeries].slice(0, 20) 
    : (localContent && localContent.length > 0 ? localContent : []);

  const allComedySeries: TVSeriesType[] = comedySeries 
    ? [...(localContent && localContent.length > 0 ? localContent : []), ...comedySeries].slice(0, 20) 
    : (localContent && localContent.length > 0 ? localContent : []);

  // Combiner toutes les séries pour le carrousel (avec plus d'options)
  // Amélioration pour mieux afficher les séries ajoutées manuellement
  const heroSeries: TVSeriesType[] = allPopularSeries?.slice(0, 10) || 
                                    (localContent && localContent.length > 0 ? localContent.slice(0, 10) : []) || 
                                    [];

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

  // Helper function to get backdrop path
  const getBackdropPath = (show: TVSeriesType): string | undefined => {
    if ('backdropPath' in show && show.backdropPath) {
      return show.backdropPath;
    } else if ('backdrop_path' in show && show.backdrop_path) {
      return show.backdrop_path;
    }
    return undefined;
  };

  // Helper function to get title/name
  const getTitle = (show: TVSeriesType): string => {
    if ('name' in show && show.name) {
      return show.name;
    } else if ('title' in show && show.title) {
      return show.title;
    }
    return 'Série inconnue';
  };

  const handleWatchSeries = (series: TVSeriesType) => {
    // Si c'est un contenu local avec ID, rediriger vers la page de lecture
    if ('id' in series && series.id && !series.id.toString().startsWith('tmdb-')) {
      setLocation(`/watch/tv/${series.id}`);
    } else {
      // Sinon, rediriger vers la page de détail
      const tmdbId = 'tmdbId' in series ? series.tmdbId : series.id;
      setLocation(`/tv/${tmdbId}`);
    }
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

  // Handle error state
  if (isError) {
    return (
      <section className="relative h-screen overflow-hidden bg-muted flex items-center justify-center" data-testid="series-hero-error">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les séries. Veuillez réessayer plus tard.
          </p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Recharger la page
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{SEO_CONFIG.series.title}</title>
        <meta name="description" content={SEO_CONFIG.series.description} />
        <link rel="canonical" href={SEO_CONFIG.series.canonical} />
        <meta property="og:title" content={SEO_CONFIG.series.og.title} />
        <meta property="og:description" content={SEO_CONFIG.series.og.description} />
        <meta property="og:type" content={SEO_CONFIG.series.og.type} />
        <meta property="og:image" content={SEO_CONFIG.series.og.image} />
        <meta property="og:url" content={SEO_CONFIG.series.canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO_CONFIG.series.og.title} />
        <meta name="twitter:description" content={SEO_CONFIG.series.og.description} />
        <meta name="twitter:image" content={SEO_CONFIG.series.og.image} />
      </Helmet>
      <script type="application/ld+json">
        {JSON.stringify(collectionData)}
      </script>
      {/* Hero Section - Carousel */}
      <section 
        className="relative h-[60vh] sm:h-[70vh] md:h-screen overflow-hidden" 
        data-testid="series-hero"
      >
        {heroSeries.length > 0 && (
          <>
            <div className="absolute inset-0 transition-opacity duration-1000">
              <img
                src={tmdbService.getBackdropUrl(getBackdropPath(heroSeries[currentSlide]) || "")}
                alt={getTitle(heroSeries[currentSlide])}
                className="w-full h-full object-cover"
                data-testid="series-hero-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  {/* Changement de h1 à h2 pour éviter les balises H1 multiples */}
                  <h2 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 line-clamp-2" 
                    data-testid="series-hero-title"
                  >
                    {getTitle(heroSeries[currentSlide])}
                  </h2>
                  
                  <p 
                    className="text-lg sm:text-xl text-white/90 mb-6 line-clamp-3" 
                    data-testid="series-hero-overview"
                  >
                    {heroSeries[currentSlide].overview}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Button 
                      size="lg" 
                      className="bg-white text-black hover:bg-gray-200"
                      data-testid="series-hero-play-button"
                      onClick={() => handleWatchSeries(heroSeries[currentSlide])}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Lecture
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="lg"
                      className="bg-black/50 text-white hover:bg-black/70"
                      data-testid="series-hero-info-button"
                      onClick={() => {
                        const tmdbId = 'tmdbId' in heroSeries[currentSlide] ? heroSeries[currentSlide].tmdbId : heroSeries[currentSlide].id;
                        setLocation(`/tv/${tmdbId}`);
                      }}
                    >
                      <Info className="w-5 h-5 mr-2" />
                      Plus d'infos
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
              onClick={togglePlayPause}
              data-testid="series-hero-play-pause"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </Button>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {heroSeries.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Aller à la diapositive ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* TV Show Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <TVRow
          title="Séries Populaires"
          series={allPopularSeries || []}
          isLoading={popularLoading || localContentLoading}
        />
        
        <TVRow
          title="Mieux Notées"
          series={allTopRatedSeries || []}
          isLoading={topRatedLoading}
        />
        
        <TVRow
          title="Actuellement Diffusées"
          series={allOnTheAirSeries || []}
          isLoading={onTheAirLoading}
        />
        
        <TVRow
          title="Séries Dramatiques"
          series={allDramaSeries || []}
          isLoading={dramaLoading}
        />
        
        <TVRow
          title="Séries Comiques"
          series={allComedySeries || []}
          isLoading={comedyLoading}
        />
      </div>
    </div>
  );
}