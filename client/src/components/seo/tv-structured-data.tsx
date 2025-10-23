import React from 'react';
import { TMDBTVSeries } from '@/types/movie';

interface TVStructuredDataProps {
  series: TMDBTVSeries;
}

const TVStructuredData: React.FC<TVStructuredDataProps> = ({ series }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": series.name,
    "alternateName": series.original_name,
    "description": series.overview,
    "image": `https://image.tmdb.org/t/p/w500${series.poster_path}`,
    "datePublished": series.first_air_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": series.vote_average,
      "bestRating": 10,
      "worstRating": 0,
      "ratingCount": series.vote_count
    },
    "genre": series.genres?.map(genre => genre.name) || series.genre_ids?.map(id => {
      // Map genre IDs to names (simplified)
      const genreMap: Record<number, string> = {
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
        37: "Western"
      };
      return genreMap[id] || "Divers";
    }) || [],
    "numberOfSeasons": series.number_of_seasons,
    "numberOfEpisodes": series.number_of_episodes,
    "actor": [], // Would need to fetch this from API
    "contentRating": "TV-14", // Simplified rating
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "EUR",
      "url": `https://streamflix2-o7vx.onrender.com/tv/${series.id}`
    }
  };

  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
    />
  );
};

export default TVStructuredData;