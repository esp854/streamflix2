import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Plus, Heart, Star, Calendar, Clock, Tv, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import React from "react";
import { tmdbService } from "@/lib/tmdb";
import { useFavorites } from "@/hooks/use-favorites";
import TVRow from "@/components/tv-row";
import CommentsSection from "@/components/CommentsSection";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import ContentShareButton from "@/components/ContentShareButton";
import type { TMDBTVSeries } from "@/types/movie";

export default function TVDetail() {
  const { id } = useParams<{ id: string }>();
  const tvId = parseInt(id || "0");
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1])); // First season expanded by default
  const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
  const { shouldRedirectToPayment } = useSubscriptionCheck();

  const { data: tvDetails, isLoading, error } = useQuery({
    queryKey: [`/api/tmdb/tv/${tvId}`],
    queryFn: () => tmdbService.getTVShowDetails(tvId),
    enabled: !!tvId,
  });

  // Check if series is favorite
  const { data: favoriteStatus } = checkFavorite(tvId);
  const isFavorite = favoriteStatus?.isFavorite || false;

  // Get content ID for comments
  const { data: contentData } = useQuery({
    queryKey: [`/api/content/tmdb/${tvId}`],
    queryFn: async () => {
      const response = await fetch(`/api/content/tmdb/${tvId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!tvId,
  });

  // Get real episodes from database
  const { data: episodesData } = useQuery({
    queryKey: [`/api/admin/episodes/${contentData?.id}`],
    queryFn: async () => {
      if (!contentData?.id) return null;
      const response = await fetch(`/api/admin/episodes/${contentData.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!contentData?.id,
  });

  const { data: similarShows } = useQuery({
    queryKey: [`/api/tmdb/tv/similar/${tvId}`],
    queryFn: () => {
      // For now, get TV shows from the same primary genre
      const primaryGenre = tvDetails?.genres?.[0]?.id;
      return primaryGenre ? tmdbService.getTVShowsByGenre(primaryGenre) : [];
    },
    enabled: !!tvDetails?.genres?.[0]?.id,
  });

  // Group episodes by season from database using useMemo correctly
  const episodesBySeason = useMemo(() => {
    if (!episodesData?.episodes) return {};

    const grouped: { [seasonNumber: number]: any[] } = {};
    episodesData.episodes.forEach((episode: any) => {
      if (!grouped[episode.seasonNumber]) {
        grouped[episode.seasonNumber] = [];
      }
      grouped[episode.seasonNumber].push(episode);
    });

    // Sort episodes within each season
    Object.keys(grouped).forEach(season => {
      grouped[parseInt(season)].sort((a: any, b: any) => a.episodeNumber - b.episodeNumber);
    });

    return grouped;
  }, [episodesData]);

  const handleToggleFavorite = async () => {
    if (tvDetails) {
      // Create a simplified series object for the favorites system
      const seriesForFavorites = {
        id: tvDetails.id,
        name: tvDetails.name,
        poster_path: tvDetails.poster_path,
        first_air_date: tvDetails.first_air_date,
        genre_ids: tvDetails.genres?.map((g: any) => g.id) || [],
        vote_average: tvDetails.vote_average,
        vote_count: tvDetails.vote_count,
        popularity: tvDetails.popularity,
        overview: tvDetails.overview,
        backdrop_path: tvDetails.backdrop_path,
        original_language: tvDetails.original_language,
        original_name: tvDetails.original_name,
        adult: false,
      };
      await toggleFavorite(seriesForFavorites, 'tv');
    }
  };

  const handleAddToList = () => {
    // TODO: Implement watchlist functionality
    console.log('Add to watchlist:', tvDetails?.name);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="tv-detail-loading">
        <div className="relative h-96 bg-muted animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading TV show:", error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="tv-detail-error">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Erreur de chargement</h1>
          <p className="text-muted-foreground mb-4">Impossible de charger les détails de la série</p>
          <Link href="/series">
            <Button>Retour aux séries</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!tvDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="tv-detail-error">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Série non trouvée</h1>
          <Link href="/series">
            <Button>Retour aux séries</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract the actual TV show data from the response
  // The backend returns { show, credits, videos } but sometimes it might return the data directly
  const tv = (tvDetails as any).show || tvDetails;
  const { credits, videos } = tvDetails as any;
  const cast = credits?.cast?.slice(0, 8) || [];
  const trailer = videos?.results?.find((video: any) => video.type === "Trailer" && video.site === "YouTube");

  const formatEpisodeRuntime = (runtimes: number[] | undefined) => {
    if (!runtimes || runtimes.length === 0) return null;
    const avgRuntime = Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length);
    return `~${avgRuntime}min/épisode`;
  };

  const getAirYears = () => {
    if (!tv.first_air_date) return "Date inconnue";
    const startYear = new Date(tv.first_air_date).getFullYear();
    if (tv.status === "Ended" && tv.last_air_date) {
      const endYear = new Date(tv.last_air_date).getFullYear();
      return startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`;
    }
    return `${startYear}-en cours`;
  };

  const toggleSeason = (seasonNumber: number) => {
    setExpandedSeasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seasonNumber)) {
        newSet.delete(seasonNumber);
      } else {
        newSet.add(seasonNumber);
      }
      return newSet;
    });
  };

  // Préparer les données de partage
  const shareableContent = {
    id: tv.id.toString(),
    title: tv.name,
    overview: tv.overview,
    poster_path: tv.poster_path || undefined,
    backdrop_path: tv.backdrop_path || undefined,
    first_air_date: tv.first_air_date,
    vote_average: tv.vote_average,
    contentType: 'tv' as const,
    url: `/tv/${tv.id}`
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-screen">
        <img
          src={tmdbService.getBackdropUrl(tv.backdrop_path)}
          alt={tv.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

        {/* Back button */}
        <Link href="/series">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full z-10"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </Link>

        {/* TV show info */}
        <div className="absolute bottom-8 left-4 right-4 sm:left-8 sm:right-8 md:left-16 md:bottom-16 md:max-w-3xl z-10">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4">
            {tv.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white/80 mb-4 sm:mb-6">
            <span className="flex items-center space-x-1 text-sm sm:text-base">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{getAirYears()}</span>
            </span>
            {formatEpisodeRuntime(tv.episode_run_time) && (
              <span className="flex items-center space-x-1 text-sm sm:text-base">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{formatEpisodeRuntime(tv.episode_run_time)}</span>
              </span>
            )}
            <span className="flex items-center space-x-1 text-sm sm:text-base">
              <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{tv.number_of_seasons} saison{tv.number_of_seasons > 1 ? 's' : ''}</span>
            </span>
            <div className="flex items-center space-x-1 text-sm sm:text-base">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent fill-current" />
              <span>{tv.vote_average.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
            {tv.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              onClick={() => {
                // If user should be redirected to payment page, redirect them
                if (shouldRedirectToPayment) {
                  window.location.href = `/subscription`;
                  return;
                }
                window.location.href = `/watch/tv/${tvId}`;
              }}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Play className="w-5 h-5" />
              <span>Regarder</span>
            </Button>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 sm:flex-none">
              <Button className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto" onClick={handleAddToList}>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Ma Liste</span>
                <span className="xs:hidden">Liste</span>
              </Button>
              <Button
                className={`btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto ${isFavorite ? 'bg-primary text-white' : ''}`}
                onClick={handleToggleFavorite}
                disabled={isAddingToFavorites}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="hidden xs:inline">{isFavorite ? 'Retirer des favoris' : 'Favoris'}</span>
                <span className="xs:hidden">{isFavorite ? 'Retirer' : 'Favoris'}</span>
              </Button>
              <ContentShareButton 
                content={shareableContent}
                className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Acteurs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {cast.map((actor: any) => (
              <div key={actor.id} className="text-center">
                <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2">
                  {actor.profile_path ? (
                    <img
                      src={tmdbService.getProfileUrl(actor.profile_path)}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Pas d'image</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm sm:text-base line-clamp-1">{actor.name}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1">{actor.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trailer Section */}
      {trailer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Bande-annonce</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={trailer.name}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Seasons Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Saisons</h2>
        <div className="space-y-4">
          {tv.seasons?.map((season: any) => (
            <div key={season.season_number} className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-muted transition-colors"
                onClick={() => toggleSeason(season.season_number)}
              >
                <div className="flex items-center space-x-4">
                  {season.poster_path ? (
                    <img
                      src={tmdbService.getPosterUrl(season.poster_path)}
                      alt={season.name}
                      className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 sm:w-20 sm:h-28 bg-muted rounded flex items-center justify-center">
                      <Tv className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{season.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {season.air_date ? new Date(season.air_date).getFullYear() : 'Date inconnue'} • {season.episode_count} épisode{season.episode_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedSeasons.has(season.season_number) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              
              {expandedSeasons.has(season.season_number) && (
                <div className="border-t bg-muted/50 p-4 sm:p-6">
                  {episodesBySeason[season.season_number] && episodesBySeason[season.season_number].length > 0 ? (
                    <div className="space-y-3">
                      {episodesBySeason[season.season_number].map((episode: any) => (
                        <div key={episode.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-background transition-colors">
                          <div className="flex-shrink-0 w-16 h-9 bg-muted rounded flex items-center justify-center text-xs font-medium">
                            E{episode.episodeNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-1">{episode.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                            {episode.duration && (
                              <p className="text-xs text-muted-foreground mt-1">{Math.floor(episode.duration / 60)}min</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              // If user should be redirected to payment page, redirect them
                              if (shouldRedirectToPayment) {
                                window.location.href = `/subscription`;
                                return;
                              }
                              window.location.href = `/watch/tv/${tvId}/${season.season_number}/${episode.episodeNumber}`;
                            }}
                          >
                            Regarder
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aucun épisode disponible pour cette saison</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Similar Shows */}
      {similarShows && similarShows.length > 0 && (
        <div className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TVRow title="Vous aimerez aussi" series={similarShows.slice(0, 10) as TMDBTVSeries[]} />
          </div>
        </div>
      )}

      {/* Comments Section */}
      {contentData?.id && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <CommentsSection contentId={contentData.id} contentType="tv" />
        </div>
      )}
    </div>
  );
}