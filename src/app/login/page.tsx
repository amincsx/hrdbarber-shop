'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp'>('phone');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for phone:', phone);
      
      // Try API first with better error handling
      const response = await fetch(`/api/auth?phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Login API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Login successful via API');
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/dashboard');
        return;
      }

      // Handle specific error responses
      if (response.status === 401) {
        setError('شماره تلفن یا رمز عبور اشتباه است');
        return;
      }

      if (response.status === 404) {
        setError('کاربری با این شماره تلفن یافت نشد');
        return;
      }

      if (response.status >= 500) {
        console.log('🔄 Server error, trying localStorage fallback...');
        // Only use localStorage fallback for server errors
        const storedUsers = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')!) : [];
        const existingUser = storedUsers.find((u: any) => u.phone === phone && u.password === password);

        if (existingUser) {
          console.log('✅ Login successful via localStorage fallback');
          localStorage.setItem('user', JSON.stringify(existingUser));
          router.push('/dashboard');
          return;
        }
      }

      // For other errors, try to get the error message
      try {
        const errorResult = await response.json();
        setError(errorResult.error || 'خطا در ورود');
      } catch {
        setError('خطا در ورود به سرور');
      }

    } catch (err) {
      console.error('🚨 Network error during login:', err);
      
      // Only fallback to localStorage on complete network failure
      try {
        const storedUsers = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')!) : [];
        const existingUser = storedUsers.find((u: any) => u.phone === phone && u.password === password);

        if (existingUser) {
          console.log('✅ Login successful via localStorage (network error fallback)');
          localStorage.setItem('user', JSON.stringify(existingUser));
          router.push('/dashboard');
          return;
        }
      } catch (localErr) {
        console.error('❌ localStorage fallback failed:', localErr);
      }

      setError('خطا در اتصال به سرور. لطفا اتصال اینترنت خود را بررسی کنید');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      console.log('🔄 Forgot password step:', forgotStep);
      
      if (forgotStep === 'phone') {
        if (!forgotPhone) {
          setForgotError('لطفاً شماره تلفن را وارد کنید');
          return;
        }

        // Validate Iranian phone number
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(forgotPhone)) {
          setForgotError('شماره تلفن معتبر نیست');
          return;
        }

        console.log('📱 Checking if user exists for phone:', forgotPhone);
        
        // Step 1: Check if user exists first
        const checkResponse = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: forgotPhone }),
        });

        console.log('📡 User check response status:', checkResponse.status);

        if (!checkResponse.ok) {
          const checkResult = await checkResponse.json();
          console.log('❌ User check failed:', checkResult.error);
          setForgotError(checkResult.error || 'خطا در بررسی کاربر');
          return;
        }

        console.log('✅ User exists, sending OTP...');
        
        // Step 2: Send OTP using the same API as signup
        const otpResponse = await fetch('/api/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: forgotPhone }),
        });

        console.log('📡 OTP send response status:', otpResponse.status);

        if (otpResponse.ok) {
          console.log('✅ OTP sent successfully');
          setForgotSuccess('کد تأیید به شماره شما ارسال شد');
          setForgotStep('otp');
        } else {
          const otpResult = await otpResponse.json();
          console.log('❌ OTP send failed:', otpResult.error);
          setForgotError(otpResult.error || 'خطا در ارسال کد تایید. لطفا مجددا تلاش کنید');
        }
      } else if (forgotStep === 'otp') {
        console.log('🔑 Resetting password with OTP...');
        
        // Step 3: Verify OTP and reset password
        if (!newPassword) {
          setForgotError('لطفاً رمز عبور جدید را وارد کنید');
          return;
        }

        if (newPassword.length < 4) {
          setForgotError('رمز عبور باید حداقل 4 کاراکتر باشد');
          return;
        }

        const response = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: forgotPhone,
            otp: otpCode,
            newPassword: newPassword
          }),
        });

        console.log('📡 Password reset response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Password reset successful');
          setForgotSuccess('رمز عبور با موفقیت تغییر کرد');
          setTimeout(() => {
            resetForgotPassword();
          }, 2000);
        } else {
          const result = await response.json();
          console.log('❌ Password reset failed:', result.error);
          setForgotError(result.error || 'خطا در تغییر رمز عبور');
        }
      }
    } catch (err) {
      console.error('🚨 Network error during password reset:', err);
      setForgotError('خطا در اتصال به سرور. لطفا اتصال اینترنت خود را بررسی کنید');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep('phone');
    setForgotPhone('');
    setOtpCode('');
    setNewPassword('');
    setForgotError('');
    setForgotSuccess('');
  };

  return (
    <div className="mobile-full-height flex items-center justify-center relative overflow-hidden mobile-container" dir="rtl">
      {/* Background Image */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/PICBG1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -20
        }}
      ></div>

      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {error && (
          <div className="bg-red-100/20 border border-red-300/20 text-red-700 px-4 py-3 rounded-2xl mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="شماره تلفن یا نام کاربری"
              className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
            />
            
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="رمز عبور"
              className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-4 rounded-2xl font-medium backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 text-white shadow-xl mt-6"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current ml-2"></div>
                در حال ورود...
              </div>
            ) : (
              'ورود'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-white/70 hover:text-white text-sm underline decoration-white/30 underline-offset-4 transition-colors"
          >
            رمز عبور خود را فراموش کرده‌اید؟
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/signup"
            className="text-white/80 hover:text-white font-medium underline decoration-white/30 underline-offset-4 transition-colors"
          >
            حساب کاربری ندارید؟ ثبت نام
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={resetForgotPassword}></div>
          <div className="relative max-w-md w-full mx-4 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">بازیابی رمز عبور</h2>
              <button
                onClick={resetForgotPassword}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotStep === 'phone' && (
                <div>
                  <label className="block text-white/80 mb-2">شماره تلفن</label>
                  <input
                    type="tel"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    required
                    placeholder="شماره تلفن خود را وارد کنید"
                    className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                  />
                </div>
              )}

              {forgotStep === 'otp' && (
                <>
                  <div>
                    <label className="block text-white/80 mb-2">کد تأیید</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      placeholder="کد ارسال شده را وارد کنید"
                      className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">رمز عبور جدید</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="رمز عبور جدید را وارد کنید"
                      className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                    />
                  </div>
                </>
              )}

              {forgotError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-400/30 text-green-200 text-sm">
                  {forgotSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full p-4 rounded-2xl font-medium backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 text-white shadow-xl"
              >
                {forgotLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current ml-2"></div>
                    در حال پردازش...
                  </div>
                ) : forgotStep === 'phone' ? (
                  'ارسال کد تأیید'
                ) : (
                  'تغییر رمز عبور'
                )}
              </button>

              {forgotStep !== 'phone' && (
                <button
                  type="button"
                  onClick={() => setForgotStep('phone')}
                  className="w-full p-3 rounded-2xl font-medium text-white/70 hover:text-white transition-colors"
                >
                  بازگشت
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
