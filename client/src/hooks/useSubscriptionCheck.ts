import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

// Hook to check if user has a paid subscription
export const useSubscriptionCheck = () => {
  const { isAuthenticated, user } = useAuth();

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
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });

  // Check if user has a paid subscription
  const hasPaidSubscription = () => {
    // If user is not authenticated, they can't have a paid subscription
    if (!isAuthenticated) return false;
    
    // If still loading, assume no paid subscription
    if (isLoading) return false;
    
    // If there's an error fetching subscription data, assume no paid subscription
    if (error) return false;
    
    // Get the plan ID from subscription data
    const planId = subscriptionData?.subscription?.planId;
    
    // User has a paid subscription if planId exists and is not 'free'
    return planId && planId !== 'free';
  };

  // Check if user is admin (admins don't need to pay)
  const isAdmin = user?.role === 'admin';

  // User should be redirected to payment page if:
  // 1. They are authenticated
  // 2. They are not an admin
  // 3. They don't have a paid subscription
  const shouldRedirectToPayment = isAuthenticated && !isAdmin && !hasPaidSubscription();

  return {
    hasPaidSubscription: hasPaidSubscription(),
    shouldRedirectToPayment,
    isLoading,
    error,
    subscriptionData
  };
};