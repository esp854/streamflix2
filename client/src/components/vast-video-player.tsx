import React, { useEffect, useRef } from 'react';

// Déclaration globale pour video.js
declare global {
  interface Window {
    videojs: any;
  }
}

interface VASTVideoPlayerProps {
  videoUrl: string;
  vastUrl: string;
  title: string;
  onAdComplete: () => void;
  onAdError?: (error: string) => void;
}

const VASTVideoPlayer: React.FC<VASTVideoPlayerProps> = ({
  videoUrl,
  vastUrl,
  title,
  onAdComplete,
  onAdError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Charger les scripts Video.js et plugins
    const loadVideoJs = async () => {
      try {
        // Charger Video.js
        if (!window.videojs) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://vjs.zencdn.net/7.24.0/video.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Charger videojs-contrib-ads
        if (!window.videojs?.contribAds) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/videojs-contrib-ads@6.8.0/dist/videojs-contrib-ads.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Charger videojs-ima
        if (!window.videojs?.ima) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/videojs-ima@1.9.0/dist/videojs.ima.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Charger les styles Video.js
        if (!document.querySelector('link[href*="video-js.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://vjs.zencdn.net/7.24.0/video-js.css';
          document.head.appendChild(link);
        }

        // Initialiser le lecteur
        if (videoRef.current && window.videojs) {
          // Créer un lecteur Video.js vide pour les pubs
          const player = window.videojs(videoRef.current, {
            controls: true,
            preload: 'auto',
            fluid: true,
            responsive: true,
          });

          playerRef.current = player;

          // Initialiser contrib-ads
          player.contribAds({
            debug: true
          });

          // Initialiser IMA avec l'URL VAST
          player.ima({
            adTagUrl: vastUrl,
            debug: true,
            // Désactiver autoplay sur desktop pour éviter les problèmes
            disableCustomPlaybackForIOS10Plus: true,
          });

          // Gérer les événements
          player.on('adserror', (error: any) => {
            console.error('VAST Ads Error:', error);
            onAdError?.('Erreur lors du chargement de la publicité');
            // Continuer vers la vidéo principale même si la pub échoue
            onAdComplete();
          });

          player.on('adend', () => {
            console.log('VAST Ad Ended');
            // Passer à la vidéo principale
            onAdComplete();
          });

          player.on('ready', () => {
            console.log('VAST Player Ready');
            // Pour mobile, activer autoplay muted si nécessaire
            if (window.innerWidth <= 768) {
              player.muted(true);
              // Démarrer automatiquement sur mobile avec son coupé
              player.play().catch((error: any) => {
                console.log('Autoplay prevented on mobile:', error);
                // Si autoplay est bloqué, l'utilisateur devra cliquer
              });
            } else {
              // Sur desktop, démarrer les pubs
              player.play();
            }
          });

          // Gérer le cas où l'utilisateur clique sur le bouton de lecture
          player.on('play', () => {
            console.log('VAST Player Play');
          });
        }
      } catch (error) {
        console.error('Error loading Video.js:', error);
        onAdError?.('Erreur lors du chargement du lecteur vidéo');
        onAdComplete(); // Passer directement à la vidéo en cas d'erreur
      }
    };

    loadVideoJs();

    // Nettoyage
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [vastUrl, onAdComplete, onAdError]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-fluid w-full h-full"
        data-setup="{}"
      >
        <p className="vjs-no-js text-white">
          Pour visionner cette vidéo, activez JavaScript et envisagez une mise à niveau vers un navigateur web qui{' '}
          <a href="https://www.videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
            supporte la vidéo HTML5
          </a>
          .
        </p>
      </video>
    </div>
  );
};

export default VASTVideoPlayer;