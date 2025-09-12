'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [canBookNew, setCanBookNew] = useState<boolean>(true);
  const [nextAvailableTime, setNextAvailableTime] = useState<string>('');

  const checkBookingEligibility = (bookings: any[]) => {
    if (bookings.length === 0) {
      setCanBookNew(true);
      return;
    }

    const now = new Date();
    const currentTime = now.getTime();

    // Find the most recent booking that hasn't ended yet
    const activeOrUpcomingBookings = bookings.filter((booking: any) => {
      const bookingDate = new Date(booking.date_key);
      const endTime = new Date(booking.date_key + 'T' + booking.end_time);
      
      return endTime.getTime() > currentTime;
    });

    if (activeOrUpcomingBookings.length === 0) {
      // No active or upcoming bookings, can book
      setCanBookNew(true);
      setNextAvailableTime('');
    } else {
      // Find the latest end time
      const latestBooking = activeOrUpcomingBookings.reduce((latest: any, current: any) => {
        const latestEnd = new Date(latest.date_key + 'T' + latest.end_time);
        const currentEnd = new Date(current.date_key + 'T' + current.end_time);
        return currentEnd > latestEnd ? current : latest;
      });

      const latestEndTime = new Date(latestBooking.date_key + 'T' + latestBooking.end_time);
      
      if (latestEndTime.getTime() <= currentTime) {
        // Latest booking has ended, can book
        setCanBookNew(true);
        setNextAvailableTime('');
      } else {
        // Still have active booking, cannot book yet
        setCanBookNew(false);
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        setNextAvailableTime(latestEndTime.toLocaleDateString('fa-IR', options));
      }
    }
  };

  useEffect(() => {
    // Get user data from localStorage
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const user = JSON.parse(storedData);
      setUserData(user);

      // Fetch bookings from API database
      const fetchUserBookings = async () => {
        try {
          console.log('🔍 Fetching bookings for user:', user.phone);
          const response = await fetch(`/api/bookings?user_id=${encodeURIComponent(user.phone)}`);
          if (response.ok) {
            const data = await response.json();
            const bookings = data.bookings || [];
            console.log('📋 Fetched user bookings from database:', bookings);
            
            // Sort by date and time (most recent first)
            if (bookings.length > 0) {
              bookings.sort((a: any, b: any) => {
                const dateA = new Date(a.date_key + 'T' + a.start_time);
                const dateB = new Date(b.date_key + 'T' + b.start_time);
                return dateB.getTime() - dateA.getTime();
              });
            }
            setUserBookings(bookings);
            checkBookingEligibility(bookings);
          } else {
            console.warn('⚠️ API response not ok:', response.status);
            setUserBookings([]);
          }
        } catch (error) {
          console.error('❌ Error fetching bookings from database:', error);
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
              <div className="space-y-4">
                <div className="text-center text-sm text-white/70 mb-4">
                  🗄️ رزروهای شما از پایگاه داده بارگذاری شده‌اند
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
                <p className="text-center font-medium mt-5 text-white">
                  مجموع رزروها: {userBookings.length}
                </p>
              </div>
            </div>
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

        {/* Navigation and New Booking - only show when user has existing bookings */}
        {userBookings.length > 0 && (
          <div className="text-center space-y-4">
            {canBookNew ? (
              <Link
                href="/booking"
                className="glass-button bg-green-500/20 text-green-300 py-3 px-6 rounded-lg hover:bg-green-500/30 font-medium transition-colors backdrop-blur-xl border border-green-500/30"
              >
                📅 رزرو نوبت جدید
              </Link>
            ) : (
              <div className="space-y-2">
                <div className="glass-button bg-red-500/20 text-red-300 py-3 px-6 rounded-lg font-medium backdrop-blur-xl border border-red-500/30 cursor-not-allowed">
                  ⏳ امکان رزرو جدید وجود ندارد
                </div>
                <p className="text-sm text-white/70">
                  پس از اتمام آخرین نوبت خود می‌توانید نوبت جدید رزرو کنید
                </p>
                {nextAvailableTime && (
                  <p className="text-xs text-white/60">
                    آخرین نوبت تا: {nextAvailableTime}
                  </p>
                )}
              </div>
            )}
            
            <Link
              href="/"
              className="glass-button bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 font-medium transition-colors backdrop-blur-xl border border-white/20 text-sm"
            >
              🏠 صفحه اصلی
            </Link>
          </div>
        )}

        {/* Home link for users with no bookings */}
        {userBookings.length === 0 && (
          <div className="text-center">
            <Link
              href="/"
              className="glass-button bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 font-medium transition-colors backdrop-blur-xl border border-white/20 text-sm"
            >
              🏠 صفحه اصلی
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
