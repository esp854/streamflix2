import { useAuth } from '@/contexts/auth-context';

export const useAuthCheck = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Unauthenticated users should see ads
  const shouldShowAds = !isLoading && !isAuthenticated;
  
  return { shouldShowAds, isAuthenticated, isLoading };
};