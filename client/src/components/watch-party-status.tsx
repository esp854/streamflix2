import React from 'react';
import { Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface WatchPartyStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  participantCount: number;
  onRetry?: () => void;
}

const WatchPartyStatus: React.FC<WatchPartyStatusProps> = ({ 
  isConnected, 
  isConnecting, 
  hasError, 
  participantCount,
  onRetry
}) => {
  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Connexion...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-between gap-2 text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Erreur de connexion</span>
        </div>
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/20 h-6 px-2"
          >
            Réessayer
          </Button>
        )}
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">
          Connecté • {participantCount} participant{participantCount > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-400 bg-gray-400/10 px-3 py-2 rounded-lg">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Non connecté</span>
    </div>
  );
};

export default WatchPartyStatus;