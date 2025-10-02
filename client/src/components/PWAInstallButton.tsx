import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

export default function PWAInstallButton() {
  const { canInstall, install, isOnline } = usePWA();
  const { toast } = useToast();

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

  // Only show button if PWA can be installed and user is online
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