import express from "express";
import Bottleneck from "bottleneck"; // Importez Bottleneck
const router = express.Router();

// Configurez le limiteur de débit pour TMDB
const limiter = new Bottleneck({
  minTime: 350, // Attendre 350 ms entre chaque requête
  maxConcurrent: 1, // 1 requête à la fois
});

// Fonction pour appeler TMDB avec limite
const fetchTMDB = limiter.wrap(async (url) => {
  const res = await fetch(url);
  return res;
});

// Simple in-memory cache for TMDB responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
function getCachedData(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

// Helper function to set cached data
function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// TMDB API proxy endpoints with better error handling
router.get("/tmdb/trending", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("TMDB_API_KEY is not configured in environment variables");
      // Return mock data if API key is not configured
      const mockTrending = {
        results: [
          {
            id: 1,
            title: "Mock Movie 1",
            overview: "This is a mock movie description for testing purposes.",
            release_date: "2023-01-01",
            vote_average: 7.5,
            poster_path: "/mock-poster1.jpg",
            backdrop_path: "/mock-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          },
          {
            id: 2,
            name: "Mock TV Show 1",
            overview: "This is a mock TV show description for testing purposes.",
            first_air_date: "2022-01-01",
            vote_average: 8.0,
            poster_path: "/mock-tv-poster1.jpg",
            backdrop_path: "/mock-tv-backdrop1.jpg",
            genre_ids: [18, 9648]
          }
        ]
      };
      return res.json(mockTrending);
    }

    const cacheKey = "trending";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached trending data");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=fr-FR`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({ 
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429 
        });
      }
      // Return mock data on API error
      const mockTrending = {
        results: [
          {
            id: 1,
            title: "Mock Movie 1",
            overview: "This is a mock movie description for testing purposes.",
            release_date: "2023-01-01",
            vote_average: 7.5,
            poster_path: "/mock-poster1.jpg",
            backdrop_path: "/mock-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          },
          {
            id: 2,
            name: "Mock TV Show 1",
            overview: "This is a mock TV show description for testing purposes.",
            first_air_date: "2022-01-01",
            vote_average: 8.0,
            poster_path: "/mock-tv-poster1.jpg",
            backdrop_path: "/mock-tv-backdrop1.jpg",
            genre_ids: [18, 9648]
          }
        ]
      };
      return res.json(mockTrending);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching trending content:", error);
    // Return mock data on error
    const mockTrending = {
      results: [
        {
          id: 1,
          title: "Mock Movie 1",
          overview: "This is a mock movie description for testing purposes.",
          release_date: "2023-01-01",
          vote_average: 7.5,
          poster_path: "/mock-poster1.jpg",
          backdrop_path: "/mock-backdrop1.jpg",
          genre_ids: [28, 12, 878]
        },
        {
          id: 2,
          name: "Mock TV Show 1",
          overview: "This is a mock TV show description for testing purposes.",
          first_air_date: "2022-01-01",
          vote_average: 8.0,
          poster_path: "/mock-tv-poster1.jpg",
          backdrop_path: "/mock-tv-backdrop1.jpg",
          genre_ids: [18, 9648]
        }
      ]
    };
    res.json(mockTrending);
  }
});

// Popular movies
router.get("/tmdb/popular", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("TMDB_API_KEY is not configured in environment variables");
      // Return mock data if API key is not configured
      const mockPopular = {
        results: [
          {
            id: 1,
            title: "Mock Movie 1",
            overview: "This is a mock movie description for testing purposes.",
            release_date: "2023-01-01",
            vote_average: 7.5,
            poster_path: "/mock-poster1.jpg",
            backdrop_path: "/mock-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          },
          {
            id: 2,
            title: "Mock Movie 2",
            overview: "This is another mock movie description for testing purposes.",
            release_date: "2023-02-01",
            vote_average: 6.8,
            poster_path: "/mock-poster2.jpg",
            backdrop_path: "/mock-backdrop2.jpg",
            genre_ids: [35, 10749]
          }
        ]
      };
      return res.json(mockPopular);
    }

    const cacheKey = "popular";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached popular movies");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=1`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({ 
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429 
        });
      }
      // Return mock data on API error
      const mockPopular = {
        results: [
          {
            id: 1,
            title: "Mock Movie 1",
            overview: "This is a mock movie description for testing purposes.",
            release_date: "2023-01-01",
            vote_average: 7.5,
            poster_path: "/mock-poster1.jpg",
            backdrop_path: "/mock-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          },
          {
            id: 2,
            title: "Mock Movie 2",
            overview: "This is another mock movie description for testing purposes.",
            release_date: "2023-02-01",
            vote_average: 6.8,
            poster_path: "/mock-poster2.jpg",
            backdrop_path: "/mock-backdrop2.jpg",
            genre_ids: [35, 10749]
          }
        ]
      };
      return res.json(mockPopular);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    // Return mock data on error
    const mockPopular = {
      results: [
        {
          id: 1,
          title: "Mock Movie 1",
          overview: "This is a mock movie description for testing purposes.",
          release_date: "2023-01-01",
          vote_average: 7.5,
          poster_path: "/mock-poster1.jpg",
          backdrop_path: "/mock-backdrop1.jpg",
          genre_ids: [28, 12, 878]
        },
        {
          id: 2,
          title: "Mock Movie 2",
          overview: "This is another mock movie description for testing purposes.",
          release_date: "2023-02-01",
          vote_average: 6.8,
          poster_path: "/mock-poster2.jpg",
          backdrop_path: "/mock-backdrop2.jpg",
            genre_ids: [35, 10749]
        }
      ]
    };
    res.json(mockPopular);
  }
});

// Movies by genre
router.get("/tmdb/genre/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("TMDB_API_KEY is not configured in environment variables");
      // Return mock data if API key is not configured
      const mockGenreData = {
        results: [
          {
            id: 1,
            title: "Mock Movie 1",
            overview: "This is a mock movie description for testing purposes.",
            release_date: "2023-01-01",
            vote_average: 7.5,
            poster_path: "/mock-poster1.jpg",
            backdrop_path: "/mock-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          }
        ]
      };
      return res.json(mockGenreData);
    }

    const cacheKey = `genre-${genreId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached movies for genre ${genreId}`);
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=fr-FR&with_genres=${genreId}&page=1`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      // Return mock data on API error
      const mockGenreData = {
        results: [
          {
            id: 1,
            title: "Mock Movie 1",
            overview: "This is a mock movie description for testing purposes.",
            release_date: "2023-01-01",
            vote_average: 7.5,
            poster_path: "/mock-poster1.jpg",
            backdrop_path: "/mock-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          }
        ]
      };
      return res.json(mockGenreData);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching movies by genre:", error);
    // Return mock data on error
    const mockGenreData = {
      results: [
        {
          id: 1,
          title: "Mock Movie 1",
          overview: "This is a mock movie description for testing purposes.",
          release_date: "2023-01-01",
          vote_average: 7.5,
          poster_path: "/mock-poster1.jpg",
          backdrop_path: "/mock-backdrop1.jpg",
          genre_ids: [28, 12, 878]
        }
      ]
    };
    res.json(mockGenreData);
  }
});

// Upcoming movies
router.get("/tmdb/movie/upcoming", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("TMDB_API_KEY is not configured in environment variables");
      // Return mock data if API key is not configured
      const mockUpcoming = {
        results: [
          {
            id: 1,
            title: "Mock Upcoming Movie 1",
            overview: "This is a mock upcoming movie description for testing purposes.",
            release_date: "2023-12-01",
            vote_average: 7.5,
            poster_path: "/mock-upcoming-poster1.jpg",
            backdrop_path: "/mock-upcoming-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          }
        ]
      };
      return res.json(mockUpcoming);
    }

    const cacheKey = "upcoming";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached upcoming movies");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=fr-FR&page=1`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      // Return mock data on API error
      const mockUpcoming = {
        results: [
          {
            id: 1,
            title: "Mock Upcoming Movie 1",
            overview: "This is a mock upcoming movie description for testing purposes.",
            release_date: "2023-12-01",
            vote_average: 7.5,
            poster_path: "/mock-upcoming-poster1.jpg",
            backdrop_path: "/mock-upcoming-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          }
        ]
      };
      return res.json(mockUpcoming);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching upcoming movies:", error);
    // Return mock data on error
    const mockUpcoming = {
      results: [
        {
          id: 1,
          title: "Mock Upcoming Movie 1",
          overview: "This is a mock upcoming movie description for testing purposes.",
          release_date: "2023-12-01",
          vote_average: 7.5,
          poster_path: "/mock-upcoming-poster1.jpg",
          backdrop_path: "/mock-upcoming-backdrop1.jpg",
          genre_ids: [28, 12, 878]
        }
      ]
    };
    res.json(mockUpcoming);
  }
});

// Now playing movies
router.get("/tmdb/movie/now_playing", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("TMDB_API_KEY is not configured in environment variables");
      // Return mock data if API key is not configured
      const mockNowPlaying = {
        results: [
          {
            id: 1,
            title: "Mock Now Playing Movie 1",
            overview: "This is a mock now playing movie description for testing purposes.",
            release_date: "2023-10-01",
            vote_average: 7.5,
            poster_path: "/mock-now-playing-poster1.jpg",
            backdrop_path: "/mock-now-playing-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          }
        ]
      };
      return res.json(mockNowPlaying);
    }

    const cacheKey = "now_playing";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached now playing movies");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=fr-FR&page=1`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      // Return mock data on API error
      const mockNowPlaying = {
        results: [
          {
            id: 1,
            title: "Mock Now Playing Movie 1",
            overview: "This is a mock now playing movie description for testing purposes.",
            release_date: "2023-10-01",
            vote_average: 7.5,
            poster_path: "/mock-now-playing-poster1.jpg",
            backdrop_path: "/mock-now-playing-backdrop1.jpg",
            genre_ids: [28, 12, 878]
          }
        ]
      };
      return res.json(mockNowPlaying);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching now playing movies:", error);
    // Return mock data on error
    const mockNowPlaying = {
      results: [
        {
          id: 1,
          title: "Mock Now Playing Movie 1",
          overview: "This is a mock now playing movie description for testing purposes.",
          release_date: "2023-10-01",
          vote_average: 7.5,
          poster_path: "/mock-now-playing-poster1.jpg",
          backdrop_path: "/mock-now-playing-backdrop1.jpg",
          genre_ids: [28, 12, 878]
        }
      ]
    };
    res.json(mockNowPlaying);
  }
});

// Movie details
router.get("/tmdb/movie/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = `movie-${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached movie details for ${id}`);
      return res.json(cached);
    }

    const [movieResponse, creditsResponse, videosResponse] = await Promise.all([
      fetchTMDB(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=fr-FR`),
      fetchTMDB(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`),
      fetchTMDB(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=fr-FR`)
    ]);

    if (!movieResponse.ok || !creditsResponse.ok || !videosResponse.ok) {
      // Handle rate limiting specifically
      if (movieResponse.status === 429 || creditsResponse.status === 429 || videosResponse.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error("TMDB API error");
    }

    const [movie, credits, videos] = await Promise.all([
      movieResponse.json(),
      creditsResponse.json(),
      videosResponse.json()
    ]);

    const result = { movie, credits, videos };
    
    // Cache the result
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// Search movies
router.get("/tmdb/search", async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).json({ error: "Failed to search movies" });
  }
});

// Popular TV shows
router.get("/tmdb/tv/popular", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = "tv-popular";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached popular TV shows");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching popular TV shows:", error);
    res.status(500).json({ error: "Failed to fetch popular TV shows" });
  }
});

// Top rated TV shows
router.get("/tmdb/tv/top_rated", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = "tv-top-rated";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached top rated TV shows");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&language=fr-FR&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching top rated TV shows:", error);
    res.status(500).json({ error: "Failed to fetch top rated TV shows" });
  }
});

// On the air TV shows
router.get("/tmdb/tv/on_the_air", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = "tv-on-the-air";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached on the air TV shows");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=fr-FR&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching on the air TV shows:", error);
    res.status(500).json({ error: "Failed to fetch on the air TV shows" });
  }
});

// Airing today TV shows
router.get("/tmdb/tv/airing_today", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = "tv-airing-today";
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("Returning cached airing today TV shows");
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/tv/airing_today?api_key=${apiKey}&language=fr-FR&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching airing today TV shows:", error);
    res.status(500).json({ error: "Failed to fetch airing today TV shows" });
  }
});

// TV shows by genre
router.get("/tmdb/tv/genre/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = `tv-genre-${genreId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached TV shows for genre ${genreId}`);
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=fr-FR&with_genres=${genreId}&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching TV shows by genre:", error);
    res.status(500).json({ error: "Failed to fetch TV shows by genre" });
  }
});

// TV show details
router.get("/tmdb/tv/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = `tv-${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached TV show details for ${id}`);
      return res.json(cached);
    }

    const [showResponse, creditsResponse, videosResponse] = await Promise.all([
      fetchTMDB(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=fr-FR`),
      fetchTMDB(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${apiKey}`),
      fetchTMDB(`https://api.themoviedb.org/3/tv/${id}/videos?api_key=${apiKey}&language=fr-FR`)
    ]);

    if (!showResponse.ok || !creditsResponse.ok || !videosResponse.ok) {
      // Handle rate limiting specifically
      if (showResponse.status === 429 || creditsResponse.status === 429 || videosResponse.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error("TMDB API error");
    }

    const [show, credits, videos] = await Promise.all([
      showResponse.json(),
      creditsResponse.json(),
      videosResponse.json()
    ]);

    const result = { show, credits, videos };
    
    // Cache the result
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Error fetching TV show details:", error);
    res.status(500).json({ error: "Failed to fetch TV show details" });
  }
});

// Search TV shows
router.get("/tmdb/tv/search", async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error searching TV shows:", error);
    res.status(500).json({ error: "Failed to search TV shows" });
  }
});

// TV season details
router.get("/tmdb/tv/:id/season/:seasonNumber", async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    console.log(`[DEBUG] TMDB API key configured: ${!!apiKey}`);
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const cacheKey = `tv-${id}-season-${seasonNumber}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached season details for TV ${id}, season ${seasonNumber}`);
      return res.json(cached);
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${apiKey}&language=fr-FR`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the result
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching TV season details:", error);
    res.status(500).json({ error: "Failed to fetch TV season details" });
  }
});

// Multi-search for both movies and TV shows
router.get("/tmdb/multi-search", async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const response = await fetchTMDB(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}&page=1`
    );

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        return res.status(429).json({
          error: "Trop de requêtes provenant de cette adresse IP, veuillez réessayer ultérieurement.",
          status: 429
        });
      }
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error multi-searching content:", error);
    res.status(500).json({ error: "Failed to search content" });
  }
});

export default router;