import { useQuery } from '@tanstack/react-query';

// Define plan features with more detailed specifications
export const PLAN_FEATURES = {
  free: {
    name: "Gratuit",
    maxSimultaneousDevices: 1,
    videoQuality: "SD",
    downloadAllowed: false,
    exclusiveContent: false,
    prioritySupport: false,
    earlyAccess: false,
    ads: true,
    maxVideoQuality: "SD", // Maximum quality allowed
    maxDevices: 1, // Maximum devices allowed
    canDownload: false, // Can download content
    hasExclusive: false, // Has access to exclusive content
    supportLevel: "basic", // Support level (basic, priority, vip)
    earlyAccessAllowed: false, // Early access to new content
  },
  basic: {
    name: "Basic",
    maxSimultaneousDevices: 1,
    videoQuality: "SD",
    downloadAllowed: false,
    exclusiveContent: false,
    prioritySupport: false,
    earlyAccess: false,
    ads: false,
    maxVideoQuality: "SD",
    maxDevices: 1,
    canDownload: false,
    hasExclusive: false,
    supportLevel: "basic",
    earlyAccessAllowed: false,
  },
  standard: {
    name: "Standard",
    maxSimultaneousDevices: 2,
    videoQuality: "HD",
    downloadAllowed: true,
    exclusiveContent: false,
    prioritySupport: true,
    earlyAccess: false,
    ads: false,
    maxVideoQuality: "HD",
    maxDevices: 2,
    canDownload: true,
    hasExclusive: false,
    supportLevel: "priority",
    earlyAccessAllowed: false,
  },
  premium: {
    name: "Premium",
    maxSimultaneousDevices: 4,
    videoQuality: "4K",
    downloadAllowed: true,
    exclusiveContent: true,
    prioritySupport: true,
    earlyAccess: false,
    ads: false,
    maxVideoQuality: "4K",
    maxDevices: 4,
    canDownload: true,
    hasExclusive: true,
    supportLevel: "priority",
    earlyAccessAllowed: false,
  },
  vip: {
    name: "VIP",
    maxSimultaneousDevices: Infinity,
    videoQuality: "4K",
    downloadAllowed: true,
    exclusiveContent: true,
    prioritySupport: true,
    earlyAccess: true,
    ads: false,
    maxVideoQuality: "4K",
    maxDevices: Infinity,
    canDownload: true,
    hasExclusive: true,
    supportLevel: "vip",
    earlyAccessAllowed: true,
  }
};

// Hook to get user's current subscription
export const useUserSubscription = () => {
  return useQuery({
    queryKey: ['/api/subscription/current'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/subscription/current', {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch current subscription');
      return response.json();
    }
  });
};

// Hook to get plan features for the current user
export const usePlanFeatures = () => {
  const { data: subscriptionData, isLoading, error } = useUserSubscription();
  
  if (isLoading) {
    return { features: null, isLoading: true, error: null, planId: null };
  }
  
  if (error) {
    // Si l'utilisateur n'a pas d'abonnement, ne pas lui attribuer de plan par défaut
    return { features: null, isLoading: false, error: null, planId: null };
  }
  
  // Si l'utilisateur a un abonnement, utiliser son plan
  if (subscriptionData?.subscription?.planId) {
    const planId = subscriptionData.subscription.planId;
    const features = PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free;
    return { features, isLoading: false, error: null, planId };
  }
  
  // Si l'utilisateur n'a pas d'abonnement, ne pas lui attribuer de plan
  return { features: null, isLoading: false, error: null, planId: null };
};

// Hook pour vérifier si l'utilisateur a accès à une fonctionnalité
// Comme nous supprimons le système d'abonnement, tous les utilisateurs ont accès à toutes les fonctionnalités
export const useHasFeature = (feature: string) => {
  return { hasFeature: true, isLoading: false, error: null };
};

// Hook pour vérifier si l'utilisateur peut accéder à une qualité vidéo spécifique
// Comme nous supprimons le système d'abonnement, tous les utilisateurs ont accès à toutes les qualités
export const useCanAccessQuality = (quality: 'SD' | 'HD' | '4K') => {
  return { canAccess: true, isLoading: false, error: null };
};

// Hook pour vérifier la limite d'appareils
// Comme nous supprimons le système d'abonnement, il n'y a pas de limite d'appareils
export const useDeviceLimit = () => {
  return { maxDevices: Infinity, currentDevices: 1, canAddDevice: true, isLoading: false, error: null };
};

export default PLAN_FEATURES;