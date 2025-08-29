"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "App Updated",
                    description: "A new version is available. Refresh to update.",
                    variant: "default",
                    icon: <Wifi className="h-4 w-4" />,
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle online/offline status
      const handleOnline = () => {
        toast({
          title: "Back Online",
          description: "Internet connection restored.",
          variant: "default",
          icon: <Wifi className="h-4 w-4" />,
        });
      };

      const handleOffline = () => {
        toast({
          title: "Offline Mode",
          description: "Using cached data. Some features may be limited.",
          variant: "default",
          icon: <WifiOff className="h-4 w-4" />,
        });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [toast]);

  return null;
}