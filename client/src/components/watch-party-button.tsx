import React, { useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

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
  const { user, isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);

  // Fonction pour obtenir le token CSRF
  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return null;
    }
  };

  const createWatchParty = async () => {
    // Vérification côté client
    if (!isAuthenticated || !user) {
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
      // Obtenir le token CSRF
      const csrfToken = await getCSRFToken();
      
      const response = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
        },
        body: JSON.stringify({
          videoUrl,
          title
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la Watch Party');
      }

      const data = await response.json();
      
      // Naviguer vers la Watch Party dans le même onglet au lieu d'ouvrir une nouvelle fenêtre
      const watchPartyUrl = `/watch-party/${data.roomId}`;
      setLocation(watchPartyUrl);
      
      // Callback optionnel
      onWatchPartyCreated?.(data.roomId);
      
      toast({
        title: "Succès",
        description: "Watch Party créée avec succès !",
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la Watch Party:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la Watch Party",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Ne pas afficher le bouton si l'utilisateur n'est pas authentifié
  if (!isAuthenticated || !user) {
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