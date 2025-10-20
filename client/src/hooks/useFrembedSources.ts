import { useEffect, useState } from 'react';

interface FrembedSource {
  url: string;
  quality: string;
  type: 'iframe';
}

export const useFrembedSources = (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
  const [sources, setSources] = useState<FrembedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFrembedSources = async () => {
      if (!tmdbId) return;
      
      try {
        setLoading(true);
        let apiUrl: string;
        
        if (mediaType === 'movie') {
          apiUrl = `https://frembed.fun/api/embed/${tmdbId}`;
        } else if (mediaType === 'tv' && season && episode) {
          apiUrl = `https://frembed.fun/api/embed/${tmdbId}?s=${season}&e=${episode}`;
        } else {
          setSources([]);
          setLoading(false);
          return;
        }
        
        // Utiliser l'API Frembed directement comme spécifié dans les mémoires
        setSources([{
          url: apiUrl,
          quality: 'auto',
          type: 'iframe'
        }]);
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch Frembed sources');
        console.error('Frembed API error:', err);
        setSources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFrembedSources();
  }, [tmdbId, mediaType, season, episode]);

  return { sources, loading, error };
};