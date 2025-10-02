import { useCallback, useEffect, useState } from 'react';
import { usePWA } from './usePWA';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    contentId?: string;
    contentType?: 'movie' | 'tv';
  };
}

export function useNotifications() {
  const { requestNotificationPermission, sendNotification } = usePWA();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
      setIsSupported(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';
    
    const result = await requestNotificationPermission();
    setPermission(result as NotificationPermission);
    return result;
  }, [isSupported, requestNotificationPermission]);

  const showNotification = useCallback((payload: NotificationPayload) => {
    if (permission !== 'granted' || !isSupported) {
      console.warn('[Notifications] Notifications not permitted or not supported');
      return null;
    }

    // Créer une copie de l'objet payload sans la propriété body pour éviter les conflits
    const { body, ...notificationOptions } = payload;

    return sendNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      data: payload.data,
      ...notificationOptions
    });
  }, [permission, isSupported, sendNotification]);

  const subscribeToNewContent = useCallback(async () => {
    // Cette fonction serait appelée pour s'abonner aux notifications de nouveaux contenus
    const result = await requestPermission();
    return result === 'granted';
  }, [requestPermission]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    subscribeToNewContent
  };
}