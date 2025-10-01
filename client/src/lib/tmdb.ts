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
  
  // Method to clear specific cache entries
  clearKey(key: string): void {
    this.cache.delete(key);
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

  private async fetchWithRetry(url: string, options?: RequestInit, maxRetries: number = 3): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for rate limiter
        await this.rateLimiter.wait();

        const response = await fetch(url, options);

        // If successful or not a rate limit error, return the response
        if (response.ok || response.status !== 429) {
          return response;
        }

        // If rate limited and we have retries left, wait with exponential backoff
        if (response.status === 429 && attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
          console.log(`Rate limited, retrying in ${backoffTime}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }

        // If rate limited and no retries left, return the response
        return response;

      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.log(`Request failed, retrying in ${backoffTime}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
      }
    }

    throw lastError!;
  }

  async getTrending(): Promise<TMDBMovie[]> {
    const cacheKey = "trending";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached trending movies");
      return cached;
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/trending`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/popular`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/genre/${genreId}`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/movie/${id}`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/popular`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/top_rated`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/on_the_air`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/airing_today`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/genre/${genreId}`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/${id}`);
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/search?query=${encodeURIComponent(query)}`);
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

  async getTVSeasonDetails(tvId: number, seasonNumber: number): Promise<any> {
    const cacheKey = `tv-${tvId}-season-${seasonNumber}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Returning cached season details for TV ${tvId}, season ${seasonNumber}`);
      return cached;
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/tv/${tvId}/season/${seasonNumber}`);
      console.log(`[DEBUG] TMDB season response status: ${response.status}, content-type: ${response.headers.get('content-type')}`);
      if (!response.ok) {
        console.log(`[DEBUG] TMDB season response not ok, status: ${response.status}`);
        throw new Error("Failed to fetch TV season details");
      }
      const data = await response.json();
      console.log(`[DEBUG] TMDB season data received:`, data);

      // Cache the result
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching TV season details:", error);
      throw error;
    }
  }

  // Multi-search for both movies and TV shows
  async multiSearch(query: string): Promise<(TMDBMovie | TMDBTVSeries)[]> {
    // Don't cache search results as they're user-specific
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/multi-search?query=${encodeURIComponent(query)}`);
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
  
  // New method to fetch featured content with links
  async getFeaturedContent(): Promise<{movies: TMDBMovie[], tvShows: TMDBTVSeries[]}> {
    const cacheKey = "featured-content";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached featured content");
      return cached;
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/featured-content`);
      if (!response.ok) {
        console.error("Featured content API error:", response.status, response.statusText);
        return {movies: [], tvShows: []};
      }
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, data);
      console.log("Fetched and cached featured content:", data);
      return data;
    } catch (error) {
      console.error("Error fetching featured content:", error);
      return {movies: [], tvShows: []};
    }
  }
  
  // New method to fetch content with links
  async getContentWithLinks(): Promise<TMDBMovie[]> {
    const cacheKey = "content-with-links";
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log("Returning cached content with links");
      return cached;
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/content-with-links`);
      if (!response.ok) {
        console.error("Content with links API error:", response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, data);
      console.log("Fetched and cached content with links:", data);
      return data;
    } catch (error) {
      console.error("Error fetching content with links:", error);
      return [];
    }
  }
  
  // Method to clear specific cache entries (useful when content is deleted)
  clearContentCache(): void {
    // Clear popular movies cache
    this.cache.clearKey("popular");
    
    // Clear genre caches (action, comedy, horror)
    this.cache.clearKey("genre-28");  // Action
    this.cache.clearKey("genre-35");  // Comedy
    this.cache.clearKey("genre-27");  // Horror
    
    // Clear TV show caches
    this.cache.clearKey("tv-popular");
    this.cache.clearKey("tv-top-rated");
    this.cache.clearKey("tv-on-the-air");
    this.cache.clearKey("tv-airing-today");
    
    // Clear featured content caches
    this.cache.clearKey("featured-content");
    this.cache.clearKey("content-with-links");
    
    console.log("TMDB content cache cleared");
  }
}

export const tmdbService = new TMDBService();