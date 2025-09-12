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

export default function SecureBarberDashboard() {
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
                return <span className="px-3 py-1 text-xs bg-green-400/20 text-green-700 rounded-full border border-green-400/30 backdrop-blur-sm">✅ تأیید شده</span>;
            case 'cancelled':
                return <span className="px-3 py-1 text-xs bg-red-400/20 text-red-700 rounded-full border border-red-400/30 backdrop-blur-sm">❌ لغو شده</span>;
            case 'completed':
                return <span className="px-3 py-1 text-xs bg-blue-400/20 text-blue-700 rounded-full border border-blue-400/30 backdrop-blur-sm">🎉 تکمیل شده</span>;
            default:
                return <span className="px-3 py-1 text-xs bg-yellow-400/20 text-yellow-700 rounded-full border border-yellow-400/30 backdrop-blur-sm">⏳ در انتظار</span>;
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
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
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
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                <div className="glass-card p-8 relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
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
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                <div className="glass-card p-8 text-center relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto"></div>
                    <p className="mt-4 text-white/90">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
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
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
                <div className="glass-card p-8 text-center relative z-10">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-2">خطا در دریافت اطلاعات</h2>
                    <p className="text-white/90 mb-6">{error}</p>
                    <button
                        onClick={handleLogout}
                        className="glass-button px-6 py-3"
                    >
                        🔙 بازگشت به صفحه ورود
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 relative overflow-hidden" 
             dir="rtl"
             style={{
               backgroundImage: 'url(/picbg2.jpg)',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundRepeat: 'no-repeat',
               backgroundAttachment: 'fixed'
             }}>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-300/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="glass-card p-6 mb-6 floating">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-glass mb-2 flex items-center">
                                ✂️ داشبورد آرایشگر: {decodeURIComponent(barberId)}
                            </h1>
                            <p className="text-glass-secondary">
                                تعداد کل رزروها: {barberData?.total_bookings || 0}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="glass-button glass-danger px-6 py-3"
                        >
                            🚪 خروج
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="stats-card p-4 text-center">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl">📊</span>
                        </div>
                        <h3 className="text-sm font-medium text-glass-secondary mb-1">کل رزروها</h3>
                        <p className="text-2xl font-bold text-blue-600">{barberData?.total_bookings || 0}</p>
                    </div>
                    <div className="stats-card p-4 text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl">📅</span>
                        </div>
                        <h3 className="text-sm font-medium text-glass-secondary mb-1">امروز</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {filteredBookings.filter(b =>
                                b.date_key === new Date().toISOString().split('T')[0] && b.status !== 'cancelled'
                            ).length}
                        </p>
                    </div>
                    <div className="stats-card p-4 text-center">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl">⏳</span>
                        </div>
                        <h3 className="text-sm font-medium text-glass-secondary mb-1">در انتظار تأیید</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                            {filteredBookings.filter(b => !b.status || b.status === 'pending').length}
                        </p>
                    </div>
                    <div className="stats-card p-4 text-center">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl">🎉</span>
                        </div>
                        <h3 className="text-sm font-medium text-glass-secondary mb-1">تکمیل شده</h3>
                        <p className="text-2xl font-bold text-purple-600">
                            {filteredBookings.filter(b => b.status === 'completed').length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-6 mb-6">
                    <h2 className="text-xl font-bold text-glass mb-4 flex items-center">
                        🔍 فیلترها
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-glass mb-2">
                                فیلتر بر اساس تاریخ
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full p-3 glass-input text-glass"
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
                            <label className="block text-sm font-medium text-glass mb-2">
                                فیلتر بر اساس وضعیت
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-3 glass-input text-glass"
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
                <div className="glass-card">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-glass flex items-center">
                            📋 رزروهای من ({filteredBookings.length})
                        </h2>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📝</span>
                            </div>
                            <p className="text-glass-secondary">هیچ رزروی یافت نشد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-glass mb-2 flex items-center">
                                                        👤 اطلاعات مشتری
                                                    </h3>
                                                    <p className="text-glass"><strong>نام:</strong> {booking.user_name}</p>
                                                    <p className="text-glass"><strong>📞 تلفن:</strong> {booking.user_phone}</p>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-glass mb-2 flex items-center">
                                                        ⏰ زمان رزرو
                                                    </h3>
                                                    <p className="text-glass"><strong>📅 تاریخ:</strong> {formatDate(booking.date_key)}</p>
                                                    <p className="text-glass">
                                                        <strong>🕐 ساعت:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                    </p>
                                                    <p className="text-glass"><strong>⏱️ مدت:</strong> {booking.total_duration} دقیقه</p>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-glass mb-2 flex items-center">
                                                        🛠️ خدمات
                                                    </h3>
                                                    <ul className="text-glass">
                                                        {booking.services.map((service, index) => (
                                                            <li key={index} className="text-sm">• {service}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {booking.notes && (
                                                <div className="mt-4 p-3 bg-blue-100/10 rounded-xl border border-blue-200/20">
                                                    <h4 className="font-semibold text-glass flex items-center mb-2">
                                                        📝 یادداشت:
                                                    </h4>
                                                    <p className="text-glass-secondary text-sm">{booking.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-4 flex flex-col items-end space-y-3">
                                            {getStatusBadge(booking.status)}

                                            <div className="flex space-x-2 space-x-reverse">
                                                {(!booking.status || booking.status === 'pending') && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                        className="px-4 py-2 glass-button glass-success text-sm"
                                                    >
                                                        ✅ تأیید
                                                    </button>
                                                )}

                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                        className="px-4 py-2 glass-button text-sm"
                                                    >
                                                        🎉 تکمیل
                                                    </button>
                                                )}

                                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟')) {
                                                                updateBookingStatus(booking.id, 'cancelled');
                                                            }
                                                        }}
                                                        className="px-4 py-2 glass-button glass-danger text-sm"
                                                    >
                                                        ❌ لغو
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
