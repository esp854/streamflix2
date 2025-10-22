import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { TMDBMovie } from "@/types/movie";

export interface WatchHistoryItem {
  id: string;
  userId: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  watchedAt: string;
  watchDuration?: number;
}

export interface WatchProgressItem {
  id: string;
  userId: string;
  contentId?: string;
  episodeId?: string;
  movieId?: number;
  currentTime: number;
  duration?: number;
  completed: boolean;
  lastWatchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export function useWatchHistory() {
  const { user, token, isAuthenticated } = useAuth();
  const userId = isAuthenticated && user?.id ? user.id : null;

  // Get watch history (completed items)
  const { data: watchHistory, isLoading: isHistoryLoading, error: historyError } = useQuery({
    queryKey: ["/api/watch-history", userId],
    queryFn: async () => {
      if (!userId || !isAuthenticated) return [];
      const response = await fetch(`/api/watch-history/${userId}`, {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch watch history");
      return response.json() as Promise<WatchHistoryItem[]>;
    },
    enabled: !!userId && isAuthenticated,
  });

  // Get watch progress (recently watched items)
  const { data: watchProgress, isLoading: isProgressLoading, error: progressError } = useQuery({
    queryKey: ["/api/watch-progress", userId],
    queryFn: async () => {
      if (!userId || !isAuthenticated) return [];
      const response = await fetch(`/api/watch-progress/${userId}`, {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch watch progress");
      return response.json() as Promise<WatchProgressItem[]>;
    },
    enabled: !!userId && isAuthenticated,
  });

  // Convert watch history items to TMDBMovie objects
  const watchHistoryItems: TMDBMovie[] = (watchHistory || []).map(item => ({
    id: item.movieId,
    title: item.movieTitle,
    poster_path: item.moviePoster || "/placeholder-movie.jpg",
    release_date: item.watchedAt,
    overview: "",
    original_title: item.movieTitle,
    backdrop_path: "",
    genre_ids: [],
    vote_average: 0,
    popularity: 0,
    original_language: "fr",
    vote_count: 0,
    adult: false,
    video: false,
  }));

  // Convert watch progress items to TMDBMovie objects
  const watchProgressItems: TMDBMovie[] = (watchProgress || []).map(item => ({
    id: item.movieId || 0,
    title: item.movieId ? `Film ${item.movieId}` : `Contenu ${item.contentId || item.episodeId}`,
    poster_path: "/placeholder-movie.jpg",
    release_date: item.lastWatchedAt,
    overview: "",
    original_title: item.movieId ? `Film ${item.movieId}` : `Contenu ${item.contentId || item.episodeId}`,
    backdrop_path: "",
    genre_ids: [],
    vote_average: 0,
    popularity: 0,
    original_language: "fr",
    vote_count: 0,
    adult: false,
    video: false,
  }));

  // Get recently watched items (combine history and progress)
  const recentlyWatched: TMDBMovie[] = [...watchHistoryItems, ...watchProgressItems]
    .sort((a, b) => {
      const dateA = new Date(a.release_date || "");
      const dateB = new Date(b.release_date || "");
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 20); // Limit to 20 most recent items

  return {
    watchHistory,
    watchProgress,
    recentlyWatched,
    isLoading: isHistoryLoading || isProgressLoading,
    isError: historyError || progressError,
  };
}