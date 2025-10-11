// Configuration avancée pour Socket.IO dans Watch Party
export const SOCKET_CONFIG = {
  // Configuration de base
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://streamflix2-o7vx.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  
  // Options de transport
  transports: ["websocket", "polling"],
  
  // Configuration de ping/pong pour maintenir la connexion
  pingInterval: 25000, // 25 secondes
  pingTimeout: 20000,  // 20 secondes
  
  // Limites
  maxHttpBufferSize: 1e6, // 1MB
  
  // Configuration pour une meilleure synchronisation en temps réel
  allowEIO3: true, // Autoriser Engine.IO v3
};

// Configuration de synchronisation pour Watch Party
export const SYNC_CONFIG = {
  // Fréquence de synchronisation (en ms)
  PLAY_PAUSE_SYNC_INTERVAL: 100,  // 100ms pour play/pause
  SEEK_SYNC_INTERVAL: 50,         // 50ms pour seek
  TIME_SYNC_INTERVAL: 1000,       // 1s pour la synchronisation régulière
  
  // Tolérance de décalage (en secondes)
  SYNC_TOLERANCE: 0.5,
  
  // Nombre maximum de participants par salle
  MAX_PARTICIPANTS_PER_ROOM: 50,
  
  // Durée de conservation des messages (en minutes)
  MESSAGE_RETENTION_MINUTES: 60,
  
  // Nombre maximum de messages conservés
  MAX_MESSAGES_PER_ROOM: 100,
};

// Configuration des salles
export const ROOM_CONFIG = {
  // Durée avant suppression d'une salle vide (en minutes)
  EMPTY_ROOM_TIMEOUT: 5,
  
  // Longueur de l'ID de salle
  ROOM_ID_LENGTH: 16,
  
  // Nombre maximum de salles
  MAX_ROOMS: 1000,
};

// Codes d'erreur pour Watch Party
export const ERROR_CODES = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  INVALID_VIDEO_URL: 'INVALID_VIDEO_URL',
  SYNC_ERROR: 'SYNC_ERROR',
};

// Événements Socket.IO pour Watch Party
export const SOCKET_EVENTS = {
  // Connexion/Déconnexion
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Gestion des salles
  JOIN_ROOM: 'join-watch-party',
  LEAVE_ROOM: 'leave-watch-party',
  ROOM_JOINED: 'watch-party-joined',
  PARTICIPANT_JOINED: 'participant-joined',
  PARTICIPANT_LEFT: 'participant-left',
  HOST_CHANGED: 'host-changed',
  
  // Contrôle vidéo
  VIDEO_PLAY: 'video-play',
  VIDEO_PAUSE: 'video-pause',
  VIDEO_SEEK: 'video-seek',
  VIDEO_TIME_SYNC: 'video-time-sync',
  VIDEO_CHANGED: 'video-changed',
  
  VIDEO_PLAY_SYNC: 'video-play-sync',
  VIDEO_PAUSE_SYNC: 'video-pause-sync',
  VIDEO_SEEK_SYNC: 'video-seek-sync',
  
  // Chat
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  
  // Erreurs
  ERROR: 'watch-party-error',
};

export default {
  SOCKET_CONFIG,
  SYNC_CONFIG,
  ROOM_CONFIG,
  ERROR_CODES,
  SOCKET_EVENTS
};