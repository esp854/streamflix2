﻿import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Plus, Heart, Share2, Star, Calendar, Clock, Globe, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/lib/tmdb";
import { useFavorites } from "@/hooks/use-favorites";
import { useShare } from "@/hooks/use-share";
import MovieRow from "@/components/movie-row";
import CommentsSection from "@/components/CommentsSection";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || "0");
  const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
  const { shareCurrentPage } = useShare();

  const { data: movieDetails, isLoading } = useQuery({
    queryKey: [`/api/tmdb/movie/${movieId}`],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    enabled: !!movieId,
  });

  // Check if movie is favorite
  const { data: favoriteStatus } = checkFavorite(movieId);
  const isFavorite = favoriteStatus?.isFavorite || false;

  // Get content ID for comments
  const { data: contentData } = useQuery({
    queryKey: [`/api/content/tmdb/${movieId}`],
    queryFn: async () => {
      const response = await fetch(`/api/content/tmdb/${movieId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!movieId,
  });

  const { data: similarMovies } = useQuery({
    queryKey: [`/api/tmdb/similar/${movieId}`],
    queryFn: () => {
      // For now, get movies from the same primary genre
      const primaryGenre = movieDetails?.movie.genres?.[0]?.id;
      return primaryGenre ? tmdbService.getMoviesByGenre(primaryGenre) : [];
    },
    enabled: !!movieDetails?.movie.genres?.[0]?.id,
  });

  const handleToggleFavorite = async () => {
    if (movieDetails?.movie) {
      await toggleFavorite(movieDetails.movie, 'movie');
    }
  };

  const handleAddToList = () => {
    // TODO: Implement watchlist functionality
    console.log('Add to watchlist:', movieDetails?.movie.title);
  };

  const handleShare = async () => {
    if (movieDetails?.movie) {
      await shareCurrentPage(movieDetails.movie.title);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="movie-detail-loading">
        <div className="relative h-64 sm:h-96 bg-muted animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!movieDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="movie-detail-error">
        <div className="text-center max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Film non trouvé</h1>
          <Link href="/">
            <Button className="w-full sm:w-auto">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { movie, credits, videos } = movieDetails;
  const cast = credits.cast.slice(0, 8);
  const crew = credits.crew.slice(0, 8);
  const trailer = videos.results.find(video => video.type === "Trailer" && video.site === "YouTube");

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Données structurées pour le film
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "image": tmdbService.getBackdropUrl(movie.backdrop_path),
    "description": movie.overview,
    "datePublished": movie.release_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": movie.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": movie.vote_count
    },
    "genre": movie.genres?.map(g => g.name),
    "director": crew.filter(person => person.job === "Director").map(person => person.name),
    "actor": cast.slice(0, 5).map(person => person.name),
    "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
    "potentialAction": {
      "@type": "WatchAction",
      "target": `https://streamflix2.site/watch/movie/${movieId}`
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="movie-detail-page">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {/* Hero Section - Adapté pour mobile */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh]">
        <img
          src={tmdbService.getBackdropUrl(movie.backdrop_path)}
          alt={movie.title}
          className="w-full h-full object-cover"
          data-testid="movie-backdrop"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

        {/* Back button - Ajusté pour mobile */}
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full z-10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>

        {/* Movie info - Optimisé pour mobile */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:left-8 md:bottom-8 md:right-8 z-10">
          <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3" data-testid="movie-title">
            {movie.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/80 mb-2 sm:mb-3 text-xs sm:text-sm" data-testid="movie-metadata">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{new Date(movie.release_date).getFullYear()}</span>
            </span>
            {movie.runtime && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatRuntime(movie.runtime)}</span>
              </span>
            )}
            <span className="text-xs">Genres: {movie.genres?.map(g => g.name).join(", ")}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-accent fill-current" />
              <span>{movie.vote_average.toFixed(1)}/10</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-white/90 mb-3 sm:mb-4 leading-relaxed max-w-2xl line-clamp-3" data-testid="movie-overview">
            {movie.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-2" data-testid="movie-actions">
            <Button 
              onClick={() => {
                window.location.href = `/watch/movie/${movieId}`;
              }}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto h-10 sm:h-12" 
              data-testid="watch-button"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Regarder</span>
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 flex-1 sm:flex-none">
              <Button className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto h-10 sm:h-12" onClick={handleAddToList} data-testid="add-list-button">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline text-sm sm:text-base">Ma Liste</span>
                <span className="xs:hidden text-sm">Liste</span>
              </Button>
              <Button
                className={`btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto h-10 sm:h-12 ${isFavorite ? 'bg-primary text-white' : ''}`}
                onClick={handleToggleFavorite}
                disabled={isAddingToFavorites}
                data-testid="favorite-button"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="hidden xs:inline text-sm sm:text-base">{isFavorite ? 'Retirer des favoris' : 'Favoris'}</span>
                <span className="xs:hidden text-sm">{isFavorite ? 'Retirer' : 'Favoris'}</span>
              </Button>
              <Button className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto h-10 sm:h-12" onClick={handleShare} data-testid="share-button">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline text-sm sm:text-base">Partager</span>
                <span className="xs:hidden text-sm">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content sections - Adapté pour mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-12">
        {/* Additional Movie Information - Optimisé pour mobile */}
        <section data-testid="movie-info-section">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-foreground">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Langue originale</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">{movie.original_language?.toUpperCase()}</p>
                </div>
              </div>
              
              {movie.budget && movie.budget > 0 && (
                <div className="flex items-start">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Budget</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{formatCurrency(movie.budget)}</p>
                  </div>
                </div>
              )}
              
              {movie.revenue && movie.revenue > 0 && (
                <div className="flex items-start">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Revenus</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{formatCurrency(movie.revenue)}</p>
                  </div>
                </div>
              )}
              
              {movie.status && (
                <div className="flex items-start">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Statut</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{movie.status}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {movie.tagline && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">Slogan</h3>
                  <p className="text-muted-foreground italic text-xs sm:text-sm">"{movie.tagline}"</p>
                </div>
              )}
              
              {movie.production_companies && movie.production_companies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">Sociétés de production</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {movie.production_companies.map((company: any) => company.name).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cast - Optimisé pour mobile */}
        {cast.length > 0 && (
          <section data-testid="cast-section">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-foreground">Distribution</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4 lg:gap-6" data-testid="cast-grid">
              {cast.map((actor) => (
                <div key={actor.id} className="text-center" data-testid={`cast-member-${actor.id}`}>
                  <img
                    src={tmdbService.getProfileUrl(actor.profile_path)}
                    alt={actor.name}
                    className="w-full aspect-square rounded-lg object-cover mb-1 sm:mb-2"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-profile.jpg";
                    }}
                  />
                  <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{actor.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Crew - Optimisé pour mobile */}
        {crew.length > 0 && (
          <section data-testid="crew-section">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-foreground">Équipe technique</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4" data-testid="crew-grid">
              {crew.map((member) => (
                <div key={member.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-muted rounded-lg" data-testid={`crew-member-${member.id}`}>
                  <img
                    src={tmdbService.getProfileUrl(member.profile_path)}
                    alt={member.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-profile.jpg";
                    }}
                  />
                  <div>
                    <h3 className="font-medium text-foreground text-xs sm:text-sm">{member.name}</h3>
                    <p className="text-xs text-muted-foreground">{member.job}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Movies */}
        {similarMovies && similarMovies.length > 0 && (
          <section data-testid="similar-movies-section">
            <MovieRow
              title="Films Similaires"
              movies={similarMovies}
              isLoading={false}
            />
          </section>
        )}

        {/* Comments Section */}
        {contentData && (
          <CommentsSection
            contentId={contentData.id}
            contentType="movie"
          />
        )}
      </div>
    </div>
  );
}