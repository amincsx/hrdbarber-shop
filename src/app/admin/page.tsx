'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLogin() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loginData, setLoginData] = useState({
        username: '',
        password: '',
        type: 'barber' // 'barber' or 'owner'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check for barber parameter in URL
    useEffect(() => {
        const barberParam = searchParams.get('barber');
        if (barberParam) {
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
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store admin session
                localStorage.setItem('adminSession', JSON.stringify({
                    user: result.user,
                    loginTime: new Date().toISOString()
                }));

                // Redirect based on user type
                if (result.user.type === 'owner') {
                    router.push('/admin/owner');
                } else {
                    router.push(`/admin/barber/${result.user.name}`);
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
        <div className="mobile-full-height flex items-center justify-center mobile-container relative overflow-hidden"
            dir="rtl"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            {/* Subtle Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-100/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md glass-card p-6 sm:p-8 relative z-10 floating">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm touch-manipulation">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-glass mb-2">
                        ورود به پنل مدیریت
                    </h1>
                    <p className="text-glass-secondary text-sm">
                        برای دسترسی به پنل آرایشگر یا مدیریت وارد شوید
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-glass mb-3">
                            نوع کاربر
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setLoginData({ ...loginData, type: 'barber' })}
                                className={`p-4 rounded-xl font-medium transition-all ${loginData.type === 'barber'
                                    ? 'bg-white/30 border border-white/40 text-glass backdrop-blur-sm'
                                    : 'glass-secondary'
                                    }`}
                            >
                                آرایشگر
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginData({ ...loginData, type: 'owner' })}
                                className={`p-4 rounded-xl font-medium transition-all ${loginData.type === 'owner'
                                    ? 'bg-white/30 border border-white/40 text-glass backdrop-blur-sm'
                                    : 'glass-secondary'
                                    }`}
                            >
                                مدیریت آرایشگاه
                            </button>
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-glass mb-2">
                            نام کاربری
                        </label>
                        <input
                            type="text"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all duration-300"
                            placeholder={loginData.type === 'owner' ? 'ceo' : 'نام انگلیسی آرایشگر (مثلا hamid)'}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-glass mb-2">
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
                        <div className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-600 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-4 rounded-xl text-white font-medium transition-all ${loading
                            ? 'bg-gray-400/20 cursor-not-allowed backdrop-blur-sm'
                            : loginData.type === 'owner'
                                ? 'glass-button glass-success'
                                : 'glass-button'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                                در حال ورود...
                            </div>
                        ) : (
                            '🚀 ورود به پنل'
                        )}
                    </button>
                </form>


                {/* Back to main */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-glass-light hover:text-glass-secondary text-sm transition-colors flex items-center justify-center mx-auto"
                    >
                        ← بازگشت به صفحه اصلی
                    </button>
                </div>
            </div>
        </div>
    );
}
