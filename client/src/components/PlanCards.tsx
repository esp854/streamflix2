import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Shield, Star, Crown, Zap, Loader2 } from 'lucide-react';

export interface BackendPlan {
  amount: number;
  currency: string;
  name: string;
  duration: number; // days
  description?: string;
}

export type PlansResponse = Record<string, BackendPlan>;

export interface PlanCardsProps {
  title?: string;
  description?: string;
  showFree?: boolean; // show the 'free' plan card as well
  ctaLabel?: string; // CTA label on each card
  onSelectPlan?: (planId: string) => void; // optional callback when user clicks the CTA
}

const planIcons: Record<string, React.ReactNode> = {
  basic: <Shield className="w-6 h-6" />,
  standard: <Star className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
  vip: <Zap className="w-6 h-6" />,
};

const planFeatures: Record<string, { text: string; available: boolean }[]> = {
  basic: [
    { text: 'Accès à tout le contenu', available: true },
    { text: 'Qualité Standard (SD)', available: true },
    { text: '1 appareil simultané', available: true },
    { text: 'Téléchargement', available: false },
  ],
  standard: [
    { text: 'Accès à tout le contenu', available: true },
    { text: 'Qualité HD', available: true },
    { text: '2 appareils simultanés', available: true },
    { text: 'Téléchargement hors ligne', available: true },
  ],
  premium: [
    { text: 'Accès à tout le contenu', available: true },
    { text: 'Qualité 4K', available: true },
    { text: '4 appareils simultanés', available: true },
    { text: 'Contenu exclusif', available: true },
  ],
  vip: [
    { text: 'Accès à tout le contenu', available: true },
    { text: 'Qualité 4K', available: true },
    { text: 'Appareils illimités', available: true },
    { text: 'Accès anticipé', available: true },
  ],
};

export default function PlanCards({ title, description, showFree = false, ctaLabel = "S'abonner", onSelectPlan }: PlanCardsProps) {
  const { data, isLoading, isError, refetch } = useQuery<PlansResponse>({
    queryKey: ['/api/subscription/plans'],
    queryFn: async () => {
      const res = await fetch('/api/subscription/plans', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const entries = useMemo(() => {
    if (!data) return [] as [string, BackendPlan][];
    const all = Object.entries(data) as [string, BackendPlan][];
    return showFree ? all : all.filter(([id]) => id !== 'free');
  }, [data, showFree]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="loader-wrapper">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
        </div>
        <span>Chargement des plans…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Erreur</CardTitle>
          <CardDescription>Impossible de récupérer les plans d'abonnement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!entries.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Aucun plan disponible</CardTitle>
          <CardDescription>Aucun plan d'abonnement n'est actuellement disponible.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">Recharger</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {(title || description) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {entries.map(([planId, plan]) => {
          const icon = planIcons[planId] ?? <Shield className="w-6 h-6" />;
          const features = planFeatures[planId] ?? [];

          return (
            <Card key={planId} className="relative transition-all hover:shadow">
              {planId === 'standard' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Populaire</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center">
                  {icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description ?? `Abonnement ${planId}`}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.amount.toLocaleString('fr-FR')}</span>
                  <span className="text-muted-foreground ml-1">{plan.currency}/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 min-h-[120px]">
                  {features.length > 0 ? (
                    features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {f.available ? (
                          <Check className="w-4 h-4 text-green-600 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mt-0.5" />
                        )}
                        <span className={f.available ? '' : 'text-muted-foreground line-through'}>
                          {f.text}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">Fonctionnalités indisponibles</li>
                  )}
                </ul>

                {onSelectPlan ? (
                  <Button className="w-full" onClick={() => onSelectPlan(planId)}>
                    {ctaLabel}
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <a href="/subscription">{ctaLabel}</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
