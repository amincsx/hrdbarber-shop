'use client';

import Link from 'next/link';
import PWAInstall from '@/components/PWAInstall';

export default function HomePage() {
  const welcomeMessage = "به آرایشگاه HRD خوش آمدید - برای رزرو وقت وارد شوید";
  
  // Check if this is a barber PWA that somehow ended up here
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const isPWA = urlParams.get('pwa') === '1';
    const isAuto = urlParams.get('auto') === '1';
    
    if (isPWA || isAuto) {
      console.error('🚨 Barber PWA opened main page instead of barber dashboard!');
      console.log('Current URL:', window.location.href);
      console.log('PWA params:', { isPWA, isAuto });
    }
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-8 lg:px-12" dir="rtl">
      {/* Blurry Black-Orange Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#2d1810',
          filter: 'blur(50px)',
          zIndex: -20
        }}
      ></div>

      {/* Background Image - Mobile */}
      <div
        className="fixed inset-0 w-full h-full lg:hidden"
        style={{
          backgroundImage: 'url(/BG.jpg)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          zIndex: -10
        }}
      ></div>

      {/* Background Image - Desktop (same as login page) */}
      <div
        className="hidden lg:block fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/PICBG1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -10
        }}
      ></div>

      {/* Enhanced Background Elements - Responsive */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] bg-white/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] bg-gray-100/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-blue-400/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-cyan-400/15 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/3 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-white/6 rounded-full blur-2xl"></div>
        <div className="absolute top-1/6 left-1/6 w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-blue-300/12 rounded-full blur-3xl"></div>
        {/* Desktop-only additional elements */}
        <div className="hidden lg:block absolute top-1/3 right-1/3 w-32 h-32 bg-cyan-300/10 rounded-full blur-2xl"></div>
        <div className="hidden lg:block absolute bottom-1/4 right-1/6 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </div>


      {/* Main Content Container */}
      <div className="mt-16 sm:mt-20 lg:mt-24 flex flex-col items-center w-full">
        {/* Content - Responsive buttons */}
        <div className="flex gap-4 sm:gap-6 lg:gap-8 flex-col sm:flex-row w-full max-w-xs sm:max-w-md lg:max-w-2xl relative z-10 px-4 sm:px-0">
          {/* Enhanced Neon glow behind signup button */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/60 rounded-xl blur-lg animate-pulse"></div>
            <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <Link
              href="/signup"
              className="relative glass-button w-full px-6 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-6 text-center font-bold text-lg sm:text-xl lg:text-2xl rounded-xl backdrop-blur-xl bg-white/35 border border-white/50 hover:bg-white/45 transition-all duration-300 shadow-2xl block text-white hover:shadow-blue-500/25 hover:shadow-3xl"
            >
              ثبت نام
            </Link>
          </div>

          {/* Enhanced Neon glow behind login button */}
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/60 rounded-xl blur-lg animate-pulse"></div>
            <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <Link
              href="/login"
              className="relative glass-button w-full px-6 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-6 text-center font-bold text-lg sm:text-xl lg:text-2xl rounded-xl backdrop-blur-xl bg-white/30 border border-white/50 hover:bg-white/40 transition-all duration-300 shadow-2xl block text-white hover:shadow-cyan-500/25 hover:shadow-3xl"
            >
              ورود
            </Link>
          </div>

        </div>

        {/* PWA Install Button - Below main buttons */}
        <div className="mt-6 sm:mt-8 relative z-10">
          <PWAInstall />
        </div>
      </div>

      {/* Welcome Message - Responsive */}
      <div className="absolute bottom-50 left-1/2 transform -translate-x-1/2 z-10 px-4 text-center">
        <p className="text-white/80 text-sm sm:text-lg lg:text-xl font-medium max-w-xs sm:max-w-sm lg:max-w-md">
          {welcomeMessage}
        </p>
      </div>

    </div>
  );
}
