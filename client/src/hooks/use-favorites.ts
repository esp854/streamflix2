import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { queryClient } from "@/lib/queryClient";
import type { TMDBMovie, TMDBTVSeries } from "@/types/movie";

interface FavoriteData {
  userId: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string | null;
  movieGenres?: string[];
  movieYear?: number;
  addedAt: string;
}

export function useFavorites() {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const userId = isAuthenticated && user?.id ? user.id : null;

  // Check if a movie/series is favorite
  const checkFavorite = (contentId: number) => {
    return useQuery({
      queryKey: ["/api/favorites/check", userId, contentId],
      queryFn: async () => {
        if (!userId || !isAuthenticated) return { isFavorite: false };
        const response = await fetch(`/api/favorites/${userId}/${contentId}`, {
          credentials: 'include',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) return { isFavorite: false };
        return response.json() as Promise<{ isFavorite: boolean }>;
      },
      enabled: !!userId && isAuthenticated,
    });
  };

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (data: { content: TMDBMovie | TMDBTVSeries; type: 'movie' | 'tv' }) => {
      if (!userId || !isAuthenticated) throw new Error("User not authenticated");
      
      const isMovie = data.type === 'movie';
      const favoriteData: FavoriteData = {
        userId,
        movieId: data.content.id,
        movieTitle: isMovie ? (data.content as TMDBMovie).title : (data.content as TMDBTVSeries).name,
        moviePoster: data.content.poster_path,
        movieGenres: data.content.genre_ids?.map(id => 
          isMovie ? `Genre ${id}` : `TV Genre ${id}`
        ).slice(0, 3),
        movieYear: isMovie 
          ? new Date((data.content as TMDBMovie).release_date).getFullYear()
          : (data.content as TMDBTVSeries).first_air_date ? new Date((data.content as TMDBTVSeries).first_air_date).getFullYear() : undefined,
        addedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(favoriteData),
      });

      if (!response.ok) {
        throw new Error("Failed to add to favorites");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/check", userId, variables.content.id] });
      
      const isMovie = variables.type === 'movie';
      const title = isMovie ? (variables.content as TMDBMovie).title : (variables.content as TMDBTVSeries).name;
      
      toast({
        title: "Ajouté aux favoris",
        description: `${title} a été ajouté à vos favoris.`,
      });
    },
    onError: (error) => {
      console.error("Error adding to favorites:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter aux favoris.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (contentId: number) => {
      if (!userId || !isAuthenticated) throw new Error("User not authenticated");
      
      const response = await fetch(`/api/favorites/${userId}/${contentId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove from favorites");
      }

      return response.json();
    },
    onSuccess: (_, contentId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/check", userId, contentId] });
      
      toast({
        title: "Retiré des favoris",
        description: "Le contenu a été retiré de vos favoris.",
      });
    },
    onError: (error) => {
      console.error("Error removing from favorites:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer des favoris.",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite function
  const toggleFavorite = async (content: TMDBMovie | TMDBTVSeries, type: 'movie' | 'tv') => {
    if (!userId || !isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check current status
      const response = await fetch(`/api/favorites/${userId}/${content.id}`, {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const { isFavorite } = await response.json();

      if (isFavorite) {
        removeFromFavoritesMutation.mutate(content.id);
      } else {
        addToFavoritesMutation.mutate({ content, type });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris.",
        variant: "destructive",
      });
    }
  };

  return {
    checkFavorite,
    toggleFavorite,
    addToFavorites: addToFavoritesMutation.mutate,
    removeFromFavorites: removeFromFavoritesMutation.mutate,
    isAddingToFavorites: addToFavoritesMutation.isPending,
    isRemovingFromFavorites: removeFromFavoritesMutation.isPending,
  };
}