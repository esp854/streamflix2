import { Link } from "wouter";
import { Play, Star, Plus, Heart, Share2 } from "lucide-react";
import { TMDBTVSeries, TV_GENRE_MAP } from "@/types/movie";
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
  name?: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: 'tv';
  odyseeUrl?: string;
  active: boolean;
  voteAverage?: number;
  genreIds?: number[];
}

// Create a type that combines both interfaces
type TVSeriesType = TMDBTVSeries | LocalContent;

interface TVCardProps {
  series: TVSeriesType;
  size?: "small" | "medium" | "large";
  showOverlay?: boolean;
}

export default function TVCard({ series, size = "medium", showOverlay = true }: TVCardProps) {
   const [imageError, setImageError] = useState(false);
   const [showTrailer, setShowTrailer] = useState(false);
   const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
   const [isHovering, setIsHovering] = useState(false);
   const videoRef = useRef<HTMLVideoElement>(null);
   const trailerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
   const { shareContent } = useShare();
   const { shouldRedirectToPayment } = useSubscriptionCheck();

   // Check if series is favorite
   const seriesId = 'tmdbId' in series ? series.tmdbId : parseInt(series.id);
   const seriesIdStr = seriesId.toString();
   const { data: favoriteStatus } = checkFavorite(seriesId);
   const isFavorite = favoriteStatus?.isFavorite || false;

  // Vérifier si le contenu est actif dans la base de données avec React Query pour le caching
  const { data: contentActiveData, isLoading: contentActiveLoading } = useQuery({
    queryKey: ["content-active", seriesId],
    queryFn: async () => {
      try {
        // For local content, check if it's active directly
        if ('active' in series) {
          return series.active;
        }
        
        // For TMDB content, check the database
        const response = await fetch(`/api/contents/tmdb/${seriesId}`);
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

  // Load trailer when hovering (only for TMDB content)
  const loadTrailer = async () => {
    // Only load trailers for TMDB content, not local content
    if ('tmdbId' in series) {
      if (trailerUrl) return; // Already loaded

      try {
        const details = await tmdbService.getTVShowDetails(series.tmdbId);
        if (details.videos && details.videos.results) {
          const trailer = details.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
          if (trailer) {
            setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&modestbranding=1&showinfo=0&rel=0`);
          }
        }
      } catch (error) {
        console.error('Error loading trailer:', error);
      }
    }
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsHovering(true);
    loadTrailer();
    // Start trailer after a short delay (only for TMDB content)
    if ('tmdbId' in series) {
      trailerTimeoutRef.current = setTimeout(() => {
        if (trailerUrl) {
          setShowTrailer(true);
        }
      }, 500);
    }
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
    
    // For local content without video links, redirect to the detail page instead
    if ('odyseeUrl' in series && !series.odyseeUrl) {
      window.location.href = `/tv/${seriesId}`;
    } else {
      window.location.href = `/watch/tv/${seriesId}/1/1`;
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a compatible object for the toggleFavorite function
    const favoriteObject = 'tmdbId' in series 
      ? {
          id: series.tmdbId,
          name: series.name || series.title,
          poster_path: series.posterPath || null,
          genre_ids: series.genreIds || [],
          first_air_date: series.firstAirDate || ""
        } as unknown as TMDBTVSeries
      : series;
      
    await toggleFavorite(favoriteObject, 'tv');
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement watchlist functionality (separate from favorites)
    console.log('Add to watchlist:', 'name' in series ? series.name : series.title);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a compatible object for the shareContent function
    const shareObject = 'tmdbId' in series 
      ? {
          id: series.tmdbId,
          name: series.name || series.title,
          poster_path: series.posterPath || null,
          genre_ids: series.genreIds || [],
          first_air_date: series.firstAirDate || ""
        } as unknown as TMDBTVSeries
      : series;
      
    await shareContent(shareObject, 'tv');
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
  const genreIds = 'genre_ids' in series ? series.genre_ids : series.genreIds || [];
  const genres = genreIds?.slice(0, 2).map(id => TV_GENRE_MAP[id]).filter(Boolean) || [];

  // Get name/title for both TMDB and local content
  const name = 'name' in series ? series.name : series.title;
  
  // Get first air date for both TMDB and local content
  const firstAirDate = 'first_air_date' in series ? series.first_air_date : series.firstAirDate;
  
  // Get poster path for both TMDB and local content
  const posterPath = 'poster_path' in series ? series.poster_path : series.posterPath;
  
  // Get vote average for both TMDB and local content
  const voteAverage = 'vote_average' in series ? series.vote_average : series.voteAverage;

  // Si le contenu n'est pas actif, on ne l'affiche pas
  if (!contentActive) {
    return null;
  }

  return (
    <Link
      href={`/tv/${seriesId}`}
      className={`flex-shrink-0 ${sizeClasses[size]} group cursor-pointer tv-card block`}
      data-testid={`tv-card-${seriesIdStr}`}
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
              title={`${name} trailer`}
            />
          ) : (
            <img
              src={imageError ? "/placeholder-movie.jpg" : tmdbService.getPosterUrl(posterPath || null)}
              alt={name || ""}
              className={`w-full ${heightClasses[size]} object-cover`}
              onError={handleImageError}
              data-testid={`tv-poster-${seriesIdStr}`}
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
              {voteAverage && voteAverage > 0 && (
                <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded text-sm font-semibold flex items-center space-x-1" data-testid={`tv-rating-${seriesIdStr}`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>{voteAverage.toFixed(1)}</span>
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
                  data-testid={`button-favorite-${seriesIdStr}`}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleAddToList}
                  className="w-8 h-8 rounded-full bg-black/50 text-white"
                  data-testid={`button-add-list-${seriesIdStr}`}
                  title="Ajouter à ma liste"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleShare}
                  className="w-8 h-8 rounded-full bg-black/50 text-white"
                  data-testid={`button-share-${seriesIdStr}`}
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-2 sm:mt-3" data-testid={`tv-info-${seriesIdStr}`}>
          <h3 className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors duration-200 line-clamp-1" data-testid={`tv-title-${seriesIdStr}`}>
            {name}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`tv-year-${seriesIdStr}`}>
              {firstAirDate ? new Date(firstAirDate).getFullYear() : "Date inconnue"} • {genres.join(", ")}
            </p>
          </div>
        </div>
    </Link>
  );
}