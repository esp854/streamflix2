﻿﻿﻿﻿﻿﻿import { useParams, Link } from "wouter";
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
import { EpisodeCard } from "@/components/episode-card";

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

  // Get season details from TMDB to get episode images
  const { data: seasonDetails } = useQuery({
    queryKey: [`/api/tmdb/tv/${tvId}/season-details`],
    queryFn: async () => {
      if (!tvDetails?.seasons) return null;
      
      // Fetch details for all seasons
      const seasonPromises = tvDetails.seasons.map(async (season: any) => {
        if (season.season_number > 0) { // Skip season 0 (specials)
          try {
            const response = await fetch(`/api/tmdb/tv/${tvId}/season/${season.season_number}`);
            if (response.ok) {
              return await response.json();
            }
          } catch (error) {
            console.error(`Error fetching season ${season.season_number} details:`, error);
          }
        }
        return null;
      });
      
      const seasonData = await Promise.all(seasonPromises);
      return seasonData.filter(Boolean); // Remove null values
    },
    enabled: !!tvId && tvId > 0 && !!tvDetails?.seasons,
  });

  // Create a map of episode images by season and episode number
  const episodeImages = useMemo(() => {
    if (!seasonDetails) return {};
    
    const images: { [key: string]: string | null } = {};
    
    seasonDetails.forEach((season: any) => {
      if (season && season.episodes) {
        season.episodes.forEach((episode: any) => {
          const key = `${season.season_number}-${episode.episode_number}`;
          images[key] = episode.still_path;
        });
      }
    });
    
    return images;
  }, [seasonDetails]);

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
      <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="tv-detail-error">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Série non trouvée</h1>
          <p className="text-muted-foreground mb-6">
            Désolé, nous n'avons pas pu charger les informations de cette série.
          </p>
          <Link href="/series">
            <Button className="w-full sm:w-auto">Retour aux séries</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!tvDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="tv-detail-error">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Série non trouvée</h1>
          <p className="text-muted-foreground mb-6">
            La série que vous recherchez n'est pas disponible.
          </p>
          <Link href="/series">
            <Button className="w-full sm:w-auto">Retour aux séries</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { 
    name, 
    overview, 
    genres, 
    vote_average, 
    first_air_date, 
    last_air_date, 
    status, 
    number_of_seasons, 
    number_of_episodes, 
    episode_run_time,
    backdrop_path,
    poster_path,
    created_by,
    production_companies,
    seasons,
    credits
  } = tvDetails;

  // Extract cast and crew from credits
  const cast = credits?.cast || [];
  const crew = credits?.crew || [];

  const formatEpisodeRuntime = (runtimeArray: number[]) => {
    if (!runtimeArray || runtimeArray.length === 0) return null;
    const avgRuntime = Math.round(runtimeArray.reduce((a, b) => a + b, 0) / runtimeArray.length);
    return `~${avgRuntime}min/épisode`;
  };

  const getAirYears = () => {
    if (!first_air_date) return "Date inconnue";
    const startYear = new Date(first_air_date).getFullYear();
    if (status === "Ended" && last_air_date) {
      const endYear = new Date(last_air_date).getFullYear();
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

  // Données structurées pour la série
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": tvDetails.name,
    "image": tmdbService.getBackdropUrl(tvDetails.backdrop_path),
    "description": tvDetails.overview,
    "datePublished": tvDetails.first_air_date,
    "endDate": tvDetails.last_air_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tvDetails.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": tvDetails.vote_count
    },
    "genre": tvDetails.genres?.map((g: any) => g.name),
    "creator": tvDetails.created_by?.map((person: any) => person.name),
    "actor": cast.slice(0, 5).map((person: any) => person.name),
    "numberOfSeasons": tvDetails.number_of_seasons,
    "numberOfEpisodes": tvDetails.number_of_episodes,
    "potentialAction": {
      "@type": "WatchAction",
      "target": `https://streamflix2.site/watch/tv/${tvId}`
    }
  };

  // Données structurées pour les épisodes (exemple pour le premier épisode)
  const episodeData = tvDetails.seasons && tvDetails.seasons.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    "name": `${tvDetails.name} - Saison 1 Épisode 1`,
    "episodeNumber": 1,
    "seasonNumber": 1,
    "partOfSeries": {
      "@type": "TVSeries",
      "name": tvDetails.name
    },
    "potentialAction": {
      "@type": "WatchAction",
      "target": `https://streamflix2.site/watch/tv/${tvId}/1/1`
    }
  } : null;

  return (
    <div className="min-h-screen bg-background" data-testid="tv-detail-page">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {episodeData && (
        <script type="application/ld+json">
          {JSON.stringify(episodeData)}
        </script>
      )}
      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh]">
        <img
          src={tmdbService.getBackdropUrl(backdrop_path)}
          alt={name}
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
            className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full z-10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>

        {/* TV Show info */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:left-8 md:bottom-8 md:right-8 z-10">
          <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-white mb-2 sm:mb-3" data-testid="tv-title">
            {name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/80 mb-3 sm:mb-4 text-xs sm:text-sm" data-testid="tv-metadata">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Années: {getAirYears()}</span>
            </span>
            {number_of_seasons && (
              <span className="flex items-center space-x-1">
                <Tv className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{number_of_seasons} saison{number_of_seasons > 1 ? 's' : ''}</span>
              </span>
            )}
            {number_of_episodes && (
              <span>{number_of_episodes} épisodes</span>
            )}
            {formatEpisodeRuntime(episode_run_time) && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatEpisodeRuntime(episode_run_time)}</span>
              </span>
            )}
            <span className="hidden sm:inline">Genres: {genres?.map((g: any) => g.name).join(", ")}</span>

            {vote_average > 0 && (
              <span className="flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current" />
                <span>{vote_average.toFixed(1)}/10</span>
              </span>
            )}
          </div>

          {/* Genres on mobile */}
          <div className="sm:hidden mb-3">
            <span className="text-white/80 text-xs">{genres?.map((g: any) => g.name).join(", ")}</span>
          </div>

          <p className="text-white/90 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 leading-relaxed line-clamp-3" data-testid="tv-overview">
            {overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-2" data-testid="tv-actions">
            <Button 
              onClick={() => {
                // If user should be redirected to payment page, redirect them
                if (shouldRedirectToPayment) {
                  window.location.href = `/subscription`;
                  return;
                }
                window.location.href = `/watch/tv/${tvDetails.id}/1/1`;
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
                <span className="sm:hidden">{isFavorite ? "ÔÖÑ" : "+"}</span>
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
                <span className="sm:hidden">Ôåù</span>
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
                  <p className="text-muted-foreground">{tvDetails.original_language?.toUpperCase()}</p>
                </div>
              </div>
              
              {tvDetails.status && (
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-muted-foreground mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Statut</h3>
                    <p className="text-muted-foreground">{tvDetails.status}</p>
                  </div>
                </div>
              )}
              
              {tvDetails.type && (
                <div className="flex items-start">
                  <Award className="w-5 h-5 text-muted-foreground mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Type</h3>
                    <p className="text-muted-foreground">{tvDetails.type}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {tvDetails.tagline && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Slogan</h3>
                  <p className="text-muted-foreground italic">"{tvDetails.tagline}"</p>
                </div>
              )}
              
              {tvDetails.created_by && tvDetails.created_by.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Créateurs</h3>
                  <p className="text-muted-foreground">
                    {tvDetails.created_by.map((creator: any) => creator.name).join(", ")}
                  </p>
                </div>
              )}
              
              {tvDetails.networks && tvDetails.networks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Chaînes de diffusion</h3>
                  <p className="text-muted-foreground">
                    {tvDetails.networks.map((network: any) => network.name).join(", ")}
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
        {tvDetails.seasons && tvDetails.seasons.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Saisons</h3>
            <div className="space-y-3 sm:space-y-4">
              {tvDetails.seasons.map((season: any) => {
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
                            seasonEpisodes.map((episode: any) => {
                              const episodeKey = `${season.season_number}-${episode.episodeNumber}`;
                              const episodeImage = episodeImages[episodeKey] || null;
                              
                              return (
                                <EpisodeCard
                                  key={`${season.season_number}-${episode.episodeNumber}`}
                                  episode={{
                                    air_date: episode.releaseDate || '',
                                    episode_number: episode.episodeNumber,
                                    id: episode.id || 0,
                                    name: episode.title,
                                    overview: episode.description || '',
                                    production_code: '',
                                    runtime: null,
                                    season_number: season.season_number,
                                    show_id: tvDetails.id,
                                    still_path: null,
                                    vote_average: 0,
                                    vote_count: 0,
                                    crew: [],
                                    guest_stars: []
                                  }}
                                  tvId={tvDetails.id}
                                  seasonNumber={season.season_number}
                                  episodeImage={episodeImage}
                                />
                              );
                            })
                          ) : (
                            // Fallback to placeholder episodes if no real episodes in DB
                            Array.from({ length: season.episode_count }, (_, i) => {
                              const episodeKey = `${season.season_number}-${i + 1}`;
                              const episodeImage = episodeImages[episodeKey] || null;
                              
                              return (
                                <EpisodeCard
                                  key={`${season.season_number}-${i + 1}`}
                                  episode={{
                                    air_date: season.air_date || '',
                                    episode_number: i + 1,
                                    id: 0,
                                    name: `Épisode ${i + 1}`,
                                    overview: 'Résumé de l\'épisode à venir...',
                                    production_code: '',
                                    runtime: null,
                                    season_number: season.season_number,
                                    show_id: tvDetails.id,
                                    still_path: null,
                                    vote_average: 0,
                                    vote_count: 0,
                                    crew: [],
                                    guest_stars: []
                                  }}
                                  tvId={tvDetails.id}
                                  seasonNumber={season.season_number}
                                  episodeImage={episodeImage}
                                />
                              );
                            })
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
