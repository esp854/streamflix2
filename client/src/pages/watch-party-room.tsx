import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth-context';
import WatchPartyRoomInfo from '../components/watch-party-room-info';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const WatchPartyRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleJoinRoom = (roomId: string) => {
    // Rediriger vers la page de watch party avec le roomId
    setLocation(`/watch-party/${roomId}`);
  };

  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">Détails de la salle</h1>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] items-center justify-center p-4">
        {roomId ? (
          <WatchPartyRoomInfo 
            roomId={roomId} 
            onJoin={handleJoinRoom} 
          />
        ) : (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Salle non trouvée</h2>
            <p className="text-gray-400 mb-6">
              Le code de salle spécifié est invalide ou n'existe plus.
            </p>
            <Button
              onClick={() => setLocation('/watch-party')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Créer une nouvelle salle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchPartyRoomPage;