import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  MessageCircle, 
  Share2, 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  Laugh, 
  ThumbsUp, 
  Angry, 
  Copy, 
  Check, 
  Wifi, 
  WifiOff,
  Crown,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Interfaces pour les événements Socket.IO
interface WatchPartyJoinedData {
  roomId: string;
  host: string;
  participants: string[];
  currentVideo: string;
  currentTime: number;
  isPlaying: boolean;
  messages: ChatMessage[];
  isHost: boolean;
  participantCount: number;
  maxParticipants: number;
}

interface ParticipantEventData {
  userId: string;
  username: string;
  participants: string[];
  participantCount?: number;
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

const WatchPartyEnhanced: React.FC<WatchPartyProps> = ({ 
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [participantCount, setParticipantCount] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isHost = externalIsHost !== undefined ? externalIsHost : internalIsHost;
  const setIsHost = externalSetIsHost || setInternalIsHost;

  // Fonction utilitaire pour obtenir l'ID de l'hôte
  const getHostId = () => {
    const hostParticipant = participants.find(p => p.isHost);
    return hostParticipant?.userId || '';
  };

  // Initialiser Socket.IO avec reconnexion automatique et gestion d'erreurs avancée
  useEffect(() => {
    if (!user) return;

    setConnectionStatus('connecting');

    // Utiliser l'URL du serveur selon l'environnement
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';

    const socketConnection = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      forceNew: true
    });

    socketConnection.on('connect', () => {
      console.log('✅ Connecté au serveur Watch Party');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('❌ Déconnecté du serveur Watch Party:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketConnection.on('connect_error', (error) => {
      console.error('🚨 Erreur de connexion:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    });

    socketConnection.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnecté après ${attemptNumber} tentatives`);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketConnection.on('reconnect_error', (error) => {
      console.error('🚨 Erreur de reconnexion:', error);
      setConnectionStatus('error');
    });

    socketConnection.on('reconnect_failed', () => {
      console.error('🚨 Échec de reconnexion');
      setConnectionStatus('error');
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
      console.log('🎉 Rejoint la watch party:', data);
      setRoomId(data.roomId);
      setIsHost(data.isHost);
      setParticipantCount(data.participantCount);
      setMaxParticipants(data.maxParticipants);
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
      setIsLoading(false);
    });

    // Nouveau participant
    socket.on('participant-joined', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: p === getHostId()
      })));
      setParticipantCount(data.participantCount || data.participants.length);
    });

    // Participant parti
    socket.on('participant-left', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: p === getHostId()
      })));
      setParticipantCount(data.participantCount || data.participants.length);
      
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

    // Participant déconnecté
    socket.on('participant-disconnected', (data: ParticipantEventData) => {
      setParticipants(data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: p === getHostId()
      })));
      setParticipantCount(data.participantCount || data.participants.length);
      
      // Ajouter un message système
      const newMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'Système',
        message: `${data.username} s'est déconnecté`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      setMessages(prev => [...prev, newMessage]);
    });

    // Changement d'hôte
    socket.on('host-changed', (data: HostChangedData) => {
      setIsHost(data.newHost === user.id);
      setParticipants(prev => prev.map(p => ({
        ...p,
        isHost: p.userId === data.newHost
      })));
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
      console.log('🎬 Vidéo changée:', data);
      onVideoUrlChange?.(data.videoUrl);
    });

    // Nouveaux messages
    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Gestion des erreurs
    socket.on('error', (error: { message: string }) => {
      console.error('🚨 Erreur Watch Party:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        userId: 'system',
        username: 'Erreur',
        message: `Erreur: ${error.message}`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    return () => {
      socket.off('watch-party-joined');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('participant-disconnected');
      socket.off('host-changed');
      socket.off('video-play-sync');
      socket.off('video-pause-sync');
      socket.off('video-seek-sync');
      socket.off('video-changed');
      socket.off('new-message');
      socket.off('error');
    };
  }, [socket, user, onVideoControl, onVideoUrlChange, setIsHost]);

  // Auto-scroll des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createWatchParty = async () => {
    if (!socket || !user) return;

    setIsLoading(true);
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

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setRoomId(data.roomId);
      setRoomCode(data.roomId);

      // Rejoindre la salle créée
      socket.emit('join-watch-party', {
        roomId: data.roomId,
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      console.error('Erreur création watch party:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        userId: 'system',
        username: 'Erreur',
        message: `Impossible de créer la Watch Party: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const joinWatchParty = () => {
    if (!socket || !user || !roomCode.trim()) return;

    // Valider le code de salle
    if (roomCode.trim().length < 4) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        userId: 'system',
        username: 'Erreur',
        message: 'Le code de salle doit contenir au moins 4 caractères',
        timestamp: Date.now(),
        isSystemMessage: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    socket.emit('join-watch-party', {
      roomId: roomCode.trim().toUpperCase(),
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

  const leaveWatchParty = () => {
    if (!socket) return;

    socket.emit('leave-watch-party');
    setRoomId('');
    setIsHost(false);
    setParticipants([]);
    setMessages([]);
    setParticipantCount(0);
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

  const copyRoomCode = async () => {
    if (!roomId) return;
    
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Indicateur de statut de connexion
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connexion...';
      case 'connected':
        return 'Connecté';
      case 'disconnected':
        return 'Déconnecté';
      case 'error':
        return 'Erreur de connexion';
      default:
        return 'Non connecté';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* En-tête avec statut de connexion */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Watch Party</h2>
          <div className="flex items-center gap-1">
            {getConnectionStatusIcon()}
            <span className="text-sm text-gray-400">{getConnectionStatusText()}</span>
          </div>
        </div>
        
        {roomId && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Users className="h-3 w-3 mr-1" />
              {participantCount}/{maxParticipants}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={copyRoomCode}
              className="flex items-center gap-1"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copié!' : roomId}
            </Button>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex">
        {/* Panneau de contrôle */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          {/* Actions principales */}
          <div className="p-4 border-b border-gray-700">
            {!roomId ? (
              <div className="space-y-3">
                <Button
                  onClick={createWatchParty}
                  disabled={isLoading || !isConnected}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Créer une Watch Party
                </Button>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Code de salle"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="flex-1"
                    disabled={isLoading || !isConnected}
                  />
                  <Button
                    onClick={joinWatchParty}
                    disabled={isLoading || !isConnected || !roomCode.trim()}
                    variant="outline"
                  >
                    Rejoindre
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Salle:</span>
                  <Badge variant="secondary">{roomId}</Badge>
                </div>
                
                {isHost && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Crown className="h-4 w-4" />
                    <span className="text-sm">Vous êtes l'hôte</span>
                  </div>
                )}
                
                <Button
                  onClick={leaveWatchParty}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Quitter la salle
                </Button>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({participantCount})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-2 rounded bg-gray-800"
                >
                  <span className="text-sm">{participant.username}</span>
                  {participant.isHost && (
                    <Crown className="h-3 w-3 text-yellow-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  {showChat ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
            </div>

            {showChat && (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded ${
                          message.isSystemMessage
                            ? 'bg-blue-900/30 text-blue-300 text-xs'
                            : message.userId === user?.id
                            ? 'bg-blue-600 ml-4'
                            : 'bg-gray-800 mr-4'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs">
                            {message.username}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{message.message}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2 mb-2">
                    {['😀', '😂', '❤️', '👍', '👎'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => sendReaction(emoji)}
                        className="text-lg"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!isConnected || !roomId}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!isConnected || !roomId || !newMessage.trim()}
                    >
                      Envoyer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zone vidéo */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {!roomId ? (
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold mb-2">Aucune Watch Party active</h3>
              <p className="text-gray-400">
                Créez une nouvelle salle ou rejoignez une salle existante
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-gray-400">Salle: {roomId}</p>
              </div>
              
              {!isConnected && (
                <Alert className="max-w-md mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connexion perdue. Tentative de reconnexion...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPartyEnhanced;
