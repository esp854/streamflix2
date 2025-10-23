import React from 'react';

interface CategoryStructuredDataProps {
  categoryName: string;
  categoryDescription: string;
  categoryUrl: string;
}

const CategoryStructuredData: React.FC<CategoryStructuredDataProps> = ({ 
  categoryName, 
  categoryDescription,
  categoryUrl
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${categoryName} - StreamFlix`,
    "description": categoryDescription,
    "url": categoryUrl,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://streamflix2-o7vx.onrender.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": categoryName,
          "item": categoryUrl
        }
      ]
    }
  };

  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
    />
  );
};

export default CategoryStructuredData;