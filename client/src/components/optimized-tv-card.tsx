import React from 'react';
import { Play, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tmdbService } from '@/lib/tmdb';
import { TMDBTVSeries } from '@/types/movie';
import OptimizedImage from '@/components/ui/optimized-image';

interface OptimizedTVCardProps {
  series: TMDBTVSeries;
  onPlay?: (series: TMDBTVSeries) => void;
  onAddToList?: (series: TMDBTVSeries) => void;
  onToggleFavorite?: (series: TMDBTVSeries) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

const OptimizedTVCard: React.FC<OptimizedTVCardProps> = ({ 
  series, 
  onPlay,
  onAddToList,
  onToggleFavorite,
  isFavorite = false,
  showActions = true
}) => {
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(series);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList?.(series);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(series);
  };

  return (
    <div 
      className="group relative bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      data-testid={`tv-card-${series.id}`}
    >
      {/* Series Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <OptimizedImage
          src={tmdbService.getPosterUrl(series.poster_path)}
          alt={series.name}
          className="w-full h-full object-cover"
          webpSrc={tmdbService.getPosterUrl(series.poster_path).replace('.jpg', '.webp')}
          loading="lazy"
        />
        
        {/* Overlay with actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3 p-2">
            <Button 
              size="sm" 
              className="w-10 h-10 rounded-full bg-white text-black hover:bg-gray-200"
              onClick={handlePlay}
              aria-label={`Regarder ${series.name}`}
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
          <span>{series.vote_average.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Series Info */}
      <div className="p-3">
        <h3 
          className="font-semibold text-foreground text-sm line-clamp-2 mb-1"
          title={series.name}
        >
          {series.name}
        </h3>
        
        <p className="text-muted-foreground text-xs">
          {series.first_air_date ? new Date(series.first_air_date).getFullYear() : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default OptimizedTVCard;