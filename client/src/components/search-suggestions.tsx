import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Film, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/lib/tmdb";
import { useLocation, useSearch } from "wouter";

interface SearchSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export default function SearchSuggestions({ isOpen, onClose, onSearch }: SearchSuggestionsProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus l'input quand le composant s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fermer quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Requête pour les suggestions de recherche
  const { data: suggestions, isLoading } = useQuery({
    queryKey: [`/api/tmdb/multi-search`, query],
    queryFn: () => tmdbService.multiSearch(query),
    enabled: query.length > 2 && isOpen,
    retry: 1,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      onClose();
    }
  };

  const handleSuggestionClick = (item: any) => {
    const title = item.title || item.name;
    if (title) {
      onSearch(title);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50"
      data-testid="search-suggestions"
    >
      <form onSubmit={handleSubmit} className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Rechercher des films et séries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
            data-testid="search-suggestions-input"
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {query.length > 2 && (
        <div className="border-t border-border max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              Recherche en cours...
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.slice(0, 8).map((item: any) => (
                <div
                  key={item.id}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center space-x-3"
                  onClick={() => handleSuggestionClick(item)}
                  data-testid={`suggestion-${item.id}`}
                >
                  <div className="flex-shrink-0">
                    {item.poster_path ? (
                      <img
                        src={tmdbService.getPosterUrl(item.poster_path)}
                        alt={item.title || item.name}
                        className="w-10 h-14 object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                        {item.media_type === 'movie' ? (
                          <Film className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Tv className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.title || item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.media_type === 'movie' ? 'Film' : 'Série'} • {item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length > 2 ? (
            <div className="py-4 text-center text-muted-foreground">
              Aucun résultat trouvé
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}