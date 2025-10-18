import React from 'react';
import ZuploadVideoPlayer from './zupload-video-player';

interface ZuploadVideoPlayerExampleProps {
  videoUrl?: string;
  title?: string;
}

const ZuploadVideoPlayerExample: React.FC<ZuploadVideoPlayerExampleProps> = ({ 
  videoUrl = "https://example.com/sample-video.mp4",
  title = "Exemple de vidéo Zupload"
}) => {
  const handleVideoError = (error: string) => {
    console.error('Erreur de lecture vidéo:', error);
    alert(`Erreur de lecture: ${error}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        <ZuploadVideoPlayer 
          videoUrl={videoUrl}
          title={title}
          onVideoError={handleVideoError}
          tmdbId={385687} // Exemple de TMDB ID pour démonstration
          mediaType="movie"
        />
      </div>
      
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Instructions d'utilisation</h3>
        <ul className="list-disc list-inside text-gray-300 space-y-1">
          <li>Remplacez l'URL de la vidéo par votre propre URL Zupload</li>
          <li>Assurez-vous que l'URL est accessible et autorise l'intégration</li>
          <li>Les contrôles personnalisés apparaissent au survol de la vidéo</li>
          <li>Utilisez les raccourcis clavier pour une navigation rapide</li>
        </ul>
      </div>
    </div>
  );
};

export default ZuploadVideoPlayerExample;