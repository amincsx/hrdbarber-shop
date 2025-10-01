'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BarberLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loginData, setLoginData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check for barber parameter in URL
    useEffect(() => {
        const barberParam = searchParams.get('barber');
        if (barberParam) {
            console.log('🔧 Barber parameter detected:', barberParam);
            setLoginData(prev => ({
                ...prev,
                username: decodeURIComponent(barberParam)
            }));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...loginData,
                    type: 'barber'
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store barber session
                localStorage.setItem('barberSession', JSON.stringify({
                    user: result.user,
                    loginTime: new Date().toISOString()
                }));

                // Redirect to barber dashboard
                const urlParams = new URLSearchParams(window.location.search);
                const isPWA = urlParams.get('pwa') === '1';
                
                if (isPWA) {
                    window.location.href = `/barber-dashboard/${encodeURIComponent(result.user.name)}?pwa=1`;
                } else {
                    router.push(`/barber-dashboard/${result.user.name}`);
                }
            } else {
                setError(result.error || 'خطا در ورود');
            }
        } catch (err) {
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-md w-full mx-4 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-block bg-blue-500/20 p-4 rounded-full mb-4">
                        <span className="text-4xl">✂️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">ورود آرایشگر</h1>
                    <p className="text-white/70">داشبورد مدیریت رزروها</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            نام کاربری
                        </label>
                        <input
                            type="text"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all duration-300"
                            placeholder="نام کاربری"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            رمز عبور
                        </label>
                        <input
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all duration-300"
                            placeholder="رمز عبور"
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all duration-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'در حال ورود...' : 'ورود به داشبورد'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-white/70 hover:text-white text-sm transition-colors flex items-center justify-center mx-auto"
                    >
                        ← بازگشت به سایت اصلی
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BarberLogin() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
                style={{
                    backgroundImage: 'url(/picbg2.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed'
                }}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                <div className="glass-card p-8 text-center relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto"></div>
                    <p className="mt-4 text-white/90">در حال بارگذاری...</p>
                </div>
            </div>
        }>
            <BarberLoginContent />
        </Suspense>
    );
}
