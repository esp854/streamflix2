import { useAuth } from '@/contexts/auth-context';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

export const useAuthCheck = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAccess, accessType } = useSubscriptionCheck();
  
  // Show ads for unauthenticated users or authenticated users without active subscription
  const shouldShowAds = !isLoading && (!isAuthenticated || (isAuthenticated && accessType !== 'subscribed'));
  
  return { shouldShowAds, isAuthenticated, isLoading };
};