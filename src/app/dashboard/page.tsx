'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  useEffect(() => {
    // Get user data from localStorage
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const user = JSON.parse(storedData);
      setUserData(user);

      // Get all bookings and filter for this user
      const allBookings = localStorage.getItem('allBookings');
      if (allBookings) {
        const bookings = JSON.parse(allBookings);
        const userBookings = bookings.filter((booking: any) =>
          booking.phone === user.phone
        );
        // Sort by date and time (most recent first)
        userBookings.sort((a: any, b: any) => {
          const dateA = new Date(a.dateKey + 'T' + a.startTime);
          const dateB = new Date(b.dateKey + 'T' + b.startTime);
          return dateB.getTime() - dateA.getTime();
        });
        setUserBookings(userBookings);
      }
    }
  }, []);

  const formatPersianDate = (dateKey: string) => {
    const date = new Date(dateKey);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('fa-IR', options);
  };

  if (!userData) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <div className="mobile-full-height relative min-h-screen flex items-center justify-center p-4" dir="rtl"
         style={{
           backgroundImage: 'url(/picbg2.jpg)',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat',
           backgroundAttachment: 'fixed'
         }}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <div className="relative glass mobile-container w-full max-w-md p-6 space-y-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">
          داشبورد - {userData.name}
        </h1>

        {userBookings.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">نوبت‌های رزرو شده شما:</h2>
            <div className="space-y-4">
              {userBookings.map((booking: any, index: number) => (
                <div key={index} className="glass-card p-4 space-y-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                  <h3 className="text-base font-semibold text-white">
                    رزرو شماره {index + 1}
                  </h3>
                  <p className="text-sm text-white/90"><strong>تاریخ:</strong> {formatPersianDate(booking.dateKey)}</p>
                  <p className="text-sm text-white/90"><strong>ساعت:</strong> {booking.startTime} تا {booking.endTime}</p>
                  <p className="text-sm text-white/90"><strong>آرایشگر:</strong> {booking.barber}</p>
                  <p className="text-sm text-white/90"><strong>سرویس‌ها:</strong> {booking.services.join('، ')}</p>
                  <p className="text-sm text-white/90"><strong>مدت زمان:</strong> {booking.totalDuration} دقیقه</p>
                </div>
              ))}
            </div>
            <p className="text-center font-medium mt-5 text-white">
              مجموع رزروها: {userBookings.length}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-white">
              شما هیچ نوبتی رزرو نکرده‌اید
            </h2>
            <Link
              href="/booking"
              className="inline-block glass-button bg-white/20 text-white py-3 px-6 rounded-lg hover:bg-white/30 font-medium transition-colors backdrop-blur-xl border border-white/20"
            >
              رزرو نوبت جدید
            </Link>
          </div>
        )}

        {/* Quick Actions for Users */}
        <div className="glass-card p-5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4 text-center text-white">
            عملیات سریع
          </h3>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/booking"
              className="glass-button bg-white/20 text-white py-2 px-4 rounded-lg hover:bg-white/30 font-medium transition-colors backdrop-blur-xl border border-white/20"
            >
              رزرو نوبت جدید
            </Link>
            <Link
              href="/admin"
              className="glass-button bg-white/20 text-white py-2 px-4 rounded-lg hover:bg-white/30 font-medium transition-colors backdrop-blur-xl border border-white/20"
            >
              ورود آرایشگر/مالک
            </Link>
          </div>
          <p className="text-center mt-3 text-sm text-white/70">
            برای مدیریت رزروها، از بخش ورود آرایشگر استفاده کنید
          </p>
        </div>
      </div>
    </div>
  );
}
