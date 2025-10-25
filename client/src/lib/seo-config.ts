export const SEO_CONFIG = {
  home: {
    title: "StreamFlix - Films et Séries en Streaming HD | Plateforme Légale",
    description: "Regardez des milliers de films et séries en streaming légal, sans publicité et en haute qualité. Abonnement à partir de 2000 FCFA/mois. Découvrez notre vaste catalogue dès maintenant !",
    canonical: "https://streamflix2.site/",
    og: {
      type: "website",
      title: "StreamFlix - Films et Séries en Streaming HD | Plateforme Légale",
      description: "Regardez des milliers de films et séries en streaming légal, sans publicité et en haute qualité.",
      image: "https://streamflix2.site/logo.png"
    }
  },
  movie: {
    title: "{movieTitle} - Regarder en Streaming HD sur StreamFlix",
    description: "Regardez {movieTitle} gratuitement sur Streamflix, sans inscription. Streaming légal en haute qualité sans publicité.",
    canonical: "https://streamflix2.site/movie/{id}",
    og: {
      type: "video.movie",
      title: "{movieTitle}",
      description: "Regardez {movieTitle} en streaming sur Streamflix sans publicité.",
      image: "{posterUrl}"
    }
  },
  tv: {
    title: "{tvTitle} - Série TV en Streaming sur StreamFlix",
    description: "Regardez la série {tvTitle} en streaming légal sur Streamflix. Toutes les saisons disponibles sans publicité.",
    canonical: "https://streamflix2.site/tv/{id}",
    og: {
      type: "video.tv_show",
      title: "{tvTitle}",
      description: "Regardez la série {tvTitle} en streaming sur Streamflix sans publicité.",
      image: "{posterUrl}"
    }
  },
  search: {
    title: "Recherche - StreamFlix | Films et Séries en Streaming",
    description: "Recherchez des films et séries sur StreamFlix. Trouvez votre prochain contenu à regarder en streaming HD sans publicité.",
    canonical: "https://streamflix2.site/search",
    og: {
      type: "website",
      title: "Recherche - StreamFlix",
      description: "Recherchez des films et séries sur StreamFlix en streaming HD.",
      image: "https://streamflix2.site/logo.png"
    }
  },
  category: {
    title: "Films {category} - StreamFlix | Streaming Légal",
    description: "Découvrez notre sélection de films {category} en streaming légal sur StreamFlix sans publicité intrusive.",
    canonical: "https://streamflix2.site/category/{genre}",
    og: {
      type: "website",
      title: "Films {category} - StreamFlix",
      description: "Découvrez notre sélection de films {category} en streaming sans publicité.",
      image: "https://streamflix2.site/logo.png"
    }
  },
  series: {
    title: "Séries TV en Streaming - StreamFlix | Plateforme Légale",
    description: "Découvrez notre collection de séries TV en streaming légal. Toutes les saisons disponibles sans publicité intrusive.",
    canonical: "https://streamflix2.site/series",
    og: {
      type: "website",
      title: "Séries TV en Streaming - StreamFlix",
      description: "Découvrez notre collection de séries TV en streaming légal sans publicité.",
      image: "https://streamflix2.site/logo.png"
    }
  }
};