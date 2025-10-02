import React, { useEffect, useState } from 'react';
import { Download, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

export default function PWAInstallButton() {
  const { canInstall, install, isOnline, updateAvailable, updateServiceWorker } = usePWA();
  const { toast } = useToast();
  const [showUpdateButton, setShowUpdateButton] = useState(false);

  useEffect(() => {
    // Show update button when update is available
    setShowUpdateButton(updateAvailable);
  }, [updateAvailable]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      toast({
        title: "Installation réussie",
        description: "StreamFlix a été installé sur votre appareil !",
      });
    } else {
      toast({
        title: "Installation annulée",
        description: "L'installation a été annulée.",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = () => {
    updateServiceWorker();
    toast({
      title: "Mise à jour",
      description: "StreamFlix est en cours de mise à jour...",
    });
  };

  // Show update button if update is available
  if (showUpdateButton) {
    return (
      <Button
        onClick={handleUpdate}
        variant="outline"
        size="sm"
        className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Mettre à jour
      </Button>
    );
  }

  // Only show install button if PWA can be installed and user is online
  if (!canInstall || !isOnline) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors"
    >
      <Smartphone className="w-4 h-4 mr-2" />
      <Download className="w-4 h-4 mr-2" />
      Installer l'app
    </Button>
  );
}