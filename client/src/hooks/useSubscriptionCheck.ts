import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

// Hook to check if user has an active subscription
export const useSubscriptionCheck = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  // Fetch user's current subscription
  const { data: subscriptionData, isLoading, error } = useQuery({
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
    },
    enabled: isAuthenticated && !isAdmin, // Only fetch if user is authenticated and not admin
  });
  
  // If user is admin, they have access
  if (isAdmin) {
    return { 
      hasAccess: true, 
      isLoading: false, 
      error: null, 
      accessType: 'admin',
      isAdmin: true
    };
  }
  
  // If user is authenticated, check their subscription
  if (isAuthenticated) {
    // If still loading subscription data
    if (isLoading) {
      return { 
        hasAccess: false, 
        isLoading: true, 
        error: null, 
        accessType: 'loading',
        isAdmin: false
      };
    }
    
    // If there was an error fetching subscription
    if (error) {
      return { 
        hasAccess: false, 
        isLoading: false, 
        error, 
        accessType: 'error',
        isAdmin: false
      };
    }
    
    // Check if user has an active subscription
    const subscription = subscriptionData?.subscription;
    const hasActiveSubscription = subscription && subscription.status === 'active';
    
    return { 
      hasAccess: hasActiveSubscription, 
      isLoading: false, 
      error: null, 
      accessType: hasActiveSubscription ? 'subscribed' : 'no_subscription',
      isAdmin: false,
      subscription
    };
  }
  
  // If user is not authenticated, they have limited free access
  return { 
    hasAccess: true, 
    isLoading: false, 
    error: null, 
    accessType: 'free_with_ads',
    isAdmin: false
  };
};