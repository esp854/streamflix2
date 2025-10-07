import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useLocation } from 'wouter';

const AdvertisementBanner: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              Profitez d'une expérience sans publicité
            </h3>
            <p className="text-blue-700 mb-4">
              Avec un abonnement, vous pouvez profiter de tout notre contenu sans interruptions publicitaires.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ✓ Sans publicités
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ✓ Accès complet
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ✓ Meilleure qualité
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Button 
              onClick={() => setLocation('/subscription')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              S'abonner dès maintenant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvertisementBanner;