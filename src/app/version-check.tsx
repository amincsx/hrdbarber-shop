'use client';

import { useEffect } from 'react';

// This component checks for app updates and forces reload when needed
export function VersionCheck() {
  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          // Check for updates every 5 seconds
          setInterval(() => {
            registration.update().catch((err) => {
              console.log('Service worker update check failed:', err);
            });
          }, 5000);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('🔄 New version available, reloading...');
                  // Force reload to get new version
                  window.location.reload();
                }
              });
            }
          });
        });
      });
    }

    // Also check by polling the current page URL
    const checkForUpdates = async () => {
      try {
        // Add a timestamp to bypass cache
        const response = await fetch(window.location.href + '?cache-bust=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        
        const lastModified = response.headers.get('last-modified');
        const currentVersion = sessionStorage.getItem('app-version');
        
        if (currentVersion && lastModified && currentVersion !== lastModified) {
          console.log('🔄 Page updated, reloading...');
          sessionStorage.setItem('app-version', lastModified);
          window.location.reload();
        } else if (lastModified && !currentVersion) {
          sessionStorage.setItem('app-version', lastModified);
        }
      } catch (error) {
        // Silently fail
      }
    };

    // Check for updates every 10 seconds
    const interval = setInterval(checkForUpdates, 10000);
    checkForUpdates(); // Check immediately

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

