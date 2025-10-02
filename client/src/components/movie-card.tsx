import { Link } from "wouter";
import { Play, Star, Plus, Heart, Share2 } from "lucide-react";
import { TMDBMovie, GENRE_MAP } from "@/types/movie";
import { tmdbService } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { useShare } from "@/hooks/use-share";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";

interface MovieCardProps {
  movie: TMDBMovie;
  size?: "small" | "medium" | "large";
  showOverlay?: boolean;
}

export default function MovieCard({ movie, size = "medium", showOverlay = true }: MovieCardProps) {
   const [imageError, setImageError] = useState(false);
   const [showTrailer, setShowTrailer] = useState(false);
   const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
   const [isHovering, setIsHovering] = useState(false);
   const videoRef = useRef<HTMLVideoElement>(null);
   const trailerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
   const { shareContent } = useShare();
   const { shouldRedirectToPayment } = useSubscriptionCheck();

   // Check if movie is favorite
   const { data: favoriteStatus } = checkFavorite(movie.id);
   const isFavorite = favoriteStatus?.isFavorite || false;

  const handleImageError = () => {
    setImageError(true);
  };

  // Load trailer when hovering
  const loadTrailer = async () => {
    if (trailerUrl) return; // Already loaded

    try {
      const details = await tmdbService.getMovieDetails(movie.id);
      if (details.videos && details.videos.results) {
        const trailer = details.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&modestbranding=1&showinfo=0&rel=0`);
        }
      }
    } catch (error) {
      console.error('Error loading trailer:', error);
    }
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsHovering(true);
    loadTrailer();
    // Start trailer after a short delay
    trailerTimeoutRef.current = setTimeout(() => {
      if (trailerUrl) {
        setShowTrailer(true);
      }
    }, 500);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovering(false);
    setShowTrailer(false);
    if (trailerTimeoutRef.current) {
      clearTimeout(trailerTimeoutRef.current);
      trailerTimeoutRef.current = null;
    }
    // Pause video if playing
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (trailerTimeoutRef.current) {
        clearTimeout(trailerTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user should be redirected to payment page, redirect them
    if (shouldRedirectToPayment) {
      window.location.href = `/subscription`;
      return;
    }
    
    window.location.href = `/watch/movie/${movie.id}`;
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(movie, 'movie');
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement watchlist functionality (separate from favorites)
    console.log('Add to watchlist:', movie.title);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await shareContent(movie, 'movie');
  };

  const sizeClasses = {
    small: "w-32 sm:w-40 md:w-48",
    medium: "w-40 sm:w-48 md:w-56",
    large: "w-48 sm:w-56 md:w-64",
  };

  const heightClasses = {
    small: "h-48 sm:h-60 md:h-72",
    medium: "h-60 sm:h-72 md:h-80",
    large: "h-72 sm:h-80 md:h-96",
  };

  const genres = movie.genre_ids?.slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean) || [];

  return (
    <Link
      href={`/movie/${movie.id}`}
      className={`flex-shrink-0 ${sizeClasses[size]} group cursor-pointer movie-card block`}
      data-testid={`movie-card-${movie.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
        <div className="relative overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
          {showTrailer && trailerUrl ? (
            <iframe
              ref={videoRef as any}
              src={trailerUrl}
              className={`w-full ${heightClasses[size]} object-cover`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`${movie.title} trailer`}
            />
          ) : (
            <img
              src={imageError ? "/placeholder-movie.jpg" : tmdbService.getPosterUrl(movie.poster_path)}
              alt={movie.title}
              className={`w-full ${heightClasses[size]} object-cover`}
              onError={handleImageError}
              data-testid={`movie-poster-${movie.id}`}
            />
          )}
          
          {showOverlay && (
            <>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
              
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handlePlayClick}
                  className="bg-primary/80 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Play className="w-5 h-5 ml-1" />
                </button>
              </div>
              
              {/* Rating badge */}
              {movie.vote_average > 0 && (
                <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded text-sm font-semibold flex items-center space-x-1" data-testid={`movie-rating-${movie.id}`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>{movie.vote_average.toFixed(1)}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleToggleFavorite}
                  disabled={isAddingToFavorites}
                  className={`w-8 h-8 rounded-full ${isFavorite ? "bg-primary text-white" : "bg-black/50 text-white"}`}
                  data-testid={`button-favorite-${movie.id}`}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleAddToList}
                  className="w-8 h-8 rounded-full bg-black/50 text-white"
                  data-testid={`button-add-list-${movie.id}`}
                  title="Ajouter à ma liste"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleShare}
                  className="w-8 h-8 rounded-full bg-black/50 text-white"
                  data-testid={`button-share-${movie.id}`}
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-2 sm:mt-3" data-testid={`movie-info-${movie.id}`}>
          <h3 className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors duration-200 line-clamp-1" data-testid={`movie-title-${movie.id}`}>
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`movie-year-${movie.id}`}>
              {new Date(movie.release_date).getFullYear()} • {genres.join(", ")}
            </p>
          </div>
        </div>
    </Link>
  );
}
