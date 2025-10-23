import React from 'react';
import { TMDBMovie } from '@/types/movie';

interface MovieStructuredDataProps {
  movie: TMDBMovie;
}

const MovieStructuredData: React.FC<MovieStructuredDataProps> = ({ movie }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "alternateName": movie.original_title,
    "description": movie.overview,
    "image": `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    "datePublished": movie.release_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": movie.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": movie.vote_count
    },
    "genre": movie.genres?.map(genre => genre.name) || movie.genre_ids?.map(id => {
      // Map genre IDs to names (simplified)
      const genreMap: Record<number, string> = {
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
        37: "Western"
      };
      return genreMap[id] || "Divers";
    }) || [],
    "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
    "director": [], // Would need to fetch this from API
    "actor": [], // Would need to fetch this from API
    "contentRating": "R", // Simplified rating
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "EUR",
      "url": `https://streamflix2-o7vx.onrender.com/movie/${movie.id}`
    }
  };

  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
    />
  );
};

export default MovieStructuredData;