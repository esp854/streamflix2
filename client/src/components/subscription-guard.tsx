import React from 'react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, User, Info } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { hasAccess, isLoading, accessType, isAdmin } = useSubscriptionCheck();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="loader-wrapper">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Vérification de l'accès...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is admin or has active subscription, or is non-authenticated (free access with ads), render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have an active subscription
  if (isAuthenticated && accessType === 'no_subscription') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Abonnement requis
            </CardTitle>
            <CardDescription>
              Un abonnement actif est nécessaire pour accéder au contenu sans publicités.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Accès gratuit avec publicités</p>
                    <p className="text-sm text-blue-700">
                      Vous pouvez regarder ce contenu gratuitement, mais des publicités seront affichées.
                      Pour une expérience sans publicité, veuillez vous abonner.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => setLocation('/subscription')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Choisir un abonnement
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  Continuer avec les publicités
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Vous pouvez choisir parmi nos différents plans d'abonnement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For unauthenticated users, allow access with ads
  if (!isAuthenticated && accessType === 'free_with_ads') {
    return <>{children}</>;
  }

  // Fallback - should not happen in normal circumstances
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Accès restreint
          </CardTitle>
          <CardDescription>
            Impossible de déterminer votre statut d'accès.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Une erreur s'est produite lors de la vérification de votre accès au contenu.
            </p>
            <Button 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGuard;