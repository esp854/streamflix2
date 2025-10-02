import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateNotifier() {
  const { updateAvailable, updateServiceWorker } = usePWA();
  const { toast } = useToast();

  useEffect(() => {
    if (updateAvailable) {
      toast({
        title: "Mise à jour disponible",
        description: "Une nouvelle version de StreamFlix est prête à être installée.",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateServiceWorker}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Mettre à jour
          </Button>
        ),
        duration: Infinity,
      });
    }
  }, [updateAvailable, updateServiceWorker, toast]);

  return null;
}