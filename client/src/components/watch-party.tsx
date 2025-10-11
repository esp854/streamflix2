import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MessageCircle, Share2, Play, Pause, SkipForward } from 'lucide-react';

// Interfaces pour les événements Socket.IO
interface WatchPartyJoinedData {
  roomId: string;
  host: string;
  participants: string[];
  currentVideo: string;
  currentTime: number;
  isPlaying: boolean;
  messages: ChatMessage[];
}

interface ParticipantEventData {
  userId: string;
  username: string;
  participants: string[];
}

interface HostChangedData {
  newHost: string;
}

interface VideoSyncData {
  currentTime: number;
  triggeredBy: string;
}

interface VideoChangedData {
  videoUrl: string;
  title: string;
  changedBy: string;
}

interface WatchPartyProps {
  videoUrl: string;
  title: string;
  onVideoControl?: (action: 'play' | 'pause' | 'seek', data?: any) => void;
  onVideoUrlChange?: (url: string) => void;
  onVideoTimeUpdate?: (time: number) => void;
  isVideoPlaying?: boolean;
  videoCurrentTime?: number;
}

interface Participant {
  userId: string;
  username: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

const WatchParty: React.FC<WatchPartyProps> = ({ 
  videoUrl, 
  title, 
  onVideoControl,
  onVideoUrlChange,
  onVideoTimeUpdate,
  isVideoPlaying,
  videoCurrentTime
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [syncedIsPlaying, setSyncedIsPlaying] = useState(false);
  const [syncedCurrentTime, setSyncedCurrentTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSyncTimeRef = useRef<number>(0);

  // Initialiser Socket.IO
  useEffect(() => {
    if (!user) return;

    // Utiliser l'URL du serveur selon l'environnement
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';

    const socketConnection = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connecté au serveur Watch Party');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Déconnecté du serveur Watch Party');
      setIsConnected(false);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [user]);

  // Gestion des événements Socket.IO
  useEffect(() => {
    if (!socket || !user) return;

    // Rejoindre une salle existante
    socket.on('watch-party-joined', (data: WatchPartyJoinedData) => {
      console.log('Rejoint la watch party:', data);
      setRoomId(data.roomId);
      setIsHost(data.host === user.id);
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`
      })));
      setMessages(data.messages || []);
      // Synchroniser l'état vidéo
      if (data.currentVideo) {
        onVideoUrlChange?.(data.currentVideo);
      }
      setSyncedCurrentTime(data.currentTime);
      setSyncedIsPlaying(data.isPlaying);
      onVideoTimeUpdate?.(data.currentTime);
      if (data.isPlaying) {
        onVideoControl?.('play', { currentTime: data.currentTime });
      } else {
        onVideoControl?.('pause', { currentTime: data.currentTime });
      }
    });

    // Nouveau participant
    socket.on('participant-joined', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`
      })));
    });

    // Participant parti
    socket.on('participant-left', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`
      })));
    });

    // Changement d'hôte
    socket.on('host-changed', (data: HostChangedData) => {
      setIsHost(data.newHost === user.id);
    });

    // Synchronisation vidéo
    socket.on('video-play-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        onVideoControl?.('play', { currentTime: data.currentTime });
        setSyncedIsPlaying(true);
        setSyncedCurrentTime(data.currentTime);
        onVideoTimeUpdate?.(data.currentTime);
      }
    });

    socket.on('video-pause-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        onVideoControl?.('pause', { currentTime: data.currentTime });
        setSyncedIsPlaying(false);
        setSyncedCurrentTime(data.currentTime);
        onVideoTimeUpdate?.(data.currentTime);
      }
    });

    socket.on('video-seek-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        onVideoControl?.('seek', { currentTime: data.currentTime });
        setSyncedCurrentTime(data.currentTime);
        onVideoTimeUpdate?.(data.currentTime);
      }
    });

    // Changement de vidéo
    socket.on('video-changed', (data: VideoChangedData) => {
      console.log('Vidéo changée:', data);
      onVideoUrlChange?.(data.videoUrl);
    });

    // Nouveaux messages
    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('watch-party-joined');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('host-changed');
      socket.off('video-play-sync');
      socket.off('video-pause-sync');
      socket.off('video-seek-sync');
      socket.off('video-changed');
      socket.off('new-message');
    };
  }, [socket, user, onVideoControl, onVideoUrlChange, onVideoTimeUpdate]);

  // Synchroniser l'état local avec l'état vidéo
  useEffect(() => {
    if (isVideoPlaying !== undefined) {
      setSyncedIsPlaying(isVideoPlaying);
    }
  }, [isVideoPlaying]);

  useEffect(() => {
    if (videoCurrentTime !== undefined) {
      setSyncedCurrentTime(videoCurrentTime);
    }
  }, [videoCurrentTime]);

  // Auto-scroll des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createWatchParty = async () => {
    if (!socket || !user) return;

    try {
      const response = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          title
        })
      });

      const data = await response.json();
      setRoomId(data.roomId);

      // Rejoindre la salle créée
      socket.emit('join-watch-party', {
        roomId: data.roomId,
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      console.error('Erreur création watch party:', error);
    }
  };

  const joinWatchParty = (partyRoomId: string) => {
    if (!socket || !user || !partyRoomId.trim()) return;

    socket.emit('join-watch-party', {
      roomId: partyRoomId.trim(),
      userId: user.id,
      username: user.username
    });
  };

  // Fonctions de contrôle vidéo pour la synchronisation
  const handlePlay = (time: number) => {
    if (socket && isHost) {
      // Limiter la fréquence des synchronisations
      const now = Date.now();
      if (now - lastSyncTimeRef.current > 100) { // 100ms minimum entre sync
        socket.emit('video-play', { currentTime: time });
        lastSyncTimeRef.current = now;
      }
    }
  };

  const handlePause = (time: number) => {
    if (socket && isHost) {
      // Limiter la fréquence des synchronisations
      const now = Date.now();
      if (now - lastSyncTimeRef.current > 100) {
        socket.emit('video-pause', { currentTime: time });
        lastSyncTimeRef.current = now;
      }
    }
  };

  const handleSeek = (time: number) => {
    if (socket && isHost) {
      socket.emit('video-seek', { currentTime: time });
    }
  };

  const leaveWatchParty = () => {
    if (!socket) return;

    socket.emit('leave-watch-party');
    setRoomId('');
    setIsHost(false);
    setParticipants([]);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!socket || !newMessage.trim()) return;

    socket.emit('send-message', { message: newMessage.trim() });
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch-party/${roomId}`;
    navigator.clipboard.writeText(link);
    // Ici on pourrait ajouter une notification de succès
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">Connectez-vous pour utiliser Watch Party</p>
      </div>
    );
  }

  return (
    <div className="watch-party-container">
      {!roomId ? (
        // Interface de création/rejoindre
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Watch Party
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Regardez {title} ensemble avec vos amis !
              </p>
              <Button
                onClick={createWatchParty}
                className="w-full mb-4"
                disabled={!isConnected}
              >
                Créer une Watch Party
              </Button>
              <div className="text-xs text-gray-500 mb-2">OU</div>
              <Input
                placeholder="Entrez le code de la salle"
                onKeyPress={(e) => e.key === 'Enter' && joinWatchParty((e.target as HTMLInputElement).value)}
                className="mb-2"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Entrez le code de la salle"]') as HTMLInputElement;
                  joinWatchParty(input.value);
                }}
                disabled={!isConnected}
              >
                Rejoindre une Watch Party
              </Button>
            </div>
            {!isConnected && (
              <p className="text-xs text-red-500 text-center">
                Connexion au serveur en cours...
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        // Interface de la watch party active
        <div className="watch-party-active flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                Salle: {roomId.slice(0, 8)}...
                {isHost && <span className="text-yellow-500 ml-1">(Hôte)</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomLink}
                className="flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                Partager
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                Chat
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveWatchParty}
              >
                Quitter
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Zone principale (vidéo) */}
            <div className="flex-1">
              {/* Ici serait intégré le lecteur vidéo */}
              <div className="p-4 text-center text-gray-500">
                {videoUrl ? (
                  <div className="text-sm">
                    Vidéo sélectionnée: {title}
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">Aucune vidéo sélectionnée</p>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => {
                        // Exemple d'URL de test - à remplacer par la sélection réelle
                        if (onVideoUrlChange) {
                          onVideoUrlChange('https://example.com/video.mp4');
                        }
                      }}
                    >
                      Sélectionner une vidéo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat (optionnel) */}
            {showChat && (
              <div className="w-80 border-l flex flex-col">
                {/* Liste des participants */}
                <div className="p-3 border-b">
                  <h3 className="text-sm font-medium mb-2">
                    Participants ({participants.length})
                  </h3>
                  <div className="space-y-1">
                    {participants.map((participant) => (
                      <div key={participant.userId} className="text-xs text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {participant.username}
                        {participant.userId === participants.find(p => p.userId === user.id)?.userId && (
                          <span className="text-blue-500">(Vous)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div key={message.id} className="text-sm">
                        <span className="font-medium text-blue-600">
                          {message.username}:
                        </span>
                        <span className="ml-2">{message.message}</span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input message */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="text-sm"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                    >
                      Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchParty;