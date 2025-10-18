import { Link } from "wouter";
import { Play, Star, Plus, Heart, Share2 } from "lucide-react";
import { TMDBMovie, GENRE_MAP } from "@/types/movie";
import { tmdbService } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { useShare } from "@/hooks/use-share";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { useQuery } from "@tanstack/react-query";

// Add interface for local content
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
  voteAverage?: number;
  genreIds?: number[];
}

// Create a type that combines both interfaces
type MovieType = TMDBMovie | LocalContent;

interface MovieCardProps {
  movie: MovieType;
  size?: "small" | "medium" | "large";
  showOverlay?: boolean;
}

export default function MovieCard({ movie, size = "medium", showOverlay = true }: MovieCardProps) {
   const [imageError, setImageError] = useState(false);
   const [isHovering, setIsHovering] = useState(false);
   const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
   const { shareContent } = useShare();
   const { shouldRedirectToPayment } = useSubscriptionCheck();

   // Check if movie is favorite
   const isTMDBMovie = 'tmdbId' in movie;
   const numericMovieId = isTMDBMovie ? movie.tmdbId : (typeof movie.id === 'string' ? parseInt(movie.id, 10) || 0 : movie.id);
   const stringMovieId = isTMDBMovie ? movie.tmdbId.toString() : movie.id.toString();
   const { data: favoriteStatus } = checkFavorite(numericMovieId);
   const isFavorite = favoriteStatus?.isFavorite || false;

  // Vérifier si le contenu est actif dans la base de données avec React Query pour le caching
  const { data: contentActiveData, isLoading: contentActiveLoading } = useQuery({
    queryKey: ["content-active", numericMovieId],
    queryFn: async () => {
      try {
        // For local content, check if it's active directly
        if ('active' in movie) {
          return movie.active;
        }
        
        // For TMDB content, check the database
        const response = await fetch(`/api/contents/tmdb/${numericMovieId}`);
        if (response.ok) {
          const content = await response.json();
          return content.active !== false; // Si active est false, le contenu est inactif
        }
        return true; // Par défaut, on suppose que le contenu est actif
      } catch (error) {
        console.error('Error checking content status:', error);
        return true; // En cas d'erreur, on affiche le contenu
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const contentActive = contentActiveData !== undefined ? contentActiveData : true;

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle mouse enter - simplified for mobile
  const handleMouseEnter = () => {
    // Only show overlay effects on non-mobile devices
    if (window.innerWidth > 768) {
      setIsHovering(true);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user should be redirected to payment page, redirect them
    if (shouldRedirectToPayment) {
      window.location.href = `/subscription`;
      return;
    }
    
    // For local content without video links, redirect to the detail page instead
    if ('odyseeUrl' in movie && !movie.odyseeUrl) {
      window.location.href = `/movie/${stringMovieId}`;
    } else {
      window.location.href = `/watch/movie/${stringMovieId}`;
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a compatible object for the toggleFavorite function
    const favoriteObject = 'tmdbId' in movie 
      ? {
          id: movie.tmdbId,
          title: movie.title,
          poster_path: movie.posterPath || null,
          genre_ids: movie.genreIds || [],
          release_date: movie.releaseDate || ""
        } as unknown as TMDBMovie
      : movie;
      
    await toggleFavorite(favoriteObject, 'movie');
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
    
    // Create a compatible object for the shareContent function
    const shareObject = 'tmdbId' in movie 
      ? {
          id: movie.tmdbId,
          title: movie.title,
          poster_path: movie.posterPath || null,
          genre_ids: movie.genreIds || [],
          release_date: movie.releaseDate || ""
        } as unknown as TMDBMovie
      : movie;
      
    await shareContent(shareObject, 'movie');
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

  // Get genres for both TMDB and local content
  const genreIds = 'genre_ids' in movie ? movie.genre_ids : movie.genreIds || [];
  const genres = genreIds?.slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean) || [];

  // Get title for both TMDB and local content
  const title = movie.title;
  
  // Get release date for both TMDB and local content
  const releaseDate = 'release_date' in movie ? movie.release_date : movie.releaseDate;
  
  // Get poster path for both TMDB and local content
  const posterPath = 'poster_path' in movie ? movie.poster_path : movie.posterPath;
  
  // Get vote average for both TMDB and local content
  const voteAverage = 'vote_average' in movie ? movie.vote_average : movie.voteAverage;

  // Si le contenu n'est pas actif, on ne l'affiche pas
  if (!contentActive) {
    return null;
  }

  return (
    <Link
      href={`/movie/${stringMovieId}`}
      className={`flex-shrink-0 ${sizeClasses[size]} group cursor-pointer movie-card block`}
      data-testid={`movie-card-${stringMovieId}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
        <div className="relative overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
          <img
            src={imageError ? "/placeholder-movie.jpg" : tmdbService.getPosterUrl(posterPath || null)}
            alt={title || ""}
            className={`w-full ${heightClasses[size]} object-cover`}
            onError={handleImageError}
            data-testid={`movie-poster-${stringMovieId}`}
            loading="lazy"
          />
          
          {showOverlay && (
            <>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
              
              {/* Play overlay - only show on desktop */}
              {window.innerWidth > 768 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={handlePlayClick}
                    className="bg-primary/80 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <Play className="w-5 h-5 ml-1" />
                  </button>
                </div>
              )}
              
              {/* Rating badge */}
              {voteAverage && voteAverage > 0 && (
                <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded text-sm font-semibold flex items-center space-x-1" data-testid={`movie-rating-${stringMovieId}`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>{voteAverage.toFixed(1)}</span>
                </div>
              )}

              {/* Action buttons - only show on desktop */}
              {window.innerWidth > 768 && (
                <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleToggleFavorite}
                    disabled={isAddingToFavorites}
                    className={`w-8 h-8 rounded-full ${isFavorite ? "bg-primary text-white" : "bg-black/50 text-white"}`}
                    data-testid={`button-favorite-${stringMovieId}`}
                    title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleAddToList}
                    className="w-8 h-8 rounded-full bg-black/50 text-white"
                    data-testid={`button-add-list-${stringMovieId}`}
                    title="Ajouter à ma liste"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleShare}
                    className="w-8 h-8 rounded-full bg-black/50 text-white"
                    data-testid={`button-share-${stringMovieId}`}
                    title="Partager"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-2 sm:mt-3" data-testid={`movie-info-${stringMovieId}`}>
          <h3 className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors duration-200 line-clamp-1" data-testid={`movie-title-${stringMovieId}`}>
            {title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`movie-year-${stringMovieId}`}>
              {releaseDate ? new Date(releaseDate).getFullYear() : "Date inconnue"} • {genres.join(", ")}
            </p>
          </div>
        </div>
    </Link>
  );
}