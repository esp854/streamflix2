import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Plus, Heart, Share2, Star, Calendar, Clock, Tv, ChevronDown, ChevronRight, Globe, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import React from "react";
import { tmdbService } from "@/lib/tmdb";
import { useFavorites } from "@/hooks/use-favorites";
import { useShare } from "@/hooks/use-share";
import TVRow from "@/components/tv-row";
import CommentsSection from "@/components/CommentsSection";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import TVDetailStructuredData from "@/components/seo/tv-detail-structured-data";

export default function TVDetail() {
  const { id } = useParams<{ id: string }>();
  
  // Amélioration de la gestion de l'identifiant pour gérer les différents formats
  const tvId = (() => {
    if (!id) return 0;
    
    // Si l'ID est au format "tmdb-12345", on extrait le numéro
    if (id.startsWith('tmdb-')) {
      const parsed = parseInt(id.substring(5), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Sinon, on tente une conversion normale
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 0 : parsed;
  })();
  
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1])); // First season expanded by default
  const { toggleFavorite, checkFavorite, isAddingToFavorites } = useFavorites();
  const { shareCurrentPage } = useShare();
  const { shouldRedirectToPayment } = useSubscriptionCheck();

  const { data: tvDetails, isLoading, error } = useQuery({
    queryKey: [`/api/tmdb/tv/${tvId}`],
    queryFn: () => tmdbService.getTVShowDetails(tvId),
    enabled: !!tvId && tvId > 0,
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

  const handleShare = async () => {
    if (tvDetails) {
      await shareCurrentPage(tvDetails.name);
    }
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
  const crew = credits?.crew?.slice(0, 8) || [];
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

  // Format data for structured data component
  const tvDetailsForStructuredData = {
    ...tv,
    credits,
    videos
  };

  return (
    <div className="min-h-screen bg-background" data-testid="tv-detail-page">
      <TVDetailStructuredData tvDetails={tvDetailsForStructuredData} />
      {/* Hero Section */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-screen">
        <img
          src={tmdbService.getBackdropUrl(tv.backdrop_path)}
          alt={tv.name}
          className="w-full h-full object-cover"
          data-testid="tv-backdrop"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-backdrop.jpg";
          }}
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

        {/* Back button */}
        <Link href="/series">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full z-10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </Link>

        {/* TV Show info */}
        <div className="absolute bottom-8 left-4 right-4 sm:left-8 sm:right-8 md:left-16 md:bottom-16 md:max-w-3xl z-10">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4" data-testid="tv-title">
            {tv.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white/80 mb-4 sm:mb-6 text-sm sm:text-base" data-testid="tv-metadata">
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Années: {getAirYears()}</span>
            </span>
            {tv.number_of_seasons && (
              <span className="flex items-center space-x-1">
                <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{tv.number_of_seasons} saison{tv.number_of_seasons > 1 ? 's' : ''}</span>
              </span>
            )}
            {tv.number_of_episodes && (
              <span>{tv.number_of_episodes} épisodes au total</span>
            )}
            {formatEpisodeRuntime(tv.episode_run_time) && (
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Durée moyenne: {formatEpisodeRuntime(tv.episode_run_time)}</span>
              </span>
            )}
            <span className="hidden sm:inline">Genres: {tv.genres?.map((g: any) => g.name).join(", ")}</span>

            {tv.vote_average > 0 && (
              <span className="flex items-center space-x-1">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Note: {tv.vote_average.toFixed(1)}/10</span>
              </span>
            )}
          </div>

          {/* Genres on mobile */}
          <div className="sm:hidden mb-4">
            <span className="text-white/80 text-sm">{tv.genres?.map((g: any) => g.name).join(", ")}</span>
          </div>

          <p className="text-white/90 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed line-clamp-3 sm:line-clamp-none" data-testid="tv-overview">
            {tv.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4" data-testid="tv-actions">
            <Button 
              onClick={() => {
                // If user should be redirected to payment page, redirect them
                if (shouldRedirectToPayment) {
                  window.location.href = `/subscription`;
                  return;
                }
                window.location.href = `/watch/tv/${tv.id}/1/1`;
              }}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto" 
              data-testid="button-watch"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Regarder</span>
            </Button>

            <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={handleToggleFavorite}
                disabled={isAddingToFavorites}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2"
                data-testid="button-favorite"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? "fill-current" : ""}`} />
                <span className="hidden sm:inline">{isFavorite ? "Favoris" : "Favoris"}</span>
                <span className="sm:hidden">{isFavorite ? "♥" : "+"}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleAddToList}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2"
                data-testid="button-add-list"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Ma liste</span>
                <span className="sm:hidden">+</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleShare}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2"
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Partager</span>
                <span className="sm:hidden">↗</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Additional TV Show Information */}
        <section className="mb-8 sm:mb-12" data-testid="tv-info-section">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-foreground">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Globe className="w-5 h-5 text-muted-foreground mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">Langue originale</h3>
                  <p className="text-muted-foreground">{tv.original_language?.toUpperCase()}</p>
                </div>
              </div>
              
              {tv.status && (
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-muted-foreground mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Statut</h3>
                    <p className="text-muted-foreground">{tv.status}</p>
                  </div>
                </div>
              )}
              
              {tv.type && (
                <div className="flex items-start">
                  <Award className="w-5 h-5 text-muted-foreground mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Type</h3>
                    <p className="text-muted-foreground">{tv.type}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {tv.tagline && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Slogan</h3>
                  <p className="text-muted-foreground italic">"{tv.tagline}"</p>
                </div>
              )}
              
              {tv.created_by && tv.created_by.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Créateurs</h3>
                  <p className="text-muted-foreground">
                    {tv.created_by.map((creator: any) => creator.name).join(", ")}
                  </p>
                </div>
              )}
              
              {tv.networks && tv.networks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Chaînes de diffusion</h3>
                  <p className="text-muted-foreground">
                    {tv.networks.map((network: any) => network.name).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cast Section */}
        {cast.length > 0 && (
          <section className="mb-8 sm:mb-12" data-testid="tv-cast">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Acteurs</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
              {cast.map((person: any) => (
                <div key={person.id} className="text-center" data-testid={`cast-member-${person.id}`}>
                  <div className="relative pb-[150%] mb-2 sm:mb-3 rounded-md overflow-hidden">
                    <img
                      src={tmdbService.getProfileUrl(person.profile_path)}
                      alt={person.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-profile.jpg";
                      }}
                    />
                  </div>
                  <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-1" data-testid={`cast-name-${person.id}`}>
                    {person.name}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-1" data-testid={`cast-character-${person.id}`}>
                    {person.character}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Crew Section */}
        {crew.length > 0 && (
          <section className="mb-8 sm:mb-12" data-testid="tv-crew">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Équipe technique</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="crew-grid">
              {crew.map((member: any) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg" data-testid={`crew-member-${member.id}`}>
                  <img
                    src={tmdbService.getProfileUrl(member.profile_path)}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-profile.jpg";
                    }}
                  />
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{member.name}</h3>
                    <p className="text-xs text-muted-foreground">{member.job}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Seasons Section */}
        {tv.seasons && tv.seasons.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Saisons</h3>
            <div className="space-y-3 sm:space-y-4">
              {tv.seasons.map((season: any) => {
                const isExpanded = expandedSeasons.has(season.season_number);
                const seasonEpisodes = episodesBySeason[season.season_number] || [];
                const episodeCount = seasonEpisodes.length > 0 ? seasonEpisodes.length : season.episode_count;

                return (
                  <div key={season.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className="p-3 sm:p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => toggleSeason(season.season_number)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {season.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                              alt={season.name}
                              className="w-12 h-18 sm:w-16 sm:h-24 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-poster.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-18 sm:w-16 sm:h-24 bg-gray-700 rounded flex items-center justify-center">
                              <Tv className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base line-clamp-1">{season.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-400">{episodeCount} épisodes</p>
                            {season.air_date && (
                              <p className="text-xs text-gray-500">
                                {new Date(season.air_date).getFullYear()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-700">
                        <div className="p-3 sm:p-4 space-y-2">
                          {seasonEpisodes.length > 0 ? (
                            seasonEpisodes.map((episode: any) => (
                              <div key={`${season.season_number}-${episode.episodeNumber}`} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-700 transition-colors">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                                  {episode.episodeNumber}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm sm:text-base line-clamp-1">{episode.title}</h5>
                                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{episode.description}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/watch/tv/${tv.id}/${season.season_number}/${episode.episodeNumber}`}
                                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary hover:bg-primary/90 rounded-full transition-colors"
                                  >
                                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                                  </Link>
                                </div>
                              </div>
                            ))
                          ) : (
                            // Fallback to placeholder episodes if no real episodes in DB
                            Array.from({ length: season.episode_count }, (_, i) => (
                              <div key={`${season.season_number}-${i + 1}`} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-700 transition-colors">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm sm:text-base line-clamp-1">Épisode {i + 1}</h5>
                                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">Résumé de l'épisode à venir...</p>
                                </div>
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/watch/tv/${tv.id}/${season.season_number}/${i + 1}`}
                                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary hover:bg-primary/90 rounded-full transition-colors"
                                  >
                                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                                  </Link>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Similar Shows */}
        {similarShows && similarShows.length > 0 && (
          <section className="mb-6 sm:mb-8" data-testid="similar-shows">
            <TVRow
              title="Séries Similaires"
              series={similarShows}
              isLoading={false}
            />
          </section>
        )}

        {/* Comments Section */}
        {contentData && (
          <CommentsSection
            contentId={contentData.id}
            contentType="tv"
          />
        )}
      </div>
    </div>
  );
}