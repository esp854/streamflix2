import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Film, Tv, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tmdbService } from "@/lib/tmdb";
import MovieCard from "@/components/movie-card";
import TVCard from "@/components/tv-card";
import AdvertisementBanner from "@/components/AdvertisementBanner";
import { useAuthCheck } from "@/hooks/useAuthCheck";

export default function Search() {
  const { shouldShowAds } = useAuthCheck();
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = urlParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery) {
        setShowSuggestions(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: [`/api/tmdb/search`, debouncedQuery],
    queryFn: () => tmdbService.searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const { data: tvSearchResults, isLoading: tvLoading } = useQuery({
    queryKey: [`/api/tmdb/tv/search`, debouncedQuery],
    queryFn: () => tmdbService.searchTVShows(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  // Get search suggestions
  const { data: suggestions } = useQuery({
    queryKey: [`/api/tmdb/multi-search`, debouncedQuery],
    queryFn: () => tmdbService.multiSearch(debouncedQuery),
    enabled: debouncedQuery.length > 2 && showSuggestions,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    setSearchQuery(item.title || item.name);
    setShowSuggestions(false);
    setLocation(`/search?q=${encodeURIComponent(item.title || item.name)}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-background py-8" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {shouldShowAds && <AdvertisementBanner />}
        
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
              onFocus={() => searchQuery && setShowSuggestions(true)}
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
            
            {/* Search Suggestions */}
            {showSuggestions && debouncedQuery.length > 2 && suggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto" data-testid="search-suggestions">
                <div className="py-1">
                  {suggestions.slice(0, 8).map((item: any) => (
                    <div
                      key={item.id}
                      className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center space-x-3"
                      onClick={() => handleSuggestionClick(item)}
                      data-testid={`suggestion-${item.id}`}
                    >
                      <div className="flex-shrink-0">
                        {item.poster_path ? (
                          <img
                            src={tmdbService.getPosterUrl(item.poster_path)}
                            alt={item.title || item.name}
                            className="w-8 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                            {item.media_type === 'movie' ? (
                              <Film className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Tv className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title || item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.media_type === 'movie' ? 'Film' : 'Série'} • {new Date(item.release_date || item.first_air_date).getFullYear()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Search Results */}
        {(isLoading || tvLoading) && debouncedQuery && (
          <div className="text-center py-12" data-testid="search-loading">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Recherche en cours...</p>
          </div>
        )}

        {!isLoading && !tvLoading && debouncedQuery && (searchResults || tvSearchResults) && (
          <Tabs defaultValue="movies" className="w-full" data-testid="search-results">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="movies" className="flex items-center space-x-2">
                <Film className="h-4 w-4" />
                <span>Films ({searchResults?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="tv" className="flex items-center space-x-2">
                <Tv className="h-4 w-4" />
                <span>Séries ({tvSearchResults?.length || 0})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movies">
              {searchResults && searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" data-testid="search-results-grid">
                  {searchResults.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} size="small" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="search-no-results">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Aucun film trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez avec d'autres mots-clés ou vérifiez l'orthographe.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tv">
              {tvSearchResults && tvSearchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" data-testid="search-tv-results-grid">
                  {tvSearchResults.map((series) => (
                    <TVCard key={series.id} series={series} size="small" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="search-tv-no-results">
                  <div className="text-6xl mb-4">📺</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Aucune série trouvée</h3>
                  <p className="text-muted-foreground">
                    Essayez avec d'autres mots-clés ou vérifiez l'orthographe.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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