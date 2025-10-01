'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running as installed PWA
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check if running in iOS standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    // Detect iOS
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    checkIfInstalled();
    detectIOS();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show install button for iOS devices (they don't fire beforeinstallprompt)
    if (isIOS && !isInstalled) {
      setShowInstallButton(true);
    }

    // Always show the button for testing/demo purposes
    setTimeout(() => {
      setShowInstallButton(true);
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isInstalled]);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS install instructions
      alert(
        'برای نصب اپلیکیشن روی آیفون:\n\n' +
        '1. روی دکمه "اشتراک" (مربع با فلش) در پایین صفحه بزنید\n' +
        '2. گزینه "افزودن به صفحه اصلی" را انتخاب کنید\n' +
        '3. روی "افزودن" بزنید'
      );
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA install accepted');
      } else {
        console.log('❌ PWA install dismissed');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('PWA install error:', error);
    }
  };

  // Don't show install button if app is already installed
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <div className="w-full text-center">
      {/* PWA Install Button */}
      <div className="relative inline-block">
        <button
          onClick={handleInstallClick}
          className="relative w-20 h-20 rounded-xl backdrop-blur-xl bg-white/10 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-2xl flex items-center justify-center hover:scale-105 p-3"
          aria-label="نصب اپلیکیشن"
          title="نصب اپلیکیشن"
        >
          <img 
            src="/logo.jpg" 
            alt="HRD Logo" 
            className="w-full h-full object-contain rounded-lg"
          />
        </button>
      </div>
      
      {/* Install instruction text */}
      <p className="text-white/70 text-xs mt-2 font-light">
        نصب اپلیکیشن
      </p>
    </div>
  );
}
