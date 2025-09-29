import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Play, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WatchProgress } from "@shared/schema";

export default function ContinueWatching() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const { data: watchProgress, isLoading, error } = useQuery({
    queryKey: ["/api/watch-progress", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      const response = await fetch(`/api/watch-progress/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch watch progress");
      return response.json() as Promise<WatchProgress[]>;
    },
    enabled: !!userId && isAuthenticated,
  });

  const removeProgressMutation = useMutation({
    mutationFn: async (progressId: string) => {
      await apiRequest("DELETE", `/api/watch-progress/${progressId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watch-progress", userId] });
      toast({
        title: "Supprimé",
        description: "Le contenu a été retiré de votre liste.",
      });
    },
    onError: (error) => {
      console.error("Error removing progress:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer ce contenu.",
        variant: "destructive"
      });
    },
  });

  const handleRemove = (progressId: string, contentTitle: string) => {
    removeProgressMutation.mutate(progressId);
  };

  // Filter out completed content and sort by last watched
  const activeProgress = watchProgress?.filter(p => !p.completed && p.currentTime > 0) || [];

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Connexion requise</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Vous devez être connecté pour voir vos contenus en cours de visionnage.
            </p>
            <Link href="/">
              <Button className="gap-2">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-muted rounded animate-pulse mb-4 w-64"></div>
            <div className="h-6 bg-muted rounded animate-pulse w-96"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-[2/3] bg-muted rounded-md animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-6">
              Impossible de charger vos contenus en cours. Veuillez réessayer plus tard.
            </p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!activeProgress || activeProgress.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Continuer à regarder
            </h1>
            <p className="text-muted-foreground">
              Reprenez où vous en étiez dans vos contenus préférés
            </p>
          </div>

          <div className="text-center py-12">
            <div className="text-8xl mb-6">▶️</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Aucun contenu en cours
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Vous n'avez pas de contenu en cours de visionnage. Commencez à regarder quelque chose !
            </p>
            <Link href="/">
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Découvrir des contenus
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Play className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Continuer à regarder
            </h1>
          </div>
          <p className="text-muted-foreground">
            {activeProgress.length} contenu{activeProgress.length > 1 ? 's' : ''} en cours - Reprenez où vous en étiez
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {activeProgress.map((progress) => (
            <ContinueWatchingCard
              key={progress.id}
              progress={progress}
              onRemove={handleRemove}
              isRemoving={removeProgressMutation.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ContinueWatchingCardProps {
  progress: WatchProgress;
  onRemove: (progressId: string, contentTitle: string) => void;
  isRemoving: boolean;
}

function ContinueWatchingCard({ progress, onRemove, isRemoving }: ContinueWatchingCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // We need to get the content title - for now using a placeholder
    onRemove(progress.id, "ce contenu");
  };

  const progressPercentage = progress.duration
    ? Math.min((progress.currentTime / progress.duration) * 100, 100)
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes}m`;
    }
    return `${minutes}m`;
  };

  const timeRemaining = progress.duration
    ? progress.duration - progress.currentTime
    : 0;

  // For now, we'll create a link to the movie page
  // In a real implementation, this would need to handle both movies and TV episodes
  const contentLink = progress.episodeId
    ? `/tv/${progress.contentId || 'unknown'}?episode=${progress.episodeId}`
    : `/movie/${progress.movieId || progress.contentId || 'unknown'}`;

  return (
    <div className="group cursor-pointer relative">
      <Link href={contentLink}>
        <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-colors duration-300">
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={imageError ? "/placeholder-movie.jpg" : "/placeholder-movie.jpg"} // TODO: Add poster URL
              alt="Content poster"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
            />

            {/* Progress bar overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
              <Progress value={progressPercentage} className="h-1" />
              <div className="flex justify-between items-center mt-1 text-xs text-white">
                <span>{Math.round(progressPercentage)}%</span>
                {timeRemaining > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(timeRemaining)} restants
                  </span>
                )}
              </div>
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Play className="w-6 h-6 text-black" fill="currentColor" />
              </div>
            </div>

            {/* Remove button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="icon"
                variant="destructive"
                onClick={handleRemoveClick}
                disabled={isRemoving}
                className="w-8 h-8 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-3">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 text-sm">
              {progress.movieId ? `Film ${progress.movieId}` : `Contenu ${progress.contentId || 'inconnu'}`}
            </h3>
            {progress.episodeId && (
              <p className="text-xs text-muted-foreground mt-1">
                Épisode {progress.episodeId}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Vu le {new Date(progress.lastWatchedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}