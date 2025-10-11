import React, { useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WatchPartyButtonProps {
  videoUrl: string;
  title: string;
  onWatchPartyCreated?: (roomId: string) => void;
}

const WatchPartyButton: React.FC<WatchPartyButtonProps> = ({ 
  videoUrl, 
  title,
  onWatchPartyCreated 
}) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createWatchParty = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une Watch Party",
        variant: "destructive",
      });
      return;
    }

    if (!videoUrl) {
      toast({
        title: "Erreur",
        description: "Aucune vidéo sélectionnée",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          title
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la Watch Party');
      }

      const data = await response.json();
      
      // Ouvrir la Watch Party dans un nouvel onglet
      const watchPartyUrl = `/watch-party/${data.roomId}`;
      window.open(watchPartyUrl, '_blank');
      
      // Callback optionnel
      onWatchPartyCreated?.(data.roomId);
      
      toast({
        title: "Succès",
        description: "Watch Party créée avec succès !",
      });
    } catch (error) {
      console.error('Erreur lors de la création de la Watch Party:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la Watch Party",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={createWatchParty}
      disabled={isCreating}
      className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
    >
      <Users className="w-4 h-4" />
      {isCreating ? 'Création...' : 'Watch Party'}
    </Button>
  );
};

export default WatchPartyButton;