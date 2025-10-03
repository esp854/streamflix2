import React from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

const PWAInstallBanner: React.FC = () => {
  const { isInstallable, installPWA } = usePWAInstall();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isIOS, setIsIOS] = React.useState(false);

  // Vérifier si l'utilisateur est sur iOS
  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  // Ne pas afficher la bannière si l'application est déjà installée
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;

  if (!isVisible || !isInstallable || isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await installPWA();
    if (accepted) {
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Pour iOS, afficher des instructions spéciales
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 border-t border-gray-700">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Installer StreamFlix</h3>
            <p className="text-sm text-gray-300 mb-2">
              Appuyez sur le bouton Partager <span className="bg-gray-700 px-1 rounded">␣</span> 
              puis sélectionnez "Sur l'écran d'accueil"
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white ml-2"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 border-t border-gray-700">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Installer StreamFlix</h3>
          <p className="text-sm text-gray-300 mb-2">
            Installez l'application pour une meilleure expérience
          </p>
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-white ml-2"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>
      <Button 
        onClick={handleInstall}
        className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
      >
        <Download className="mr-2" size={16} />
        Installer l'application
      </Button>
    </div>
  );
};

export default PWAInstallBanner;