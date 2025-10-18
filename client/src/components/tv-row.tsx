import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TMDBTVSeries } from "@/types/movie";
import TVCard from "./tv-card";

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
  mediaType: 'tv';
  odyseeUrl?: string;
  active: boolean;
}

// Create a type that combines both interfaces
type TVSeriesType = TMDBTVSeries | LocalContent;

interface TVRowProps {
  title: string;
  series: TVSeriesType[];
  isLoading?: boolean;
}

export default function TVRow({ title, series, isLoading }: TVRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      <section className="py-8 px-4 sm:px-6 lg:px-8" data-testid="tv-row-loading">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{title}</h2>
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

  if (!series.length) {
    return (
      <section className="py-8 px-4 sm:px-6 lg:px-8" data-testid="tv-row-empty">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{title}</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucune série disponible</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 relative group" data-testid="tv-row">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground" data-testid="tv-row-title">{title}</h2>
      
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

        {/* TV Series container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          data-testid="tv-container"
        >
          {series.map((show) => (
            <TVCard key={'tmdbId' in show ? show.tmdbId : show.id} series={show} />
          ))}
        </div>
      </div>
    </section>
  );
}