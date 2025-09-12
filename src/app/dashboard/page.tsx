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

      // Fetch bookings from API
      const fetchUserBookings = async () => {
        try {
          const response = await fetch(`/api/bookings?user_id=${encodeURIComponent(user.phone)}`);
          if (response.ok) {
            const data = await response.json();
            const bookings = data.bookings || [];
            console.log('📋 Fetched user bookings from database:', bookings);
            
            if (bookings.length > 0) {
              // Sort by date and time (most recent first)
              bookings.sort((a: any, b: any) => {
                const dateA = new Date(a.date_key + 'T' + a.start_time);
                const dateB = new Date(b.date_key + 'T' + b.start_time);
                return dateB.getTime() - dateA.getTime();
              });
              setUserBookings(bookings);
            } else {
              console.log('📱 No bookings from API, checking localStorage');
              fetchFromLocalStorage();
            }
          } else {
            console.warn('⚠️ API failed, falling back to localStorage');
            fetchFromLocalStorage();
          }
        } catch (error) {
          console.error('❌ Error fetching bookings:', error);
          fetchFromLocalStorage();
        }
      };

      const fetchFromLocalStorage = () => {
        try {
          const allBookings = localStorage.getItem('allBookings');
          if (allBookings) {
            const bookings = JSON.parse(allBookings);
            const userBookings = bookings.filter((booking: any) =>
              booking.phone === user.phone || 
              booking.user_phone === user.phone ||
              booking.user_id === user.phone
            );
            
            if (userBookings.length > 0) {
              userBookings.sort((a: any, b: any) => {
                const dateA = new Date((a.dateKey || a.date_key) + 'T' + (a.startTime || a.start_time));
                const dateB = new Date((b.dateKey || b.date_key) + 'T' + (b.startTime || b.start_time));
                return dateB.getTime() - dateA.getTime();
              });
              setUserBookings(userBookings);
              console.log('📱 Loaded user bookings from localStorage:', userBookings);
            } else {
              console.log('📝 No bookings found in localStorage for user:', user.phone);
              setUserBookings([]);
            }
          } else {
            console.log('📝 No bookings found in localStorage');
            setUserBookings([]);
          }
        } catch (error) {
          console.error('❌ Error reading localStorage:', error);
          setUserBookings([]);
        }
      };

      fetchUserBookings();
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
            <div className="p-6">
              {userBookings.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center text-sm text-white/70 mb-4">
                    📱 رزروهای شما از localStorage بارگذاری شده‌اند
                  </div>
                  {userBookings.map((booking: any, index: number) => (
                <div key={index} className="glass-card p-4 space-y-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                  <h3 className="text-base font-semibold text-white">
                    رزرو شماره {index + 1}
                  </h3>
                  <p className="text-sm text-white/90"><strong>تاریخ:</strong> {formatPersianDate(booking.dateKey || booking.date_key)}</p>
                  <p className="text-sm text-white/90"><strong>ساعت:</strong> {booking.startTime || booking.start_time} تا {booking.endTime || booking.end_time}</p>
                  <p className="text-sm text-white/90"><strong>آرایشگر:</strong> {booking.barber}</p>
                  <p className="text-sm text-white/90"><strong>سرویس‌ها:</strong> {booking.services.join('، ')}</p>
                  <p className="text-sm text-white/90"><strong>مدت زمان:</strong> {booking.totalDuration || booking.total_duration} دقیقه</p>
                  {booking.status && (
                    <p className="text-sm text-white/90"><strong>وضعیت:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {booking.status === 'confirmed' ? 'تایید شده' :
                         booking.status === 'pending' ? 'در انتظار' :
                         booking.status === 'cancelled' ? 'لغو شده' : booking.status}
                      </span>
                    </p>
                  )}
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
            </div>

        {/* Navigation back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="glass-button bg-white/10 text-white py-3 px-6 rounded-lg hover:bg-white/20 font-medium transition-colors backdrop-blur-xl border border-white/20"
          >
            🏠 بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
