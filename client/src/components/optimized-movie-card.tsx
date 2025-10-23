import React from 'react';
import { Play, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tmdbService } from '@/lib/tmdb';
import { TMDBMovie } from '@/types/movie';
import OptimizedImage from '@/components/ui/optimized-image';

interface OptimizedMovieCardProps {
  movie: TMDBMovie;
  onPlay?: (movie: TMDBMovie) => void;
  onAddToList?: (movie: TMDBMovie) => void;
  onToggleFavorite?: (movie: TMDBMovie) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

const OptimizedMovieCard: React.FC<OptimizedMovieCardProps> = ({ 
  movie, 
  onPlay,
  onAddToList,
  onToggleFavorite,
  isFavorite = false,
  showActions = true
}) => {
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(movie);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList?.(movie);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(movie);
  };

  return (
    <div 
      className="group relative bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      data-testid={`movie-card-${movie.id}`}
    >
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <OptimizedImage
          src={tmdbService.getPosterUrl(movie.poster_path)}
          alt={movie.title}
          className="w-full h-full object-cover"
          webpSrc={tmdbService.getPosterUrl(movie.poster_path).replace('.jpg', '.webp')}
          loading="lazy"
        />
        
        {/* Overlay with actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3 p-2">
            <Button 
              size="sm" 
              className="w-10 h-10 rounded-full bg-white text-black hover:bg-gray-200"
              onClick={handlePlay}
              aria-label={`Regarder ${movie.title}`}
            >
              <Play className="w-4 h-4" />
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-8 h-8 rounded-full p-0"
                onClick={handleAddToList}
                aria-label="Ajouter à la liste"
              >
                <Plus className="w-3 h-3" />
              </Button>
              
              <Button 
                size="sm" 
                variant={isFavorite ? "default" : "secondary"} 
                className="w-8 h-8 rounded-full p-0"
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        )}
        
        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
          <span>{movie.vote_average.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Movie Info */}
      <div className="p-3">
        <h3 
          className="font-semibold text-foreground text-sm line-clamp-2 mb-1"
          title={movie.title}
        >
          {movie.title}
        </h3>
        
        <p className="text-muted-foreground text-xs">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default OptimizedMovieCard;