import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, CreditCard } from 'lucide-react';

const PaymentCancelled: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Get payment details from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const planName = urlParams.get('plan') || 'Premium';
  const amount = urlParams.get('amount') || '0';

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 w-16 h-16 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Paiement annulé</CardTitle>
          <CardDescription>
            Votre paiement a été annulé ou refusé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Détails de la tentative</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Plan :</span>
                <span className="font-medium">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant :</span>
                <span className="font-medium">{parseInt(amount).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Que faire maintenant ?</h4>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• Vérifiez vos informations de paiement</li>
              <li>• Réessayez avec un autre mode de paiement</li>
              <li>• Contactez le support si le problème persiste</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/subscription')}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Réessayer le paiement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelled;