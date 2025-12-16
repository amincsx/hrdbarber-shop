'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { persianToEnglish } from '../../lib/numberUtils';

export default function BarberForgotPassword() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [sentOtp, setSentOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Send OTP to phone
    const sendOTP = async () => {
        try {
            setLoading(true);
            setError('');

            const normalizedPhone = persianToEnglish(phone);

            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    context: 'barber-forgot-password'
                })
            });

            const result = await response.json();

            if (response.ok) {
                setSentOtp(result.otp);
                setMessage(`کد تأیید به شماره ${normalizedPhone} ارسال شد`);
                setStep(2);
            } else {
                setError(result.error || 'خطا در ارسال کد تأیید');
            }
        } catch (err) {
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const verifyOTP = (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedOtp = persianToEnglish(otp).trim();
        const expectedOtp = String(sentOtp).trim();

        if (normalizedOtp !== expectedOtp) {
            setError('کد تأیید اشتباه است');
            return;
        }

        setError('');
        setMessage('شماره تلفن تأیید شد. رمز عبور جدید را وارد کنید.');
        setStep(3);
    };

    // Reset password
    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('رمز عبور و تأیید آن یکسان نیستند');
            return;
        }

        if (newPassword.length < 6) {
            setError('رمز عبور باید حداقل 6 کاراکتر باشد');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/barber-auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: persianToEnglish(phone),
                    username: persianToEnglish(username),
                    newPassword: persianToEnglish(newPassword)
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('رمز عبور شما با موفقیت تغییر کرد!\nاکنون می‌توانید با رمز عبور جدید وارد شوید.');
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
                    <div className="inline-block bg-yellow-500/20 p-4 rounded-full mb-4">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {step === 1 && 'بازیابی رمز عبور'}
                        {step === 2 && 'تأیید شماره تلفن'}
                        {step === 3 && 'رمز عبور جدید'}
                    </h1>
                    <p className="text-white/70">
                        {step === 1 && 'شماره تلفن خود را وارد کنید'}
                        {step === 2 && 'کد تأیید را وارد کنید'}
                        {step === 3 && 'رمز عبور جدید را تعیین کنید'}
                    </p>
                </div>

                {/* Step 1: Phone Number */}
                {step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }} className="space-y-6" autoComplete="off">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                شماره تلفن همراه
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"
                                placeholder="09xxxxxxxxx"
                                autoComplete="off"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                نام کاربری (اختیاری)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"
                                placeholder="mohammad"
                                autoComplete="off"
                            />
                            <p className="text-xs text-white/60 mt-1">اگر به خاطر دارید، وارد کنید</p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                        >
                            {loading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={verifyOTP} className="space-y-6">
                        {message && (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-200 text-sm">
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                کد تأیید (6 رقمی)
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full p-4 rounded-xl bg-white/90 text-gray-800 text-center text-2xl tracking-widest border border-white/40 focus:bg-white focus:border-white/60 focus:outline-none transition-all"
                                placeholder="------"
                                maxLength={6}
                                autoComplete="off"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                                className="flex-1 py-4 bg-gray-600 hover:bg-gray-500 rounded-xl text-white font-semibold transition-all"
                            >
                                بازگشت
                            </button>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                            >
                                تأیید
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={resetPassword} className="space-y-6" autoComplete="off">
                        {message && (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-200 text-sm">
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                رمز عبور جدید
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all pr-12"
                                    placeholder="حداقل 6 کاراکتر"
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    {showNewPassword ? (
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

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                تأیید رمز عبور جدید
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all pr-12"
                                    placeholder="تکرار رمز عبور"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    {showConfirmPassword ? (
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
                )}

                {/* Links */}
                <div className="mt-6 text-center space-y-2">
                    <button
                        onClick={() => router.push('/barber-login')}
                        className="text-white/70 hover:text-white text-sm transition-colors block w-full"
                    >
                        ← بازگشت به صفحه ورود
                    </button>
                </div>
            </div>
        </div>
    );
}

