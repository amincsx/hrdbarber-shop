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
        const sessionData = localStorage.getItem('adminSession');
        if (!sessionData) {
            router.push('/admin');
            return;
        }

        try {
            const parsedSession = JSON.parse(sessionData);
            if (!parsedSession.user || parsedSession.user.role !== 'barber') {
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
        } catch (err) {
            router.push('/admin');
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

                {/* Filter Controls */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                فیلتر بر اساس تاریخ
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">همه وضعیت‌ها</option>
                                <option value="pending">در انتظار تأیید</option>
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
                    <div className="p-6">
                        {filteredBookings.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">هیچ رزروی یافت نشد</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900">{booking.user_name}</h3>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    📞 {booking.user_phone}
                                                </p>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    📅 {formatDate(booking.date_key)}
                                                </p>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    ⏰ {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                </p>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    ✂️ {booking.services.join(', ')}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    ⏱️ مدت زمان: {booking.total_duration} دقیقه
                                                </p>
                                                {booking.notes && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        📝 یادداشت: {booking.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 mr-4">
                                                {(!booking.status || booking.status === 'pending') && (
                                                    <>
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                        >
                                                            تأیید
                                                        </button>
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                        >
                                                            لغو
                                                        </button>
                                                    </>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        تکمیل
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
