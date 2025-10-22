import axios from 'axios';

interface FrembedMovieResponse {
  // Structure de la réponse pour un film
  // À adapter selon l'API réelle de Frembed
}

interface FrembedSeriesResponse {
  // Structure de la réponse pour une série
  // À adapter selon l'API réelle de Frembed
}

export class FrembedService {
  private static readonly BASE_URL = 'https://frembed.cfd/api';

  /**
   * Récupère les informations d'un film depuis l'API Frembed
   * @param tmdbId L'ID TMDB du film
   */
  static async getMovieEmbedUrl(tmdbId: number): Promise<string | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/film.php`, {
        params: {
          id: tmdbId
        },
        timeout: 10000, // 10 secondes timeout
        headers: {
          'User-Agent': 'Streamflix/1.0'
        }
      });
      
      // Retourner l'URL de l'iframe directement
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL Frembed pour le film:', error);
      return null;
    }
  }

  /**
   * Récupère les informations d'une série depuis l'API Frembed
   * @param tmdbId L'ID TMDB de la série
   * @param season Le numéro de saison
   * @param episode Le numéro d'épisode
   */
  static async getSeriesEmbedUrl(tmdbId: number, season: number, episode: number): Promise<string | null> {
    try {
      // Modification de l'URL pour correspondre à la structure actuelle de l'API
      // Utilisation de la même structure que pour les films mais avec des paramètres supplémentaires
      const response = await axios.get(`${this.BASE_URL}/film.php`, {
        params: {
          id: tmdbId,
          s: season,
          e: episode
        },
        timeout: 10000, // 10 secondes timeout
        headers: {
          'User-Agent': 'Streamflix/1.0'
        }
      });
      
      // Retourner l'URL de l'iframe directement
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL Frembed pour la série:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'API Frembed est accessible
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${this.BASE_URL}/film.php`, {
        params: {
          id: 1 // Test avec un ID simple
        },
        timeout: 5000
      });
      return true;
    } catch (error) {
      console.error('Frembed API non accessible:', error);
      return false;
    }
  }
}