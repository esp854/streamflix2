import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Download, 
  Eye, 
  Play, 
  Plus, 
  Star, 
  User 
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useOfflineContent } from "@/hooks/useOfflineContent";
import { useContentPreloader } from "@/hooks/useContentPreloader";
import LazyImage from "@/components/LazyImage";
import { useTMDBImage } from "@/hooks/useImageOptimization";

interface MovieCardProps {
  movie: any;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  onPlay?: () => void;
}

export default function MovieCard({ 
  movie, 
  size = "md", 
  showDetails = false,
  onPlay 
}: MovieCardProps) {
  const { user } = useAuth();
  const { toggleFavorite, checkFavorite } = useFavorites();
  const { toast } = useToast();
  const { saveForOffline, isContentSavedOffline } = useOfflineContent();
  const { preloadContent, preloadSimilarContent } = useContentPreloader();
  const posterUrl = useTMDBImage(movie.poster_path, size === "sm" ? "w342" : size === "lg" ? "w780" : "w500");
  
  // Vérifier si le film est un favori
  const { data: favoriteData } = checkFavorite(movie.id);
  const isFavorite = favoriteData?.isFavorite || false;
  
  // Vérifier si le contenu est actif dans la base de données avec React Query pour le caching
  const { data: contentActiveData, isLoading: contentActiveLoading } = useQuery({
    queryKey: ["content-active", movie.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/contents/tmdb/${movie.id}`);
        if (response.ok) {
          const content = await response.json();
          return content.active !== false; // Si active est false, le contenu est inactif
        }
        return true; // Par défaut, on suppose que le contenu est actif
      } catch (error) {
        console.error('Error checking content status:', error);
        return true; // En cas d'erreur, on affiche le contenu
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Ne pas afficher le film si son statut actif est false
  if (contentActiveData === false) {
    return null;
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter aux favoris.",
        action: (
          <Link href="/login">
            <Button variant="outline" size="sm">Se connecter</Button>
          </Link>
        ),
      });
      return;
    }
    
    try {
      await toggleFavorite(movie, 'movie');
      toast({
        title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
        description: isFavorite 
          ? `"${movie.title}" a été retiré de vos favoris.` 
          : `"${movie.title}" a été ajouté à vos favoris.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les favoris.",
        variant: "destructive"
      });
    }
  };

  const handleSaveForOffline = async () => {
    try {
      await saveForOffline({
        ...movie,
        contentType: 'movie'
      });
      toast({
        title: "Contenu sauvegardé",
        description: `"${movie.title}" a été ajouté à votre bibliothèque hors-ligne.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le contenu.",
        variant: "destructive"
      });
    }
  };

  const handleMouseEnter = () => {
    // Précharger le contenu du film quand l'utilisateur passe la souris sur la carte
    preloadContent({
      id: movie.id.toString(),
      type: 'movie',
      url: `/movie/${movie.id}`,
      priority: 'medium'
    });
    
    // Précharger les contenus similaires
    preloadSimilarContent(movie.id.toString(), 'movie');
  };

  const sizeClasses = {
    sm: "w-48",
    md: "w-56",
    lg: "w-64"
  };

  const posterSize = {
    sm: "h-64",
    md: "h-72",
    lg: "h-80"
  };

  return (
    <Card 
      className={`${sizeClasses[size]} flex-shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader className="p-0 relative group">
        <Link href={`/movie/${movie.id}`}>
          <div className="relative overflow-hidden rounded-t-lg">
            <LazyImage
              src={posterUrl}
              alt={movie.title}
              className={`${posterSize[size]} w-full object-cover transition-transform duration-300 group-hover:scale-110`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <div className="text-white space-y-2 w-full">
                <h3 className="font-bold text-lg line-clamp-2">{movie.title}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{movie.vote_average?.toFixed(1)}</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>{movie.release_date?.substring(0, 4) || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Bouton de sauvegarde hors-ligne */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSaveForOffline();
              }}
              disabled={isContentSavedOffline(movie.id)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
          onClick={handleToggleFavorite}
        >
          <Plus className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </Button>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="p-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              Film
            </Badge>
            
            <p className="text-sm text-muted-foreground line-clamp-3">
              {movie.overview}
            </p>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{movie.runtime || 'N/A'} min</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{movie.vote_count || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={onPlay || (() => window.location.href = `/watch/movie/${movie.id}`)}
        >
          <Play className="w-4 h-4 mr-2" />
          Regarder
        </Button>
      </CardFooter>
    </Card>
  );
}