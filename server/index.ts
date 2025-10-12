import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { storage } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Configuration Socket.IO pour Watch Party
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://streamflix2-o7vx.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://streamflix2-o7vx.onrender.com"],
  credentials: true
}));
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "../dist/public")));

// Enregistrer les routes API
registerRoutes(app);

// Route catch-all pour React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Gestion des salles de watch party
const watchPartyRooms = new Map<string, {
  host: string;
  participants: Map<string, { username: string; lastSeen: number }>;
  currentVideo: string;
  currentTime: number;
  isPlaying: boolean;
  messages: Array<{
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: number;
    isSystemMessage?: boolean;
  }>;
  createdAt: number;
  lastActivity: number;
  maxParticipants?: number;
}>();

// Fonction pour nettoyer les salles inactives
function cleanupInactiveRooms() {
  const now = Date.now();
  const INACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 heures
  
  // Convertir l'itérateur en tableau pour éviter les problèmes de compatibilité
  const roomsArray = Array.from(watchPartyRooms.entries());
  for (const [roomId, room] of roomsArray) {
    if (now - room.lastActivity > INACTIVE_THRESHOLD) {
      watchPartyRooms.delete(roomId);
      console.log(`Salle ${roomId} supprimée (inactivité)`);
    }
  }
}

// Nettoyer les salles inactives toutes les heures
setInterval(cleanupInactiveRooms, 60 * 60 * 1000);

// Socket.IO handlers pour Watch Party et Notifications
io.on('connection', (socket: Socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Gestion des notifications temps réel
  socket.on('join-notifications', (data: { userId: string }) => {
    const { userId } = data;
    
    if (!userId) {
      socket.emit('error', { message: 'User ID is required for notifications' });
      return;
    }
    
    // Rejoindre la room des notifications pour cet utilisateur
    socket.join(`notifications-${userId}`);
    socket.data.userId = userId;
    
    console.log(`User ${userId} joined notifications room`);
    
    // Envoyer les notifications non lues
    storage.getUserNotifications(userId).then(notifications => {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        socket.emit('unread-notifications', unreadNotifications);
      }
    }).catch(error => {
      console.error('Error fetching unread notifications:', error);
    });
  });

  socket.on('mark-notification-read', async (data: { notificationId: string }) => {
    try {
      const { notificationId } = data;
      await storage.markNotificationAsRead(notificationId);
      
      // Notifier l'utilisateur que la notification a été marquée comme lue
      socket.emit('notification-marked-read', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });

  socket.on('leave-notifications', () => {
    if (socket.data.userId) {
      socket.leave(`notifications-${socket.data.userId}`);
      console.log(`User ${socket.data.userId} left notifications room`);
    }
  });

  // Rejoindre une salle de watch party
  socket.on('join-watch-party', (data: { roomId: string; userId: string; username: string }) => {
    const { roomId, userId, username } = data;

    // Valider les données d'entrée
    if (!roomId || !userId || !username) {
      socket.emit('error', { message: 'Données de connexion invalides' });
      return;
    }

    // Créer la salle si elle n'existe pas
    if (!watchPartyRooms.has(roomId)) {
      watchPartyRooms.set(roomId, {
        host: userId,
        participants: new Map(),
        currentVideo: '',
        currentTime: 0,
        isPlaying: false,
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
        maxParticipants: 20
      });
      console.log(`Nouvelle salle créée: ${roomId} par ${username}`);
    }

    const room = watchPartyRooms.get(roomId)!;
    
    // Vérifier la limite de participants
    if (room.participants.size >= (room.maxParticipants || 20)) {
      socket.emit('error', { message: 'La salle est pleine' });
      return;
    }

    // Ajouter le participant
    room.participants.set(userId, { 
      username, 
      lastSeen: Date.now()
    });
    room.lastActivity = Date.now();

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = userId;
    socket.data.username = username;

    console.log(`${username} a rejoint la salle ${roomId} (${room.participants.size}/${room.maxParticipants || 20})`);

    // Envoyer l'état actuel de la salle au nouveau participant
    socket.emit('watch-party-joined', {
      roomId,
      host: room.host,
      participants: Array.from(room.participants.keys()),
      currentVideo: room.currentVideo,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      messages: room.messages.slice(-50), // Derniers 50 messages
      isHost: room.host === userId,
      participantCount: room.participants.size,
      maxParticipants: room.maxParticipants || 20
    });

    // Notifier les autres participants
    socket.to(roomId).emit('participant-joined', {
      userId,
      username,
      participants: Array.from(room.participants.keys()),
      participantCount: room.participants.size
    });

    // Ajouter un message système
    const systemMessage = {
      id: `system-${Date.now()}`,
      userId: 'system',
      username: 'Système',
      message: `${username} a rejoint la salle`,
      timestamp: Date.now(),
      isSystemMessage: true
    };
    room.messages.push(systemMessage);
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }
    io.to(roomId).emit('new-message', systemMessage);
  });

  // Quitter une salle de watch party
  socket.on('leave-watch-party', () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      const wasHost = room.host === userId;
      
      room.participants.delete(userId);
      room.lastActivity = Date.now();

      socket.leave(roomId);

      console.log(`${username} a quitté la salle ${roomId}`);

      // Notifier les autres participants
      socket.to(roomId).emit('participant-left', {
        userId,
        username,
        participants: Array.from(room.participants.keys()),
        participantCount: room.participants.size
      });

      // Si l'hôte part, transférer l'hôte au premier participant restant
      if (wasHost && room.participants.size > 0) {
        const newHost = Array.from(room.participants.keys())[0];
        room.host = newHost;
        console.log(`Hôte transféré de ${username} à ${room.participants.get(newHost)?.username}`);
        socket.to(roomId).emit('host-changed', { newHost });
        
        // Ajouter un message système pour le changement d'hôte
        const hostChangeMessage = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${room.participants.get(newHost)?.username} est maintenant l'hôte`,
          timestamp: Date.now(),
          isSystemMessage: true
        };
        room.messages.push(hostChangeMessage);
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
        io.to(roomId).emit('new-message', hostChangeMessage);
      }

      // Ajouter un message système pour le départ
      const leaveMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'Système',
        message: `${username} a quitté la salle`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      room.messages.push(leaveMessage);
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }
      io.to(roomId).emit('new-message', leaveMessage);

      // Supprimer la salle si elle est vide
      if (room.participants.size === 0) {
        watchPartyRooms.delete(roomId);
        console.log(`Salle ${roomId} supprimée (vide)`);
      }
    }
  });

  // Synchronisation de la lecture vidéo
  socket.on('video-play', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      
      // Vérifier que l'utilisateur est l'hôte
      if (room.host !== socket.data.userId) {
        return;
      }
      
      room.isPlaying = true;
      room.currentTime = data.currentTime;
      room.lastActivity = Date.now();

      socket.to(roomId).emit('video-play-sync', {
        currentTime: data.currentTime,
        triggeredBy: socket.data.userId
      });
    }
  });

  socket.on('video-pause', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      
      // Vérifier que l'utilisateur est l'hôte
      if (room.host !== socket.data.userId) {
        return;
      }
      
      room.isPlaying = false;
      room.currentTime = data.currentTime;
      room.lastActivity = Date.now();

      socket.to(roomId).emit('video-pause-sync', {
        currentTime: data.currentTime,
        triggeredBy: socket.data.userId
      });
    }
  });

  socket.on('video-seek', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      
      // Vérifier que l'utilisateur est l'hôte
      if (room.host !== socket.data.userId) {
        return;
      }
      
      room.currentTime = data.currentTime;
      room.lastActivity = Date.now();

      socket.to(roomId).emit('video-seek-sync', {
        currentTime: data.currentTime,
        triggeredBy: socket.data.userId
      });
    }
  });

  // Changer de vidéo dans la watch party
  socket.on('change-video', (data: { videoUrl: string; title: string }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;

    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;

      // Seul l'hôte peut changer de vidéo
      if (room.host === userId) {
        room.currentVideo = data.videoUrl;
        room.currentTime = 0;
        room.isPlaying = false;
        room.lastActivity = Date.now();

        io.to(roomId).emit('video-changed', {
          videoUrl: data.videoUrl,
          title: data.title,
          changedBy: socket.data.username
        });
        
        // Ajouter un message système
        const messageData = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${socket.data.username} a changé la vidéo pour: ${data.title}`,
          timestamp: Date.now()
        };
        
        room.messages.push(messageData);
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
        
        io.to(roomId).emit('new-message', messageData);
      }
    }
  });

  // Chat de la watch party
  socket.on('send-message', (data: { message: string }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (roomId && watchPartyRooms.has(roomId) && data.message.trim()) {
      const room = watchPartyRooms.get(roomId)!;
      room.lastActivity = Date.now();

      const messageData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        username,
        message: data.message.trim(),
        timestamp: Date.now()
      };

      // Ajouter le message à l'historique (limiter à 100 messages)
      room.messages.push(messageData);
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Envoyer le message à tous les participants de la salle
      io.to(roomId).emit('new-message', messageData);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    // Quitter la room des notifications
    if (userId) {
      socket.leave(`notifications-${userId}`);
    }

    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      room.participants.delete(userId);
      room.lastActivity = Date.now();

      // Si la salle est vide, la supprimer
      if (room.participants.size === 0) {
        watchPartyRooms.delete(roomId);
        console.log(`Salle ${roomId} supprimée (déconnexion)`);
      } else {
        // Si l'hôte se déconnecte, transférer l'hôte
        if (room.host === userId) {
          const newHost = Array.from(room.participants.keys())[0];
          room.host = newHost;
          console.log(`Hôte transféré de ${username} à ${room.participants.get(newHost)?.username} (déconnexion)`);
          io.to(roomId).emit('host-changed', { newHost });
          
          // Ajouter un message système pour le changement d'hôte
          const hostChangeMessage = {
            id: `system-${Date.now()}`,
            userId: 'system',
            username: 'Système',
            message: `${room.participants.get(newHost)?.username} est maintenant l'hôte`,
            timestamp: Date.now(),
            isSystemMessage: true
          };
          room.messages.push(hostChangeMessage);
          if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
          }
          io.to(roomId).emit('new-message', hostChangeMessage);
        }

        // Notifier les autres participants de la déconnexion
        socket.to(roomId).emit('participant-disconnected', {
          userId,
          username,
          participants: Array.from(room.participants.keys()),
          participantCount: room.participants.size
        });

        // Ajouter un message système pour la déconnexion
        const disconnectMessage = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${username} s'est déconnecté`,
          timestamp: Date.now(),
          isSystemMessage: true
        };
        room.messages.push(disconnectMessage);
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
        io.to(roomId).emit('new-message', disconnectMessage);
      }
    }

    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// Fonctions utilitaires pour les notifications temps réel
export const notificationService = {
  // Envoyer une notification à un utilisateur spécifique
  async sendNotificationToUser(userId: string, title: string, message: string, type: string = "info") {
    try {
      const notification = await storage.sendNotificationToUser(userId, title, message, type);
      
      // Envoyer la notification en temps réel
      io.to(`notifications-${userId}`).emit('new-notification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  },

  // Envoyer une annonce à tous les utilisateurs
  async sendAnnouncementToAllUsers(title: string, message: string) {
    try {
      const notifications = await storage.sendAnnouncementToAllUsers(title, message);
      
      // Envoyer l'annonce en temps réel à tous les utilisateurs connectés
      io.emit('new-announcement', {
        title,
        message,
        type: 'announcement',
        createdAt: new Date().toISOString()
      });
      
      return notifications;
    } catch (error) {
      console.error('Error sending announcement to all users:', error);
      throw error;
    }
  },

  // Marquer une notification comme lue
  async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      const notification = await storage.markNotificationAsRead(notificationId);
      
      // Notifier l'utilisateur que la notification a été marquée comme lue
      io.to(`notifications-${userId}`).emit('notification-marked-read', { notificationId });
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};

// API routes pour Watch Party
app.get('/api/watch-party/:roomId', (req, res) => {
  const { roomId } = req.params;

  if (watchPartyRooms.has(roomId)) {
    const room = watchPartyRooms.get(roomId)!;
    res.json({
      exists: true,
      host: room.host,
      participants: Array.from(room.participants.keys()),
      currentVideo: room.currentVideo,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      messageCount: room.messages.length,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    });
  } else {
    res.json({ exists: false });
  }
});

app.post('/api/watch-party', (req, res) => {
  const { videoUrl, title } = req.body;
  // Générer un code de salle plus court et plus lisible
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Créer une nouvelle salle
  watchPartyRooms.set(roomId, {
    host: req.user?.userId || 'anonymous',
    participants: new Map(),
    currentVideo: videoUrl,
    currentTime: 0,
    isPlaying: false,
    messages: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    maxParticipants: 20
  });

  res.json({
    roomId,
    videoUrl,
    title
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Socket.IO activé pour Watch Party`);
});