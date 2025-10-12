'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { persianToEnglish } from '../../lib/numberUtils';

export default function BarberChangePassword() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [barberSession, setBarberSession] = useState<any>(null);

    useEffect(() => {
        // Check if barber is logged in
        const session = localStorage.getItem('barberSession');
        if (!session) {
            router.push('/barber-login');
            return;
        }

        const parsedSession = JSON.parse(session);
        if (parsedSession.user.type !== 'barber') {
            router.push('/barber-login');
            return;
        }

        setBarberSession(parsedSession);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('رمز عبور جدید و تأیید آن یکسان نیستند');
            return;
        }

        if (newPassword.length < 6) {
            setError('رمز عبور جدید باید حداقل 6 کاراکتر باشد');
            return;
        }

        if (newPassword === currentPassword) {
            setError('رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch('/api/barber-auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: barberSession.user.username,
                    currentPassword: persianToEnglish(currentPassword),
                    newPassword: persianToEnglish(newPassword)
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('رمز عبور شما با موفقیت تغییر کرد!\nلطفاً مجدداً وارد شوید.');
                localStorage.removeItem('barberSession');
                router.push('/barber-login');
            } else {
                setError(result.error || 'خطا در تغییر رمز عبور');
            }
        } catch (err) {
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    if (!barberSession) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-md w-full mx-4 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-block bg-green-500/20 p-4 rounded-full mb-4">
                        <span className="text-4xl">🔒</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">تغییر رمز عبور</h1>
                    <p className="text-white/70">{barberSession.user.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />

                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            رمز عبور فعلی
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"
                            placeholder="رمز عبور فعلی"
                            autoComplete="off"
                            required
                        />
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            رمز عبور جدید
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"
                            placeholder="حداقل 6 کاراکتر"
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            تأیید رمز عبور جدید
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"
                            placeholder="تکرار رمز عبور جدید"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                    >
                        {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <button
                        onClick={() => router.back()}
                        className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                        ← بازگشت به داشبورد
                    </button>
                </div>
            </div>
        </div>
    );
}

