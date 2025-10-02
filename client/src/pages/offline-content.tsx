import React from 'react';
import OfflineContentManager from '@/components/OfflineContentManager';
import { useAuth } from '@/contexts/auth-context';

export default function OfflineContentPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contenu hors-ligne</h1>
        <p className="text-muted-foreground">
          Accédez à vos films et séries sauvegardés pour une consultation sans connexion.
        </p>
      </div>
      
      {user ? (
        <OfflineContentManager />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted rounded-full p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Connexion requise</h3>
          <p className="text-muted-foreground mb-4">
            Connectez-vous pour accéder à votre bibliothèque hors-ligne.
          </p>
        </div>
      )}
    </div>
  );
}