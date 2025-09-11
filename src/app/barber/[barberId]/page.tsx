'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Booking {
    id: string;
    user_id: string;
    user_name: string;
    user_phone: string;
    date_key: string;
    start_time: string;
    end_time: string;
    services: string[];
    total_duration: number;
    status?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

interface BarberData {
    barber: string;
    bookings: Booking[];
    total_bookings: number;
}

export default function BarberDashboard() {
    const params = useParams();
    const router = useRouter();
    const barberId = params.barberId as string;
    const [barberData, setBarberData] = useState<BarberData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [adminSession, setAdminSession] = useState<any>(null);

    useEffect(() => {
        // Check if user is authenticated barber
        const session = localStorage.getItem('adminSession');
        if (!session) {
            router.push('/admin');
            return;
        }

        const parsedSession = JSON.parse(session);
        if (parsedSession.user.type !== 'barber') {
            router.push('/admin');
            return;
        }

        // Check if barber is accessing their own dashboard
        const decodedBarberId = decodeURIComponent(barberId);
        if (parsedSession.user.name !== decodedBarberId) {
            router.push(`/admin/barber/${encodeURIComponent(parsedSession.user.name)}`);
            return;
        }

        setAdminSession(parsedSession);
        if (barberId) {
            fetchBarberBookings();
        }
    }, [barberId, router]);

    const fetchBarberBookings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/barber/${encodeURIComponent(barberId)}`);
            const data = await response.json();

            if (response.ok) {
                setBarberData(data);
            } else {
                setError(data.error || 'خطا در دریافت اطلاعات');
            }
        } catch (err) {
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
        try {
            const response = await fetch(`/api/barber/${encodeURIComponent(barberId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    booking_id: bookingId,
                    status,
                    notes
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Refresh bookings
                await fetchBarberBookings();
                alert('وضعیت رزرو با موفقیت به‌روزرسانی شد');
            } else {
                alert(result.error || 'خطا در به‌روزرسانی');
            }
        } catch (err) {
            alert('خطا در اتصال به سرور');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminSession');
        router.push('/admin');
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">تأیید شده</span>;
            case 'cancelled':
                return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">لغو شده</span>;
            case 'completed':
                return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">تکمیل شده</span>;
            default:
                return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">در انتظار</span>;
        }
    };

    const formatDate = (dateKey: string) => {
        const date = new Date(dateKey);
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const formatTime = (time: string) => {
        return time.replace(':', ':');
    };

    const filteredBookings = barberData?.bookings.filter(booking => {
        const matchesDate = !selectedDate || booking.date_key === selectedDate;
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesDate && matchesStatus;
    }) || [];

    const getUniquesDates = () => {
        if (!barberData) return [];
        const dates = [...new Set(barberData.bookings.map(b => b.date_key))];
        return dates.sort();
    };

    if (!adminSession) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">خطا در دریافت اطلاعات</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        بازگشت به صفحه ورود
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                داشبورد آرایشگر: {decodeURIComponent(barberId)}
                            </h1>
                            <p className="text-gray-600">
                                تعداد کل رزروها: {barberData?.total_bookings || 0}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            خروج
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">کل رزروها</h3>
                        <p className="text-2xl font-bold text-blue-600">{barberData?.total_bookings || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">امروز</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {filteredBookings.filter(b =>
                                b.date_key === new Date().toISOString().split('T')[0] && b.status !== 'cancelled'
                            ).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">در انتظار تأیید</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                            {filteredBookings.filter(b => !b.status || b.status === 'pending').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">تکمیل شده</h3>
                        <p className="text-2xl font-bold text-purple-600">
                            {filteredBookings.filter(b => b.status === 'completed').length}
                        </p>
                    </div>
                </div>

  const updateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/barber/${encodeURIComponent(barberId)}`, {
                    method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
        },
                body: JSON.stringify({
                    booking_id: bookingId,
                status,
                notes
        })
      });

                const result = await response.json();

                if (response.ok) {
                    // Refresh bookings
                    await fetchBarberBookings();
                alert('وضعیت رزرو با موفقیت به‌روزرسانی شد');
      } else {
                    alert(result.error || 'خطا در به‌روزرسانی');
      }
    } catch (err) {
                    alert('خطا در اتصال به سرور');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
                return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">تأیید شده</span>;
                case 'cancelled':
                return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">لغو شده</span>;
                case 'completed':
                return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">تکمیل شده</span>;
                default:
                return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">در انتظار</span>;
    }
  };

  const formatDate = (dateKey: string) => {
    const date = new Date(dateKey);
                return date.toLocaleDateString('fa-IR', {
                    year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
    });
  };

  const formatTime = (time: string) => {
    return time.replace(':', ':');
  };

  const filteredBookings = barberData?.bookings.filter(booking => {
    const matchesDate = !selectedDate || booking.date_key === selectedDate;
                const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
                return matchesDate && matchesStatus;
  }) || [];

  const getUniquesDates = () => {
    if (!barberData) return [];
    const dates = [...new Set(barberData.bookings.map(b => b.date_key))];
                return dates.sort();
  };

                if (loading) {
    return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
                    </div>
                </div>
                );
  }

                if (error) {
    return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-600 text-xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">خطا در دریافت اطلاعات</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            بازگشت به داشبورد
                        </button>
                    </div>
                </div>
                );
  }

                return (
                <div className="min-h-screen bg-gray-50 p-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        داشبورد آرایشگر: {decodeURIComponent(barberId)}
                                    </h1>
                                    <p className="text-gray-600">
                                        تعداد کل رزروها: {barberData?.total_bookings || 0}
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    بازگشت به داشبورد اصلی
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">فیلترها</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        فیلتر بر اساس تاریخ
                                    </label>
                                    <select
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">همه تاریخ‌ها</option>
                                        {getUniquesDates().map(date => (
                                            <option key={date} value={date}>
                                                {formatDate(date)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        فیلتر بر اساس وضعیت
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">همه وضعیت‌ها</option>
                                        <option value="pending">در انتظار</option>
                                        <option value="confirmed">تأیید شده</option>
                                        <option value="completed">تکمیل شده</option>
                                        <option value="cancelled">لغو شده</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Bookings List */}
                        <div className="bg-white rounded-xl shadow-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                    رزروهای فیلتر شده ({filteredBookings.length})
                                </h2>
                            </div>

                            {filteredBookings.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    هیچ رزروی یافت نشد
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredBookings.map((booking) => (
                                        <div key={booking.id} className="p-6 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 mb-2">اطلاعات مشتری</h3>
                                                            <p className="text-gray-700"><strong>نام:</strong> {booking.user_name}</p>
                                                            <p className="text-gray-700"><strong>تلفن:</strong> {booking.user_phone}</p>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 mb-2">زمان رزرو</h3>
                                                            <p className="text-gray-700"><strong>تاریخ:</strong> {formatDate(booking.date_key)}</p>
                                                            <p className="text-gray-700">
                                                                <strong>ساعت:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                            </p>
                                                            <p className="text-gray-700"><strong>مدت:</strong> {booking.total_duration} دقیقه</p>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 mb-2">خدمات</h3>
                                                            <ul className="text-gray-700">
                                                                {booking.services.map((service, index) => (
                                                                    <li key={index} className="text-sm">• {service}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    {booking.notes && (
                                                        <div className="mt-4">
                                                            <h4 className="font-semibold text-gray-900">یادداشت:</h4>
                                                            <p className="text-gray-700 text-sm">{booking.notes}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="ml-4 flex flex-col items-end space-y-2">
                                                    {getStatusBadge(booking.status)}

                                                    <div className="flex space-x-2 space-x-reverse">
                                                        {(!booking.status || booking.status === 'pending') && (
                                                            <button
                                                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                            >
                                                                تأیید
                                                            </button>
                                                        )}

                                                        {booking.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                            >
                                                                تکمیل
                                                            </button>
                                                        )}

                                                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟')) {
                                                                        updateBookingStatus(booking.id, 'cancelled');
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                            >
                                                                لغو
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                );
}
