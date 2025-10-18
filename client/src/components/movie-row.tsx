import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TMDBMovie } from "@/types/movie";
import MovieCard from "./movie-card";

// Add interface for local content
interface LocalContent {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  mediaType: 'movie';
  odyseeUrl?: string;
  active: boolean;
  voteAverage?: number;
  genreIds?: number[];
}

// Create a type that combines both interfaces
type MovieType = TMDBMovie | LocalContent;

interface MovieRowProps {
  title: string;
  movies: MovieType[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function MovieRow({ title, movies, isLoading }: MovieRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Gestionnaire d'événement wheel avec { passive: false }
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollBy({
          left: e.deltaY,
        });
      }
    };

    // Ajouter l'écouteur avec { passive: false }
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8" data-testid="movie-row-loading">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground">{title}</h2>
        <div className="flex space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48 md:w-56">
              <div className="bg-muted rounded-md h-72 md:h-80 animate-pulse"></div>
              <div className="mt-3 space-y-2">
                <div className="bg-muted h-4 rounded animate-pulse"></div>
                <div className="bg-muted h-3 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative group" data-testid="movie-row">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground" data-testid="movie-row-title">{title}</h2>
      
      <div className="relative">
        {/* Left scroll button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          data-testid="scroll-left-button"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {/* Right scroll button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          data-testid="scroll-right-button"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* Movie container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide pb-4"
          data-testid="movie-container"
        >
          {movies.map((movie) => (
            <MovieCard key={'tmdbId' in movie ? movie.tmdbId.toString() : movie.id} movie={movie as TMDBMovie} />
          ))}
        </div>
      </div>
    </section>
  );
}