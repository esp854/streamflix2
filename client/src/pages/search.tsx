import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Film, Tv, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MovieCard from "@/components/movie-card";
import TVCard from "@/components/tv-card";
import { tmdbService } from "@/lib/tmdb";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useAuth } from "@/contexts/auth-context";

// Type pour les résultats combinés
type SearchResult = {
  type: 'movie' | 'tv';
  data: any;
};

export default function Search() {
  const { token } = useAuth();
  const { shouldShowAds } = useAuthCheck();
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = urlParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<{movies: any[], tvShows: any[]}>({movies: [], tvShows: []});
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fonction pour obtenir le jeton CSRF
  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return null;
    }
  };

  // Effect pour effectuer la recherche quand le query change
  useEffect(() => {
    if (debouncedQuery) {
      handleSearchContent();
    } else {
      setSearchResults({movies: [], tvShows: []});
    }
  }, [debouncedQuery]);

  // Fonction de recherche utilisant le même endpoint que l'admin
  const handleSearchContent = async () => {
    if (!debouncedQuery.trim()) return;
    
    setIsSearching(true);
    try {
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken();
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/admin/search-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ query: debouncedQuery }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setSearchResults({
        movies: result.movies || [],
        tvShows: result.tvShows || []
      });
    } catch (error: any) {
      console.error("Erreur de recherche:", error);
    } finally {
      setIsSearching(false);
    }
  };

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

  // Combiner les résultats de films et de séries
  const combinedResults: SearchResult[] = [];
  
  if (searchResults.movies && searchResults.movies.length > 0) {
    searchResults.movies.forEach((movie: any) => {
      combinedResults.push({ type: 'movie', data: movie });
    });
  }
  
  if (searchResults.tvShows && searchResults.tvShows.length > 0) {
    searchResults.tvShows.forEach((tv: any) => {
      combinedResults.push({ type: 'tv', data: tv });
    });
  }

  // Trier les résultats combinés par popularité (vote_count)
  combinedResults.sort((a, b) => {
    const popularityA = a.data.vote_count || 0;
    const popularityB = b.data.vote_count || 0;
    return popularityB - popularityA;
  });

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
        {isSearching && debouncedQuery && (
          <div className="text-center py-12" data-testid="search-loading">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Recherche en cours...</p>
          </div>
        )}

        {/* Combined Results Grid (similar to admin) */}
        {!isSearching && debouncedQuery && combinedResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combinedResults.map((result) => (
              <Card key={`${result.type}-${result.data.id}`} className="overflow-hidden">
                <div className="relative">
                  {result.data.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${result.data.poster_path}`} 
                      alt={result.type === 'movie' ? result.data.title : result.data.name}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted rounded flex items-center justify-center">
                      {result.type === 'movie' ? (
                        <Film className="h-12 w-12 text-muted-foreground" />
                      ) : (
                        <Tv className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1 text-lg mb-2">
                    {result.type === 'movie' ? result.data.title : result.data.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {result.type === 'movie' 
                      ? (result.data.release_date ? new Date(result.data.release_date).getFullYear() : 'N/A') 
                      : (result.data.first_air_date ? new Date(result.data.first_air_date).getFullYear() : 'N/A')}
                    {' • '}
                    {result.type === 'movie' ? 'Film' : 'Série TV'}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">
                      {result.data.vote_average?.toFixed(1) || 'N/A'} ★
                    </Badge>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state for no results */}
        {!isSearching && debouncedQuery && combinedResults.length === 0 && (
          <div className="text-center py-12" data-testid="search-no-results">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground">
              Essayez avec d'autres mots-clés ou vérifiez l'orthographe.
            </p>
          </div>
        )}

        {/* Initial empty state */}
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