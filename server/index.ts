import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import { config } from "dotenv";

// Charger les variables d'environnement
config();

// Alternative approach for getting __dirname in both ESM and CommonJS
const getCurrentDir = (): string => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  try {
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename);
  } catch {
    // Fallback for environments where import.meta.url is not available
    return process.cwd();
  }
};

const __dirname: string = getCurrentDir();

// Déterminer le chemin vers les fichiers statiques
// Utiliser process.cwd() pour s'assurer que le chemin est correct dans tous les environnements
const getPublicPath = (): string => {
  // En production (Render), les fichiers sont dans dist/public
  // En développement, ils peuvent être dans des chemins différents
  const publicPath = path.join(process.cwd(), "dist", "public");
  console.log(`Public path: ${publicPath}`);
  return publicPath;
};

// Initialisation de la base de données
async function initializeDatabase() {
  try {
    console.log("🔧 Initialisation de la base de données...");
    
    // Exécuter le script d'initialisation existant
    const { execSync } = await import("child_process");
    
    // Exécuter le script d'initialisation avec npx tsx
    execSync("npx tsx server/init-db.ts", { stdio: "inherit" });
    
    console.log("✅ Base de données initialisée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
    process.exit(1);
  }
}

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
app.use(express.static(getPublicPath()));

// Enregistrer les routes API
registerRoutes(app);

// Route catch-all pour React Router (doit être après les routes API)
app.get('*', (req, res) => {
  res.sendFile(path.join(getPublicPath(), 'index.html'));
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
    room.lastActivity = Date.now();

    // Envoyer le message système à tous les participants
    io.to(roomId).emit('chat-message', systemMessage);

    // Limiter l'historique des messages à 100
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }
  });

  socket.on('leave-watch-party', (data: { roomId: string }) => {
    const { roomId } = data;
    const room = watchPartyRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Salle non trouvée' });
      return;
    }

    const userId = socket.data.userId;
    const username = socket.data.username;

    if (!userId || !username) {
      socket.emit('error', { message: 'Données utilisateur invalides' });
      return;
    }

    // Retirer le participant
    room.participants.delete(userId);
    room.lastActivity = Date.now();

    socket.leave(roomId);
    delete socket.data.roomId;
    delete socket.data.userId;
    delete socket.data.username;

    console.log(`${username} a quitté la salle ${roomId} (${room.participants.size}/${room.maxParticipants || 20})`);

    // Si la salle est vide, la supprimer
    if (room.participants.size === 0) {
      watchPartyRooms.delete(roomId);
      console.log(`Salle ${roomId} supprimée (vide)`);
      return;
    }

    // Si l'hôte quitte, promouvoir un nouveau participant
    if (room.host === userId) {
      const newHostId = Array.from(room.participants.keys())[0];
      room.host = newHostId;
      console.log(`Nouvel hôte pour la salle ${roomId}: ${newHostId}`);
    }

    // Notifier les autres participants
    socket.to(roomId).emit('participant-left', {
      userId,
      username,
      participants: Array.from(room.participants.keys()),
      participantCount: room.participants.size,
      newHost: room.host
    });

    // Ajouter un message système
    const systemMessage = {
      id: `system-${Date.now()}`,
      userId: 'system',
      username: 'Système',
      message: `${username} a quitté la salle`,
      timestamp: Date.now(),
      isSystemMessage: true
    };

    room.messages.push(systemMessage);
    room.lastActivity = Date.now();

    // Envoyer le message système à tous les participants
    io.to(roomId).emit('chat-message', systemMessage);

    // Limiter l'historique des messages à 100
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }
  });

  socket.on('watch-party-control', (data: { 
    roomId: string; 
    action: 'play' | 'pause' | 'seek'; 
    time?: number;
    video?: string;
  }) => {
    const { roomId, action, time, video } = data;
    const room = watchPartyRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Salle non trouvée' });
      return;
    }

    const userId = socket.data.userId;
    if (!userId) {
      socket.emit('error', { message: 'Utilisateur non authentifié' });
      return;
    }

    // Seul l'hôte peut contrôler la lecture
    if (room.host !== userId) {
      socket.emit('error', { message: 'Seul l\'hôte peut contrôler la lecture' });
      return;
    }

    // Mettre à jour l'état de la salle
    switch (action) {
      case 'play':
        room.isPlaying = true;
        if (time !== undefined) {
          room.currentTime = time;
        }
        break;
      case 'pause':
        room.isPlaying = false;
        if (time !== undefined) {
          room.currentTime = time;
        }
        break;
      case 'seek':
        if (time !== undefined) {
          room.currentTime = time;
        }
        break;
    }

    // Si une nouvelle vidéo est spécifiée, la changer
    if (video && video !== room.currentVideo) {
      room.currentVideo = video;
      room.currentTime = 0;
      room.isPlaying = false;
    }

    room.lastActivity = Date.now();

    // Envoyer la mise à jour à tous les participants
    io.to(roomId).emit('watch-party-update', {
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      currentVideo: room.currentVideo
    });
  });

  socket.on('chat-message', (data: { roomId: string; message: string }) => {
    const { roomId, message } = data;
    const room = watchPartyRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Salle non trouvée' });
      return;
    }

    const userId = socket.data.userId;
    const username = socket.data.username;

    if (!userId || !username) {
      socket.emit('error', { message: 'Données utilisateur invalides' });
      return;
    }

    // Valider le message
    if (!message || message.trim().length === 0) {
      socket.emit('error', { message: 'Message vide' });
      return;
    }

    if (message.length > 500) {
      socket.emit('error', { message: 'Message trop long (max 500 caractères)' });
      return;
    }

    // Créer le message
    const chatMessage = {
      id: `msg-${Date.now()}-${userId}`,
      userId,
      username,
      message: message.trim(),
      timestamp: Date.now()
    };

    // Ajouter le message à l'historique
    room.messages.push(chatMessage);
    room.lastActivity = Date.now();

    // Envoyer le message à tous les participants
    io.to(roomId).emit('chat-message', chatMessage);

    // Limiter l'historique des messages à 100
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);

    // Gérer la déconnexion de l'utilisateur des salles de watch party
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = watchPartyRooms.get(roomId);
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (room && userId && username) {
        // Retirer le participant
        room.participants.delete(userId);
        room.lastActivity = Date.now();

        console.log(`${username} a été déconnecté de la salle ${roomId} (${room.participants.size}/${room.maxParticipants || 20})`);

        // Si la salle est vide, la supprimer
        if (room.participants.size === 0) {
          watchPartyRooms.delete(roomId);
          console.log(`Salle ${roomId} supprimée (vide)`);
          return;
        }

        // Si l'hôte se déconnecte, promouvoir un nouveau participant
        if (room.host === userId) {
          const newHostId = Array.from(room.participants.keys())[0];
          room.host = newHostId;
          console.log(`Nouvel hôte pour la salle ${roomId}: ${newHostId}`);
        }

        // Notifier les autres participants
        socket.to(roomId).emit('participant-left', {
          userId,
          username,
          participants: Array.from(room.participants.keys()),
          participantCount: room.participants.size,
          newHost: room.host
        });

        // Ajouter un message système
        const systemMessage = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${username} s'est déconnecté`,
          timestamp: Date.now(),
          isSystemMessage: true
        };

        room.messages.push(systemMessage);
        room.lastActivity = Date.now();

        // Envoyer le message système à tous les participants
        io.to(roomId).emit('chat-message', systemMessage);

        // Limiter l'historique des messages à 100
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
      }
    }
  });
});

// Démarrer le serveur
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Initialiser la base de données avant de démarrer le serveur
initializeDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Subscription plans route registered`);
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Socket.IO activé pour Watch Party`);
  });
}).catch(error => {
  console.error("❌ Impossible de démarrer le serveur:", error);
  process.exit(1);
});