import React from 'react';
import { Star } from 'lucide-react';
import { tmdbService } from '@/lib/tmdb';

interface VideoSuggestion {
  id: number;
  title: string;
  name?: string; // Pour les séries TV
  posterPath: string;
  voteAverage: number;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: 'movie' | 'tv';
}

interface VideoSuggestionsProps {
  suggestions: VideoSuggestion[];
  title: string;
  onMediaClick: (media: VideoSuggestion) => void;
}

export function VideoSuggestions({ suggestions, title, onMediaClick }: VideoSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 bg-background" data-testid="video-suggestions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
          {suggestions.map((media) => (
            <div
              key={media.id}
              className="cursor-pointer group"
              onClick={() => onMediaClick(media)}
              data-testid={`suggestion-${media.id}`}
            >
              <div className="relative pb-[150%] rounded-lg overflow-hidden bg-muted">
                {media.posterPath ? (
                  <img
                    src={tmdbService.getPosterUrl(media.posterPath)}
                    alt={media.title || media.name || 'Media'}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-poster.jpg";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="w-8 h-8 text-muted-foreground flex items-center justify-center">
                      🎬
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {media.title || media.name || 'Titre inconnu'}
              </h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span>{media.voteAverage?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}