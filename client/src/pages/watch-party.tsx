import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth-context';
import WatchParty from '../components/watch-party';
import ZuploadVideoPlayer from '../components/zupload-video-player';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const WatchPartyPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('Watch Party');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [syncVideoTime, setSyncVideoTime] = useState<number | undefined>(undefined);
  const [syncVideoAction, setSyncVideoAction] = useState<'play' | 'pause' | 'seek' | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    // Si on arrive avec un roomId dans l'URL, on pourrait charger les détails de la salle
    if (roomId) {
      console.log('Room ID from URL:', roomId);
    }
  }, [user, roomId, setLocation]);

  const handleVideoControl = (action: 'play' | 'pause' | 'seek', data?: any) => {
    console.log('Video control:', action, data);
    // Ici on implémente la logique de contrôle vidéo
    switch (action) {
      case 'play':
        setIsVideoPlaying(true);
        if (data?.currentTime !== undefined) {
          setCurrentVideoTime(data.currentTime);
        }
        break;
      case 'pause':
        setIsVideoPlaying(false);
        if (data?.currentTime !== undefined) {
          setCurrentVideoTime(data.currentTime);
        }
        break;
      case 'seek':
        if (data?.currentTime !== undefined) {
          setCurrentVideoTime(data.currentTime);
        }
        break;
    }
  };

  const handleVideoTimeUpdate = (time: number) => {
    // Mettre à jour le temps de la vidéo localement
    setCurrentVideoTime(time);
  };

  // Fonction pour gérer les commandes de synchronisation reçues de WatchParty
  const handleSyncVideoControl = (action: 'play' | 'pause' | 'seek', data?: any) => {
    console.log('Sync video control:', action, data);
    setSyncVideoAction(action);
    
    if (data?.currentTime !== undefined) {
      setSyncVideoTime(data.currentTime);
      setCurrentVideoTime(data.currentTime);
    }
    
    // Réinitialiser l'action de synchronisation après un court délai
    setTimeout(() => {
      setSyncVideoAction(undefined);
    }, 100);
  };

  if (!user) {
    return null; // Redirection en cours
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
          <h1 className="text-xl font-bold">Watch Party</h1>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Zone principale avec la vidéo */}
        <div className="flex-1 flex flex-col">
          {/* Lecteur vidéo */}
          <div className="flex-1 relative">
            {videoUrl ? (
              <ZuploadVideoPlayer
                videoUrl={videoUrl}
                title={title}
                onVideoEnd={() => console.log('Video ended')}
                onVideoError={(error) => console.error('Video error:', error)}
                onNextEpisode={() => console.log('Next episode')}
                onVideoTimeUpdate={handleVideoTimeUpdate}
                syncVideoTime={syncVideoTime}
                syncVideoAction={syncVideoAction}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Choisissez une vidéo</h2>
                  <p className="text-gray-400 mb-6">
                    Sélectionnez un film ou une série pour commencer votre Watch Party
                  </p>
                  <Button
                    onClick={() => setLocation('/')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Explorer le catalogue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau Watch Party */}
        <div className="w-96 border-l border-gray-800 bg-gray-900">
          <WatchParty
            videoUrl={videoUrl}
            title={title}
            onVideoControl={handleSyncVideoControl}
            onVideoUrlChange={setVideoUrl}
            onVideoTimeUpdate={handleVideoTimeUpdate}
            isVideoPlaying={isVideoPlaying}
            videoCurrentTime={currentVideoTime}
          />
        </div>
      </div>
    </div>
  );
};

export default WatchPartyPage;