import { useEffect } from "react";
import { X, Play, Plus, ThumbsUp, Share2, Star, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import { MovieDetails, GENRE_MAP } from "@/types/movie";

interface MovieModalProps {
  movieId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function MovieModal({ movieId, open, onClose }: MovieModalProps) {
  const { data: movieDetails, isLoading } = useQuery({
    queryKey: [`/api/tmdb/movie/${movieId}`],
    queryFn: () => movieId ? tmdbService.getMovieDetails(movieId) : null,
    enabled: !!movieId && open,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!movieId || !open) return null;

  const movie = movieDetails?.movie;
  const cast = movieDetails?.credits?.cast?.slice(0, 4) || [];
  const trailer = movieDetails?.videos?.results?.find(video => video.type === "Trailer" && video.site === "YouTube");

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-card border-border"
        data-testid="movie-modal"
        aria-describedby="movie-modal-description"
      >
        <DialogHeader className="sr-only">
          <DialogTitle id="movie-modal-title">
            {movie ? `Détails du film ${movie.title}` : "Détails du film"}
          </DialogTitle>
          <DialogDescription id="movie-modal-description">
            {movie ? `Détails du film ${movie.title}` : "Chargement des détails du film"}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-96" data-testid="movie-modal-loading">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des détails...</p>
            </div>
          </div>
        ) : movie ? (
          <>
            {/* Header with backdrop */}
            <div className="relative">
              <img
                src={tmdbService.getBackdropUrl(movie.backdrop_path)}
                alt={movie.title}
                className="w-full h-64 md:h-80 object-cover rounded-t-lg"
                data-testid="modal-backdrop"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent rounded-t-lg"></div>
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full"
                data-testid="modal-close-button"
              >
                <X className="w-5 h-5" />
              </Button>
              
              {/* Movie info overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="modal-title">
                  {movie.title}
                </h1>
                <div className="flex items-center space-x-4 text-white/80 mb-4" data-testid="modal-metadata">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </span>
                  {movie.runtime && (
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(movie.runtime)}</span>
                    </span>
                  )}
                  <span>{movie.genres?.map(g => g.name).join(", ")}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-accent fill-current" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6" data-testid="modal-actions">
                <Button 
                  onClick={() => {
                    window.location.href = `/watch/movie/${movieId}`;
                  }}
                  className="btn-primary flex items-center space-x-2" 
                  data-testid="modal-watch-button"
                >
                  <Play className="w-5 h-5" />
                  <span>Regarder</span>
                </Button>
                <Button className="btn-secondary flex items-center space-x-2" data-testid="modal-add-list-button">
                  <Plus className="w-5 h-5" />
                  <span>Ma Liste</span>
                </Button>
                <Button className="btn-secondary flex items-center space-x-2" data-testid="modal-like-button">
                  <ThumbsUp className="w-5 h-5" />
                  <span>J'aime</span>
                </Button>
                <Button className="btn-secondary flex items-center space-x-2" data-testid="modal-share-button">
                  <Share2 className="w-5 h-5" />
                  <span>Partager</span>
                </Button>
              </div>
              
              {/* Synopsis */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-3" data-testid="modal-synopsis-title">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="modal-synopsis">
                  {movie.overview || "Aucun synopsis disponible."}
                </p>
              </div>
              
              {/* Cast */}
              {cast.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3" data-testid="modal-cast-title">Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="modal-cast">
                    {cast.map((actor) => (
                      <div key={actor.id} className="text-center" data-testid={`cast-member-${actor.id}`}>
                        <img
                          src={tmdbService.getProfileUrl(actor.profile_path)}
                          alt={actor.name}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-2 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-profile.jpg";
                          }}
                        />
                        <p className="text-sm font-medium text-foreground">{actor.name}</p>
                        <p className="text-xs text-muted-foreground">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trailer */}
              {trailer && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3" data-testid="modal-trailer-title">Bande-annonce</h3>
                  <div className="relative bg-muted rounded-lg overflow-hidden aspect-video" data-testid="modal-trailer">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}`}
                      title={trailer.name}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    />
                  </div>
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-96" data-testid="movie-modal-error">
            <p className="text-muted-foreground">Erreur lors du chargement du film</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}