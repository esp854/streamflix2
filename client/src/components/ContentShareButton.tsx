import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useOfflineShare } from '@/hooks/useOfflineShare';

interface ShareableContent {
  id: string;
  title: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  contentType: 'movie' | 'tv';
  url: string;
}

interface ContentShareButtonProps {
  content: ShareableContent;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export default function ContentShareButton({
  content,
  variant = 'outline',
  size = 'default',
  className = '',
  children
}: ContentShareButtonProps) {
  const { shareContentWithFallback } = useOfflineShare();

  const handleShare = async () => {
    try {
      const result = await shareContentWithFallback(content);
      
      if (result.success) {
        // Le partage a réussi, on ne fait rien de plus
        console.log('[ContentShare] Content shared successfully');
      } else {
        // En cas d'échec, on pourrait afficher un message d'erreur
        console.warn('[ContentShare] Failed to share content:', result.error);
      }
    } catch (error) {
      console.error('[ContentShare] Error sharing content:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
    >
      {children || (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Partager</span>
        </>
      )}
    </Button>
  );
}