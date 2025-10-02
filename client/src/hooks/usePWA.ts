import { useState, useEffect, useCallback } from 'react';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend ServiceWorkerRegistration to include sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistrationWithSync | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for service worker updates
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker and listen for updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg as ServiceWorkerRegistrationWithSync);
          
          // Check for updates
          reg.addEventListener('updatefound', handleSWUpdate);
          
          // Check if update is already available
          if (reg.waiting) {
            setUpdateAvailable(true);
          }
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (registration) {
        registration.removeEventListener('updatefound', handleSWUpdate);
      }
    };
  }, [registration]);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  };

  const share = async (data: { title?: string; text?: string; url?: string }) => {
    if (!navigator.share) {
      console.warn('[PWA] Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[PWA] Share failed:', error);
      }
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error);
      return 'denied';
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      });
    }
    return null;
  };

  // Background sync for offline actions
  const sync = async (tag: string) => {
    if (registration && registration.sync) {
      try {
        await registration.sync.register(tag);
        return true;
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  };

  // Update the service worker
  const updateServiceWorker = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Prefetch content for offline use
  const prefetchContent = (urls: string[]) => {
    if (registration && registration.active) {
      registration.active.postMessage({
        command: 'PREFETCH_CONTENT',
        urls
      });
    }
  };

  // Invalidate content cache
  const invalidateContentCache = () => {
    if (registration && registration.active) {
      registration.active.postMessage({
        command: 'INVALIDATE_CONTENT_CACHE'
      });
    }
  };

  // Preload content for better performance
  const preloadContent = (urls: string[]) => {
    if (registration && registration.active) {
      registration.active.postMessage({
        command: 'PRELOAD_CONTENT',
        urls
      });
    }
  };

  // Clear API cache
  const clearAPICache = () => {
    if (registration && registration.active) {
      registration.active.postMessage({
        command: 'CLEAR_API_CACHE'
      });
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    install,
    share,
    requestNotificationPermission,
    sendNotification,
    sync,
    updateAvailable,
    updateServiceWorker,
    prefetchContent,
    preloadContent,
    invalidateContentCache,
    clearAPICache,
    canShare: !!navigator.share,
    canInstall: isInstallable && !isInstalled,
    canSync: registration?.sync !== undefined
  };
}