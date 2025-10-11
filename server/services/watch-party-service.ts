import { SOCKET_EVENTS, SYNC_CONFIG, ROOM_CONFIG, ERROR_CODES } from '../socket-config';

// Type pour une salle de Watch Party
export interface WatchPartyRoom {
  id: string;
  host: string;
  participants: Map<string, Participant>;
  currentVideo: string;
  currentTime: number;
  isPlaying: boolean;
  messages: WatchPartyMessage[];
  createdAt: number;
  lastActivity: number;
  lastSyncTime: number;
}

// Type pour un participant
export interface Participant {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: number;
}

// Type pour un message
export interface WatchPartyMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

// Service de gestion des Watch Parties
class WatchPartyService {
  private rooms: Map<string, WatchPartyRoom> = new Map();
  private userRooms: Map<string, string> = new Map(); // userId -> roomId

  // Créer une nouvelle salle
  createRoom(hostUserId: string, hostUsername: string, hostSocketId: string, initialVideoUrl: string = ''): WatchPartyRoom {
    // Vérifier la limite de salles
    if (this.rooms.size >= ROOM_CONFIG.MAX_ROOMS) {
      throw new Error(ERROR_CODES.ROOM_FULL);
    }

    const roomId = this.generateRoomId();
    const now = Date.now();

    const room: WatchPartyRoom = {
      id: roomId,
      host: hostUserId,
      participants: new Map(),
      currentVideo: initialVideoUrl,
      currentTime: 0,
      isPlaying: false,
      messages: [],
      createdAt: now,
      lastActivity: now,
      lastSyncTime: 0
    };

    // Ajouter l'hôte comme premier participant
    this.addParticipantToRoom(room, hostUserId, hostUsername, hostSocketId);

    this.rooms.set(roomId, room);
    return room;
  }

  // Générer un ID de salle unique
  private generateRoomId(): string {
    let roomId: string;
    do {
      roomId = Math.random().toString(36).substring(2, ROOM_CONFIG.ROOM_ID_LENGTH + 2);
    } while (this.rooms.has(roomId));
    return roomId;
  }

  // Rejoindre une salle existante
  joinRoom(roomId: string, userId: string, username: string, socketId: string): WatchPartyRoom {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
    }

    // Vérifier la limite de participants
    if (room.participants.size >= SYNC_CONFIG.MAX_PARTICIPANTS_PER_ROOM) {
      throw new Error(ERROR_CODES.ROOM_FULL);
    }

    // Ajouter le participant
    this.addParticipantToRoom(room, userId, username, socketId);
    
    // Mettre à jour l'activité
    room.lastActivity = Date.now();
    
    return room;
  }

  // Ajouter un participant à une salle
  private addParticipantToRoom(room: WatchPartyRoom, userId: string, username: string, socketId: string): void {
    const participant: Participant = {
      userId,
      username,
      socketId,
      joinedAt: Date.now()
    };

    room.participants.set(userId, participant);
    this.userRooms.set(userId, room.id);
  }

  // Quitter une salle
  leaveRoom(userId: string): { room: WatchPartyRoom; shouldDeleteRoom: boolean } | null {
    const roomId = this.userRooms.get(userId);
    
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    
    if (!room) {
      this.userRooms.delete(userId);
      return null;
    }

    // Retirer le participant
    room.participants.delete(userId);
    this.userRooms.delete(userId);

    // Si l'hôte quitte, transférer l'hôte
    if (room.host === userId && room.participants.size > 0) {
      const participantsArray = Array.from(room.participants.values());
      if (participantsArray.length > 0) {
        const newHost = participantsArray[0].userId;
        room.host = newHost;
      }
    }

    // Mettre à jour l'activité
    room.lastActivity = Date.now();

    // Vérifier si la salle doit être supprimée
    const shouldDeleteRoom = room.participants.size === 0;
    
    if (shouldDeleteRoom) {
      this.rooms.delete(roomId);
    }

    return { room, shouldDeleteRoom };
  }

  // Supprimer une salle vide après un délai
  scheduleRoomCleanup(roomId: string): NodeJS.Timeout | null {
    const room = this.rooms.get(roomId);
    
    if (!room || room.participants.size > 0) {
      return null;
    }

    // Planifier la suppression
    const timeout = setTimeout(() => {
      if (this.rooms.has(roomId) && this.rooms.get(roomId)?.participants.size === 0) {
        this.rooms.delete(roomId);
      }
    }, ROOM_CONFIG.EMPTY_ROOM_TIMEOUT * 60 * 1000); // Convertir en millisecondes

    return timeout;
  }

  // Synchroniser la lecture vidéo
  syncVideoPlay(roomId: string, userId: string, currentTime: number): { shouldSync: boolean; room: WatchPartyRoom } | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    // Vérifier la fréquence de synchronisation
    const now = Date.now();
    const shouldSync = now - room.lastSyncTime > SYNC_CONFIG.PLAY_PAUSE_SYNC_INTERVAL;
    
    if (shouldSync) {
      room.isPlaying = true;
      room.currentTime = currentTime;
      room.lastSyncTime = now;
      room.lastActivity = now;
    }

    return { shouldSync, room };
  }

  // Synchroniser la pause vidéo
  syncVideoPause(roomId: string, userId: string, currentTime: number): { shouldSync: boolean; room: WatchPartyRoom } | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    // Vérifier la fréquence de synchronisation
    const now = Date.now();
    const shouldSync = now - room.lastSyncTime > SYNC_CONFIG.PLAY_PAUSE_SYNC_INTERVAL;
    
    if (shouldSync) {
      room.isPlaying = false;
      room.currentTime = currentTime;
      room.lastSyncTime = now;
      room.lastActivity = now;
    }

    return { shouldSync, room };
  }

  // Synchroniser le seek vidéo
  syncVideoSeek(roomId: string, userId: string, currentTime: number): { room: WatchPartyRoom } | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    room.currentTime = currentTime;
    room.lastSyncTime = Date.now();
    room.lastActivity = Date.now();

    return { room };
  }

  // Synchroniser la position vidéo régulièrement
  syncVideoTime(roomId: string, userId: string, currentTime: number): { shouldSync: boolean; room: WatchPartyRoom } | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    // Vérifier la fréquence de synchronisation
    const now = Date.now();
    const shouldSync = now - room.lastSyncTime > SYNC_CONFIG.TIME_SYNC_INTERVAL;
    
    if (shouldSync) {
      room.currentTime = currentTime;
      room.lastSyncTime = now;
    }

    room.lastActivity = now;

    return { shouldSync, room };
  }

  // Changer de vidéo (réservé à l'hôte)
  changeVideo(roomId: string, userId: string, videoUrl: string, title: string): { room: WatchPartyRoom; isAuthorized: boolean } | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    const isAuthorized = room.host === userId;
    
    if (isAuthorized) {
      room.currentVideo = videoUrl;
      room.currentTime = 0;
      room.isPlaying = false;
      room.lastSyncTime = Date.now();
      room.lastActivity = Date.now();
    }

    return { room, isAuthorized };
  }

  // Envoyer un message
  sendMessage(roomId: string, userId: string, username: string, message: string): WatchPartyMessage | null {
    const room = this.rooms.get(roomId);
    
    if (!room || !message.trim()) {
      return null;
    }

    const messageData: WatchPartyMessage = {
      id: this.generateMessageId(),
      userId,
      username,
      message: message.trim(),
      timestamp: Date.now()
    };

    // Ajouter le message à l'historique
    room.messages.push(messageData);
    
    // Limiter le nombre de messages
    if (room.messages.length > SYNC_CONFIG.MAX_MESSAGES_PER_ROOM) {
      room.messages = room.messages.slice(-SYNC_CONFIG.MAX_MESSAGES_PER_ROOM);
    }

    room.lastActivity = Date.now();

    return messageData;
  }

  // Générer un ID de message unique
  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Obtenir les informations d'une salle
  getRoomInfo(roomId: string): WatchPartyRoom | null {
    return this.rooms.get(roomId) || null;
  }

  // Obtenir l'ID de la salle d'un utilisateur
  getUserRoomId(userId: string): string | null {
    return this.userRooms.get(userId) || null;
  }

  // Nettoyer les salles inactives
  cleanupInactiveRooms(): void {
    const now = Date.now();
    const inactiveThreshold = ROOM_CONFIG.EMPTY_ROOM_TIMEOUT * 60 * 1000; // Convertir en millisecondes

    // Convertir l'itérateur en tableau pour éviter les problèmes de compatibilité
    const roomsArray = Array.from(this.rooms.entries());
    
    for (const [roomId, room] of roomsArray) {
      // Supprimer les salles vides inactives
      if (room.participants.size === 0 && (now - room.lastActivity) > inactiveThreshold) {
        this.rooms.delete(roomId);
      }
    }
  }

  // Obtenir les statistiques
  getStats(): { roomCount: number; participantCount: number; messageCount: number } {
    let participantCount = 0;
    let messageCount = 0;

    // Convertir l'itérateur en tableau pour éviter les problèmes de compatibilité
    const roomsArray = Array.from(this.rooms.values());
    
    for (const room of roomsArray) {
      participantCount += room.participants.size;
      messageCount += room.messages.length;
    }

    return {
      roomCount: this.rooms.size,
      participantCount,
      messageCount
    };
  }
}

export default new WatchPartyService();