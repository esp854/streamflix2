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

  // Configuration des univers avec logos
  const universes = {
    netflix: {
      name: "Netflix",
      logo: "/logos/netflix.jpeg",
      color: "bg-red-600",
      movieGenres: [99], // Documentaires
      tvGenres: [99] // Documentaires
    },
    disney: {
      name: "Disney+",
      logo: "/logos/disney.jpeg",
      color: "bg-blue-600",
      movieGenres: [16, 10751], // Animation, Famille
      tvGenres: [16, 10751] // Animation, Famille
    },
    prime: {
      name: "Prime Video",
      logo: "/logos/prime.jpeg",
      color: "bg-blue-400",
      movieGenres: [28, 12], // Action, Aventure
      tvGenres: [28, 12] // Action, Aventure
    },
    paramount: {
      name: "Paramount+",
      logo: "/logos/paramount.jpeg",
      color: "bg-blue-800",
      movieGenres: [878, 53], // Science-fiction, Thriller
      tvGenres: [878, 53] // Science-fiction, Thriller
    },
    apple: {
      name: "Apple TV+",
      logo: "/logos/apple.jpeg",
      color: "bg-gray-800",
      movieGenres: [18, 10749], // Drame, Romance
      tvGenres: [18, 10749] // Drame, Romance
    },
    marvel: {
      name: "Marvel",
      logo: "/logos/marvel.jpeg",
      color: "bg-red-700",
      movieGenres: [28, 12, 878], // Action, Aventure, Science-fiction
      tvGenres: [28, 12, 878] // Action, Aventure, Science-fiction
    },
    dc: {
      name: "DC",
      logo: "/logos/dc.jpeg",
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
        // Filter content by universe based on title keywords
        return data.filter((item: LocalContent) => {
          if (!item.title) return false;
          
          const title = item.title.toLowerCase();
          
          // Association du contenu aux univers basée sur les mots-clés dans le titre
          switch (id) {
            case 'netflix':
              return title.includes('netflix') || 
                     title.includes('the witcher') || 
                     title.includes('stranger things') || 
                     title.includes('ozark') || 
                     title.includes('money heist') || 
                     title.includes('la casa de papel') || 
                     title.includes('dark') || 
                     title.includes('narcos');
            case 'disney':
              return title.includes('disney') || 
                     title.includes('marvel') || 
                     title.includes('star wars') || 
                     title.includes('avengers') || 
                     title.includes('iron man') || 
                     title.includes('captain america') || 
                     title.includes('thor') || 
                     title.includes('black panther') || 
                     title.includes('guardians of the galaxy') || 
                     title.includes('mandalorian') || 
                     title.includes('baby yoda') || 
                     title.includes('the lion king') || 
                     title.includes('frozen') || 
                     title.includes('moana');
            case 'prime':
              return title.includes('prime') || 
                     title.includes('amazon') || 
                     title.includes('lord of the rings') || 
                     title.includes('the rings of power') || 
                     title.includes('jack ryan') || 
                     title.includes('the boys') || 
                     title.includes('invincible');
            case 'paramount':
              return title.includes('paramount') || 
                     title.includes('mission impossible') || 
                     title.includes('transformers') || 
                     title.includes('star trek') || 
                     title.includes('south park');
            case 'apple':
              return title.includes('apple tv') || 
                     title.includes('ted lasso') || 
                     title.includes('severance') || 
                     title.includes('the morning show') || 
                     title.includes('see');
            case 'marvel':
              return title.includes('marvel') || 
                     title.includes('avengers') || 
                     title.includes('x-men') || 
                     title.includes('spider-man') || 
                     title.includes('deadpool') || 
                     title.includes('fantastic four') || 
                     title.includes('black widow') || 
                     title.includes('doctor strange') || 
                     title.includes('hulk') || 
                     title.includes('ant-man') || 
                     title.includes('wolverine');
            case 'dc':
              return title.includes('dc') || 
                     title.includes('batman') || 
                     title.includes('superman') || 
                     title.includes('wonder woman') || 
                     title.includes('flash') || 
                     title.includes('green lantern') || 
                     title.includes('aquaman') || 
                     title.includes('justice league') || 
                     title.includes('arrow') || 
                     title.includes('supergirl');
            default:
              return false;
          }
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
              <div className="flex items-center space-x-4">
                {/* Afficher le logo de l'univers s'il existe, sinon le nom */}
                {currentUniverse.logo ? (
                  <img 
                    src={currentUniverse.logo} 
                    alt={currentUniverse.name} 
                    className="h-16 md:h-24 w-auto object-contain filter brightness-0 invert"
                    onError={(e) => {
                      // Si le logo n'existe pas, afficher le nom
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextSibling && target.nextSibling instanceof HTMLElement) {
                        target.nextSibling.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                {/* Fallback pour afficher le nom si le logo n'existe pas */}
                <h1 className={`text-4xl md:text-6xl font-bold text-white ${currentUniverse.logo ? 'hidden' : ''}`}>
                  {currentUniverse.name}
                </h1>
              </div>
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