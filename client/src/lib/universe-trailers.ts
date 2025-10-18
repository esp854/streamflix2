// Configuration des génériques officiels pour chaque univers
export const UNIVERSE_TRAILERS = {
  netflix: {
    name: "Netflix",
    youtubeId: "RXJo86FGYAM", // Générique Netflix officiel
    duration: 30
  },
  disney: {
    name: "Disney+",
    youtubeId: "r43_WLqNcZo", // Générique Disney+ officiel
    duration: 30
  },
  prime: {
    name: "Prime Video",
    youtubeId: "dtUJvOj3GLc", // Générique Prime Video officiel
    duration: 30
  },
  paramount: {
    name: "Paramount+",
    youtubeId: "bUHK7DoQ340", // Générique Paramount+ officiel
    duration: 30
  },
  apple: {
    name: "Apple TV+",
    youtubeId: "3517fJ4bbMI", // Générique Apple TV+ officiel
    duration: 30
  },
  marvel: {
    name: "Marvel",
    youtubeId: "LBZJLJqQFwM", // Générique Marvel Studios
    duration: 30
  },
  dc: {
    name: "DC",
    youtubeId: "OQfj58Pbzwk", // Générique DC Studios
    duration: 30
  }
};

// Fonction pour générer l'URL de prévisualisation YouTube
export function getYoutubePreviewUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

// Fonction pour générer l'URL de la vidéo YouTube
export function getYoutubeVideoUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

// Fonction pour générer l'URL de l'embed YouTube
export function getYoutubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}`;
}