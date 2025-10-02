import { useEffect, useCallback } from 'react';
import { usePWA } from './usePWA';
import { useAuth } from '@/contexts/auth-context';

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  autoplay?: boolean;
  subtitles?: boolean;
  quality?: 'auto' | 'hd' | 'sd';
  notifications?: {
    newContent?: boolean;
    recommendations?: boolean;
    updates?: boolean;
  };
}

export function useUserPreferencesSync() {
  const { sync, isOnline } = usePWA();
  const { user, token } = useAuth();
  
  // Charger les préférences depuis le stockage local
  const loadLocalPreferences = useCallback((): UserPreferences | null => {
    try {
      const preferences = localStorage.getItem('userPreferences');
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('[PreferencesSync] Failed to load local preferences:', error);
      return null;
    }
  }, []);
  
  // Sauvegarder les préférences dans le stockage local
  const saveLocalPreferences = useCallback((preferences: UserPreferences) => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('[PreferencesSync] Failed to save local preferences:', error);
    }
  }, []);
  
  // Charger les préférences depuis le serveur
  const loadServerPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    if (!user || !token) return null;
    
    try {
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.preferences || null;
      }
    } catch (error) {
      console.error('[PreferencesSync] Failed to load server preferences:', error);
    }
    
    return null;
  }, [user, token]);
  
  // Sauvegarder les préférences sur le serveur
  const saveServerPreferences = useCallback(async (preferences: UserPreferences) => {
    if (!user || !token) return false;
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('[PreferencesSync] Failed to save server preferences:', error);
      return false;
    }
  }, [user, token]);
  
  // Fusionner les préférences locales et serveur
  const mergePreferences = useCallback((local: UserPreferences | null, server: UserPreferences | null): UserPreferences => {
    // Si l'une des deux est null, retourner l'autre
    if (!local) return server || {};
    if (!server) return local;
    
    // Fusionner les préférences, avec priorité aux préférences serveur
    return {
      ...local,
      ...server,
      notifications: {
        ...local.notifications,
        ...server.notifications,
      }
    };
  }, []);
  
  // Synchroniser les préférences
  const syncPreferences = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      // Charger les préférences locales et serveur
      const localPreferences = loadLocalPreferences();
      const serverPreferences = await loadServerPreferences();
      
      // Fusionner les préférences
      const mergedPreferences = mergePreferences(localPreferences, serverPreferences);
      
      // Sauvegarder les préférences fusionnées localement et sur le serveur
      saveLocalPreferences(mergedPreferences);
      await saveServerPreferences(mergedPreferences);
      
      console.log('[PreferencesSync] Preferences synchronized successfully');
    } catch (error) {
      console.error('[PreferencesSync] Failed to synchronize preferences:', error);
    }
  }, [user, token, loadLocalPreferences, loadServerPreferences, mergePreferences, saveLocalPreferences, saveServerPreferences]);
  
  // Enregistrer la synchronisation en arrière-plan
  const registerBackgroundSync = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      // Enregistrer la synchronisation en arrière-plan
      const success = await sync('preferences-sync');
      if (success) {
        console.log('[PreferencesSync] Background sync registered for preferences');
      }
    } catch (error) {
      console.error('[PreferencesSync] Failed to register background sync:', error);
    }
  }, [user, token, sync]);
  
  // Mettre à jour une préférence spécifique
  const updatePreference = useCallback(async (key: keyof UserPreferences, value: any) => {
    try {
      // Charger les préférences actuelles
      const currentPreferences = loadLocalPreferences() || {};
      
      // Mettre à jour la préférence spécifique
      const updatedPreferences = {
        ...currentPreferences,
        [key]: value
      };
      
      // Sauvegarder localement
      saveLocalPreferences(updatedPreferences);
      
      // Si l'utilisateur est connecté, sauvegarder sur le serveur
      if (user && token) {
        await saveServerPreferences(updatedPreferences);
        
        // Enregistrer la synchronisation en arrière-plan pour les autres appareils
        await registerBackgroundSync();
      }
      
      console.log(`[PreferencesSync] Preference ${key} updated to:`, value);
    } catch (error) {
      console.error('[PreferencesSync] Failed to update preference:', error);
    }
  }, [loadLocalPreferences, saveLocalPreferences, user, token, saveServerPreferences, registerBackgroundSync]);
  
  // Effet pour synchroniser les préférences lorsque l'utilisateur se connecte/déconnecte
  // ou lorsque la connexion en ligne change
  useEffect(() => {
    if (isOnline && user && token) {
      syncPreferences();
    }
  }, [isOnline, user, token, syncPreferences]);
  
  // Effet pour enregistrer la synchronisation en arrière-plan
  useEffect(() => {
    if (user && token) {
      registerBackgroundSync();
    }
  }, [user, token, registerBackgroundSync]);
  
  return {
    syncPreferences,
    updatePreference,
    loadLocalPreferences,
    saveLocalPreferences
  };
}