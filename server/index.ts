import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

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
  participants: Set<string>;
  currentVideo: string;
  currentTime: number;
  isPlaying: boolean;
  messages: Array<{
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: number;
  }>;
}>();

// Socket.IO handlers pour Watch Party
io.on('connection', (socket: Socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Rejoindre une salle de watch party
  socket.on('join-watch-party', (data: { roomId: string; userId: string; username: string }) => {
    const { roomId, userId, username } = data;

    // Créer la salle si elle n'existe pas
    if (!watchPartyRooms.has(roomId)) {
      watchPartyRooms.set(roomId, {
        host: userId,
        participants: new Set(),
        currentVideo: '',
        currentTime: 0,
        isPlaying: false,
        messages: []
      });
    }

    const room = watchPartyRooms.get(roomId)!;
    room.participants.add(userId);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = userId;
    socket.data.username = username;

    console.log(`${username} a rejoint la salle ${roomId}`);

    // Envoyer l'état actuel de la salle au nouveau participant
    socket.emit('watch-party-joined', {
      roomId,
      host: room.host,
      participants: Array.from(room.participants),
      currentVideo: room.currentVideo,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      messages: room.messages.slice(-50) // Derniers 50 messages
    });

    // Notifier les autres participants
    socket.to(roomId).emit('participant-joined', {
      userId,
      username,
      participants: Array.from(room.participants)
    });
  });

  // Quitter une salle de watch party
  socket.on('leave-watch-party', () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      room.participants.delete(userId);

      socket.leave(roomId);

      // Si la salle est vide, la supprimer
      if (room.participants.size === 0) {
        watchPartyRooms.delete(roomId);
        console.log(`Salle ${roomId} supprimée (vide)`);
      } else {
        // Si l'hôte quitte, transférer l'hôte à quelqu'un d'autre
        if (room.host === userId) {
          const newHost = Array.from(room.participants)[0];
          room.host = newHost;
          io.to(roomId).emit('host-changed', { newHost });
        }

        // Notifier les autres participants
        socket.to(roomId).emit('participant-left', {
          userId,
          username,
          participants: Array.from(room.participants)
        });
      }

      console.log(`${username} a quitté la salle ${roomId}`);
    }
  });

  // Synchronisation de la lecture vidéo
  socket.on('video-play', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      room.isPlaying = true;
      room.currentTime = data.currentTime;

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
      room.isPlaying = false;
      room.currentTime = data.currentTime;

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
      room.currentTime = data.currentTime;

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

        io.to(roomId).emit('video-changed', {
          videoUrl: data.videoUrl,
          title: data.title,
          changedBy: socket.data.username
        });
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

    if (roomId && watchPartyRooms.has(roomId)) {
      const room = watchPartyRooms.get(roomId)!;
      room.participants.delete(userId);

      // Si la salle est vide, la supprimer
      if (room.participants.size === 0) {
        watchPartyRooms.delete(roomId);
        console.log(`Salle ${roomId} supprimée (déconnexion)`);
      } else {
        // Si l'hôte se déconnecte, transférer l'hôte
        if (room.host === userId) {
          const newHost = Array.from(room.participants)[0];
          room.host = newHost;
          io.to(roomId).emit('host-changed', { newHost });
        }

        // Notifier les autres participants
        socket.to(roomId).emit('participant-left', {
          userId,
          username,
          participants: Array.from(room.participants)
        });
      }
    }

    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// API routes pour Watch Party
app.get('/api/watch-party/:roomId', (req, res) => {
  const { roomId } = req.params;

  if (watchPartyRooms.has(roomId)) {
    const room = watchPartyRooms.get(roomId)!;
    res.json({
      exists: true,
      host: room.host,
      participants: Array.from(room.participants),
      currentVideo: room.currentVideo,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      messageCount: room.messages.length
    });
  } else {
    res.json({ exists: false });
  }
});

app.post('/api/watch-party', (req, res) => {
  const { videoUrl, title } = req.body;
  const roomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Créer une nouvelle salle
  watchPartyRooms.set(roomId, {
    host: req.user?.userId || 'anonymous',
    participants: new Set(),
    currentVideo: videoUrl,
    currentTime: 0,
    isPlaying: false,
    messages: []
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
