import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MessageCircle, Share2, Play, Pause, SkipForward, Heart, Laugh, ThumbsUp, Angry, Copy, Check } from 'lucide-react';

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
  isHost?: boolean;
  setIsHost?: (isHost: boolean) => void;
  currentVideoTime?: number;
  isVideoPlaying?: boolean;
}

interface Participant {
  userId: string;
  username: string;
  isHost: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  isSystemMessage?: boolean;
}

const WatchParty: React.FC<WatchPartyProps> = ({ 
  videoUrl, 
  title, 
  onVideoControl,
  onVideoUrlChange,
  isHost: externalIsHost,
  setIsHost: externalSetIsHost,
  currentVideoTime,
  isVideoPlaying
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [internalIsHost, setInternalIsHost] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isHost = externalIsHost !== undefined ? externalIsHost : internalIsHost;
  const setIsHost = externalSetIsHost || setInternalIsHost;

  // Initialiser Socket.IO
  useEffect(() => {
    if (!user) return;

    // Utiliser l'URL du serveur selon l'environnement
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';

    const socketConnection = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketConnection.on('connect', () => {
      console.log('Connecté au serveur Watch Party');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('Déconnecté du serveur Watch Party:', reason);
      setIsConnected(false);
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Erreur de connexion au serveur Watch Party:', error);
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
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: p === data.host
      })));
      setMessages(data.messages || []);
      // Synchroniser l'état vidéo
      if (data.currentVideo) {
        onVideoUrlChange?.(data.currentVideo);
      }
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
    });

    // Nouveau participant
    socket.on('participant-joined', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: p === data.userId && data.userId === getHostId() // À implémenter
      })));
      
      // Ajouter un message système
      const newMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'Système',
        message: `${data.username} a rejoint la salle`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      setMessages(prev => [...prev, newMessage]);
    });

    // Participant parti
    socket.on('participant-left', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: p === getHostId()
      })));
      
      // Ajouter un message système
      const newMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'Système',
        message: `${data.username} a quitté la salle`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      setMessages(prev => [...prev, newMessage]);
    });

    // Changement d'hôte
    socket.on('host-changed', (data: HostChangedData) => {
      setIsHost(data.newHost === user.id);
    });

    // Synchronisation vidéo
    socket.on('video-play-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        onVideoControl?.('play', { currentTime: data.currentTime });
        setIsPlaying(true);
        setCurrentTime(data.currentTime);
      }
    });

    socket.on('video-pause-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        onVideoControl?.('pause', { currentTime: data.currentTime });
        setIsPlaying(false);
        setCurrentTime(data.currentTime);
      }
    });

    socket.on('video-seek-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        onVideoControl?.('seek', { currentTime: data.currentTime });
        setCurrentTime(data.currentTime);
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
  }, [socket, user, onVideoControl, onVideoUrlChange, setIsHost]);

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

  const joinWatchParty = () => {
    if (!socket || !user || !roomCode.trim()) return;

    socket.emit('join-watch-party', {
      roomId: roomCode.trim(),
      userId: user.id,
      username: user.username
    });
  };

  // Fonctions de contrôle vidéo pour la synchronisation
  const handlePlay = (time: number) => {
    if (socket && isHost) {
      socket.emit('video-play', { currentTime: time });
    }
  };

  const handlePause = (time: number) => {
    if (socket && isHost) {
      socket.emit('video-pause', { currentTime: time });
    }
  };

  const handleSeek = (time: number) => {
    if (socket && isHost) {
      socket.emit('video-seek', { currentTime: time });
    }
  };

  const changeVideo = (newVideoUrl: string, newTitle: string) => {
    if (socket && isHost) {
      socket.emit('change-video', { videoUrl: newVideoUrl, title: newTitle });
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

  const sendReaction = (emoji: string) => {
    if (!socket) return;

    socket.emit('send-message', { message: emoji });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch-party/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHostId = () => {
    const hostParticipant = participants.find(p => p.isHost);
    return hostParticipant ? hostParticipant.userId : null;
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
        <Card className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
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
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Entrez le code de la salle"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={joinWatchParty}
                  disabled={!isConnected || !roomCode.trim()}
                >
                  Rejoindre
                </Button>
              </div>
              {!isConnected && (
                <p className="text-xs text-red-500 text-center">
                  Connexion au serveur en cours...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Interface de la watch party active
        <div className="watch-party-active flex flex-col h-full flex-1">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                Salle: {roomId}
                {isHost && <span className="text-yellow-500 ml-1">(Hôte)</span>}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomLink}
                className="flex items-center gap-1 h-8 text-xs"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié!' : 'Partager'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-1 h-8 text-xs"
              >
                <MessageCircle className="w-3 h-3" />
                Chat
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveWatchParty}
                className="h-8 text-xs"
              >
                Quitter
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Zone principale (vidéo) */}
            <div className="flex-1 bg-black">
              {/* Ici serait intégré le lecteur vidéo */}
              <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
                {videoUrl ? (
                  <div className="text-sm">
                    <div className="mb-2">Vidéo sélectionnée: {title}</div>
                    <div className="text-xs text-gray-400">
                      {isVideoPlaying ? 'Lecture en cours' : 'En pause'} - 
                      Temps: {Math.floor((currentVideoTime || 0) / 60)}:{String(Math.floor((currentVideoTime || 0) % 60)).padStart(2, '0')}
                    </div>
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
              <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900">
                {/* Liste des participants */}
                <div className="p-3 border-b border-gray-800">
                  <h3 className="text-sm font-medium mb-2">
                    Participants ({participants.length})
                  </h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant.userId} className="text-xs text-gray-300 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${participant.isHost ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span className="truncate">
                          {participant.username}
                          {participant.userId === user.id && (
                            <span className="text-blue-400 ml-1">(Vous)</span>
                          )}
                          {participant.isHost && (
                            <span className="text-yellow-500 ml-1">(Hôte)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Sync controls for host */}
                  {isHost && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <h4 className="text-xs font-medium mb-2 text-gray-400">Contrôles de synchronisation</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlay(currentTime)}
                          className="flex-1 text-xs h-8"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(currentTime)}
                          className="flex-1 text-xs h-8"
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div key={message.id} className={`text-sm ${message.isSystemMessage ? 'text-gray-500 italic' : ''}`}>
                        {!message.isSystemMessage && (
                          <span className="font-medium text-blue-400">
                            {message.username}:
                          </span>
                        )}
                        <span className={`ml-2 ${message.isSystemMessage ? 'text-gray-500' : 'text-gray-300'}`}>
                          {message.message}
                        </span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Emoji reactions */}
                <div className="p-3 border-t border-gray-800">
                  <div className="flex gap-1 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendReaction('❤️')}
                      className="p-1 h-8 w-8"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendReaction('😂')}
                      className="p-1 h-8 w-8"
                    >
                      <Laugh className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendReaction('👍')}
                      className="p-1 h-8 w-8"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendReaction('😠')}
                      className="p-1 h-8 w-8"
                    >
                      <Angry className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="text-sm flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="h-8"
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