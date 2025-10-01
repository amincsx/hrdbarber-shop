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
  const [isInstalling, setIsInstalling] = useState(false);

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
      setIsInstalling(false);
      console.log('✅ PWA installation completed');
    };

    checkIfInstalled();
    detectIOS();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show install button for iOS devices (they don't fire beforeinstallprompt)
    if (isIOS && !isInstalled) {
      setShowInstallButton(true);
    }

    // Show button faster - reduce delay for better UX
    setTimeout(() => {
      if (!isInstalled) {
        setShowInstallButton(true);
      }
    }, 300);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isInstalled]);

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    console.log('🔧 User PWA install button clicked');
    console.log('🔧 isIOS:', isIOS);
    console.log('🔧 deferredPrompt:', deferredPrompt);
    
    if (isIOS) {
      // Show iOS install instructions in a better modal
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available for user PWA');
      // Show manual install instructions
      alert(`برای نصب اپلیکیشن آرایشگاه HRD:\n\n1. روی منوی سه نقطه (⋮) در مرورگر کلیک کنید\n2. "افزودن به صفحه اصلی" یا "Install app" را انتخاب کنید\n3. "نصب" یا "Install" را بزنید`);
      return;
    }

    try {
      setIsInstalling(true);
      console.log('🚀 Starting PWA installation...');
      
      // Show the install prompt immediately
      await deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA install accepted');
        // Don't hide button immediately - let the appinstalled event handle it
      } else {
        console.log('❌ PWA install dismissed');
        setIsInstalling(false);
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA install error:', error);
      setIsInstalling(false);
      alert('خطا در نصب اپلیکیشن. لطفاً دوباره تلاش کنید.');
    }
  };

  // Don't show install button if app is already installed
  console.log('🔧 User PWA Install render check:', { isInstalled, showInstallButton, isIOS, deferredPrompt: !!deferredPrompt });
  
  if (isInstalled) {
    console.log('🔧 User PWA already installed, not showing button');
    return null;
  }
  
  if (!showInstallButton) {
    console.log('🔧 User PWA install button not ready yet');
    return null;
  }

  return (
    <>
      <div className="w-full text-center">
        {/* PWA Install Button */}
        <div className="relative inline-block">
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className={`relative w-20 h-20 rounded-xl backdrop-blur-xl border transition-all duration-300 shadow-2xl flex items-center justify-center p-3 ${
              isInstalling 
                ? 'bg-blue-500/20 border-blue-500/50 cursor-not-allowed' 
                : 'bg-white/10 border-white/30 hover:bg-white/20 hover:scale-105'
            }`}
            aria-label="نصب اپلیکیشن"
            title="نصب اپلیکیشن"
          >
            {isInstalling ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            ) : (
              <img 
                src="/apple-touch-icon.png" 
                alt="HRD Logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </button>
        </div>
        
        {/* Install instruction text */}
        <p className="text-white/70 text-xs mt-2 font-light">
          {isInstalling ? 'در حال نصب...' : 'نصب اپلیکیشن'}
        </p>
        
        {/* Debug info */}
        <div className="text-xs text-white/40 mt-1">
          {deferredPrompt ? '✅ آماده' : '⏳ در انتظار'}
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSInstructions(false)}
          />
          
          <div className="relative max-w-sm w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 left-4 text-white/60 hover:text-white text-2xl"
            >
              ×
            </button>

            <div className="text-center mb-4">
              <div className="inline-block bg-blue-500/20 p-3 rounded-full mb-3">
                <span className="text-3xl">🍎</span>
              </div>
              <h3 className="text-xl font-bold text-white">نصب روی آیفون</h3>
            </div>

            <div className="space-y-3 text-white/90">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">1️⃣</div>
                <p className="text-sm">
                  روی دکمه <span className="inline-block px-2 py-1 bg-blue-500/30 rounded">اشتراک</span> (مربع با فلش) در <strong>پایین صفحه Safari</strong> بزنید
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">2️⃣</div>
                <p className="text-sm">
                  از لیست، گزینه <strong>"افزودن به صفحه اصلی"</strong> را انتخاب کنید
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">3️⃣</div>
                <p className="text-sm">
                  در پنجره باز شده، روی دکمه <strong>"افزودن"</strong> بزنید
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl mt-4">
                <span className="text-xl">✅</span>
                <p className="text-xs text-green-200">
                  اپلیکیشن روی صفحه اصلی شما نصب می‌شود!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl text-white font-semibold transition-all duration-300"
            >
              متوجه شدم 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
