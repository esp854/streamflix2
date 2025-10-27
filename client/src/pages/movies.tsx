import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import MovieRow from "@/components/movie-row";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { SEO_CONFIG } from "@/lib/seo-config";

export default function MoviesPage() {
  // Balisage JSON-LD pour la collection de films
  const collectionData = {
    "@context": "https://schema.org",
    "@type": "MediaGallery",
    "name": "Films StreamFlix",
    "description": "Découvrez notre collection de films en streaming",
    "url": "https://streamflix2.site/films",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://streamflix2.site/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

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

  // Adventure movies (genre 12)
  const { data: adventureMovies, isLoading: adventureLoading, isError: adventureError } = useQuery({
    queryKey: ['adventure-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(12),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Animation movies (genre 16)
  const { data: animationMovies, isLoading: animationLoading, isError: animationError } = useQuery({
    queryKey: ['animation-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(16),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Comedy movies (genre 35)
  const { data: comedyMovies, isLoading: comedyLoading, isError: comedyError } = useQuery({
    queryKey: ['comedy-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(35),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Crime movies (genre 80)
  const { data: crimeMovies, isLoading: crimeLoading, isError: crimeError } = useQuery({
    queryKey: ['crime-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(80),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Drama movies (genre 18)
  const { data: dramaMovies, isLoading: dramaLoading, isError: dramaError } = useQuery({
    queryKey: ['drama-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(18),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Family movies (genre 10751)
  const { data: familyMovies, isLoading: familyLoading, isError: familyError } = useQuery({
    queryKey: ['family-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(10751),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fantasy movies (genre 14)
  const { data: fantasyMovies, isLoading: fantasyLoading, isError: fantasyError } = useQuery({
    queryKey: ['fantasy-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(14),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // History movies (genre 36)
  const { data: historyMovies, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ['history-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(36),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Horror movies (genre 27)
  const { data: horrorMovies, isLoading: horrorLoading, isError: horrorError } = useQuery({
    queryKey: ['horror-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(27),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Music movies (genre 10402)
  const { data: musicMovies, isLoading: musicLoading, isError: musicError } = useQuery({
    queryKey: ['music-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(10402),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mystery movies (genre 9648)
  const { data: mysteryMovies, isLoading: mysteryLoading, isError: mysteryError } = useQuery({
    queryKey: ['mystery-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(9648),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Romance movies (genre 10749)
  const { data: romanceMovies, isLoading: romanceLoading, isError: romanceError } = useQuery({
    queryKey: ['romance-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(10749),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Science Fiction movies (genre 878)
  const { data: scienceFictionMovies, isLoading: scienceFictionLoading, isError: scienceFictionError } = useQuery({
    queryKey: ['science-fiction-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(878),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Thriller movies (genre 53)
  const { data: thrillerMovies, isLoading: thrillerLoading, isError: thrillerError } = useQuery({
    queryKey: ['thriller-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(53),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // War movies (genre 10752)
  const { data: warMovies, isLoading: warLoading, isError: warError } = useQuery({
    queryKey: ['war-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(10752),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Western movies (genre 37)
  const { data: westernMovies, isLoading: westernLoading, isError: westernError } = useQuery({
    queryKey: ['western-movies'],
    queryFn: () => tmdbService.getMoviesByGenre(37),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = popularLoading || nowPlayingLoading || upcomingLoading || topRatedLoading || 
                   actionLoading || adventureLoading || animationLoading || comedyLoading || 
                   crimeLoading || dramaLoading || familyLoading || 
                   fantasyLoading || historyLoading || horrorLoading || musicLoading || 
                   mysteryLoading || romanceLoading || scienceFictionLoading || 
                   thrillerLoading || warLoading || westernLoading;

  const hasError = popularError || nowPlayingError || upcomingError || topRatedError || 
                   actionError || adventureError || animationError || comedyError || 
                   crimeError || dramaError || familyError || 
                   fantasyError || historyError || horrorError || musicError || 
                   mysteryError || romanceError || scienceFictionError || 
                   thrillerError || warError || westernError;

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
            {[...Array(18)].map((_, index) => (
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
      <Helmet>
        <title>Films en Streaming - StreamFlix</title>
        <meta name="description" content="Découvrez notre vaste collection de films en streaming légal. Regardez des films HD sans publicité et en haute qualité." />
        <link rel="canonical" href="https://streamflix2.site/films" />
        <meta property="og:title" content="Films en Streaming - StreamFlix" />
        <meta property="og:description" content="Découvrez notre vaste collection de films en streaming légal." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://streamflix2.site/logo.png" />
        <meta property="og:url" content="https://streamflix2.site/films" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Films en Streaming - StreamFlix" />
        <meta name="twitter:description" content="Découvrez notre vaste collection de films en streaming légal." />
        <meta name="twitter:image" content="https://streamflix2.site/logo.png" />
      </Helmet>
      <script type="application/ld+json">
        {JSON.stringify(collectionData)}
      </script>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          {/* Changement de h1 à h2 pour éviter les balises H1 multiples */}
          <h2 className="text-2xl md:text-3xl font-bold">Films</h2>
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
          
          {adventureMovies && adventureMovies.length > 0 && (
            <MovieRow 
              title="Aventure" 
              movies={adventureMovies} 
              isLoading={adventureLoading}
            />
          )}
          
          {animationMovies && animationMovies.length > 0 && (
            <MovieRow 
              title="Animation" 
              movies={animationMovies} 
              isLoading={animationLoading}
            />
          )}
          
          {comedyMovies && comedyMovies.length > 0 && (
            <MovieRow 
              title="Comédie" 
              movies={comedyMovies} 
              isLoading={comedyLoading}
            />
          )}
          
          {crimeMovies && crimeMovies.length > 0 && (
            <MovieRow 
              title="Crime" 
              movies={crimeMovies} 
              isLoading={crimeLoading}
            />
          )}
          
          {dramaMovies && dramaMovies.length > 0 && (
            <MovieRow 
              title="Drame" 
              movies={dramaMovies} 
              isLoading={dramaLoading}
            />
          )}
          
          {familyMovies && familyMovies.length > 0 && (
            <MovieRow 
              title="Familial" 
              movies={familyMovies} 
              isLoading={familyLoading}
            />
          )}
          
          {fantasyMovies && fantasyMovies.length > 0 && (
            <MovieRow 
              title="Fantastique" 
              movies={fantasyMovies} 
              isLoading={fantasyLoading}
            />
          )}
          
          {historyMovies && historyMovies.length > 0 && (
            <MovieRow 
              title="Histoire" 
              movies={historyMovies} 
              isLoading={historyLoading}
            />
          )}
          
          {horrorMovies && horrorMovies.length > 0 && (
            <MovieRow 
              title="Horreur" 
              movies={horrorMovies} 
              isLoading={horrorLoading}
            />
          )}
          
          {musicMovies && musicMovies.length > 0 && (
            <MovieRow 
              title="Musique" 
              movies={musicMovies} 
              isLoading={musicLoading}
            />
          )}
          
          {mysteryMovies && mysteryMovies.length > 0 && (
            <MovieRow 
              title="Mystère" 
              movies={mysteryMovies} 
              isLoading={mysteryLoading}
            />
          )}
          
          {romanceMovies && romanceMovies.length > 0 && (
            <MovieRow 
              title="Romance" 
              movies={romanceMovies} 
              isLoading={romanceLoading}
            />
          )}
          
          {scienceFictionMovies && scienceFictionMovies.length > 0 && (
            <MovieRow 
              title="Science-Fiction" 
              movies={scienceFictionMovies} 
              isLoading={scienceFictionLoading}
            />
          )}
          
          {thrillerMovies && thrillerMovies.length > 0 && (
            <MovieRow 
              title="Thriller" 
              movies={thrillerMovies} 
              isLoading={thrillerLoading}
            />
          )}
          
          {warMovies && warMovies.length > 0 && (
            <MovieRow 
              title="Guerre" 
              movies={warMovies} 
              isLoading={warLoading}
            />
          )}
          
          {westernMovies && westernMovies.length > 0 && (
            <MovieRow 
              title="Western" 
              movies={westernMovies} 
              isLoading={westernLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}