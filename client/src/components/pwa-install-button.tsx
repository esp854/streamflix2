import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const PWAInstallButton: React.FC = () => {
  const { isInstallable, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  const handleInstallClick = async () => {
    try {
      const accepted = await install();
      
      if (accepted) {
        toast({
          title: "Installation réussie",
          description: "StreamFlix a été installé sur votre appareil !",
        });
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      // Hide the button after installation attempt
      setIsVisible(false);
    } catch (error) {
      console.error('[PWA] Error during installation:', error);
      toast({
        title: "Erreur d'installation",
        description: "Une erreur s'est produite lors de l'installation de l'application.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Ne pas afficher le bouton si l'application n'est pas installable ou si l'utilisateur a fermé la bannière
  if (!isInstallable || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-purple-600 p-2 rounded-lg flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base">Installer StreamFlix</h3>
            <p className="text-gray-300 text-xs sm:text-sm mt-1">
              Installez l'application pour une expérience plus rapide et un accès hors ligne.
            </p>
          </div>
          
          <Button
            onClick={handleInstallClick}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 whitespace-nowrap"
          >
            Installer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton;