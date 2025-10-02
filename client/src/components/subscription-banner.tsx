import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Crown, Star, Shield, ArrowRight, Sparkles, Info } from 'lucide-react';

const SubscriptionBanner: React.FC = () => {
  const [bannerData, setBannerData] = useState({
    title: "Débloquez le streaming premium",
    description: "Accédez à des milliers de films et séries en HD/4K. Paiement sécurisé avec PayPal - Cartes bancaires acceptées.",
    price: "2.000",
    features: [
      { icon: Crown, text: "Contenu premium" },
      { icon: Star, text: "Qualité 4K" },
      { icon: Shield, text: "Sans publicité" }
    ]
  });

  // Fetch banner data from public banners endpoint
  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const response = await fetch("/api/banners");
        if (response.ok) {
          const banners = await response.json();
          
          // Find the subscription banner specifically
          const subscriptionBanner = banners.find((banner: any) => 
            banner.type === 'subscription' ||
            banner.title.toLowerCase().includes('débloquez') || 
            banner.title.toLowerCase().includes('streaming') ||
            banner.title.toLowerCase().includes('premium')
          );
          
          if (subscriptionBanner) {
            setBannerData({
              title: subscriptionBanner.title || "Débloquez le streaming premium",
              description: subscriptionBanner.description || "Accédez à des milliers de films et séries en HD/4K. Paiement sécurisé avec Djamo - Orange Money, Wave, et cartes bancaires acceptées.",
              price: subscriptionBanner.price || "2.000",
              features: [
                { icon: Crown, text: "Contenu premium" },
                { icon: Star, text: "Qualité 4K" },
                { icon: Shield, text: "Sans publicité" }
              ]
            });
          }
        }
      } catch (error) {
        console.error("Error fetching banner data:", error);
        // Use default values if there's an error
      }
    };

    fetchBannerData();
  }, []);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 border-none">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute top-8 right-8">
          <Crown className="w-6 h-6 text-yellow-300 animate-bounce" />
        </div>
        <div className="absolute bottom-4 left-8">
          <Star className="w-4 h-4 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute bottom-8 right-4">
          <Shield className="w-6 h-6 text-yellow-300 animate-pulse" />
        </div>
      </div>

      <CardContent className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left content */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-400">
                🔥 Offre Spéciale
              </Badge>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {bannerData.title}
            </h2>
            
            <p className="text-blue-100 mb-4 max-w-lg">
              {bannerData.description}
            </p>
            
            {/* Important notice */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 flex items-start gap-2 border border-white/20">
              <Info className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <p className="text-blue-100 text-sm">
                <span className="font-medium">Note importante :</span> Vous devez créer un compte et vous connecter avant de pouvoir vous abonner à un plan.
              </p>
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap gap-4 text-sm text-blue-100 mb-6">
              {bannerData.features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-1">
                    <Icon className="w-4 h-4 text-yellow-300" />
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right content - Pricing */}
          <div className="flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-white mb-2">
                <span className="text-sm opacity-75">À partir de</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {bannerData.price} <span className="text-lg font-normal">FCFA</span>
              </div>
              <div className="text-blue-200 text-sm mb-4">par mois</div>
              
              <Link href="/subscription">
                <Button 
                  size="lg" 
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-semibold group transition-all duration-200"
                >
                  S'abonner maintenant
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <p className="text-xs text-blue-200 mt-2">
                Annulation libre à tout moment
              </p>
              
              {/* Payment methods */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-blue-200 mb-2">Moyen de paiement accepté :</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <div className="bg-white rounded-sm p-1.5 flex items-center justify-center h-8 w-8" title="PayPal">
                    <span className="text-blue-600 font-bold text-sm">PP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionBanner;