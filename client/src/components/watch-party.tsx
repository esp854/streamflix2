import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MessageCircle, Share2, Play, Pause, SkipForward, Copy, Check } from 'lucide-react';

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

    // Événement déclenché lorsque l'utilisateur rejoint une salle
    socket.on('watch-party-joined', (data: WatchPartyJoinedData) => {
      console.log('Watch party joined:', data);
      setRoomId(data.roomId);
      setIsHost(data.host === user.id);
      
      // Mettre à jour les participants
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`
      })));
      
      // Mettre à jour les messages
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
      // Obtenir le token d'authentification depuis le localStorage
      const authToken = localStorage.getItem('auth_token');
      
      // Obtenir le token CSRF
      let csrfToken = '';
      try {
        const csrfResponse = await fetch("/api/csrf-token", {
          credentials: "include",
          headers: {
            ...(authToken ? { "Authorization": "Bearer " + authToken } : {}),
          },
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
        }
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }

      const response = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
        },
        body: JSON.stringify({
          videoUrl,
          title
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la Watch Party');
      }

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
    <div className="watch-party-container h-full flex flex-col">
      {!roomId ? (
        // Interface de création/rejoindre
        <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-800 shadow-2xl shadow-purple-500/10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-purple-600 p-3 rounded-full mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              Watch Party
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              Regardez {title} ensemble avec vos amis
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              onClick={createWatchParty}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
              disabled={!isConnected}
            >
              <Users className="w-5 h-5 mr-2" />
              Créer une Watch Party
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900 px-2 text-gray-500">OU</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-center text-gray-400 text-sm">Rejoindre une salle existante</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Code de la salle"
                  onKeyPress={(e) => e.key === 'Enter' && joinWatchParty((e.target as HTMLInputElement).value)}
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Code de la salle"]') as HTMLInputElement;
                    joinWatchParty(input.value);
                  }}
                  disabled={!isConnected}
                  className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {!isConnected && (
              <div className="text-center py-2">
                <p className="text-sm text-red-400 flex items-center justify-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  Connexion au serveur...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Interface de la watch party active
        <div className="watch-party-active flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Salle: {roomId.slice(0, 8)}...
                </div>
                <div className="text-xs text-gray-400">
                  {participants.length} participant{participants.length > 1 ? 's' : ''}
                </div>
              </div>
              {isHost && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                  Hôte
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomLink}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={leaveWatchParty}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                Quitter
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Zone principale (vidéo) */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-4 bg-black/30">
                {videoUrl ? (
                  <div className="text-center">
                    <div className="bg-gray-800 p-4 rounded-xl inline-block">
                      <Play className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                      <div className="text-white font-medium">{title}</div>
                      <div className="text-gray-400 text-sm mt-1">La vidéo est synchronisée</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center max-w-md">
                    <div className="bg-gray-800 p-6 rounded-xl inline-block mb-4">
                      <Users className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">En attente de la vidéo</h3>
                    <p className="text-gray-400 mb-4">
                      {isHost 
                        ? "Sélectionnez une vidéo pour commencer la Watch Party" 
                        : "L'hôte va bientôt sélectionner une vidéo"}
                    </p>
                    {isHost && (
                      <Button 
                        onClick={() => {
                          // Exemple - dans une vraie implémentation, cela viendrait du lecteur
                          if (onVideoUrlChange) {
                            onVideoUrlChange('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Sélectionner une vidéo de démo
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contrôles vidéo */}
              {videoUrl && (
                <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => onVideoControl?.('seek', { currentTime: Math.max(0, (videoCurrentTime || 0) - 10) })}
                    >
                      <SkipForward className="w-4 h-4 rotate-180" />
                    </Button>
                    <Button 
                      size="icon"
                      className="bg-purple-600 hover:bg-purple-700 w-10 h-10"
                      onClick={() => {
                        if (isVideoPlaying) {
                          onVideoControl?.('pause', { currentTime: videoCurrentTime });
                        } else {
                          onVideoControl?.('play', { currentTime: videoCurrentTime });
                        }
                      }}
                    >
                      {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => onVideoControl?.('seek', { currentTime: (videoCurrentTime || 0) + 30 })}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Chat (optionnel) */}
            {showChat && (
              <div className="w-80 border-l border-gray-700 bg-gray-800 flex flex-col">
                {/* Liste des participants */}
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants
                  </h3>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div key={participant.userId} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300 truncate flex-1">
                          {participant.username}
                        </span>
                        {participant.userId === user.id && (
                          <span className="text-xs text-purple-400">(Vous)</span>
                        )}
                        {isHost && participant.userId === user.id && (
                          <span className="text-xs text-yellow-500">(Hôte)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="text-sm">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-purple-400 text-xs">
                            {message.username}:
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-gray-300">{message.message}</span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input message */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
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