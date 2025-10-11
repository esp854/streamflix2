import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth-context';
import WatchParty from '../components/watch-party';
import ZuploadVideoPlayer from '../components/zupload-video-player';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users as UsersIcon, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [showInstructions, setShowInstructions] = useState(true);
  const [initialVideoUrl, setInitialVideoUrl] = useState<string | null>(null);
  const [initialTitle, setInitialTitle] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Extraire les paramètres de l'URL pour obtenir la vidéo initiale
  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    // Si on arrive avec un roomId dans l'URL, on pourrait charger les détails de la salle
    if (roomId) {
      console.log('Room ID from URL:', roomId);
    }
    
    // Afficher les instructions la première fois
    const hasSeenInstructions = localStorage.getItem('watchPartyInstructionsSeen');
    if (hasSeenInstructions) {
      setShowInstructions(false);
    }
    
    // Vérifier s'il y a des paramètres dans l'URL pour la vidéo initiale
    const urlParams = new URLSearchParams(window.location.search);
    const initialUrl = urlParams.get('videoUrl');
    const initialTitle = urlParams.get('title');
    
    if (initialUrl) {
      setInitialVideoUrl(decodeURIComponent(initialUrl));
      setVideoUrl(decodeURIComponent(initialUrl));
    }
    
    if (initialTitle) {
      setInitialTitle(decodeURIComponent(initialTitle));
      setTitle(decodeURIComponent(initialTitle));
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

  const closeInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem('watchPartyInstructionsSeen', 'true');
  };

  // Mémoriser les gestionnaires pour éviter les re-rendus inutiles
  const videoControlHandlers = useMemo(() => ({
    handleVideoControl,
    handleVideoTimeUpdate,
    handleSyncVideoControl
  }), []);

  if (!user) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl font-bold">Watch Party</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-sm text-gray-400">
            Connecté en tant que <span className="text-purple-400">{user.username}</span>
          </div>
        </div>
      </div>

      {/* Instructions pour les nouveaux utilisateurs */}
      {showInstructions && (
        <div className="m-4 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-300 mb-1">Comment utiliser Watch Party</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• En tant qu'hôte, vous contrôlez la lecture de la vidéo</li>
                  <li>• Les autres participants voient la vidéo synchronisée en temps réel</li>
                  <li>• Utilisez le chat pour communiquer avec les autres participants</li>
                  <li>• Partagez le code de la salle avec vos amis pour qu'ils puissent rejoindre</li>
                </ul>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={closeInstructions}
              className="text-gray-400 hover:text-white"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isMobile ? 'h-[calc(100vh-160px)]' : 'h-[calc(100vh-120px)]'} lg:flex-row`}>
        {/* Zone principale avec la vidéo */}
        <div className="flex-1 flex flex-col">
          {/* Lecteur vidéo */}
          <div className="flex-1 relative bg-black">
            {videoUrl ? (
              <ZuploadVideoPlayer
                videoUrl={videoUrl}
                title={title}
                onVideoEnd={() => console.log('Video ended')}
                onVideoError={(error) => {
                  console.error('Video error:', error);
                  toast({
                    title: "Erreur vidéo",
                    description: "Impossible de charger la vidéo. Veuillez réessayer.",
                    variant: "destructive",
                  });
                }}
                onNextEpisode={() => console.log('Next episode')}
                onVideoTimeUpdate={videoControlHandlers.handleVideoTimeUpdate}
                syncVideoTime={syncVideoTime}
                syncVideoAction={syncVideoAction}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center p-8 max-w-md">
                  <div className="bg-gray-800 p-4 rounded-full inline-block mb-6">
                    <div className="bg-purple-600 p-3 rounded-full">
                      <UsersIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Bienvenue dans votre Watch Party</h2>
                  <p className="text-gray-400 mb-6">
                    Commencez par sélectionner une vidéo dans le panneau de droite ou demandez à l'hôte de partager une vidéo.
                  </p>
                  <Button
                    onClick={() => setLocation('/')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Explorer le catalogue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau Watch Party - en bas sur mobile, à droite sur desktop */}
        <div className={`${isMobile ? 'h-1/3 border-t' : 'lg:w-96 lg:border-l'} border-gray-800 bg-gray-900`}>
          <WatchParty
            videoUrl={videoUrl}
            title={title}
            onVideoControl={videoControlHandlers.handleSyncVideoControl}
            onVideoUrlChange={setVideoUrl}
            onVideoTimeUpdate={videoControlHandlers.handleVideoTimeUpdate}
            isVideoPlaying={isVideoPlaying}
            videoCurrentTime={currentVideoTime}
          />
        </div>
      </div>
    </div>
  );
};

export default WatchPartyPage;