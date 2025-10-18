import React from 'react';
import ZuploadVideoPlayer from '@/components/zupload-video-player';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useLocation } from 'wouter';

const ZuploadTestPage: React.FC = () => {
  const [, setLocation] = useLocation();
  
  const handleGoHome = () => {
    setLocation('/');
  };

  // Example Zupload URL - replace with actual URL
  const sampleZuploadUrl = "https://example.com/sample-video.mp4";
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Test Lecteur Zupload</h1>
          <Button onClick={handleGoHome} variant="default">
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Lecteur Zupload Intégré</h2>
          <p className="text-gray-400 mb-4">
            Ce lecteur utilise un iframe sécurisé pour afficher les vidéos Zupload avec des contrôles personnalisés.
          </p>
        </div>
        
        <div className="rounded-lg overflow-hidden shadow-lg">
          <ZuploadVideoPlayer 
            videoUrl={sampleZuploadUrl}
            title="Vidéo de démonstration Zupload"
            tmdbId={385687} // Exemple de TMDB ID pour démonstration
            mediaType="movie"
          />
        </div>
        
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Caractéristiques du lecteur Zupload</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Intégration iframe sécurisée avec sandboxing</li>
            <li>Contrôles de lecture personnalisés (lecture/pause, volume, plein écran)</li>
            <li>Responsive et s'adapte à la taille de l'écran</li>
            <li>Prise en charge des raccourcis clavier</li>
            <li>Interface utilisateur moderne et intuitive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ZuploadTestPage;