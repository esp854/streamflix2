import { useState, useEffect, useRef, useMemo } from "react";
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
  
  // Utilisation sécurisée de useLocation
  const [path, query] = location.split("?");
  const urlParams = new URLSearchParams(query || "");
  const initialQuery = urlParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Détection du desktop pour les overlays
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    // Vérifier si on est côté client avant d'accéder à window
    if (typeof window !== 'undefined') {
      setIsDesktop(window.innerWidth > 768);
      
      // Ajouter un event listener pour gérer le redimensionnement
      const handleResize = () => {
        setIsDesktop(window.innerWidth > 768);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

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
    gcTime: 0, // désactive le cache pendant les tests
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
      // Logs de debug uniquement en développement
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log(`[DEBUG] Calling searchTVShows with query: ${debouncedQuery}`);
      }
      const result = tmdbService.searchTVShows(debouncedQuery);
      if (isDev) {
        console.log(`[DEBUG] searchTVShows returned:`, result);
      }
      return result;
    },
    enabled: debouncedQuery.length > 0,
    ...queryOptions,
  });

  // Utilisation de useMemo pour optimiser les résultats combinés
  const combinedResults = useMemo(() => {
    const results: SearchResult[] = [];

    if (movieSearchResults?.length) {
      results.push(...movieSearchResults.map((movie: any) => ({ type: "movie" as const, data: movie })));
    }

    if (tvSearchResults?.length) {
      results.push(...tvSearchResults.map((tv: any) => ({ type: "tv" as const, data: tv })));
    }

    return results.sort((a, b) => (b.data.vote_count || 0) - (a.data.vote_count || 0));
  }, [movieSearchResults, tvSearchResults]);

  // Log de débogage pour diagnostiquer les problèmes de recherche
  console.log("🎬 Debug TMDB:", {
    debouncedQuery,
    movieSearchResults,
    tvSearchResults,
    combinedResults,
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
              aria-label="Recherche de films et séries"
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
                <MovieCard key={`movie-${result.data.id}`} movie={result.data} size="small" showOverlay={isDesktop} />
              ) : (
                <TVCard key={`tv-${result.data.id}`} series={result.data} size="small" showOverlay={isDesktop} />
              )
            ))}
          </div>
        )}

        {!moviesLoading && !tvLoading && debouncedQuery && combinedResults.length === 0 && (
          <div className="text-center py-12" data-testid="search-no-results">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground animate-pulse">
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
        
        {/* Message pour les utilisateurs non premium */}
        {shouldShowAds && debouncedQuery && combinedResults.length > 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            🔔 Certaines fonctionnalités sont réservées aux abonnés Premium.
          </div>
        )}
      </div>
    </div>
  );
}
