import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Plus, Heart, Share2, Star, Calendar, Clock, Globe, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/lib/tmdb";
import { useFavorites } from "@/hooks/use-favorites";
import { useShare } from "@/hooks/use-share";
import MovieRow from "@/components/movie-row";
import CommentsSection from "@/components/CommentsSection";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { Helmet } from "react-helmet";
import { SEO_CONFIG } from "@/lib/seo-config";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const movieId = parseInt(id || "0");
  const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
  const { shareCurrentPage } = useShare();
  const { shouldRedirectToPayment } = useSubscriptionCheck();

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

  const handleWatchMovie = async () => {
    try {
      // Vérifier d'abord si le contenu existe dans la base de données
      const response = await fetch(`/api/content/tmdb/${movieId}`);
      if (!response.ok) {
        console.error("Erreur lors de la vérification du contenu");
        return;
      }
      
      const contentData = await response.json();
      
      // Si le contenu existe, rediriger vers la page de lecture
      if (contentData && contentData.id) {
        setLocation(`/watch/movie/${contentData.id}`);
      } else {
        // Sinon, essayer de récupérer un lien vidéo Frembed
        const frembedResponse = await fetch(`/api/frembed/video-link/${movieId}?mediaType=movie`);
        if (!frembedResponse.ok) {
          console.error("Erreur lors de la récupération du lien vidéo");
          return;
        }
        
        const frembedData = await frembedResponse.json();
        if (frembedData.success && frembedData.videoUrl) {
          // Rediriger vers une page de lecture avec le lien Frembed
          setLocation(`/watch/movie/tmdb/${movieId}`);
        } else {
          console.error("Aucun lien vidéo disponible");
        }
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de la lecture:", error);
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
      "target": `https://streamflix2-o7vx.onrender.com/watch/movie/${movieId}`
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="movie-detail-page">
      <Helmet>
        <title>{SEO_CONFIG.movie.title.replace('{movieTitle}', movie.title)}</title>
        <meta name="description" content={SEO_CONFIG.movie.description.replace('{movieTitle}', movie.title)} />
        <link rel="canonical" href={SEO_CONFIG.movie.canonical.replace('{id}', movieId.toString())} />
        <meta property="og:title" content={SEO_CONFIG.movie.og.title.replace('{movieTitle}', movie.title)} />
        <meta property="og:description" content={SEO_CONFIG.movie.og.description.replace('{movieTitle}', movie.title)} />
        <meta property="og:type" content={SEO_CONFIG.movie.og.type} />
        <meta property="og:image" content={tmdbService.getPosterUrl(movie.poster_path)} />
        <meta property="og:url" content={SEO_CONFIG.movie.canonical.replace('{id}', movieId.toString())} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO_CONFIG.movie.og.title.replace('{movieTitle}', movie.title)} />
        <meta name="twitter:description" content={SEO_CONFIG.movie.og.description.replace('{movieTitle}', movie.title)} />
        <meta name="twitter:image" content={tmdbService.getPosterUrl(movie.poster_path)} />
      </Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {/* Hero Section - Adapté pour mobile */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-screen">
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
            className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full z-10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </Link>

        {/* Movie info - Optimisé pour mobile */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 md:left-16 md:bottom-16 md:max-w-3xl z-10">
          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4" data-testid="movie-title">
            {movie.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 text-white/80 mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm md:text-base" data-testid="movie-metadata">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span>Date de sortie: {new Date(movie.release_date).getFullYear()}</span>
            </span>
            {movie.runtime && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span>Durée: {formatRuntime(movie.runtime)}</span>
              </span>
            )}
            <span className="text-xs sm:text-sm">Genres: {movie.genres?.map(g => g.name).join(", ")}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-accent fill-current" />
              <span>Note: {movie.vote_average.toFixed(1)}/10</span>
            </div>
          </div>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none" data-testid="movie-overview">
            {movie.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4" data-testid="movie-actions">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground" 
              data-testid="watch-button"
              onClick={handleWatchMovie}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Regarder
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleToggleFavorite}
              disabled={isAddingToFavorites}
              data-testid="favorite-button"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Button>
            <Button variant="outline" onClick={handleShare} data-testid="share-button">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      {/* Movie Details - Desktop only for now */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cast and Crew */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Casting</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {cast.map((person) => (
                  <div key={person.id} className="text-center">
                    <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden">
                      {person.profile_path ? (
                        <img 
                          src={tmdbService.getProfileUrl(person.profile_path)} 
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-muted-foreground text-xs">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Équipe</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {crew.map((person) => (
                  <div key={person.id} className="text-center">
                    <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden">
                      {person.profile_path ? (
                        <img 
                          src={tmdbService.getProfileUrl(person.profile_path)} 
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-muted-foreground text-xs">{person.job}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Movie Info */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Informations</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Date de sortie</h3>
                <p>{new Date(movie.release_date).toLocaleDateString('fr-FR')}</p>
              </div>
              
              {movie.runtime && (
                <div>
                  <h3 className="font-semibold mb-1">Durée</h3>
                  <p>{formatRuntime(movie.runtime)}</p>
                </div>
              )}
              
              {movie.budget && movie.budget > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Budget</h3>
                  <p>{formatCurrency(movie.budget)}</p>
                </div>
              )}
              
              {movie.revenue && movie.revenue > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Recettes</h3>
                  <p>{formatCurrency(movie.revenue)}</p>
                </div>
              )}
              
              {movie.genres && movie.genres.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span key={genre.id} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {movie.production_companies && movie.production_companies.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Sociétés de production</h3>
                  <div className="space-y-2">
                    {movie.production_companies.slice(0, 3).map((company) => (
                      <div key={company.id} className="flex items-center">
                        {company.logo_path ? (
                          <img 
                            src={tmdbService.getImageUrl(company.logo_path)} 
                            alt={company.name}
                            className="w-8 h-8 object-contain mr-2"
                          />
                        ) : (
                          <Globe className="w-8 h-8 text-muted-foreground mr-2" />
                        )}
                        <span>{company.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {contentData?.id && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <CommentsSection contentId={contentData.id} contentType="movie" />
        </div>
      )}

      {/* Similar Movies */}
      {similarMovies && similarMovies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <MovieRow title="Vous aimerez aussi" movies={similarMovies} />
        </div>
      )}
    </div>
  );
}