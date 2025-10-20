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
          apiUrl = `/api/frembed/movie/${tmdbId}`;
        } else if (mediaType === 'tv' && season && episode) {
          apiUrl = `/api/frembed/series/${tmdbId}/${season}/${episode}`;
        } else {
          setSources([]);
          setLoading(false);
          return;
        }
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch Frembed sources');
        }
        
        const data = await response.json();
        
        if (data.url) {
          setSources([{
            url: data.url,
            quality: 'auto',
            type: 'iframe'
          }]);
        } else {
          setSources([]);
        }
        
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