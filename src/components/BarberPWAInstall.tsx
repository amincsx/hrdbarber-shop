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

interface BarberPWAInstallProps {
  barberName: string;
  barberId: string;
}

export default function BarberPWAInstall({ barberName, barberId }: BarberPWAInstallProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
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

    // Create dynamic manifest for this barber
    const createBarberManifest = () => {
      const manifest = {
        name: `داشبورد ${barberName} - آرایشگاه HRD`,
        short_name: `${barberName} - HRD`,
        description: `پنل مدیریت رزروها برای ${barberName}`,
        start_url: `/admin/barber/${encodeURIComponent(barberId)}`,
        display: "standalone",
        background_color: "#1e293b",
        theme_color: "#1e293b",
        orientation: "portrait-primary",
        lang: "fa",
        dir: "rtl",
        scope: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any"
          }
        ],
        categories: ["business", "productivity"],
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"]
      };

      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(blob);
      
      // Remove existing barber manifest link if any
      const existingLink = document.querySelector('link[rel="manifest"][data-barber="true"]');
      if (existingLink) {
        existingLink.remove();
      }

      // Add new manifest link
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestURL;
      manifestLink.setAttribute('data-barber', 'true');
      document.head.appendChild(manifestLink);
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
    createBarberManifest();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show install button for iOS devices
    if (isIOS && !isInstalled) {
      setShowInstallButton(true);
    }

    // Always show the button for testing
    setTimeout(() => {
      setShowInstallButton(true);
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [barberName, barberId, isIOS, isInstalled]);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions and guide user
      setShowIOSInstructions(true);
      
      // Auto-scroll to top to help user see Safari's share button
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA install accepted for', barberName);
      } else {
        console.log('❌ PWA install dismissed');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('PWA install error:', error);
    }
  };

  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <>
      <div className="inline-block">
        <button
          onClick={handleInstallClick}
          className="relative h-10 px-4 rounded-lg backdrop-blur-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-white/30 hover:from-green-500/30 hover:to-blue-500/30 transition-all duration-300 shadow-lg flex items-center gap-2 hover:scale-105"
          aria-label={`نصب اپلیکیشن ${barberName}`}
          title={`نصب اپلیکیشن ${barberName}`}
        >
          <span className="text-lg">📱</span>
          <span className="text-white text-sm font-medium">نصب اپ</span>
        </button>
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
              <h3 className="text-xl font-bold text-white">نصب داشبورد {barberName}</h3>
              <p className="text-sm text-white/70 mt-1">روی آیفون - راهنمای گام به گام</p>
            </div>

            <div className="space-y-3 text-white/90">
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="text-2xl flex-shrink-0">📍</div>
                <p className="text-sm">
                  <strong>نکته مهم:</strong> دکمه اشتراک در <span className="text-blue-300">پایین صفحه</span> است، نه بالا!
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">1️⃣</div>
                <p className="text-sm">
                  روی دکمه <span className="inline-block px-2 py-1 bg-blue-500/30 rounded">اشتراک</span> (مربع با فلش ⬆️) در <strong>پایین صفحه Safari</strong> بزنید
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">2️⃣</div>
                <p className="text-sm">
                  از منوی باز شده، گزینه <strong>"افزودن به صفحه اصلی"</strong> یا <strong>"Add to Home Screen"</strong> را انتخاب کنید
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">3️⃣</div>
                <p className="text-sm">
                  نام اپ را بررسی کنید: <strong className="text-green-400">داشبورد {barberName}</strong>
                  <br />
                  <span className="text-xs text-white/60">(می‌توانید نام را تغییر دهید)</span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="text-2xl flex-shrink-0">4️⃣</div>
                <p className="text-sm">
                  روی دکمه <strong>"افزودن"</strong> یا <strong>"Add"</strong> بزنید
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl mt-4">
                <span className="text-xl">✅</span>
                <p className="text-xs text-green-200">
                  اپلیکیشن شما با نام "داشبورد {barberName}" روی صفحه اصلی نصب می‌شود!
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mt-2">
                <span className="text-xl">💡</span>
                <p className="text-xs text-yellow-200">
                  <strong>نکته:</strong> اگر دکمه اشتراک را نمی‌بینید، صفحه را به بالا بکشید یا Safari را تازه‌سازی کنید
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowIOSInstructions(false);
                  // Scroll to top to help user find the share button
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl text-white font-semibold transition-all duration-300"
              >
                متوجه شدم 👍
              </button>
              <button
                onClick={() => {
                  setShowIOSInstructions(false);
                  // Try to help user by scrolling and highlighting
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    alert('💡 حالا دکمه اشتراک (⬆️) را در پایین صفحه Safari پیدا کنید!');
                  }, 500);
                }}
                className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl text-white font-semibold transition-all duration-300"
              >
                راهنمایی بیشتر 🎯
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

