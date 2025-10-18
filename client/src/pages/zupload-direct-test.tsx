import React from 'react';
import ZuploadVideoPlayer from '@/components/zupload-video-player';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useLocation } from 'wouter';

const ZuploadDirectTest: React.FC = () => {
  const [, setLocation] = useLocation();
  
  const handleGoHome = () => {
    setLocation('/');
  };

  // The video URL for testing - this is the direct integration
  const videoUrl = "https://zupload.cc/embed/kXHdlQd2HPGFyGT";
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Test de Lecture Vidéo</h1>
          <Button onClick={handleGoHome} variant="default">
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Épisode de Test</h2>
          <p className="text-gray-400 mb-4">
            Test de lecture d'un épisode avec intégration directe.
          </p>
        </div>
        
        {/* Direct integration without any visible branding */}
        <div className="rounded-lg overflow-hidden shadow-lg mb-8 w-full h-[70vh]">
          <ZuploadVideoPlayer 
            videoUrl={videoUrl}
            title="Épisode de Test"
            tmdbId={385687} // Exemple de TMDB ID pour démonstration
            mediaType="movie"
          />
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Intégration Directe</h3>
          <p className="text-gray-300 mb-4">
            Cette vidéo est intégrée directement sans aucun branding visible. 
            L'utilisateur ne peut pas voir que la vidéo provient d'un service externe.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Intégration transparente</li>
            <li>Aucun branding visible</li>
            <li>Contrôles natifs du lecteur</li>
            <li>Expérience utilisateur fluide</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ZuploadDirectTest;