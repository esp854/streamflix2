import React from 'react';
import MovieCard from './movie-card';
import TVCard from './tv-card';

interface VideoSuggestion {
  id: number;
  title: string;
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

export const VideoSuggestions: React.FC<VideoSuggestionsProps> = ({ 
  suggestions, 
  title,
  onMediaClick 
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 px-4">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {suggestions.map((media) => (
          <div key={`${media.mediaType}-${media.id}`} className="cursor-pointer" onClick={() => onMediaClick(media)}>
            {media.mediaType === 'movie' ? (
              <MovieCard 
                movie={{
                  id: media.id.toString(),
                  tmdbId: media.id,
                  title: media.title,
                  posterPath: media.posterPath,
                  voteAverage: media.voteAverage,
                  releaseDate: media.releaseDate || '',
                  mediaType: 'movie',
                  active: true,
                  overview: '',
                  genreIds: []
                }} 
              />
            ) : (
              <TVCard 
                series={{
                  id: media.id.toString(),
                  tmdbId: media.id,
                  title: media.title,
                  name: media.title,
                  posterPath: media.posterPath,
                  voteAverage: media.voteAverage,
                  firstAirDate: media.firstAirDate || '',
                  mediaType: 'tv',
                  active: true,
                  overview: '',
                  genreIds: []
                }} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};