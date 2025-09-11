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
    <div className="mobile-full-height bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4" dir="rtl">
      <div className="glass mobile-container w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          داشبورد - {userData.name}
        </h1>

        {userBookings.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">نوبت‌های رزرو شده شما:</h2>
            <div className="space-y-4">
              {userBookings.map((booking: any, index: number) => (
                <div key={index} className="glass-card p-4 space-y-2">
                  <h3 className="text-base font-semibold text-gray-800">
                    رزرو شماره {index + 1}
                  </h3>
                  <p className="text-sm text-gray-700"><strong>تاریخ:</strong> {formatPersianDate(booking.dateKey)}</p>
                  <p className="text-sm text-gray-700"><strong>ساعت:</strong> {booking.startTime} تا {booking.endTime}</p>
                  <p className="text-sm text-gray-700"><strong>آرایشگر:</strong> {booking.barber}</p>
                  <p className="text-sm text-gray-700"><strong>سرویس‌ها:</strong> {booking.services.join('، ')}</p>
                  <p className="text-sm text-gray-700"><strong>مدت زمان:</strong> {booking.totalDuration} دقیقه</p>
                </div>
              ))}
            </div>
            <p className="text-center font-medium mt-5 text-gray-700">
              مجموع رزروها: {userBookings.length}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">
              شما هیچ نوبتی رزرو نکرده‌اید
            </h2>
            <Link
              href="/booking"
              className="inline-block glass-button bg-slate-700 text-white py-3 px-6 rounded-lg hover:bg-slate-600 font-medium transition-colors"
            >
              رزرو نوبت جدید
            </Link>
          </div>
        )}

        {/* Quick Actions for Users */}
        <div className="glass-card p-5 border-blue-200 bg-blue-50/20">
          <h3 className="text-lg font-semibold mb-4 text-center text-blue-800">
            عملیات سریع
          </h3>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/booking"
              className="glass-button bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              رزرو نوبت جدید
            </Link>
            <Link
              href="/admin"
              className="glass-button bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              ورود آرایشگر/مالک
            </Link>
          </div>
          <p className="text-center mt-3 text-sm text-slate-600">
            برای مدیریت رزروها، از بخش ورود آرایشگر استفاده کنید
          </p>
        </div>
      </div>
    </div>
  );
}
