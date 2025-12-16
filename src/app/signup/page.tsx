'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { persianToEnglish } from '../../lib/numberUtils';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (step === 1) {
      // Step 1: Validate form and send OTP
      if (!firstName || !lastName || !phone || !password) {
        setError('لطفاً تمام فیلدها را پر کنید');
        setIsLoading(false);
        return;
      }

      // Convert Persian numerals to English numerals in phone number
      const normalizedPhone = persianToEnglish(phone);
      console.log('📞 Original phone input:', phone);
      console.log('📞 Normalized phone:', normalizedPhone);

      // Validate Iranian phone number
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        setError('شماره تلفن معتبر نیست');
        setIsLoading(false);
        return;
      }

      try {
        // Send OTP
        const otpResponse = await fetch('/api/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: normalizedPhone }),
        });

        const otpResult = await otpResponse.json();

        if (otpResponse.ok) {
          setOtpSent(true);
          setStep(2);
          setError('');
        } else {
          setError(otpResult.error || 'خطا در ارسال کد تایید');
        }
      } catch (err) {
        setError('خطا در ارسال کد تایید');
      }
    } else {
      // Step 2: Verify OTP and create account
      if (!otp) {
        setError('لطفاً کد تایید را وارد کنید');
        setIsLoading(false);
        return;
      }

      try {
        // Convert Persian numerals to English numerals in phone, password, and OTP
        const normalizedPhone = persianToEnglish(phone);
        const normalizedPassword = persianToEnglish(password);
        const normalizedOtp = persianToEnglish(otp);

        console.log('📞 Normalized phone:', normalizedPhone);
        console.log('🔑 Original password:', password);
        console.log('🔑 Normalized password:', normalizedPassword);
        console.log('🔢 Normalized OTP:', normalizedOtp);

        // Save to server via API
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            phone: normalizedPhone,
            password: normalizedPassword,
            otp: normalizedOtp
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'خطا در ثبت نام');
          return;
        }

        // Also save to localStorage for offline access
        const storedUsers = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')!) : [];
        const newUser = result.user;
        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));

        localStorage.setItem('user', JSON.stringify(newUser));
        router.push('/booking');
      } catch (err) {
        // Fallback to localStorage
        try {
          const storedUsers = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')!) : [];

          // Check if user already exists
          const existingUser = storedUsers.find((u: any) => u.phone === phone);
          if (existingUser) {
            setError('کاربر با این شماره تلفن قبلاً ثبت نام کرده است');
            return;
          }

          const newUser = {
            id: Date.now(),
            first_name: firstName,
            last_name: lastName,
            phone,
            password,
            role: 'user',
            created_at: new Date().toISOString()
          };

          storedUsers.push(newUser);
          localStorage.setItem('users', JSON.stringify(storedUsers));
          localStorage.setItem('user', JSON.stringify(newUser));

          router.push('/booking');
        } catch (localErr) {
          setError('خطا در ثبت نام. لطفا دوباره تلاش کنید');
        }
      }
    }

    setIsLoading(false);
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
          {step === 1 ? (
            // Step 1: User Information Form
            <>
              <div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="نام"
                  required
                  className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  required
                  className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                />
              </div>

              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="شماره تلفن (09xxxxxxxxx)"
                  required
                  className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور"
                    required
                    className="w-full p-4 pr-12 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/70 hover:text-black transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="black" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="black" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM4 10a6 6 0 1110.949-3.236 1 1 0 11-1.898.756A4 4 0 006 10c0 .294-.023.583-.066.866a1 1 0 11-1.868-.272zm12 0c0 1.657-.672 3.157-1.757 4.243a1 1 0 001.414 1.414A6 6 0 0016 10z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Step 2: OTP Verification
            <>
              <div className="text-center mb-4">
                <p className="text-white/80 text-sm">
                  کد تایید به شماره {phone} ارسال شد
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="کد تایید (6 رقم)"
                  required
                  maxLength={6}
                  className="w-full p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder-white/70 text-center text-lg tracking-widest"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-white/60 hover:text-white/80 text-sm underline"
                >
                  بازگشت و ویرایش اطلاعات
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-4 rounded-2xl font-medium backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 text-white shadow-xl mt-6"
          >
            {isLoading ? (
              step === 1 ? 'در حال ارسال کد...' : 'در حال تایید...'
            ) : (
              step === 1 ? 'ارسال کد تایید' : 'تایید و ثبت نام'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-white/80 hover:text-white font-medium underline decoration-white/30 underline-offset-4 transition-colors"
          >
            قبلاً ثبت نام کرده‌اید؟ ورود
          </Link>
        </div>
      </div>
    </div>
  );
}
