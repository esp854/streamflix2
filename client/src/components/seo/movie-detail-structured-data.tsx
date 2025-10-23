import React from 'react';
import { MovieDetails } from '@/types/movie';

interface MovieDetailStructuredDataProps {
  movieDetails: MovieDetails;
}

const MovieDetailStructuredData: React.FC<MovieDetailStructuredDataProps> = ({ movieDetails }) => {
  const { movie, credits, videos } = movieDetails;
  
  // Extract trailer information
  const trailer = videos?.results?.find(video => 
    video.type === "Trailer" && video.site === "YouTube"
  );
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "alternateName": movie.original_title,
    "description": movie.overview,
    "image": [
      `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    ],
    "datePublished": movie.release_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": movie.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": movie.vote_count
    },
    "genre": movie.genres?.map(genre => genre.name) || [],
    "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
    "director": credits?.crew?.filter(person => person.job === "Director")
      .map(director => director.name) || [],
    "actor": credits?.cast?.slice(0, 10)
      .map(actor => actor.name) || [],
    "contentRating": movie.adult ? "R" : "PG",
    "trailer": trailer ? {
      "@type": "VideoObject",
      "name": trailer.name,
      "description": movie.overview,
      "thumbnailUrl": `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      "uploadDate": trailer.published_at,
      "duration": "PT2M30S", // Approximate trailer duration
      "contentUrl": `https://www.youtube.com/watch?v=${trailer.key}`,
      "embedUrl": `https://www.youtube.com/embed/${trailer.key}`
    } : undefined,
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

export default MovieDetailStructuredData;