import { TMDBMovie, TMDBResponse, MovieDetails, TMDBTVSeries, TVResponse, TVDetails, TMDB_IMAGE_BASE_URL, TMDB_POSTER_SIZE, TMDB_BACKDROP_SIZE, TMDB_PROFILE_SIZE } from "@/types/movie";

// Simple in-memory cache
class Cache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttl;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item is expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Rate limiter to prevent 429 errors
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 35, timeWindow: number = 10000) { // 35 requests per 10 seconds
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldest) + 100; // Add 100ms buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.wait(); // Recursively check again
    }

    // Add current request
    this.requests.push(now);
  }
}

class TMDBService {
  private baseUrl = "/api/tmdb";
  private cache = new Cache();
  private rateLimiter = new RateLimiter();

  async getTrending(): Promise<TMDBMovie[]> {
    const cacheKey = "trending";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached trending movies");
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/trending`);
      if (!response.ok) {
        console.error("TMDB API error:", response.status, response.statusText);
        return [];
      }
      const data: TMDBResponse = await response.json();
      const result = data.results || [];
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      return [];
    }
  }

  async getPopular(): Promise<TMDBMovie[]> {
    const cacheKey = "popular";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached popular movies");
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/popular`);
      if (!response.ok) {
        console.error("TMDB API error:", response.status, response.statusText);
        return [];
      }
      const data: TMDBResponse = await response.json();
      const result = data.results || [];
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      return [];
    }
  }

  async getMoviesByGenre(genreId: number): Promise<TMDBMovie[]> {
    const cacheKey = `genre-${genreId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Returning cached movies for genre ${genreId}`);
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/genre/${genreId}`);
      if (!response.ok) {
        console.error("TMDB API error:", response.status, response.statusText);
        return [];
      }
      const data: TMDBResponse = await response.json();
      const result = data.results || [];
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching movies by genre:", error);
      return [];
    }
  }

  async getMovieDetails(id: number): Promise<MovieDetails> {
    const cacheKey = `movie-${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Returning cached movie details for ${id}`);
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/movie/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch movie details");
      }
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching movie details:", error);
      throw error;
    }
  }

  async searchMovies(query: string): Promise<TMDBMovie[]> {
    // Don't cache search results as they're user-specific
    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search movies");
      }
      const data: TMDBResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error searching movies:", error);
      throw error;
    }
  }

  getImageUrl(path: string | null, size: string = TMDB_POSTER_SIZE): string {
    if (!path) return "/placeholder-movie.jpg";
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getPosterUrl(path: string | null): string {
    return this.getImageUrl(path, TMDB_POSTER_SIZE);
  }

  getBackdropUrl(path: string | null): string {
    return this.getImageUrl(path, TMDB_BACKDROP_SIZE);
  }

  getProfileUrl(path: string | null): string {
    return this.getImageUrl(path, TMDB_PROFILE_SIZE);
  }

  // TV Series methods
  async getPopularTVShows(): Promise<TMDBTVSeries[]> {
    const cacheKey = "tv-popular";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached popular TV shows");
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/popular`);
      if (!response.ok) {
        throw new Error("Failed to fetch popular TV shows");
      }
      const data: TVResponse = await response.json();
      const result = data.results;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching popular TV shows:", error);
      throw error;
    }
  }

  async getTopRatedTVShows(): Promise<TMDBTVSeries[]> {
    const cacheKey = "tv-top-rated";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached top rated TV shows");
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/top_rated`);
      if (!response.ok) {
        throw new Error("Failed to fetch top rated TV shows");
      }
      const data: TVResponse = await response.json();
      const result = data.results;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching top rated TV shows:", error);
      throw error;
    }
  }

  async getOnTheAirTVShows(): Promise<TMDBTVSeries[]> {
    const cacheKey = "tv-on-the-air";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached on the air TV shows");
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/on_the_air`);
      if (!response.ok) {
        throw new Error("Failed to fetch on the air TV shows");
      }
      const data: TVResponse = await response.json();
      const result = data.results;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching on the air TV shows:", error);
      throw error;
    }
  }

  async getAiringTodayTVShows(): Promise<TMDBTVSeries[]> {
    const cacheKey = "tv-airing-today";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached airing today TV shows");
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/airing_today`);
      if (!response.ok) {
        throw new Error("Failed to fetch airing today TV shows");
      }
      const data: TVResponse = await response.json();
      const result = data.results;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching airing today TV shows:", error);
      throw error;
    }
  }

  async getTVShowsByGenre(genreId: number): Promise<TMDBTVSeries[]> {
    const cacheKey = `tv-genre-${genreId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Returning cached TV shows for genre ${genreId}`);
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/genre/${genreId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch TV shows by genre");
      }
      const data: TVResponse = await response.json();
      const result = data.results;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error fetching TV shows by genre:", error);
      throw error;
    }
  }

  async getTVShowDetails(id: number): Promise<TVDetails | any> {
    const cacheKey = `tv-${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Returning cached TV show details for ${id}`);
      return cached;
    }

    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/${id}`);
      if (!response.ok) {
        console.error(`Failed to fetch TV show details for ID ${id}:`, response.status, response.statusText);
        throw new Error(`Failed to fetch TV show details: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching TV show details:", error);
      throw error;
    }
  }

  async searchTVShows(query: string): Promise<TMDBTVSeries[]> {
    // Don't cache search results as they're user-specific
    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/tv/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search TV shows");
      }
      const data: TVResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error searching TV shows:", error);
      throw error;
    }
  }

  // Multi-search for both movies and TV shows
  async multiSearch(query: string): Promise<(TMDBMovie | TMDBTVSeries)[]> {
    // Don't cache search results as they're user-specific
    try {
      // Wait for rate limiter
      await this.rateLimiter.wait();
      
      const response = await fetch(`${this.baseUrl}/multi-search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search content");
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error searching content:", error);
      throw error;
    }
  }

  // Clear cache (useful for development or when data needs to be refreshed)
  clearCache(): void {
    this.cache.clear();
    console.log("TMDB cache cleared");
  }
}

export const tmdbService = new TMDBService();