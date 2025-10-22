export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  genres?: Genre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  original_language: string;
  runtime?: number;
  status?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  production_companies?: ProductionCompany[];
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface Videos {
  results: Video[];
}

export interface MovieDetails {
  movie: TMDBMovie;
  credits: Credits;
  videos: Videos;
}

export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
export const TMDB_POSTER_SIZE = "w500";
export const TMDB_BACKDROP_SIZE = "w1280";
export const TMDB_PROFILE_SIZE = "w185";

// TV Series interface
export interface TMDBTVSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  genres?: Genre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  tagline?: string;
  in_production?: boolean;
  budget?: number;
  revenue?: number;
  production_companies?: ProductionCompany[];
}

// Interface for TV episode
export interface TVSeasonEpisode {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  runtime: number | null;
  season_number: number;
  show_id: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  crew: CrewMember[];
  guest_stars: CastMember[];
}

// Interface for TV season details
export interface TVSeasonDetails {
  _id: string;
  air_date: string;
  episodes: TVSeasonEpisode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TVResponse {
  page: number;
  results: TMDBTVSeries[];
  total_pages: number;
  total_results: number;
}

export interface TVDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  genre_ids: number[];
  genres?: Genre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  tagline?: string;
  in_production?: boolean;
  credits: Credits;
  videos: Videos;
  budget?: number;
  revenue?: number;
  production_companies?: ProductionCompany[];
}

export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Aventure",
  16: "Animation",
  35: "Comédie",
  80: "Crime",
  99: "Documentaire",
  18: "Drame",
  10751: "Familial",
  14: "Fantastique",
  36: "Histoire",
  27: "Horreur",
  10402: "Musique",
  9648: "Mystère",
  10749: "Romance",
  878: "Science-Fiction",
  10770: "Téléfilm",
  53: "Thriller",
  10752: "Guerre",
  37: "Western",
};

// TV-specific genres
export const TV_GENRE_MAP: Record<number, string> = {
  10759: "Action & Aventure",
  16: "Animation",
  35: "Comédie",
  80: "Crime",
  99: "Documentaire",
  18: "Drame",
  10751: "Familial",
  10762: "Enfants",
  9648: "Mystère",
  10763: "Actualités",
  10764: "Réalité",
  10765: "Science-Fiction & Fantastique",
  10766: "Soap",
  10767: "Talk",
  10768: "Guerre & Politique",
  37: "Western",
};