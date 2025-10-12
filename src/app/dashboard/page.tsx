'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { persianToEnglish } from '../../lib/numberUtils';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [canBookNew, setCanBookNew] = useState<boolean>(true);
  const [nextAvailableTime, setNextAvailableTime] = useState<string>('');
  const [showPastBookings, setShowPastBookings] = useState<boolean>(false);

  const checkBookingEligibility = (bookings: any[]) => {
    if (bookings.length === 0) {
      setCanBookNew(true);
      return;
    }

    const now = new Date();
    const currentTime = now.getTime();

    // Find the most recent booking that hasn't ended yet
    const activeOrUpcomingBookings = bookings.filter((booking: any) => {
      // Create date in local timezone to avoid UTC conversion issues
      const [year, month, day] = booking.date_key.split('-').map(Number);
      const [hour, minute] = booking.end_time.split(':').map(Number);
      const endTime = new Date(year, month - 1, day, hour, minute);

      return endTime.getTime() > currentTime;
    });

    if (activeOrUpcomingBookings.length === 0) {
      // No active or upcoming bookings, can book
      setCanBookNew(true);
      setNextAvailableTime('');
    } else {
      // Find the latest end time
      const latestBooking = activeOrUpcomingBookings.reduce((latest: any, current: any) => {
        const [yearLatest, monthLatest, dayLatest] = latest.date_key.split('-').map(Number);
        const [hourLatest, minuteLatest] = latest.end_time.split(':').map(Number);
        const latestEnd = new Date(yearLatest, monthLatest - 1, dayLatest, hourLatest, minuteLatest);
        
        const [yearCurrent, monthCurrent, dayCurrent] = current.date_key.split('-').map(Number);
        const [hourCurrent, minuteCurrent] = current.end_time.split(':').map(Number);
        const currentEnd = new Date(yearCurrent, monthCurrent - 1, dayCurrent, hourCurrent, minuteCurrent);
        
        return currentEnd > latestEnd ? current : latest;
      });

      const [year, month, day] = latestBooking.date_key.split('-').map(Number);
      const [hour, minute] = latestBooking.end_time.split(':').map(Number);
      const latestEndTime = new Date(year, month - 1, day, hour, minute);

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
        setNextAvailableTime(persianToEnglish(latestEndTime.toLocaleDateString('fa-IR', options)));
      }
    }
  };

  useEffect(() => {
    // Get user data from localStorage (use 'user' key for consistency)
    const storedData = localStorage.getItem('user');
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
                // Create dates in local timezone to avoid UTC conversion issues
                const [yearA, monthA, dayA] = a.date_key.split('-').map(Number);
                const [hourA, minuteA] = a.start_time.split(':').map(Number);
                const dateA = new Date(yearA, monthA - 1, dayA, hourA, minuteA);
                
                const [yearB, monthB, dayB] = b.date_key.split('-').map(Number);
                const [hourB, minuteB] = b.start_time.split(':').map(Number);
                const dateB = new Date(yearB, monthB - 1, dayB, hourB, minuteB);
                
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
    } else {
      // If no user, redirect to login
      if (router) router.replace('/login');
    }
  }, []);

  const formatPersianDate = (dateKey: string) => {
    const date = new Date(dateKey);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    // Convert Persian numerals to English numerals
    return persianToEnglish(date.toLocaleDateString('fa-IR', options));
  };

  // Check if booking can be modified (more than 1 hour before start time)
  const canModifyBooking = (booking: any): boolean => {
    // Only allow modification for upcoming bookings
    if (showPastBookings) {
      return false;
    }
    
    const now = new Date();
    // Create date in local timezone to avoid UTC conversion issues
    const [year, month, day] = booking.date_key.split('-').map(Number);
    const [hour, minute] = booking.start_time.split(':').map(Number);
    const bookingDateTime = new Date(year, month - 1, day, hour, minute);
    
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can modify if more than 1 hour before start time and not cancelled
    return hoursDifference > 1 && booking.status !== 'cancelled';
  };

  // Cancel booking
  const handleCancelBooking = async (booking: any) => {
    if (!canModifyBooking(booking)) {
      alert('زمان تغییر یا لغو این رزرو به پایان رسیده است (کمتر از یک ساعت مانده)');
      return;
    }

    if (!confirm('آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟')) {
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.id,
          user_phone: userData.phone
        })
      });

      if (response.ok) {
        alert('رزرو با موفقیت لغو شد');
        // Reload bookings
        window.location.reload();
      } else {
        const error = await response.json();
        alert('خطا در لغو رزرو: ' + (error.error || 'خطای نامشخص'));
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('خطا در اتصال به سرور');
    }
  };

  // Change booking - redirect to booking page with pre-filled data
  const handleChangeBooking = (booking: any) => {
    if (!canModifyBooking(booking)) {
      alert('زمان تغییر این رزرو به پایان رسیده است (کمتر از یک ساعت مانده)');
      return;
    }

    // Store booking data for editing
    localStorage.setItem('editingBooking', JSON.stringify(booking));
    if (router) router.push('/booking');
  };

  // Filter bookings into upcoming and past
  const getUpcomingBookings = () => {
    const now = new Date();
    // Add 30 minutes buffer to ensure new bookings stay in upcoming (increased from 5 minutes)
    const bufferTime = new Date(now.getTime() + 30 * 60 * 1000);
    
    return userBookings.filter(booking => {
      // Create date in local timezone to avoid UTC conversion issues
      const [year, month, day] = booking.date_key.split('-').map(Number);
      const [hour, minute] = booking.start_time.split(':').map(Number);
      const bookingDateTime = new Date(year, month - 1, day, hour, minute);
      
      // Booking is upcoming if it's in the future (with buffer) and not cancelled
      return bookingDateTime >= bufferTime && booking.status !== 'cancelled';
    }).sort((a, b) => {
      const [yearA, monthA, dayA] = a.date_key.split('-').map(Number);
      const [hourA, minuteA] = a.start_time.split(':').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA, hourA, minuteA);
      
      const [yearB, monthB, dayB] = b.date_key.split('-').map(Number);
      const [hourB, minuteB] = b.start_time.split(':').map(Number);
      const dateB = new Date(yearB, monthB - 1, dayB, hourB, minuteB);
      
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getPastBookings = () => {
    const now = new Date();
    // Add 30 minutes buffer to ensure past bookings go to past section (increased from 5 minutes)
    const bufferTime = new Date(now.getTime() + 30 * 60 * 1000);
    
    return userBookings.filter(booking => {
      // Create date in local timezone to avoid UTC conversion issues
      const [year, month, day] = booking.date_key.split('-').map(Number);
      const [hour, minute] = booking.start_time.split(':').map(Number);
      const bookingDateTime = new Date(year, month - 1, day, hour, minute);
      
      // Booking is past if it's in the past (with buffer) or cancelled
      return bookingDateTime < bufferTime || booking.status === 'cancelled';
    }).sort((a, b) => {
      const [yearA, monthA, dayA] = a.date_key.split('-').map(Number);
      const [hourA, minuteA] = a.start_time.split(':').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA, hourA, minuteA);
      
      const [yearB, monthB, dayB] = b.date_key.split('-').map(Number);
      const [hourB, minuteB] = b.start_time.split(':').map(Number);
      const dateB = new Date(yearB, monthB - 1, dayB, hourB, minuteB);
      
      return dateB.getTime() - dateA.getTime();
    });
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">
                {showPastBookings ? 'رزروهای گذشته' : 'رزروهای آینده'}
              </h2>
              <button
                onClick={() => setShowPastBookings(!showPastBookings)}
                className="px-4 py-2 text-sm rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors"
              >
                {showPastBookings ? '📅 رزروهای آینده' : '🕐 رزروهای گذشته'}
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(showPastBookings ? getPastBookings() : getUpcomingBookings()).length === 0 ? (
                  <div className="text-center text-white/70 py-8">
                    {showPastBookings ? 'رزرو گذشته‌ای وجود ندارد' : 'رزرو آینده‌ای وجود ندارد'}
                  </div>
                ) : (
                  (showPastBookings ? getPastBookings() : getUpcomingBookings()).map((booking: any, index: number) => {
                  const canModify = canModifyBooking(booking);
                  return (
                  <div key={index} className="glass-card p-4 space-y-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
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
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
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
                    
                    {/* Action Buttons - Only show for upcoming bookings */}
                    {!showPastBookings && booking.status !== 'cancelled' && (
                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => handleChangeBooking(booking)}
                          disabled={!canModify}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            canModify
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                              : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                          }`}
                        >
                          🔄 تغییر
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          disabled={!canModify}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            canModify
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                              : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                          }`}
                        >
                          ❌ لغو
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })
                )}
                
                <p className="text-center font-medium mt-5 text-white">
                  {showPastBookings 
                    ? `مجموع رزروهای گذشته: ${getPastBookings().length}`
                    : `مجموع رزروهای آینده: ${getUpcomingBookings().length}`
                  }
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
