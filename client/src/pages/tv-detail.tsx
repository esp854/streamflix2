import { useParams, Link, useLocation } from "wouter";
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
import { Helmet } from "react-helmet";
import { SEO_CONFIG } from "@/lib/seo-config";

export default function TvDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const tvId = parseInt(id || "0");
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
    queryKey: [`/api/contents/tmdb/${tvId}`],
    queryFn: async () => {
      const response = await fetch(`/api/contents/tmdb/${tvId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!tvId,
  });

  // Get real episodes from database
  const { data: episodesData, isLoading: episodesLoading, isError: episodesError } = useQuery({
    queryKey: [`/api/admin/episodes/${contentData?.id}`],
    queryFn: async () => {
      if (!contentData?.id) return null;
      const response = await fetch(`/api/admin/episodes/${contentData.id}`);
      if (!response.ok) {
        console.error('Failed to fetch episodes:', response.status, response.statusText);
        return null;
      }
      return response.json();
    },
    enabled: !!contentData?.id,
    retry: 1, // Retry once on failure
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
    // Debug: log episodes data
    console.log('Episodes data:', episodesData);
    
    if (!episodesData?.episodes) {
      console.log('No episodes data available');
      return {};
    }

    const grouped: { [seasonNumber: number]: any[] } = {};
    episodesData.episodes.forEach((episode: any) => {
      // Debug: log each episode
      console.log('Processing episode:', episode);
      
      const seasonNumber = episode.seasonNumber || episode.season_number;
      if (!seasonNumber) {
        console.warn('Episode without season number:', episode);
        return;
      }
      
      if (!grouped[seasonNumber]) {
        grouped[seasonNumber] = [];
      }
      grouped[seasonNumber].push(episode);
    });

    // Sort episodes within each season
    Object.keys(grouped).forEach(season => {
      grouped[parseInt(season)].sort((a: any, b: any) => {
        const aEpisodeNumber = a.episodeNumber || a.episode_number;
        const bEpisodeNumber = b.episodeNumber || b.episode_number;
        return aEpisodeNumber - bEpisodeNumber;
      });
    });

    console.log('Grouped episodes by season:', grouped);
    return grouped;
  }, [episodesData]);

  const handleWatchSeries = async () => {
    try {
      // Vérifier d'abord si le contenu existe dans la base de données
      const response = await fetch(`/api/contents/tmdb/${tvId}`);
      if (!response.ok) {
        console.error("Erreur lors de la vérification du contenu");
        return;
      }
      
      const contentData = await response.json();
      
      // Si le contenu existe, rediriger vers la page de lecture du premier épisode
      if (contentData && contentData.id) {
        setLocation(`/watch/tv/${contentData.id}/1/1`);
      } else {
        // Sinon, essayer de récupérer un lien vidéo Frembed pour le premier épisode
        const frembedResponse = await fetch(`/api/frembed/video-link/${tvId}?mediaType=tv&season=1&episode=1`);
        if (!frembedResponse.ok) {
          console.error("Erreur lors de la récupération du lien vidéo");
          return;
        }
        
        const frembedData = await frembedResponse.json();
        if (frembedData.success && frembedData.videoUrl) {
          // Rediriger vers une page de lecture avec le lien Frembed
          setLocation(`/watch/tv/tmdb/${tvId}/1/1`);
        } else {
          console.error("Aucun lien vidéo disponible");
        }
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de la lecture:", error);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground mb-4">Série non trouvée</h1>
          <Link href="/">
            <Button className="w-full sm:w-auto">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!tvDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="tv-detail-error">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Série non trouvée</h1>
          <Link href="/">
            <Button className="w-full sm:w-auto">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tv = tvDetails;
  const cast = tv.credits?.cast?.slice(0, 8) || [];
  const crew = tv.credits?.crew?.slice(0, 8) || [];

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

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Données structurées pour la série TV
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": tv.name,
    "image": tmdbService.getBackdropUrl(tv.backdrop_path),
    "description": tv.overview,
    "datePublished": tv.first_air_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tv.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": tv.vote_count
    },
    "genre": tv.genres?.map((g: any) => g.name),
    "creator": crew.filter((person: any) => person.job === "Creator").map((person: any) => person.name),
    "actor": cast.slice(0, 5).map((person: any) => person.name),
    "numberOfSeasons": tv.number_of_seasons,
    "numberOfEpisodes": tv.number_of_episodes,
    "potentialAction": {
      "@type": "WatchAction",
      "target": `https://streamflix2-o7vx.onrender.com/watch/tv/${tvId}`
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="tv-detail-page">
      <Helmet>
        <title>{SEO_CONFIG.tv.title.replace('{tvTitle}', tv.name)}</title>
        <meta name="description" content={SEO_CONFIG.tv.description.replace('{tvTitle}', tv.name)} />
        <link rel="canonical" href={SEO_CONFIG.tv.canonical.replace('{id}', tvId.toString())} />
        <meta property="og:title" content={SEO_CONFIG.tv.og.title.replace('{tvTitle}', tv.name)} />
        <meta property="og:description" content={SEO_CONFIG.tv.og.description.replace('{tvTitle}', tv.name)} />
        <meta property="og:type" content={SEO_CONFIG.tv.og.type} />
        <meta property="og:image" content={tmdbService.getPosterUrl(tv.poster_path)} />
        <meta property="og:url" content={SEO_CONFIG.tv.canonical.replace('{id}', tvId.toString())} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO_CONFIG.tv.og.title.replace('{tvTitle}', tv.name)} />
        <meta name="twitter:description" content={SEO_CONFIG.tv.og.description.replace('{tvTitle}', tv.name)} />
        <meta name="twitter:image" content={tmdbService.getPosterUrl(tv.poster_path)} />
      </Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {/* Hero Section - Adapté pour mobile */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-screen">
        <img
          src={tmdbService.getBackdropUrl(tv.backdrop_path)}
          alt={tv.name}
          className="w-full h-full object-cover"
          data-testid="tv-backdrop"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

        {/* Back button - Ajusté pour mobile */}
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full z-10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </Link>

        {/* TV info - Optimisé pour mobile */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 md:left-16 md:bottom-16 md:max-w-3xl z-10">
          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4" data-testid="tv-title">
            {tv.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 text-white/80 mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm md:text-base" data-testid="tv-metadata">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span>Première diffusion: {new Date(tv.first_air_date).getFullYear()}</span>
            </span>
            {tv.episode_run_time && tv.episode_run_time[0] && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span>Durée: {formatRuntime(tv.episode_run_time[0])}</span>
              </span>
            )}
            <span className="text-xs sm:text-sm">Genres: {tv.genres?.map((g: any) => g.name).join(", ")}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-accent fill-current" />
              <span>Note: {tv.vote_average.toFixed(1)}/10</span>
            </div>
          </div>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none" data-testid="tv-overview">
            {tv.overview}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4" data-testid="tv-actions">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground" 
              data-testid="watch-button"
              onClick={handleWatchSeries}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Regarder
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleToggleFavorite}
              disabled={isAddingToFavorites}
              data-testid="favorite-button"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Button>
            <Button variant="outline" onClick={handleShare} data-testid="share-button">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      {/* TV Details - Adapté pour mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cast and Crew - Adapté pour mobile */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Casting</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {cast.map((person: any) => (
                  <div key={person.id} className="text-center">
                    <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden">
                      {person.profile_path ? (
                        <img 
                          src={tmdbService.getProfileUrl(person.profile_path)} 
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-muted-foreground text-xs">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Équipe</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {crew.map((person: any) => (
                  <div key={person.id} className="text-center">
                    <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden">
                      {person.profile_path ? (
                        <img 
                          src={tmdbService.getProfileUrl(person.profile_path)} 
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-muted-foreground text-xs">{person.job}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TV Info - Adapté pour mobile */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Informations</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Première diffusion</h3>
                <p>{new Date(tv.first_air_date).toLocaleDateString('fr-FR')}</p>
              </div>
              
              {tv.last_air_date && (
                <div>
                  <h3 className="font-semibold mb-1">Dernière diffusion</h3>
                  <p>{new Date(tv.last_air_date).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              
              {tv.number_of_seasons && (
                <div>
                  <h3 className="font-semibold mb-1">Saisons</h3>
                  <p>{tv.number_of_seasons}</p>
                </div>
              )}
              
              {tv.number_of_episodes && (
                <div>
                  <h3 className="font-semibold mb-1">Épisodes</h3>
                  <p>{tv.number_of_episodes}</p>
                </div>
              )}
              
              {tv.episode_run_time && tv.episode_run_time[0] && (
                <div>
                  <h3 className="font-semibold mb-1">Durée moyenne</h3>
                  <p>{formatRuntime(tv.episode_run_time[0])}</p>
                </div>
              )}
              
              {tv.genres && tv.genres.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {tv.genres.map((genre: any) => (
                      <span key={genre.id} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {tv.networks && tv.networks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Chaînes de diffusion</h3>
                  <div className="space-y-2">
                    {tv.networks.slice(0, 3).map((network: any) => (
                      <div key={network.id} className="flex items-center">
                        {network.logo_path ? (
                          <img 
                            src={tmdbService.getImageUrl(network.logo_path)} 
                            alt={network.name}
                            className="w-8 h-8 object-contain mr-2"
                          />
                        ) : (
                          <Globe className="w-8 h-8 text-muted-foreground mr-2" />
                        )}
                        <span>{network.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {tv.created_by && tv.created_by.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Créateurs</h3>
                  <div className="space-y-1">
                    {tv.created_by.map((creator: any) => (
                      <p key={creator.id}>{creator.name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seasons Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {tv.seasons && tv.seasons.length > 0 && (
          <div className="mb-6 sm:mb-8" data-testid="seasons-section">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Saisons</h2>
            <div className="space-y-3 sm:space-y-4">
              {tv.seasons.filter((season: any) => season.season_number > 0).map((season: any) => {
                const isExpanded = expandedSeasons.has(season.season_number);
                const seasonEpisodes = episodesBySeason[season.season_number] || [];
                
                return (
                  <div key={season.season_number} className="border border-gray-700 rounded-lg" data-testid={`season-${season.season_number}`}>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="flex-shrink-0">
                            {season.poster_path ? (
                              <img 
                                src={tmdbService.getPosterUrl(season.poster_path)} 
                                alt={`Saison ${season.season_number}`}
                                className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-16 sm:w-16 sm:h-24 bg-muted rounded flex items-center justify-center">
                                <Tv className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base">Saison {season.season_number}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {season.episode_count} épisodes
                            </p>
                            {season.air_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(season.air_date).getFullYear()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-shrink-0"
                          onClick={() => toggleSeason(season.season_number)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-700">
                        <div className="p-3 sm:p-4 space-y-2">
                          {episodesLoading ? (
                            <div className="flex justify-center py-8">
                              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <span className="ml-3">Chargement des épisodes...</span>
                            </div>
                          ) : episodesError ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>Erreur lors du chargement des épisodes.</p>
                              <p className="text-sm mt-2">Veuillez réessayer plus tard.</p>
                            </div>
                          ) : seasonEpisodes.length > 0 ? (
                            seasonEpisodes.map((episode: any) => {
                              const episodeKey = `${season.season_number}-${episode.episodeNumber}`;
                              const episodeImage = episodeImages[episodeKey] || null;
                              
                              return (
                                <EpisodeCard
                                  key={`${season.season_number}-${episode.episodeNumber}`}
                                  episode={{
                                    air_date: episode.releaseDate || episode.air_date || '',
                                    episode_number: episode.episodeNumber || episode.episode_number,
                                    id: episode.id || 0,
                                    name: episode.title || episode.name || `Épisode ${episode.episodeNumber || episode.episode_number}`,
                                    overview: episode.description || episode.overview || 'Aucune description disponible',
                                    production_code: episode.productionCode || episode.production_code || '',
                                    runtime: episode.duration || episode.runtime || null,
                                    season_number: season.season_number,
                                    show_id: tv.id,
                                    still_path: episode.stillPath || episode.still_path || null,
                                    vote_average: episode.voteAverage || episode.vote_average || 0,
                                    vote_count: episode.voteCount || episode.vote_count || 0,
                                    crew: episode.crew || [],
                                    guest_stars: episode.guestStars || episode.guest_stars || []
                                  }}
                                  tvId={tv.id}
                                  seasonNumber={season.season_number}
                                  episodeImage={episodeImage}
                                  onPlay={() => window.location.href = `/watch/tv/${tv.id}/${season.season_number}/${episode.episodeNumber || episode.episode_number}`}
                                />
                              );
                            })
                          ) : (
                            // Fallback to placeholder episodes if no real episodes in DB
                            Array.from({ length: season.episode_count || 10 }, (_, i) => {
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
                                    show_id: tv.id,
                                    still_path: null,
                                    vote_average: 0,
                                    vote_count: 0,
                                    crew: [],
                                    guest_stars: []
                                  }}
                                  tvId={tv.id}
                                  seasonNumber={season.season_number}
                                  episodeImage={episodeImage}
                                  onPlay={() => window.location.href = `/watch/tv/${tv.id}/${season.season_number}/${i + 1}`}
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