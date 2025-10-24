export const SEO_CONFIG = {
  home: {
    title: "StreamFlix - Films et Séries en Streaming HD | Plateforme Légale",
    description: "Regardez des milliers de films et séries en streaming légal, sans publicité et en haute qualité. Abonnement à partir de 2000 FCFA/mois. Découvrez notre vaste catalogue dès maintenant !",
    canonical: "https://streamflix2-o7vx.onrender.com/",
    og: {
      type: "website",
      title: "StreamFlix - Films et Séries en Streaming HD | Plateforme Légale",
      description: "Regardez des milliers de films et séries en streaming légal, sans publicité et en haute qualité.",
      image: "https://streamflix2-o7vx.onrender.com/logo.png"
    }
  },
  movie: {
    title: "{movieTitle} - Regarder en Streaming HD sur StreamFlix",
    description: "Regardez {movieTitle} gratuitement sur Streamflix, sans inscription. Streaming légal en haute qualité.",
    canonical: "https://streamflix2-o7vx.onrender.com/movie/{id}",
    og: {
      type: "video.movie",
      title: "{movieTitle}",
      description: "Regardez {movieTitle} en streaming sur Streamflix.",
      image: "{posterUrl}"
    }
  },
  tv: {
    title: "{tvTitle} - Série TV en Streaming sur StreamFlix",
    description: "Regardez la série {tvTitle} en streaming légal sur Streamflix. Toutes les saisons disponibles.",
    canonical: "https://streamflix2-o7vx.onrender.com/tv/{id}",
    og: {
      type: "video.tv_show",
      title: "{tvTitle}",
      description: "Regardez la série {tvTitle} en streaming sur Streamflix.",
      image: "{posterUrl}"
    }
  },
  search: {
    title: "Recherche - StreamFlix",
    description: "Recherchez des films et séries sur Streamflix. Trouvez votre prochain contenu à regarder.",
    canonical: "https://streamflix2-o7vx.onrender.com/search",
    og: {
      type: "website",
      title: "Recherche - StreamFlix",
      description: "Recherchez des films et séries sur Streamflix.",
      image: "https://streamflix2-o7vx.onrender.com/logo.png"
    }
  },
  category: {
    title: "Films {category} - StreamFlix",
    description: "Découvrez notre sélection de films {category} en streaming légal sur Streamflix.",
    canonical: "https://streamflix2-o7vx.onrender.com/category/{genre}",
    og: {
      type: "website",
      title: "Films {category} - StreamFlix",
      description: "Découvrez notre sélection de films {category} en streaming.",
      image: "https://streamflix2-o7vx.onrender.com/logo.png"
    }
  },
  series: {
    title: "Séries TV en Streaming - StreamFlix",
    description: "Découvrez notre collection de séries TV en streaming légal. Toutes les saisons disponibles sans publicité.",
    canonical: "https://streamflix2-o7vx.onrender.com/series",
    og: {
      type: "website",
      title: "Séries TV en Streaming - StreamFlix",
      description: "Découvrez notre collection de séries TV en streaming légal.",
      image: "https://streamflix2-o7vx.onrender.com/logo.png"
    }
  }
};