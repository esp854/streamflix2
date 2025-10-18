import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import MovieRow from "@/components/movie-row";
import TVRow from "@/components/tv-row";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Add interface for local content
interface LocalContent {
  id: string;
  tmdbId: number;
  title: string;
  name?: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: 'movie' | 'tv';
  odyseeUrl?: string;
  active: boolean;
}

export default function Universe() {
  const { id } = useParams();

  // Configuration des univers
  const universes = {
    netflix: {
      name: "Netflix",
      color: "bg-red-600",
      movieGenres: [99], // Documentaires
      tvGenres: [99] // Documentaires
    },
    disney: {
      name: "Disney+",
      color: "bg-blue-600",
      movieGenres: [16, 10751], // Animation, Famille
      tvGenres: [16, 10751] // Animation, Famille
    },
    prime: {
      name: "Prime Video",
      color: "bg-blue-400",
      movieGenres: [28, 12], // Action, Aventure
      tvGenres: [28, 12] // Action, Aventure
    },
    paramount: {
      name: "Paramount+",
      color: "bg-blue-800",
      movieGenres: [878, 53], // Science-fiction, Thriller
      tvGenres: [878, 53] // Science-fiction, Thriller
    },
    apple: {
      name: "Apple TV+",
      color: "bg-gray-800",
      movieGenres: [18, 10749], // Drame, Romance
      tvGenres: [18, 10749] // Drame, Romance
    },
    marvel: {
      name: "Marvel",
      color: "bg-red-700",
      movieGenres: [28, 12, 878], // Action, Aventure, Science-fiction
      tvGenres: [28, 12, 878] // Action, Aventure, Science-fiction
    },
    dc: {
      name: "DC",
      color: "bg-blue-900",
      movieGenres: [28, 12, 14], // Action, Aventure, Fantastique
      tvGenres: [28, 12, 14] // Action, Aventure, Fantastique
    }
  };

  const currentUniverse = universes[id as keyof typeof universes] || universes.netflix;

  // Fetch movies by genres
  const { data: genreMovies, isLoading: moviesLoading } = useQuery({
    queryKey: [`/api/tmdb/movie/universe/${id}/genres`, currentUniverse.movieGenres],
    queryFn: async () => {
      const allMovies: any[] = [];
      for (const genreId of currentUniverse.movieGenres) {
        try {
          const movies = await tmdbService.getMoviesByGenre(genreId);
          allMovies.push(...movies.slice(0, 10)); // Prendre 10 films par genre
        } catch (error) {
          console.error(`Error fetching movies for genre ${genreId}:`, error);
        }
      }
      // Supprimer les doublons
      const uniqueMovies = Array.from(new Map(allMovies.map(item => [item.id, item])).values());
      return uniqueMovies.slice(0, 20); // Limiter à 20 films
    },
  });

  // Fetch TV shows by genres
  const { data: genreTVShows, isLoading: tvShowsLoading } = useQuery({
    queryKey: [`/api/tmdb/tv/universe/${id}/genres`, currentUniverse.tvGenres],
    queryFn: async () => {
      const allTVShows: any[] = [];
      for (const genreId of currentUniverse.tvGenres) {
        try {
          const tvShows = await tmdbService.getTVShowsByGenre(genreId);
          allTVShows.push(...tvShows.slice(0, 10)); // Prendre 10 séries par genre
        } catch (error) {
          console.error(`Error fetching TV shows for genre ${genreId}:`, error);
        }
      }
      // Supprimer les doublons
      const uniqueTVShows = Array.from(new Map(allTVShows.map(item => [item.id, item])).values());
      return uniqueTVShows.slice(0, 20); // Limiter à 20 séries
    },
  });

  // Fetch local content
  const { data: localContent, isLoading: localContentLoading } = useQuery({
    queryKey: ["local-all-content-universe", id],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/content");
        if (!response.ok) return [];
        const data = await response.json();
        // Filter content by universe (this is a simplified approach)
        return data.filter((item: LocalContent) => {
          // Pour cet exemple, nous retournons tout le contenu local
          // Dans une implémentation réelle, vous auriez une logique plus complexe
          return item.mediaType === 'movie' || item.mediaType === 'tv';
        });
      } catch (error) {
        console.error("Error fetching local content:", error);
        return [];
      }
    },
  });

  // Combine TMDB content with local content
  const allMovies = genreMovies 
    ? [...(localContent?.filter((item: LocalContent) => item.mediaType === 'movie') || []), ...genreMovies].slice(0, 20) 
    : genreMovies;

  const allTVShows = genreTVShows 
    ? [...(localContent?.filter((item: LocalContent) => item.mediaType === 'tv') || []), ...genreTVShows].slice(0, 20) 
    : genreTVShows;

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <div className={`relative h-64 md:h-80 overflow-hidden ${currentUniverse.color}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <Button variant="secondary" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-4xl md:text-6xl font-bold text-white">{currentUniverse.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Films de l'univers */}
        <MovieRow
          title={`Films ${currentUniverse.name}`}
          movies={allMovies || []}
          isLoading={moviesLoading || localContentLoading}
        />

        {/* Séries de l'univers */}
        <TVRow
          title={`Séries ${currentUniverse.name}`}
          series={allTVShows || []}
          isLoading={tvShowsLoading || localContentLoading}
        />
      </div>
    </div>
  );
}