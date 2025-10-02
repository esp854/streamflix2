import React, { useState, useEffect } from 'react';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContentItem {
  id: string;
  title: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  contentType: 'movie' | 'tv';
  savedAt: string;
}

export default function OfflineContentManager() {
  const { offlineContent, removeOfflineContent, refresh } = useOfflineContent();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Rafraîchir la liste du contenu hors-ligne au montage du composant
    handleRefresh();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleRemoveContent = async (contentId: string, title: string) => {
    try {
      await removeOfflineContent(contentId);
      toast({
        title: "Contenu supprimé",
        description: `"${title}" a été supprimé de votre bibliothèque hors-ligne.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contenu.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (offlineContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Aucun contenu hors-ligne</h3>
        <p className="text-muted-foreground mb-4">
          Sauvegardez des films ou séries pour les consulter sans connexion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contenu hors-ligne</h2>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <Download className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offlineContent.map((content) => (
          <Card key={content.id} className="overflow-hidden">
            <div className="relative">
              {content.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${content.poster_path}`}
                  alt={content.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.png';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Image non disponible</span>
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveContent(content.id, content.title)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2">
                {content.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {content.overview}
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {content.contentType === 'movie' ? 'Film' : 'Série'}
                  </span>
                  <span className="text-muted-foreground">
                    {content.release_date || content.first_air_date 
                      ? formatDate(content.release_date || content.first_air_date || '') 
                      : 'Date inconnue'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  {content.vote_average && (
                    <span className="font-medium">
                      Note: {content.vote_average.toFixed(1)}/10
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    Sauvegardé le {formatDate(content.savedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}