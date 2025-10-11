import React, { useState, useEffect } from 'react';
import { Users, Film, Clock, Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoomInfo {
  exists: boolean;
  host?: string;
  participants?: string[];
  currentVideo?: string;
  currentTime?: number;
  isPlaying?: boolean;
  messageCount?: number;
  createdAt?: number;
  lastActivity?: number;
}

interface WatchPartyRoomInfoProps {
  roomId: string;
  onJoin: (roomId: string) => void;
}

const WatchPartyRoomInfo: React.FC<WatchPartyRoomInfoProps> = ({ roomId, onJoin }) => {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/watch-party/${roomId}`);
        const data = await response.json();
        setRoomInfo(data);
      } catch (err) {
        setError('Erreur lors du chargement des informations de la salle');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomInfo();
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!roomInfo || !roomInfo.exists) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>La salle spécifiée n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Informations de la salle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Code de la salle:</span>
          <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded">{roomId}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Participants:</span>
          <span className="text-sm">{roomInfo.participants?.length || 0}</span>
        </div>
        
        {roomInfo.currentVideo && (
          <div className="flex items-start gap-2">
            <Film className="w-4 h-4 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Vidéo en cours:</p>
              <p className="text-xs text-gray-400 truncate">{roomInfo.currentVideo}</p>
            </div>
          </div>
        )}
        
        {roomInfo.currentTime !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Position:</span>
            <span className="text-sm flex items-center gap-1">
              {roomInfo.isPlaying ? (
                <Play className="w-3 h-3" />
              ) : (
                <Pause className="w-3 h-3" />
              )}
              {formatDuration(roomInfo.currentTime)}
            </span>
          </div>
        )}
        
        {roomInfo.messageCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Messages:</span>
            <span className="text-sm">{roomInfo.messageCount}</span>
          </div>
        )}
        
        {roomInfo.createdAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Créée le:</span>
            <span className="text-xs text-gray-400">{formatTime(roomInfo.createdAt)}</span>
          </div>
        )}
        
        {roomInfo.lastActivity && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Dernière activité:</span>
            <span className="text-xs text-gray-400">{formatTime(roomInfo.lastActivity)}</span>
          </div>
        )}
        
        <Button 
          onClick={() => onJoin(roomId)}
          className="w-full mt-4"
        >
          Rejoindre la salle
        </Button>
      </CardContent>
    </Card>
  );
};

export default WatchPartyRoomInfo;