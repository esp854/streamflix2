import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MessageCircle, Share2, Play, Pause, SkipForward, Copy, Check, Video, Mic, MicOff, VideoOff, User, Crown, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  isHost?: boolean;
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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [copied, setCopied] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [localVideoUrl, setLocalVideoUrl] = useState<string>(videoUrl);
  const [localTitle, setLocalTitle] = useState<string>(title);
  const isMobile = useIsMobile();

  // Initialiser Socket.IO
  useEffect(() => {
    if (!user) return;

    // Utiliser l'URL du serveur selon l'environnement
    const serverUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000' 
      : 'https://streamflix2-o7vx.onrender.com';
    
    setConnectionStatus('connecting');
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    newSocket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
      setIsConnected(true);
      setConnectionStatus('connected');
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Déconnecté du serveur:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Le serveur a activement déconnecté le client
        setConnectionStatus('disconnected');
      } else {
        // Le client a perdu la connexion
        setConnectionStatus('error');
      }
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
      setConnectionStatus('error');
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au service Watch Party. Veuillez réessayer.",
        variant: "destructive",
      });
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Mettre à jour les URLs locales lorsque les props changent
  useEffect(() => {
    setLocalVideoUrl(videoUrl);
    setLocalTitle(title);
  }, [videoUrl, title]);

  // Gérer les événements Socket.IO
  useEffect(() => {
    if (!socket || !user) return;

    // Événement déclenché lorsque l'utilisateur rejoint une salle
    socket.on('watch-party-joined', (data: WatchPartyJoinedData) => {
      console.log('Watch party joined:', data);
      setRoomId(data.roomId);
      
      // Mettre à jour les participants avec les informations d'hôte
      const updatedParticipants = data.participants.map((p: string) => ({
        userId: p,
        username: p === data.host ? `${user.username} (Hôte)` : user.username,
        isHost: p === data.host
      }));
      
      setParticipants(updatedParticipants);
      setIsHost(data.host === user.id);
      
      // Mettre à jour les messages
      setMessages(data.messages || []);
      
      // Synchroniser l'état vidéo
      if (data.currentVideo) {
        onVideoUrlChange?.(data.currentVideo);
        setLocalVideoUrl(data.currentVideo);
      }
      
      setSyncedCurrentTime(data.currentTime);
      setSyncedIsPlaying(data.isPlaying);
      onVideoTimeUpdate?.(data.currentTime);
      
      if (data.isPlaying) {
        onVideoControl?.('play', { currentTime: data.currentTime });
      } else {
        onVideoControl?.('pause', { currentTime: data.currentTime });
      }
      
      toast({
        title: "Connecté",
        description: "Vous avez rejoint la Watch Party avec succès !",
      });
    });

    // Nouveau participant
    socket.on('participant-joined', (data: ParticipantEventData) => {
      const updatedParticipants = data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: false // L'hôte est géré séparément
      }));
      
      setParticipants(updatedParticipants);
      
      // Trouver le nouveau participant pour afficher une notification
      const newParticipant = data.participants.find(p => 
        !participants.some(prev => prev.userId === p)
      );
      
      if (newParticipant) {
        toast({
          title: "Nouveau participant",
          description: `${newParticipant === user.id ? 'Vous' : `User ${newParticipant.slice(0, 8)}`} a rejoint la Watch Party`,
        });
      }
    });

    // Participant parti
    socket.on('participant-left', (data: ParticipantEventData) => {
      const updatedParticipants = data.participants.map((p: string) => ({
        userId: p,
        username: p === user.id ? user.username : `User ${p.slice(0, 8)}`,
        isHost: false
      }));
      
      setParticipants(updatedParticipants);
      
      toast({
        title: "Participant parti",
        description: "Un participant a quitté la Watch Party",
      });
    });

    // Changement d'hôte
    socket.on('host-changed', (data: HostChangedData) => {
      setIsHost(data.newHost === user.id);
      
      // Mettre à jour les participants avec les nouvelles informations d'hôte
      setParticipants(prev => prev.map(p => ({
        ...p,
        username: p.userId === data.newHost ? `${p.username.split(' ')[0]} (Hôte)` : p.username.replace(' (Hôte)', ''),
        isHost: p.userId === data.newHost
      })));
      
      toast({
        title: "Changement d'hôte",
        description: data.newHost === user.id 
          ? "Vous êtes maintenant l'hôte de la Watch Party" 
          : "L'hôte de la Watch Party a changé",
      });
    });

    // Synchronisation vidéo
    socket.on('video-play-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        setSyncedIsPlaying(true);
        setSyncedCurrentTime(data.currentTime);
        onVideoTimeUpdate?.(data.currentTime);
        onVideoControl?.('play', { currentTime: data.currentTime });
      }
    });

    socket.on('video-pause-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        setSyncedIsPlaying(false);
        setSyncedCurrentTime(data.currentTime);
        onVideoTimeUpdate?.(data.currentTime);
        onVideoControl?.('pause', { currentTime: data.currentTime });
      }
    });

    socket.on('video-seek-sync', (data: VideoSyncData) => {
      if (data.triggeredBy !== user.id) {
        setSyncedCurrentTime(data.currentTime);
        onVideoTimeUpdate?.(data.currentTime);
        onVideoControl?.('seek', { currentTime: data.currentTime });
      }
    });

    // Changement de vidéo
    socket.on('video-changed', (data: VideoChangedData) => {
      onVideoUrlChange?.(data.videoUrl);
      setLocalVideoUrl(data.videoUrl);
      setLocalTitle(data.title);
      toast({
        title: "Vidéo changée",
        description: `La vidéo a été changée par ${data.changedBy}`,
      });
    });

    // Nouveau message
    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Erreurs
    socket.on('watch-party-error', (error: string) => {
      toast({
        title: "Erreur Watch Party",
        description: error,
        variant: "destructive",
      });
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
      socket.off('watch-party-error');
    };
  }, [socket, user, onVideoControl, onVideoUrlChange, onVideoTimeUpdate, participants]);

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
          videoUrl: localVideoUrl,
          title: localTitle
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
    } catch (error: any) {
      console.error('Erreur création watch party:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la Watch Party",
        variant: "destructive",
      });
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
    setLocalVideoUrl('');
    setLocalTitle('');
    
    toast({
      title: "Watch Party terminée",
      description: "Vous avez quitté la Watch Party",
    });
  };

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !user) return;

    const messageData = {
      message: newMessage.trim(),
      userId: user.id,
      username: user.username,
      timestamp: Date.now()
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch-party/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Lien copié",
        description: "Le lien de la Watch Party a été copié dans le presse-papiers",
      });
    });
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value);
  };

  const handleJoinByCode = () => {
    if (roomCode.trim()) {
      joinWatchParty(roomCode.trim());
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">Connectez-vous pour utiliser Watch Party</p>
      </div>
    );
  }

  return (
    <div className="watch-party-container h-full flex flex-col bg-gray-900">
      {!roomId ? (
        // Interface de création/rejoindre
        <Card className="w-full max-w-md mx-auto bg-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-purple-600 p-3 rounded-full mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              Watch Party
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              Regardez {localTitle || title} ensemble avec vos amis
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              onClick={createWatchParty}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
              disabled={!isConnected || connectionStatus !== 'connected'}
            >
              <Users className="w-5 h-5 mr-2" />
              Créer une Watch Party
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-800 px-2 text-gray-500">OU</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-center text-gray-400 text-sm">Rejoindre une salle existante</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Code de la salle"
                  value={roomCode}
                  onChange={handleRoomCodeChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Button
                  variant="outline"
                  onClick={handleJoinByCode}
                  disabled={!isConnected || connectionStatus !== 'connected' || !roomCode.trim()}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Indicateur de connexion */}
            <div className="text-center py-2">
              {connectionStatus === 'connecting' && (
                <p className="text-sm text-yellow-400 flex items-center justify-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                  Connexion au serveur...
                </p>
              )}
              {connectionStatus === 'connected' && (
                <p className="text-sm text-green-400 flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connecté
                </p>
              )}
              {connectionStatus === 'disconnected' && (
                <p className="text-sm text-red-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Déconnecté
                </p>
              )}
              {connectionStatus === 'error' && (
                <p className="text-sm text-red-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Erreur de connexion
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Interface de la watch party active
        <div className="watch-party-active flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
          {/* Header avec contrôles */}
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
                  <Crown className="w-3 h-3 mr-1" />
                  Hôte
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={`text-gray-300 hover:text-white hover:bg-gray-700 ${isMuted ? 'bg-red-500/20 text-red-400' : ''}`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`text-gray-300 hover:text-white hover:bg-gray-700 ${isVideoMuted ? 'bg-red-500/20 text-red-400' : ''}`}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomLink}
                className="text-gray-300 hover:text-white hover:bg-gray-700 relative"
              >
                <Copy className="w-4 h-4" />
                {copied && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </Button>
              {/* Sur mobile, le chat s'affiche en bas de l'écran */}
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className={`text-gray-300 hover:text-white hover:bg-gray-700 ${showChat ? 'bg-gray-700' : ''}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className={`text-gray-300 hover:text-white hover:bg-gray-700 ${showChat ? 'bg-gray-700' : ''}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={leaveWatchParty}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Zone principale (vidéo) */}
            <div className="flex-1 flex flex-col bg-black">
              <div className="flex-1 flex items-center justify-center p-4">
                {localVideoUrl ? (
                  <div className="text-center w-full max-w-2xl">
                    <div className="bg-gray-800 p-6 rounded-xl inline-block mb-4">
                      <Video className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                      <div className="text-white font-medium text-lg mb-2">{localTitle || title}</div>
                      <div className="text-gray-400 text-sm">
                        La vidéo est synchronisée avec tous les participants
                      </div>
                    </div>
                    
                    {/* Contrôles vidéo - Adaptés pour mobile */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <Button 
                        size={isMobile ? "icon" : "sm"}
                        variant="ghost"
                        className="text-gray-300 hover:text-white hover:bg-gray-700 w-12 h-12"
                        onClick={() => onVideoControl?.('seek', { currentTime: Math.max(0, (videoCurrentTime || 0) - 10) })}
                      >
                        <SkipForward className="w-4 h-4 rotate-180" />
                      </Button>
                      <Button 
                        size="icon"
                        className="bg-purple-600 hover:bg-purple-700 w-16 h-16 rounded-full"
                        onClick={() => {
                          if (isVideoPlaying) {
                            onVideoControl?.('pause', { currentTime: videoCurrentTime });
                          } else {
                            onVideoControl?.('play', { currentTime: videoCurrentTime });
                          }
                        }}
                        disabled={!isHost}
                      >
                        {isVideoPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                      </Button>
                      <Button 
                        size={isMobile ? "icon" : "sm"}
                        variant="ghost"
                        className="text-gray-300 hover:text-white hover:bg-gray-700 w-12 h-12"
                        onClick={() => onVideoControl?.('seek', { currentTime: (videoCurrentTime || 0) + 30 })}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {!isHost && (
                      <div className="mt-4 text-sm text-gray-400 flex items-center justify-center">
                        <User className="w-4 h-4 mr-2" />
                        Seul l'hôte peut contrôler la lecture
                      </div>
                    )}
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
                            setLocalVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                            setLocalTitle('Big Buck Bunny');
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
              
              {/* Liste des participants - Adaptée pour mobile */}
              <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">Participants:</span>
                  {participants.map((participant) => (
                    <div 
                      key={participant.userId} 
                      className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded-full text-xs whitespace-nowrap"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-200">
                        {participant.username}
                      </span>
                      {participant.userId === user.id && (
                        <span className="text-purple-400">(Vous)</span>
                      )}
                      {participant.isHost && (
                        <Crown className="w-3 h-3 text-yellow-500 ml-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat (optionnel) - Sur mobile, affiché en bas de l'écran */}
            {showChat && isMobile ? (
              <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-800 flex flex-col z-50 max-h-64">
                {/* Header du chat mobile */}
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
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
                        <span className="text-gray-200">{message.message}</span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input message */}
                <div className="p-3 border-t border-gray-700">
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
            ) : showChat && !isMobile ? (
              <div className="w-80 border-l border-gray-700 bg-gray-800 flex flex-col">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </h3>
                  </div>
                  
                  <ScrollArea className="flex-1 p-3">
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
                          <span className="text-gray-200">{message.message}</span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input message */}
                  <div className="p-3 border-t border-gray-700">
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchParty;