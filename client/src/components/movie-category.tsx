import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import { TMDBMovie } from "@/types/movie";
import MovieCard from "@/components/movie-card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface MovieCategoryProps {
  title: string;
  movies: TMDBMovie[];
  isLoading: boolean;
  isError: boolean;
  viewAllHref: string;
}

export function MovieCategory({ title, movies, isLoading, isError, viewAllHref }: MovieCategoryProps) {
  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewAllHref}>
              Tout voir
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href={viewAllHref}>
            Tout voir
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.slice(0, 6).map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}