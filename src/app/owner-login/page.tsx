'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerLogin() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/owner-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store owner session
                localStorage.setItem('ownerSession', JSON.stringify({
                    user: data.user,
                    timestamp: Date.now()
                }));

                // Redirect to owner dashboard
                router.push('/owner-dashboard');
            } else {
                setError(data.message || 'نام کاربری یا رمز عبور اشتباه است');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('خطا در ورود. لطفاً دوباره تلاش کنید');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            dir="rtl"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="glass-card p-8 max-w-md w-full rounded-3xl shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-400/30">
                        <span className="text-3xl">👑</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">ورود مدیر کل</h1>
                    <p className="text-white/60 text-sm">دسترسی به پنل مدیریت سیستم</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">
                            نام کاربری
                        </label>
                        <div className="relative">
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                                👤
                            </span>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 pr-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                                placeholder="نام کاربری خود را وارد کنید"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">
                            رمز عبور
                        </label>
                        <div className="relative">
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                                🔐
                            </span>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 pr-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                                placeholder="رمز عبور خود را وارد کنید"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 text-white font-medium py-3 px-6 rounded-xl hover:from-yellow-400/30 hover:to-orange-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                در حال ورود...
                            </div>
                        ) : (
                            'ورود به پنل مدیریت'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-white/40 text-xs">
                        دسترسی محدود به مدیر کل سیستم
                    </p>
                </div>
            </div>
        </div>
    );
}