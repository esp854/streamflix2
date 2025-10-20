import { config } from "dotenv";
import fetch from "node-fetch";

// Load environment variables
config();

// Frembed API configuration
const FREMBED_API_KEY = process.env.FREMbed_API_KEY;
const FREMBED_BASE_URL = "https://frembed.cfd/api";

interface FrembedMovieResponse {
  id: string;
  title: string;
  year: number;
  imdbId?: string;
  tmdbId?: number;
  sources: FrembedSource[];
}

interface FrembedSource {
  url: string;
  quality: string;
  type: string;
}

interface FrembedTVResponse {
  id: string;
  title: string;
  year: number;
  seasons: FrembedSeason[];
}

interface FrembedSeason {
  season: number;
  episodes: FrembedEpisode[];
}

interface FrembedEpisode {
  episode: number;
  title: string;
  sources: FrembedSource[];
}

export class FrembedService {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = FREMBED_API_KEY;
    this.baseUrl = FREMBED_BASE_URL;
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for a movie by TMDB ID
   */
  async getMovieByTmdbId(tmdbId: number): Promise<FrembedMovieResponse | null> {
    if (!this.apiKey) {
      throw new Error("Frembed API key not configured");
    }

    try {
      // Utilisation de l'endpoint API correct pour les films
      const response = await fetch(
        `${this.baseUrl}/movie?tmdb=${tmdbId}&api_key=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Movie not found
        }
        throw new Error(`Frembed API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      return data as FrembedMovieResponse;
    } catch (error) {
      console.error("Error fetching movie from Frembed:", error);
      throw error;
    }
  }

  /**
   * Search for a TV show by TMDB ID
   */
  async getTVShowByTmdbId(tmdbId: number): Promise<FrembedTVResponse | null> {
    if (!this.apiKey) {
      throw new Error("Frembed API key not configured");
    }

    try {
      // Utilisation de l'endpoint API correct pour les séries
      const response = await fetch(
        `${this.baseUrl}/tv?tmdb=${tmdbId}&api_key=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // TV show not found
        }
        throw new Error(`Frembed API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      return data as FrembedTVResponse;
    } catch (error) {
      console.error("Error fetching TV show from Frembed:", error);
      throw error;
    }
  }

  /**
   * Get episode sources by TMDB ID, season, and episode
   */
  async getEpisodeSources(tmdbId: number, season: number, episode: number): Promise<FrembedSource[] | null> {
    if (!this.apiKey) {
      throw new Error("Frembed API key not configured");
    }

    try {
      // Utilisation de l'endpoint API correct pour les épisodes
      const response = await fetch(
        `${this.baseUrl}/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&api_key=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Episode not found
        }
        throw new Error(`Frembed API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      return data.sources || null;
    } catch (error) {
      console.error("Error fetching episode sources from Frembed:", error);
      throw error;
    }
  }

  /**
   * Get movie sources by TMDB ID
   */
  async getMovieSources(tmdbId: number): Promise<FrembedSource[] | null> {
    if (!this.apiKey) {
      throw new Error("Frembed API key not configured");
    }

    try {
      // Utilisation de l'endpoint API correct pour les sources de films
      const response = await fetch(
        `${this.baseUrl}/movie/sources?tmdb=${tmdbId}&api_key=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Movie sources not found
        }
        throw new Error(`Frembed API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      return data.sources || null;
    } catch (error) {
      console.error("Error fetching movie sources from Frembed:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const frembedService = new FrembedService();