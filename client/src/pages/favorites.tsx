import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trash2, Heart, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { tmdbService } from "@/lib/tmdb";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

export default function Favorites() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated && user?.id ? user.id : null;

  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["/api/favorites", userId],
    queryFn: async () => {
      if (!userId || !isAuthenticated) {
        throw new Error("User not authenticated");
      }
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/favorites/${userId}`, {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      return response.json() as Promise<any[]>;
    },
    enabled: !!userId && isAuthenticated,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (movieId: number) => {
      if (!userId || !isAuthenticated) {
        throw new Error("User not authenticated");
      }
      await apiRequest("DELETE", `/api/favorites/${userId}/${movieId}`);
    },
    onSuccess: () => {
      // Invalidate favorites query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", userId] });
      toast({
        title: "Film supprimé",
        description: "Le film a été retiré de vos favoris.",
      });
    },
    onError: (error) => {
      console.error("Error removing favorite:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le film de vos favoris.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFavorite = (movieId: number, movieTitle: string) => {
    if (!userId || !isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour gérer vos favoris.",
        variant: "destructive",
      });
      return;
    }
    removeFavoriteMutation.mutate(movieId);
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-8" data-testid="favorites-page-unauthenticated">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Connexion requise</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Vous devez être connecté pour voir vos films favoris.
            </p>
            <Link href="/">
              <Button className="gap-2" data-testid="button-go-home">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state with skeleton cards
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8" data-testid="favorites-page-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-3" data-testid={`skeleton-card-${index}`}>
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
      <div className="min-h-screen bg-background py-8" data-testid="favorites-page-error">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-6">
              Impossible de charger vos favoris. Veuillez réessayer plus tard.
            </p>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!favorites || favorites.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8" data-testid="favorites-page-empty">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="favorites-title">
              Mes Favoris
            </h1>
            <p className="text-muted-foreground" data-testid="favorites-subtitle">
              Gérez votre collection de films préférés
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="text-8xl mb-6">💔</div>
            <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="empty-state-title">
              Aucun film favori
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto" data-testid="empty-state-description">
              Vous n'avez pas encore ajouté de films à vos favoris. 
              Explorez notre collection et cliquez sur le cœur pour ajouter vos films préférés !
            </p>
            <Link href="/">
              <Button className="gap-2" data-testid="button-go-home">
                <Home className="w-4 h-4" />
                Découvrir des films
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main favorites view
  return (
    <div className="min-h-screen bg-background py-8" data-testid="favorites-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-primary fill-current" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="favorites-title">
              Mes Favoris
            </h1>
          </div>
          <p className="text-muted-foreground" data-testid="favorites-subtitle">
            {favorites.length} {favorites.length === 1 ? "film favori" : "films favoris"}
          </p>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="favorites-grid">
          {favorites.map((favorite) => (
            <FavoriteMovieCard
              key={favorite.id}
              favorite={favorite}
              onRemove={handleRemoveFavorite}
              isRemoving={removeFavoriteMutation.isPending}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

interface FavoriteMovieCardProps {
  favorite: any;
  onRemove: (movieId: number, movieTitle: string) => void;
  isRemoving: boolean;
}

function FavoriteMovieCard({ favorite, onRemove, isRemoving }: FavoriteMovieCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(favorite.movieId, favorite.movieTitle);
  };

  return (
    <div className="group cursor-pointer relative" data-testid={`favorite-movie-${favorite.movieId}`}>
      <Link href={`/movie/${favorite.movieId}`}>
        <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-colors duration-300">
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={imageError ? "/placeholder-movie.jpg" : tmdbService.getPosterUrl(favorite.moviePoster)}
              alt={favorite.movieTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              data-testid={`favorite-poster-${favorite.movieId}`}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
            
            {/* Remove button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="icon"
                variant="destructive"
                onClick={handleRemoveClick}
                disabled={isRemoving}
                className="w-8 h-8 rounded-full"
                data-testid={`button-remove-${favorite.movieId}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-3" data-testid={`favorite-info-${favorite.movieId}`}>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 text-sm" data-testid={`favorite-title-${favorite.movieId}`}>
              {favorite.movieTitle}
            </h3>
            {favorite.movieGenres && favorite.movieGenres.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`favorite-genres-${favorite.movieId}`}>
                {favorite.movieGenres.slice(0, 2).join(", ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1" data-testid={`favorite-added-date-${favorite.movieId}`}>
              Ajouté le {new Date(favorite.addedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}