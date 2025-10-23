import React from 'react';
import { TVDetails } from '@/types/movie';

interface TVDetailStructuredDataProps {
  tvDetails: TVDetails;
}

const TVDetailStructuredData: React.FC<TVDetailStructuredDataProps> = ({ tvDetails }) => {
  const { credits, videos } = tvDetails;
  
  // Extract trailer information
  const trailer = videos?.results?.find(video => 
    video.type === "Trailer" && video.site === "YouTube"
  );
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": tvDetails.name,
    "alternateName": tvDetails.original_name,
    "description": tvDetails.overview,
    "image": [
      `https://image.tmdb.org/t/p/w500${tvDetails.poster_path}`,
      `https://image.tmdb.org/t/p/w1280${tvDetails.backdrop_path}`
    ],
    "datePublished": tvDetails.first_air_date,
    "endDate": tvDetails.last_air_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tvDetails.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": tvDetails.vote_count
    },
    "genre": tvDetails.genres?.map(genre => genre.name) || [],
    "numberOfSeasons": tvDetails.number_of_seasons,
    "numberOfEpisodes": tvDetails.number_of_episodes,
    "actor": credits?.cast?.slice(0, 10)
      .map(actor => actor.name) || [],
    "creator": credits?.crew?.filter(person => person.job === "Creator")
      .map(creator => creator.name) || [],
    "contentRating": tvDetails.adult ? "TV-MA" : "TV-14",
    "trailer": trailer ? {
      "@type": "VideoObject",
      "name": trailer.name,
      "description": tvDetails.overview,
      "thumbnailUrl": `https://image.tmdb.org/t/p/w500${tvDetails.poster_path}`,
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
      "url": `https://streamflix2-o7vx.onrender.com/tv/${tvDetails.id}`
    }
  };

  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
    />
  );
};

export default TVDetailStructuredData;