import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Filter, Grid, List, Star, Calendar, TrendingUp } from "lucide-react";
import { tmdbService } from "@/lib/tmdb";
import { GENRE_MAP } from "@/types/movie";
import MovieCard from "@/components/movie-card";
import { useState } from "react";

// Genre color mapping for visual consistency
const GENRE_COLORS: Record<number, string> = {
  28: "from-red-500 to-orange-500", // Action
  35: "from-yellow-500 to-orange-400", // Comedy
  18: "from-purple-500 to-pink-500", // Drama
  27: "from-gray-700 to-gray-900", // Horror
  878: "from-blue-500 to-cyan-500", // Sci-Fi
  10749: "from-pink-500 to-rose-400", // Romance
  16: "from-green-500 to-teal-500", // Animation
  14: "from-indigo-500 to-purple-600", // Fantasy
  53: "from-red-600 to-pink-600", // Thriller
  80: "from-gray-600 to-slate-700", // Crime
  12: "from-emerald-500 to-green-600", // Adventure
  10752: "from-amber-600 to-orange-700", // War
};

const GENRE_ICONS: Record<number, string> = {
  28: "🎬", 35: "😄", 18: "🎭", 27: "👻", 878: "🚀", 10749: "💖",
  16: "🎨", 14: "🧙", 53: "😨", 80: "🔍", 12: "🗺️", 10752: "⚔️"
};

export default function Category() {
  const { genre } = useParams<{ genre: string }>();
  const genreId = parseInt(genre || "0");
  const genreName = GENRE_MAP[genreId] || "Genre";
  const genreColor = GENRE_COLORS[genreId] || "from-primary to-primary/70";
  const genreIcon = GENRE_ICONS[genreId] || "🎬";
  
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'date'>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: movies, isLoading } = useQuery({
    queryKey: [`/api/tmdb/genre/${genreId}`],
    queryFn: () => tmdbService.getMoviesByGenre(genreId),
    enabled: !!genreId,
  });

  // Sort movies based on selected criteria
  const sortedMovies = movies ? [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.vote_average - a.vote_average;
      case 'date':
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      default:
        return b.popularity - a.popularity;
    }
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5 py-8" data-testid="category-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced loading header with gradient */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/" className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="w-16 h-16 bg-gradient-to-r from-muted to-muted/50 rounded-2xl animate-pulse" />
              <div className="flex-1">
                <div className="h-10 bg-gradient-to-r from-muted to-muted/50 rounded-xl animate-pulse mb-3 w-64" />
                <div className="h-4 bg-muted rounded-lg animate-pulse w-80" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="h-12 bg-muted rounded-xl animate-pulse w-32" />
              <div className="h-12 bg-muted rounded-xl animate-pulse w-28" />
              <div className="h-12 bg-muted rounded-xl animate-pulse w-24" />
              <div className="h-12 bg-muted rounded-xl animate-pulse w-20" />
            </div>
          </div>
          
          {/* Enhanced loading grid with staggered animation */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="group space-y-3 animate-pulse" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="bg-gradient-to-b from-muted to-muted/50 rounded-2xl h-72 md:h-80 transform transition-transform group-hover:scale-105" />
                <div className="space-y-2">
                  <div className="bg-muted h-4 rounded-lg" />
                  <div className="bg-muted/70 h-3 rounded w-2/3" />
                  <div className="bg-muted/50 h-3 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5 py-8" data-testid="category-empty">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced header with back button and gradient */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/" className="group p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 hover:scale-105">
                <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
              </Link>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${genreColor} flex items-center justify-center text-2xl shadow-lg`}>
                {genreIcon}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2" data-testid="category-title">
                  {genreName}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Explorez notre collection de films {genreName.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced empty state */}
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${genreColor} flex items-center justify-center text-4xl shadow-2xl`}>
                {genreIcon}
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-transparent to-white/10 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Aucun film trouvé</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              Aucun film n'est disponible dans cette catégorie pour le moment. Revenez bientôt pour découvrir de nouveaux contenus !
            </p>
            <Link href="/" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5 py-8" data-testid="category-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with gradient background and controls */}
        <div className="mb-12">
          {/* Header with back button and genre icon */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="group p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
            </Link>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${genreColor} flex items-center justify-center text-2xl shadow-lg transform hover:scale-105 transition-transform`}>
              {genreIcon}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2" data-testid="category-title">
                {genreName}
              </h1>
              <p className="text-muted-foreground text-lg" data-testid="category-description">
                Découvrez {sortedMovies.length} film{sortedMovies.length > 1 ? "s" : ""} dans la catégorie {genreName.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Trier par:</span>
              </div>
              <div className="flex rounded-lg bg-muted/50 p-1">
                <button
                  onClick={() => setSortBy('popularity')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                    sortBy === 'popularity'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Popularité
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                    sortBy === 'rating'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Note
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                    sortBy === 'date'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Date
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-muted/50 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Movies Grid/List */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        } grid gap-4`} data-testid="category-movies-grid">
          {sortedMovies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              size={viewMode === 'grid' ? 'small' : 'large'} 
            />
          ))}
        </div>

        {/* Results Summary */}
        <div className="text-center mt-12 p-6 bg-muted/50 rounded-xl border border-border/50">
          <p className="text-muted-foreground">
            Affichage de <span className="font-semibold text-foreground">{sortedMovies.length}</span> film{sortedMovies.length > 1 ? "s" : ""} 
            dans la catégorie <span className="font-semibold text-foreground">{genreName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}