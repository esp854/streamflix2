import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth-context';
import WatchParty from '../components/watch-party-improved';
import ZuploadVideoPlayer from '../components/zupload-video-player';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const WatchPartyPage: React.FC = () => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('Watch Party');
  const [isHost, setIsHost] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoPlayerRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    // Si on arrive avec un roomId dans l'URL, on pourrait charger les détails de la salle
    if (urlRoomId) {
      console.log('Room ID from URL:', urlRoomId);
    }
  }, [user, urlRoomId, setLocation]);

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

  const handleVideoPlay = (time: number) => {
    // Cette fonction est appelée par le lecteur vidéo quand l'utilisateur appuie sur play
    if (isHost) {
      // Si l'utilisateur est l'hôte, envoyer la synchronisation
      // handleVideoControl('play', { currentTime: time });
    }
  };

  const handleVideoPause = (time: number) => {
    // Cette fonction est appelée par le lecteur vidéo quand l'utilisateur appuie sur pause
    if (isHost) {
      // Si l'utilisateur est l'hôte, envoyer la synchronisation
      // handleVideoControl('pause', { currentTime: time });
    }
  };

  const handleVideoSeek = (time: number) => {
    // Cette fonction est appelée par le lecteur vidéo quand l'utilisateur cherche dans la vidéo
    if (isHost) {
      // Si l'utilisateur est l'hôte, envoyer la synchronisation
      // handleVideoControl('seek', { currentTime: time });
    }
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
                ref={videoPlayerRef}
                videoUrl={videoUrl}
                title={title}
                onVideoEnd={() => console.log('Video ended')}
                onVideoError={(error) => console.error('Video error:', error)}
                onNextEpisode={() => console.log('Next episode')}
                isWatchParty={true}
                isHost={isHost}
                onVideoPlay={handleVideoPlay}
                onVideoPause={handleVideoPause}
                onVideoSeek={handleVideoSeek}
                watchPartyCurrentTime={currentVideoTime}
                watchPartyIsPlaying={isVideoPlaying}
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
            onVideoControl={handleVideoControl}
            onVideoUrlChange={setVideoUrl}
            isHost={isHost}
            setIsHost={setIsHost}
          />
        </div>
      </div>
    </div>
  );
};

export default WatchPartyPage;