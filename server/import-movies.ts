#!/usr/bin/env node

// Script to import popular movies from TMDB into the database
import 'dotenv/config';
import { storage } from './storage';
import { eq } from 'drizzle-orm';

// Simple cache for TMDB responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
function getCachedData(key: string) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

// Helper function to set cached data
function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Function to fetch popular movies from TMDB
async function fetchPopularMovies(page: number = 1): Promise<any[]> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB_API_KEY is not configured in environment variables');
      return [];
    }

    const cacheKey = `popular-${page}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached popular movies for page ${page}`);
      return cached;
    }

    console.log(`Fetching popular movies from TMDB (page ${page})...`);
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=${page}`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const movies = data.results || [];
    
    // Cache the result
    setCachedData(cacheKey, movies);
    console.log(`Fetched ${movies.length} movies from TMDB (page ${page})`);
    return movies;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
}

// Function to fetch TV shows from TMDB
async function fetchPopularTVShows(page: number = 1): Promise<any[]> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB_API_KEY is not configured in environment variables');
      return [];
    }

    const cacheKey = `tv-popular-${page}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached popular TV shows for page ${page}`);
      return cached;
    }

    console.log(`Fetching popular TV shows from TMDB (page ${page})...`);
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=fr-FR&page=${page}`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const shows = data.results || [];
    
    // Cache the result
    setCachedData(cacheKey, shows);
    console.log(`Fetched ${shows.length} TV shows from TMDB (page ${page})`);
    return shows;
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
    return [];
  }
}

// Function to check if content already exists in database
async function contentExists(tmdbId: number): Promise<boolean> {
  try {
    const existingContent = await storage.getContentByTmdbIdAnyStatus(tmdbId);
    return !!existingContent;
  } catch (error) {
    console.error(`Error checking if content exists for TMDB ID ${tmdbId}:`, error);
    return false;
  }
}

// Function to add a movie to the database
async function addMovieToDatabase(movie: any): Promise<boolean> {
  try {
    // Check if movie already exists
    if (await contentExists(movie.id)) {
      console.log(`Movie "${movie.title}" (TMDB ID: ${movie.id}) already exists in database`);
      return false;
    }

    // Prepare content data
    const contentData = {
      tmdbId: movie.id,
      title: movie.title,
      description: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      genres: movie.genre_ids || [],
      odyseeUrl: '', // Empty by default, will be filled when video link is added
      muxPlaybackId: '',
      muxUrl: '',
      language: 'vf', // Default to French
      quality: 'hd', // Default to HD
      mediaType: 'movie',
      rating: Math.round(movie.vote_average * 10), // Convert to 0-100 scale
      active: true
    };

    // Add to database
    const newContent = await storage.createContent(contentData);
    console.log(`Added movie "${movie.title}" (TMDB ID: ${movie.id}) to database with ID: ${newContent.id}`);
    return true;
  } catch (error) {
    console.error(`Error adding movie "${movie.title}" to database:`, error);
    return false;
  }
}

// Function to add a TV show to the database
async function addTVShowToDatabase(show: any): Promise<boolean> {
  try {
    // Check if TV show already exists
    if (await contentExists(show.id)) {
      console.log(`TV show "${show.name}" (TMDB ID: ${show.id}) already exists in database`);
      return false;
    }

    // Prepare content data
    const contentData = {
      tmdbId: show.id,
      title: show.name,
      description: show.overview,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      releaseDate: show.first_air_date,
      genres: show.genre_ids || [],
      odyseeUrl: '', // Empty by default, will be filled when video link is added
      muxPlaybackId: '',
      muxUrl: '',
      language: 'vf', // Default to French
      quality: 'hd', // Default to HD
      mediaType: 'tv',
      rating: Math.round(show.vote_average * 10), // Convert to 0-100 scale
      active: true
    };

    // Add to database
    const newContent = await storage.createContent(contentData);
    console.log(`Added TV show "${show.name}" (TMDB ID: ${show.id}) to database with ID: ${newContent.id}`);
    return true;
  } catch (error) {
    console.error(`Error adding TV show "${show.name}" to database:`, error);
    return false;
  }
}

// Main function to import movies and TV shows
async function importContent() {
  console.log('Starting content import from TMDB...');
  
  let totalMoviesAdded = 0;
  let totalTVShowsAdded = 0;
  
  // Import popular movies (first 5 pages = 100 movies)
  console.log('\n--- Importing Popular Movies ---');
  for (let page = 1; page <= 5; page++) {
    console.log(`\nProcessing page ${page} of popular movies...`);
    const movies = await fetchPopularMovies(page);
    
    if (movies.length === 0) {
      console.log('No movies found, stopping import');
      break;
    }
    
    // Add each movie to database
    for (const movie of movies) {
      const added = await addMovieToDatabase(movie);
      if (added) {
        totalMoviesAdded++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Import popular TV shows (first 5 pages = 100 shows)
  console.log('\n--- Importing Popular TV Shows ---');
  for (let page = 1; page <= 5; page++) {
    console.log(`\nProcessing page ${page} of popular TV shows...`);
    const shows = await fetchPopularTVShows(page);
    
    if (shows.length === 0) {
      console.log('No TV shows found, stopping import');
      break;
    }
    
    // Add each TV show to database
    for (const show of shows) {
      const added = await addTVShowToDatabase(show);
      if (added) {
        totalTVShowsAdded++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n--- Import Summary ---');
  console.log(`Total movies added: ${totalMoviesAdded}`);
  console.log(`Total TV shows added: ${totalTVShowsAdded}`);
  console.log('Content import completed!');
}

// Run the import
importContent().catch(error => {
  console.error('Error during content import:', error);
  process.exit(1);
});