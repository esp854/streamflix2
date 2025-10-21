import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Film, Tv, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/movie-card";
import TVCard from "@/components/tv-card";
import { tmdbService } from "@/lib/tmdb";
import { useAuthCheck } from "@/hooks/useAuthCheck";

// Type pour les résultats combinés
type SearchResult = {
  type: 'movie' | 'tv';
  data: any;
};

export default function Search() {
  const { shouldShowAds } = useAuthCheck();
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = urlParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reduce retry attempts and cache time for mobile performance
  const queryOptions = {
    retry: 1,
    gcTime: 5 * 60 * 1000, // 5 minutes
  };

  const { data: movieSearchResults, isLoading: moviesLoading, error: moviesError } = useQuery({
    queryKey: [`/api/tmdb/search`, debouncedQuery],
    queryFn: () => tmdbService.searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    ...queryOptions,
  });

  const { data: tvSearchResults, isLoading: tvLoading, error: tvError } = useQuery({
    queryKey: [`/api/tmdb/tv/search`, debouncedQuery],
    queryFn: () => {
      console.log(`[DEBUG] Calling searchTVShows with query: ${debouncedQuery}`);
      const result = tmdbService.searchTVShows(debouncedQuery);
      console.log(`[DEBUG] searchTVShows returned:`, result);
      return result;
    },
    enabled: debouncedQuery.length > 0,
    ...queryOptions,
  });

  // Combiner les résultats de films et de séries
  const combinedResults: SearchResult[] = [];
  
  if (movieSearchResults && movieSearchResults.length > 0) {
    movieSearchResults.forEach((movie: any) => {
      combinedResults.push({ type: 'movie', data: movie });
    });
  }
  
  if (tvSearchResults && tvSearchResults.length > 0) {
    tvSearchResults.forEach((tv: any) => {
      combinedResults.push({ type: 'tv', data: tv });
    });
  }

  // Trier les résultats combinés par popularité (vote_count)
  combinedResults.sort((a, b) => {
    const popularityA = a.data.vote_count || 0;
    const popularityB = b.data.vote_count || 0;
    return popularityB - popularityA;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className="min-h-screen bg-background py-8" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  
        
        {/* Search Header */}
        <div className="mb-8" ref={searchRef}>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6" data-testid="search-title">
            Rechercher des films et séries
          </h1>
          
          <form onSubmit={handleSearch} className="relative max-w-xl" data-testid="search-form">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher des films et séries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-3 text-lg"
              data-testid="search-input"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={clearSearch}
                data-testid="clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>

        {/* Search Results */}
        {(moviesLoading || tvLoading) && debouncedQuery && (
          <div className="text-center py-12" data-testid="search-loading">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Recherche en cours...</p>
          </div>
        )}

        {/* Error handling */}
        {(moviesError || tvError) && debouncedQuery && (
          <div className="text-center py-12" data-testid="search-error">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Erreur de recherche</h3>
            <p className="text-muted-foreground mb-4">
              Une erreur s'est produite lors de la recherche. Veuillez réessayer.
            </p>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Réessayer
            </Button>
          </div>
        )}

        {!moviesLoading && !tvLoading && debouncedQuery && combinedResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6" data-testid="search-results-grid">
            {combinedResults.map((result, index) => (
              result.type === 'movie' ? (
                <MovieCard key={`movie-${result.data.id}`} movie={result.data} size="small" showOverlay={window.innerWidth > 768} />
              ) : (
                <TVCard key={`tv-${result.data.id}`} series={result.data} size="small" showOverlay={window.innerWidth > 768} />
              )
            ))}
          </div>
        )}

        {!moviesLoading && !tvLoading && debouncedQuery && combinedResults.length === 0 && (
          <div className="text-center py-12" data-testid="search-no-results">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground">
              Essayez avec d'autres mots-clés ou vérifiez l'orthographe.
            </p>
          </div>
        )}

        {!debouncedQuery && (
          <div className="text-center py-12" data-testid="search-empty-state">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Découvrez des films et séries</h3>
            <p className="text-muted-foreground">
              Utilisez la barre de recherche pour trouver vos contenus préférés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}