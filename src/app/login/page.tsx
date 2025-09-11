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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Try API first
      const response = await fetch(`/api/auth?phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`);
      const result = await response.json();

      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify(result.user));
        router.push('/dashboard');
        return;
      }

      // Fallback to localStorage if API fails
      const storedUsers = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')!) : [];
      const existingUser = storedUsers.find((u: any) => u.phone === phone && u.password === password);

      if (existingUser) {
        localStorage.setItem('userData', JSON.stringify(existingUser));
        router.push('/dashboard');
        return;
      }

      // If no user found
      setError('شماره تلفن یا رمز عبور اشتباه است');
    } catch (err) {
      // Fallback to localStorage on network error
      try {
        const storedUsers = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')!) : [];
        const existingUser = storedUsers.find((u: any) => u.phone === phone && u.password === password);

        if (existingUser) {
          localStorage.setItem('userData', JSON.stringify(existingUser));
          router.push('/dashboard');
          return;
        }
      } catch (localErr) {
        // Ignore localStorage errors
      }

      setError('خطا در ورود. لطفا دوباره تلاش کنید');
    } finally {
      setIsLoading(false);
    }
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
              placeholder="شماره تلفن"
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

        <div className="mt-6 text-center">
          <Link
            href="/signup"
            className="text-white/80 hover:text-white font-medium underline decoration-white/30 underline-offset-4 transition-colors"
          >
            حساب کاربری ندارید؟ ثبت نام
          </Link>
        </div>
      </div>
    </div>
  );
}
