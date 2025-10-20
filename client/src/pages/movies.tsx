import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import MovieRow from "@/components/movie-row";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function MoviesPage() {
  // Fetch popular movies
  const { data: popularMovies, isLoading: popularLoading, isError: popularError } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () => tmdbService.getPopular(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch now playing movies
  const { data: nowPlayingMovies, isLoading: nowPlayingLoading, isError: nowPlayingError } = useQuery({
    queryKey: ['now-playing-movies'],
    queryFn: () => tmdbService.getNowPlayingMovies(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch upcoming movies
  const { data: upcomingMovies, isLoading: upcomingLoading, isError: upcomingError } = useQuery({
    queryKey: ['upcoming-movies'],
    queryFn: () => tmdbService.getUpcomingMovies(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch top rated movies
  const { data: topRatedMovies, isLoading: topRatedLoading, isError: topRatedError } = useQuery({
    queryKey: ['top-rated-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(0).then(() => tmdbService.getPopular()), // Using popular as fallback
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Action movies (genre 28)
  const { data: actionMovies, isLoading: actionLoading, isError: actionError } = useQuery({
    queryKey: ['action-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(28),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Comedy movies (genre 35)
  const { data: comedyMovies, isLoading: comedyLoading, isError: comedyError } = useQuery({
    queryKey: ['comedy-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(35),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Horror movies (genre 27)
  const { data: horrorMovies, isLoading: horrorLoading, isError: horrorError } = useQuery({
    queryKey: ['horror-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(27),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Animation movies (genre 16)
  const { data: animationMovies, isLoading: animationLoading, isError: animationError } = useQuery({
    queryKey: ['animation-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(16),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = popularLoading || nowPlayingLoading || upcomingLoading || topRatedLoading || 
                   actionLoading || comedyLoading || horrorLoading || animationLoading;

  const hasError = popularError || nowPlayingError || upcomingError || topRatedError || 
                   actionError || comedyError || horrorError || animationError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Films</h1>
          </div>
          
          <div className="space-y-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, cardIndex) => (
                    <div key={cardIndex} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-4">Impossible de charger les films. Veuillez réessayer plus tard.</p>
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Films</h1>
        </div>
        
        <div className="space-y-12">
          {popularMovies && popularMovies.length > 0 && (
            <MovieRow 
              title="Populaires" 
              movies={popularMovies} 
              isLoading={popularLoading}
            />
          )}
          
          {nowPlayingMovies && nowPlayingMovies.length > 0 && (
            <MovieRow 
              title="En Salle" 
              movies={nowPlayingMovies} 
              isLoading={nowPlayingLoading}
            />
          )}
          
          {upcomingMovies && upcomingMovies.length > 0 && (
            <MovieRow 
              title="À Venir" 
              movies={upcomingMovies} 
              isLoading={upcomingLoading}
            />
          )}
          
          {actionMovies && actionMovies.length > 0 && (
            <MovieRow 
              title="Action" 
              movies={actionMovies} 
              isLoading={actionLoading}
            />
          )}
          
          {comedyMovies && comedyMovies.length > 0 && (
            <MovieRow 
              title="Comédie" 
              movies={comedyMovies} 
              isLoading={comedyLoading}
            />
          )}
          
          {horrorMovies && horrorMovies.length > 0 && (
            <MovieRow 
              title="Horreur" 
              movies={horrorMovies} 
              isLoading={horrorLoading}
            />
          )}
          
          {animationMovies && animationMovies.length > 0 && (
            <MovieRow 
              title="Animation" 
              movies={animationMovies} 
              isLoading={animationLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}