import React from 'react';
import { TVSeasonEpisode } from '../types/movie';
import { tmdbService } from '../lib/tmdb';

interface EpisodeCardProps {
  episode: TVSeasonEpisode;
  tvId: number;
  seasonNumber: number;
  episodeImage?: string | null;
  onPlay?: () => void;
}

export function EpisodeCard({ episode, tvId, seasonNumber, episodeImage, onPlay }: EpisodeCardProps) {
  // Utiliser l'image de l'épisode si disponible, sinon une image de fallback
  const stillUrl = episodeImage 
    ? tmdbService.getImageUrl(episodeImage, 'w300') 
    : episode.still_path 
    ? tmdbService.getImageUrl(episode.still_path, 'w300') 
    : '/placeholder-episode.jpg';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
      <div className="relative flex-shrink-0">
        <img
          src={stillUrl}
          alt={episode.name}
          className="w-16 h-9 sm:w-20 sm:h-11 md:w-24 md:h-13 object-cover rounded"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-episode.jpg';
          }}
        />
        <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={onPlay}
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-primary hover:bg-primary/90 rounded-full transition-colors flex items-center justify-center"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-primary">Épisode {episode.episode_number}</span>
          <span className="text-xs text-gray-400">
            {episode.air_date ? new Date(episode.air_date).toLocaleDateString('fr-FR') : ''}
          </span>
        </div>
        <h3 className="font-medium text-sm sm:text-base line-clamp-1 mt-1">{episode.name}</h3>
        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{episode.overview}</p>
        {episode.runtime && (
          <p className="text-xs text-gray-500 mt-1">{episode.runtime} min</p>
        )}
      </div>
      <a 
        href={`/watch/tv/${tvId}/${seasonNumber}/${episode.episode_number}`}
        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-primary hover:bg-primary/90 rounded-full transition-colors flex items-center justify-center"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      </a>
    </div>
  );
}