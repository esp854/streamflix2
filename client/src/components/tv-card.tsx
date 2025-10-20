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

// Add interface for local content (matching TVRow exactly)
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
   const [isHovering, setIsHovering] = useState(false);
   const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
   const { shareContent } = useShare();
   const { shouldRedirectToPayment } = useSubscriptionCheck();

   // Fonction utilitaire pour extraire l'ID numérique de manière plus robuste
   const getSeriesId = (): number => {
     if ('tmdbId' in series && series.tmdbId) {
       return series.tmdbId;
     }
     if ('id' in series && typeof series.id === 'string') {
       // Pour les contenus locaux, l'ID peut être une chaîne comme "tmdb-12345"
       if (series.id.startsWith('tmdb-')) {
         const tmdbId = parseInt(series.id.substring(5), 10);
         return isNaN(tmdbId) ? 0 : tmdbId;
       }
       const parsed = parseInt(series.id, 10);
       return isNaN(parsed) ? 0 : parsed;
     }
     if ('id' in series && typeof series.id === 'number') {
       return series.id;
     }
     return 0;
   };

   // Amélioration de la gestion de l'identifiant pour la navigation
   const stringSeriesId = (() => {
     if ('tmdbId' in series && series.tmdbId) {
       return series.tmdbId.toString();
     }
     if ('id' in series && typeof series.id === 'string') {
       // Pour les contenus locaux, on utilise l'ID directement
       // Si c'est un ID TMDB formaté comme "tmdb-12345", on extrait le numéro
       if (series.id.startsWith('tmdb-')) {
         return series.id.substring(5);
       }
       // Sinon, on utilise l'ID tel quel
       return series.id;
     }
     if ('id' in series && typeof series.id === 'number') {
       return series.id.toString();
     }
     return "0";
   })();
   
   const seriesId = getSeriesId();
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
        // Ne faire la requête que si on a un ID valide
        if (seriesId > 0) {
          const response = await fetch(`/api/contents/tmdb/${seriesId}`);
          if (response.ok) {
            const content = await response.json();
            return content.active !== false; // Si active est false, le contenu est inactif
          }
        }
        return true; // Par défaut, on suppose que le contenu est actif
      } catch (error) {
        console.error('Error checking content status:', error);
        // En cas d'erreur, on affiche le contenu par défaut
        return true;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Ajouter un retry en cas d'erreur
    retry: 2,
    retryDelay: 1000,
    // Ne pas bloquer l'affichage en cas d'erreur
    enabled: seriesId > 0, // Ne faire la requête que si on a un ID valide
  });

  // Par défaut, on considère que le contenu est actif si on n'a pas d'information
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
    if ('odyseeUrl' in series && !series.odyseeUrl) {
      window.location.href = `/tv/${stringSeriesId}`;
    } else {
      window.location.href = `/watch/tv/${stringSeriesId}/1/1`;
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a compatible object for the toggleFavorite function
    if ('tmdbId' in series && series.tmdbId) {
      const favoriteObject = {
        id: series.tmdbId,
        name: series.name || series.title,
        poster_path: series.posterPath || null,
        genre_ids: series.genreIds || [],
        first_air_date: series.firstAirDate || ""
      } as unknown as TMDBTVSeries;
      
      await toggleFavorite(favoriteObject, 'tv');
    } else {
      // For local content, we might need a different approach
      const title = 'name' in series ? series.name : series.title;
      console.log('Cannot add local content to favorites:', title);
    }
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement watchlist functionality (separate from favorites)
    const title = 'name' in series ? series.name : series.title;
    console.log('Add to watchlist:', title);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a compatible object for the shareContent function
    if ('tmdbId' in series && series.tmdbId) {
      const shareObject = {
        id: series.tmdbId,
        name: series.name || series.title,
        poster_path: series.posterPath || null,
        genre_ids: series.genreIds || [],
        first_air_date: series.firstAirDate || ""
      } as unknown as TMDBTVSeries;
      
      await shareContent(shareObject, 'tv');
    } else {
      // For local content, we might need a different approach
      const title = 'name' in series ? series.name : series.title;
      console.log('Cannot share local content:', title);
    }
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
  // Mais seulement pour le contenu local, pas pour le contenu TMDB
  if ('active' in series && !contentActive) {
    return null;
  }

  // URL de l'image avec fallback
  const imageUrl = imageError 
    ? "/placeholder-movie.jpg" 
    : posterPath 
      ? tmdbService.getPosterUrl(posterPath)
      : "/placeholder-movie.jpg";

  return (
    <Link
      href={`/tv/${stringSeriesId}`}
      className={`flex-shrink-0 ${sizeClasses[size]} group cursor-pointer tv-card block`}
      data-testid={`tv-card-${stringSeriesId}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
        <div className="relative overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
          <img
            src={imageUrl}
            alt={name || ""}
            className={`w-full ${heightClasses[size]} object-cover`}
            onError={handleImageError}
            data-testid={`tv-poster-${stringSeriesId}`}
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
                <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded text-sm font-semibold flex items-center space-x-1" data-testid={`tv-rating-${stringSeriesId}`}>
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
                    data-testid={`button-favorite-${stringSeriesId}`}
                    title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleAddToList}
                    className="w-8 h-8 rounded-full bg-black/50 text-white"
                    data-testid={`button-add-list-${stringSeriesId}`}
                    title="Ajouter à ma liste"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleShare}
                    className="w-8 h-8 rounded-full bg-black/50 text-white"
                    data-testid={`button-share-${stringSeriesId}`}
                    title="Partager"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-2 sm:mt-3" data-testid={`tv-info-${stringSeriesId}`}>
          <h3 className="text-sm sm:text-base text-foreground font-medium group-hover:text-primary transition-colors duration-200 line-clamp-1" data-testid={`tv-title-${stringSeriesId}`}>
            {name}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`tv-year-${stringSeriesId}`}>
              {firstAirDate ? new Date(firstAirDate).getFullYear() : "Date inconnue"} • {genres.join(", ")}
            </p>
          </div>
        </div>
    </Link>
  );
}