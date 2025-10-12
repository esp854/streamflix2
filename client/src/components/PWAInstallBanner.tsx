import React from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const PWAInstallBanner: React.FC = () => {
  const { canInstall, install, isOnline } = usePWA();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = React.useState(true);

  // Ne pas afficher si l'application est déjà installée ou si l'installation n'est pas possible
  if (!canInstall || !isOnline || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      toast({
        title: "Installation réussie",
        description: "StreamFlix a été installé sur votre appareil !",
      });
      setIsVisible(false);
    } else {
      toast({
        title: "Installation annulée",
        description: "L'installation a été annulée.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Installez StreamFlix
                  </h3>
                  <p className="text-blue-100 mb-4">
                    Installez l'application StreamFlix sur votre appareil pour une expérience optimale, 
                    un accès hors ligne et des notifications en temps réel.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-blue-100 hover:text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  ✓ Accès hors ligne
                </span>
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  ✓ Notifications
                </span>
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  ✓ Performance optimale
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={handleInstall}
                className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Installer l'application
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallBanner;