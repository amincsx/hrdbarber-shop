'use client';

import { useState } from 'react';

export default function PWAInstructions() {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setShowInstructions(true)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full flex items-center justify-center text-white hover:bg-blue-500/30 transition-all duration-300"
        aria-label="راهنمای نصب"
      >
        <span className="text-lg">❓</span>
      </button>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowInstructions(false)}
          ></div>
          
          <div className="relative max-w-md w-full glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">📱 راهنمای نصب اپلیکیشن</h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-white/90 text-sm">
              {/* Android Instructions */}
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <h3 className="font-semibold mb-2 flex items-center">
                  🤖 اندروید (Android)
                </h3>
                <ol className="space-y-2 text-xs">
                  <li>1. روی دکمه "نصب اپلیکیشن" 📱 بزنید</li>
                  <li>2. گزینه "افزودن به صفحه اصلی" را انتخاب کنید</li>
                  <li>3. "نصب" یا "Install" را بزنید</li>
                  <li>4. اپ روی صفحه اصلی شما ظاهر می‌شود ✅</li>
                </ol>
              </div>

              {/* iOS Instructions */}
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <h3 className="font-semibold mb-2 flex items-center">
                  🍎 آیفون (iPhone)
                </h3>
                <ol className="space-y-2 text-xs">
                  <li>1. روی دکمه "اشتراک" □ در پایین صفحه بزنید</li>
                  <li>2. "افزودن به صفحه اصلی" را انتخاب کنید</li>
                  <li>3. نام اپ را تأیید کنید</li>
                  <li>4. "افزودن" را بزنید ✅</li>
                </ol>
              </div>

              {/* Chrome Instructions */}
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <h3 className="font-semibold mb-2 flex items-center">
                  🌐 مرورگر Chrome
                </h3>
                <ol className="space-y-2 text-xs">
                  <li>1. منوی سه نقطه ⋮ را باز کنید</li>
                  <li>2. "افزودن به صفحه اصلی" را انتخاب کنید</li>
                  <li>3. "نصب" یا "Install" را بزنید</li>
                </ol>
              </div>

              {/* Benefits */}
              <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <h3 className="font-semibold mb-2 flex items-center">
                  ⭐ مزایای نصب اپلیکیشن
                </h3>
                <ul className="space-y-1 text-xs">
                  <li>• دسترسی سریع‌تر</li>
                  <li>• کارکرد بدون اینترنت</li>
                  <li>• اعلان‌های آنی</li>
                  <li>• تجربه بهتر کاربری</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 glass-button py-3"
            >
              متوجه شدم ✅
            </button>
          </div>
        </div>
      )}
    </>
  );
}
