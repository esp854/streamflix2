import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import TVRow from "@/components/tv-row";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Info, Pause, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import { TMDBTVSeries } from "@/types/movie";

// Add this interface for local content
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
}

export default function Series() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const { data: popularSeries, isLoading: popularLoading } = useQuery({
    queryKey: ["/api/tmdb/tv/popular"],
    queryFn: () => tmdbService.getPopularTVShows(),
  });

  const { data: topRatedSeries, isLoading: topRatedLoading } = useQuery({
    queryKey: ["/api/tmdb/tv/top_rated"],
    queryFn: () => tmdbService.getTopRatedTVShows(),
  });

  const { data: onTheAirSeries, isLoading: onTheAirLoading } = useQuery({
    queryKey: ["/api/tmdb/tv/on_the_air"],
    queryFn: () => tmdbService.getOnTheAirTVShows(),
  });

  const { data: airingTodaySeries, isLoading: airingTodayLoading } = useQuery({
    queryKey: ["/api/tmdb/tv/airing_today"],
    queryFn: () => tmdbService.getAiringTodayTVShows(),
  });

  const { data: dramaSeries, isLoading: dramaLoading } = useQuery({
    queryKey: ["/api/tmdb/tv/genre/18"],
    queryFn: () => tmdbService.getTVShowsByGenre(18),
  });

  const { data: comedySeries, isLoading: comedyLoading } = useQuery({
    queryKey: ["/api/tmdb/tv/genre/35"],
    queryFn: () => tmdbService.getTVShowsByGenre(35),
  });

  // New query to fetch local content
  const { data: localContent, isLoading: localContentLoading } = useQuery({
    queryKey: ["local-content"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/content");
        if (!response.ok) return [];
        const data = await response.json();
        // Filter only TV series that have been added locally
        return data.filter((item: LocalContent) => item.mediaType === 'tv' && item.tmdbId);
      } catch (error) {
        console.error("Error fetching local content:", error);
        return [];
      }
    },
  });

  // Combine TMDB series with local content
  const allPopularSeries = popularSeries 
    ? [...(localContent || []), ...popularSeries].slice(0, 20) 
    : popularSeries;

  const heroSeries = allPopularSeries?.slice(0, 5) || [];

  useEffect(() => {
    if (!isPlaying || heroSeries.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSeries.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, heroSeries.length]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (popularLoading) {
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

  if (!heroSeries.length) {
    return (
      <section className="relative h-screen overflow-hidden bg-muted flex items-center justify-center" data-testid="series-hero-error">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Aucune série disponible</p>
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
          {heroSeries.map((series: TMDBTVSeries | LocalContent, index: number) => (
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
      <div className="space-y-8">
        <TVRow
          title="Séries Populaires"
          series={allPopularSeries || []}
          isLoading={popularLoading}
        />
        
        <TVRow
          title="Meilleures Séries"
          series={topRatedSeries || []}
          isLoading={topRatedLoading}
        />
        
        <TVRow
          title="En Cours de Diffusion"
          series={onTheAirSeries || []}
          isLoading={onTheAirLoading}
        />
        
        <TVRow
          title="Diffusées Aujourd'hui"
          series={airingTodaySeries || []}
          isLoading={airingTodayLoading}
        />
        
        <TVRow
          title="Séries Dramatiques"
          series={dramaSeries || []}
          isLoading={dramaLoading}
        />
        
        <TVRow
          title="Séries Comiques"
          series={comedySeries || []}
          isLoading={comedyLoading}
        />
      </div>
    </div>
  );
}