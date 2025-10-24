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
import { Helmet } from "react-helmet";
import { SEO_CONFIG } from "@/lib/seo-config";

// Type pour les résultats combinés
type SearchResult = {
  type: 'movie' | 'tv';
  data: any;
};

// Fonction de debounce personnalisée
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [contentType, setContentType] = useState<"all" | "movie" | "tv">("all");
  const debouncedQuery = useDebounce(query, 300);
  const { shouldShowAds } = useAuthCheck();
  const [isDesktop, setIsDesktop] = useState(false);

  // Balisage JSON-LD pour la fonction de recherche
  const searchData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://streamflix2-o7vx.onrender.com/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://streamflix2-o7vx.onrender.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const { data: movies, isLoading: moviesLoading, isError: moviesError } = useQuery({
    queryKey: [`/api/tmdb/search`, debouncedQuery],
    queryFn: () => tmdbService.searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    retry: 1,
    gcTime: 0, // désactive le cache pendant les tests
  });

  const { data: tv, isLoading: tvLoading, isError: tvError } = useQuery({
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
    retry: 1,
    gcTime: 0, // désactive le cache pendant les tests
  });

  // Utilisation de useMemo pour optimiser les résultats combinés
  const combinedResults = useMemo(() => {
    const results: SearchResult[] = [];

    if (movies?.length) {
      results.push(...movies.map((movie: any) => ({ type: "movie" as const, data: movie })));
    }

    if (tv?.length) {
      results.push(...tv.map((tv: any) => ({ type: "tv" as const, data: tv })));
    }

    return results.sort((a, b) => (b.data.vote_count || 0) - (a.data.vote_count || 0));
  }, [movies, tv]);

  // Log de débogage pour diagnostiquer les problèmes de recherche
  console.log("🎬 Debug TMDB:", {
    debouncedQuery,
    movies,
    tv,
    combinedResults,
  });

  // Détection du desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      setLocation(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background py-8" data-testid="search-page">
      <Helmet>
        <title>{SEO_CONFIG.search.title}</title>
        <meta name="description" content={SEO_CONFIG.search.description} />
        <link rel="canonical" href={SEO_CONFIG.search.canonical} />
        <meta property="og:title" content={SEO_CONFIG.search.og.title} />
        <meta property="og:description" content={SEO_CONFIG.search.og.description} />
        <meta property="og:type" content={SEO_CONFIG.search.og.type} />
        <meta property="og:image" content={SEO_CONFIG.search.og.image} />
        <meta property="og:url" content={SEO_CONFIG.search.canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO_CONFIG.search.og.title} />
        <meta name="twitter:description" content={SEO_CONFIG.search.og.description} />
        <meta name="twitter:image" content={SEO_CONFIG.search.og.image} />
      </Helmet>
      <script type="application/ld+json">
        {JSON.stringify(searchData)}
      </script>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 py-3 text-lg"
              data-testid="search-input"
              aria-label="Recherche de films et séries"
            />
            {query && (
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
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground">
              Aucun film ou série ne correspond à votre recherche "{debouncedQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}