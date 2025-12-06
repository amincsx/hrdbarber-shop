'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { persianToEnglish } from '../../lib/numberUtils';

function BarberLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loginData, setLoginData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            // Convert Persian numerals to English in username and password
            const normalizedLoginData = {
                username: persianToEnglish(loginData.username),
                password: persianToEnglish(loginData.password),
                type: 'barber'
            };
            
            console.log('🔐 Barber login - Original username:', loginData.username);
            console.log('🔐 Barber login - Normalized username:', normalizedLoginData.username);
            console.log('🔑 Barber login - Normalized password:', normalizedLoginData.password);
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(normalizedLoginData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store barber session
                localStorage.setItem('barberSession', JSON.stringify({
                    user: result.user,
                    loginTime: new Date().toISOString()
                }));

                // Redirect to barber dashboard using username (English) not name (Farsi)
                const urlParams = new URLSearchParams(window.location.search);
                const isPWA = urlParams.get('pwa') === '1';
                const barberParam = urlParams.get('barber');
                
                // Use username for clean URLs
                const barberUrlId = result.user.username || result.user.name;
                
                if (isPWA || barberParam) {
                    // For PWA, use window.location to ensure proper navigation
                    window.location.href = `/barber-dashboard/${encodeURIComponent(barberUrlId)}?pwa=1`;
                } else {
                    router.push(`/barber-dashboard/${barberUrlId}`);
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

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {/* Hidden fake inputs to prevent autofill */}
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />
                    
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            نام کاربری
                        </label>
                        <input
                            type="text"
                            name="prevent-autofill-username"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all duration-300"
                            placeholder="نام کاربری"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-form-type="other"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            رمز عبور
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="prevent-autofill-password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all duration-300 pr-12"
                                placeholder="رمز عبور"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                data-lpignore="true"
                                data-form-type="other"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM4 10a6 6 0 1110.949-3.236 1 1 0 11-1.898.756A4 4 0 006 10c0 .294-.023.583-.066.866a1 1 0 11-1.868-.272zm12 0c0 1.657-.672 3.157-1.757 4.243a1 1 0 001.414 1.414A6 6 0 0016 10z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>
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

                {/* Action Links */}
                <div className="mt-6 space-y-3">
                    <button
                        onClick={() => router.push('/barber-forgot-password')}
                        className="w-full text-white/80 hover:text-white text-sm transition-colors py-2 hover:bg-white/10 rounded-lg"
                    >
                        🔑 فراموشی رمز عبور
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-white/20"></div>
                        <span className="text-white/50 text-xs">یا</span>
                        <div className="flex-1 h-px bg-white/20"></div>
                    </div>
                    
                    <button
                        onClick={() => router.push('/barber-register')}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-white font-medium transition-all"
                    >
                        ✨ ثبت نام آرایشگر جدید
                    </button>
                </div>

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
