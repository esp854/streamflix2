import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import watchPartyService, { WatchPartyRoom } from "./services/watch-party-service";
import { authenticateToken, csrfProtection } from "./security";

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

// Appliquer l'authentification et la protection CSRF à toutes les routes
app.use(authenticateToken);
app.use(csrfProtection);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "../dist/public")));

// Enregistrer les routes API
registerRoutes(app);

// Route catch-all pour React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Socket.IO handlers pour Watch Party
io.on('connection', (socket: Socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Rejoindre une salle de watch party
  socket.on('join-watch-party', (data: { roomId: string; userId: string; username: string }) => {
    const { roomId, userId, username } = data;

    try {
      // Rejoindre la salle
      const room = watchPartyService.joinRoom(roomId, userId, username, socket.id);

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.username = username;

      console.log(`${username} a rejoint la salle ${roomId}`);

      // Envoyer l'état actuel de la salle au nouveau participant
      socket.emit('watch-party-joined', {
        roomId,
        host: room.host,
        participants: Array.from(room.participants.keys()),
        currentVideo: room.currentVideo,
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        messages: room.messages.slice(-50) // Derniers 50 messages
      });

      // Notifier les autres participants
      socket.to(roomId).emit('participant-joined', {
        userId,
        username,
        participants: Array.from(room.participants.keys())
      });
    } catch (error: any) {
      socket.emit('watch-party-error', {
        code: error.message,
        message: error.message === 'ROOM_NOT_FOUND' 
          ? 'La salle spécifiée n\'existe pas' 
          : 'La salle est pleine'
      });
    }
  });

  // Quitter une salle de watch party
  socket.on('leave-watch-party', () => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (userId) {
      const result = watchPartyService.leaveRoom(userId);
      
      if (result) {
        const { room, shouldDeleteRoom } = result;
        const roomId = room.id;
        
        socket.leave(roomId);

        // Notifier les autres participants
        socket.to(roomId).emit('participant-left', {
          userId,
          username,
          participants: Array.from(room.participants.keys())
        });

        // Si la salle est vide, la supprimer
        if (shouldDeleteRoom) {
          console.log(`Salle ${roomId} supprimée (vide)`);
        } else {
          // Si l'hôte quitte, transférer l'hôte à quelqu'un d'autre
          if (room.host === userId && room.participants.size > 0) {
            const participantsArray = Array.from(room.participants.values());
            if (participantsArray.length > 0) {
              const newHost = participantsArray[0].userId;
              io.to(roomId).emit('host-changed', { newHost });
            }
          }
        }

        console.log(`${username} a quitté la salle ${roomId}`);
      }
    }
  });

  // Synchronisation de la lecture vidéo
  socket.on('video-play', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    
    if (roomId && userId) {
      const result = watchPartyService.syncVideoPlay(roomId, userId, data.currentTime);
      
      if (result && result.shouldSync) {
        socket.to(roomId).emit('video-play-sync', {
          currentTime: data.currentTime,
          triggeredBy: userId
        });
      }
    }
  });

  socket.on('video-pause', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    
    if (roomId && userId) {
      const result = watchPartyService.syncVideoPause(roomId, userId, data.currentTime);
      
      if (result && result.shouldSync) {
        socket.to(roomId).emit('video-pause-sync', {
          currentTime: data.currentTime,
          triggeredBy: userId
        });
      }
    }
  });

  socket.on('video-seek', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    
    if (roomId && userId) {
      const result = watchPartyService.syncVideoSeek(roomId, userId, data.currentTime);
      
      if (result) {
        socket.to(roomId).emit('video-seek-sync', {
          currentTime: data.currentTime,
          triggeredBy: userId
        });
      }
    }
  });

  // Synchronisation périodique de la position
  socket.on('video-time-sync', (data: { currentTime: number }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    
    if (roomId && userId) {
      const result = watchPartyService.syncVideoTime(roomId, userId, data.currentTime);
      
      // Pas besoin d'émettre un événement pour cette synchronisation périodique
    }
  });

  // Changer de vidéo dans la watch party
  socket.on('change-video', (data: { videoUrl: string; title: string }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;

    if (roomId && userId) {
      const result = watchPartyService.changeVideo(roomId, userId, data.videoUrl, data.title);
      
      if (result) {
        const { room, isAuthorized } = result;
        
        if (isAuthorized) {
          io.to(roomId).emit('video-changed', {
            videoUrl: data.videoUrl,
            title: data.title,
            changedBy: socket.data.username
          });
        } else {
          // Envoyer un message d'erreur à l'utilisateur non autorisé
          socket.emit('watch-party-error', {
            code: 'NOT_AUTHORIZED',
            message: 'Seul l\'hôte peut changer la vidéo'
          });
        }
      }
    }
  });

  // Chat de la watch party
  socket.on('send-message', (data: { message: string }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (roomId && userId && data.message.trim()) {
      const messageData = watchPartyService.sendMessage(roomId, userId, username, data.message);
      
      if (messageData) {
        // Envoyer le message à tous les participants de la salle
        io.to(roomId).emit('new-message', messageData);
      }
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (userId) {
      const result = watchPartyService.leaveRoom(userId);
      
      if (result) {
        const { room, shouldDeleteRoom } = result;
        const roomId = room.id;
        
        // Si la salle est vide, la supprimer
        if (shouldDeleteRoom) {
          console.log(`Salle ${roomId} supprimée (déconnexion)`);
        } else {
          // Si l'hôte se déconnecte, transférer l'hôte
          if (room.host === userId && room.participants.size > 0) {
            const participantsArray = Array.from(room.participants.values());
            if (participantsArray.length > 0) {
              const newHost = participantsArray[0].userId;
              io.to(roomId).emit('host-changed', { newHost });
            }
          }

          // Notifier les autres participants
          socket.to(roomId).emit('participant-left', {
            userId,
            username,
            participants: Array.from(room.participants.keys())
          });
        }
      }
    }

    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// API routes pour Watch Party
app.get('/api/watch-party/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = watchPartyService.getRoomInfo(roomId);

  if (room) {
    res.json({
      exists: true,
      host: room.host,
      participants: Array.from(room.participants.keys()),
      currentVideo: room.currentVideo,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      messageCount: room.messages.length
    });
  } else {
    res.json({ exists: false });
  }
});

app.post('/api/watch-party', (req: any, res: any) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({ 
      error: "Vous devez être connecté pour créer une Watch Party" 
    });
  }

  const { videoUrl, title } = req.body;
  
  try {
    // Utiliser l'ID utilisateur réel
    const userId = req.user.userId;
    const username = req.user.username;
    
    // Créer une nouvelle salle
    const room = watchPartyService.createRoom(userId, username, 'temp-socket-id', videoUrl);

    res.json({
      roomId: room.id,
      videoUrl,
      title
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Socket.IO activé pour Watch Party`);
});