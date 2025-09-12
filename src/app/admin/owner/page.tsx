'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
    id: string;
    user_id: string;
    user_name: string;
    user_phone: string;
    date_key: string;
    start_time: string;
    end_time: string;
    barber: string;
    services: string[];
    total_duration: number;
    status?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

interface BarberStats {
    name: string;
    totalBookings: number;
    todayBookings: number;
    weekBookings: number;
    pendingBookings: number;
}

export default function OwnerDashboard() {
    const router = useRouter();
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [barberStats, setBarberStats] = useState<BarberStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBarber, setSelectedBarber] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [adminSession, setAdminSession] = useState<any>(null);

    const availableBarbers = ['حمید', 'بنیامین', 'محمد'];

    useEffect(() => {
        // Check admin session
        const session = localStorage.getItem('adminSession');
        if (!session) {
            router.push('/admin');
            return;
        }

        const parsedSession = JSON.parse(session);
        if (parsedSession.user.type !== 'owner') {
            router.push('/admin');
            return;
        }

        setAdminSession(parsedSession);
        fetchAllData();
    }, [router]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const allBookings: Booking[] = [];
            const stats: BarberStats[] = [];

            // Fetch bookings for each barber
            for (const barberName of availableBarbers) {
                try {
                    const response = await fetch(`/api/barber/${encodeURIComponent(barberName)}`);
                    if (response.ok) {
                        const data = await response.json();
                        allBookings.push(...data.bookings);

                        const today = new Date().toISOString().split('T')[0];
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        const weekAgoStr = weekAgo.toISOString().split('T')[0];

                        const todayBookings = data.bookings.filter((b: Booking) =>
                            b.date_key === today && b.status !== 'cancelled'
                        ).length;

                        const weekBookings = data.bookings.filter((b: Booking) =>
                            b.date_key >= weekAgoStr && b.status !== 'cancelled'
                        ).length;

                        const pendingBookings = data.bookings.filter((b: Booking) =>
                            !b.status || b.status === 'pending'
                        ).length;

                        stats.push({
                            name: barberName,
                            totalBookings: data.bookings.filter((b: Booking) => b.status !== 'cancelled').length,
                            todayBookings,
                            weekBookings,
                            pendingBookings
                        });
                    } else {
                        stats.push({
                            name: barberName,
                            totalBookings: 0,
                            todayBookings: 0,
                            weekBookings: 0,
                            pendingBookings: 0
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching data for ${barberName}:`, err);
                }
            }

            // Sort bookings by date and time
            allBookings.sort((a, b) => {
                if (a.date_key !== b.date_key) {
                    return new Date(b.date_key).getTime() - new Date(a.date_key).getTime();
                }
                return b.start_time.localeCompare(a.start_time);
            });

            setAllBookings(allBookings);
            setBarberStats(stats);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminSession');
        router.push('/admin');
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

    const filteredBookings = allBookings.filter(booking => {
        const matchesBarber = selectedBarber === 'all' || booking.barber === selectedBarber;
        const matchesDate = !selectedDate || booking.date_key === selectedDate;
        const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
        return matchesBarber && matchesDate && matchesStatus;
    });

    const getUniqueDates = () => {
        const dates = [...new Set(allBookings.map(b => b.date_key))];
        return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    };

    const totalStats = {
        totalBookings: allBookings.filter(b => b.status !== 'cancelled').length,
        todayBookings: allBookings.filter(b =>
            b.date_key === new Date().toISOString().split('T')[0] && b.status !== 'cancelled'
        ).length,
        pendingBookings: allBookings.filter(b => !b.status || b.status === 'pending').length,
        totalRevenue: allBookings.filter(b => b.status === 'completed').length * 50000 // Estimated
    };

    if (!adminSession) {
        return <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
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
        </div>;
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

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="glass-card p-6 mb-6 floating">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-glass mb-2 flex items-center">
                                👑 پنل مدیریت مالک آرایشگاه
                            </h1>
                            <p className="text-glass-secondary">
                                خوش آمدید {adminSession.user.name}
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

                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="stats-card p-6 text-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-lg font-semibold text-glass mb-2">کل رزروها</h3>
                        <p className="text-3xl font-bold text-blue-600">{totalStats.totalBookings}</p>
                    </div>
                    <div className="stats-card p-6 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📅</span>
                        </div>
                        <h3 className="text-lg font-semibold text-glass mb-2">رزروهای امروز</h3>
                        <p className="text-3xl font-bold text-green-600">{totalStats.todayBookings}</p>
                    </div>
                    <div className="stats-card p-6 text-center">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <h3 className="text-lg font-semibold text-glass mb-2">در انتظار تأیید</h3>
                        <p className="text-3xl font-bold text-yellow-600">{totalStats.pendingBookings}</p>
                    </div>
                    <div className="stats-card p-6 text-center">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💰</span>
                        </div>
                        <h3 className="text-lg font-semibold text-glass mb-2">درآمد تقریبی</h3>
                        <p className="text-2xl font-bold text-purple-600">{totalStats.totalRevenue.toLocaleString()} تومان</p>
                    </div>
                </div>

                {/* Barber Statistics */}
                <div className="glass-card p-6 mb-6">
                    <h2 className="text-xl font-bold text-glass mb-4 flex items-center">
                        ✂️ آمار آرایشگران
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {barberStats.map((barber) => (
                            <div key={barber.name} className="glass p-4 hover:scale-105 transition-transform">
                                <h3 className="font-semibold text-glass mb-3 text-center">{barber.name}</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-glass-secondary">کل:</span>
                                        <span className="font-semibold text-glass bg-blue-100/20 px-2 py-1 rounded-full">{barber.totalBookings}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-glass-secondary">امروز:</span>
                                        <span className="font-semibold text-green-600 bg-green-100/20 px-2 py-1 rounded-full">{barber.todayBookings}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-glass-secondary">در انتظار:</span>
                                        <span className="font-semibold text-yellow-600 bg-yellow-100/20 px-2 py-1 rounded-full">{barber.pendingBookings}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-6 mb-6">
                    <h2 className="text-xl font-bold text-glass mb-4 flex items-center">
                        🔍 فیلترها
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-glass mb-2">
                                آرایشگر
                            </label>
                            <select
                                value={selectedBarber}
                                onChange={(e) => setSelectedBarber(e.target.value)}
                                className="w-full p-3 glass-input text-glass"
                            >
                                <option value="all">همه آرایشگران</option>
                                {availableBarbers.map(barber => (
                                    <option key={barber} value={barber}>{barber}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-glass mb-2">
                                تاریخ
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full p-3 glass-input text-glass"
                            >
                                <option value="">همه تاریخ‌ها</option>
                                {getUniqueDates().map(date => (
                                    <option key={date} value={date}>
                                        {formatDate(date)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-glass mb-2">
                                وضعیت
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
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

                {/* All Bookings */}
                <div className="glass-card">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-glass flex items-center">
                            📋 همه رزروها ({filteredBookings.length})
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
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <h3 className="font-semibold text-glass mb-2 flex items-center">
                                                👤 مشتری
                                            </h3>
                                            <p className="text-glass">{booking.user_name}</p>
                                            <p className="text-glass-secondary text-sm">📞 {booking.user_phone}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-glass mb-2 flex items-center">
                                                ✂️ آرایشگر
                                            </h3>
                                            <p className="text-glass">{booking.barber}</p>
                                            <p className="text-glass-secondary text-sm">📅 {formatDate(booking.date_key)}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-glass mb-2 flex items-center">
                                                ⏰ زمان
                                            </h3>
                                            <p className="text-glass">{booking.start_time} - {booking.end_time}</p>
                                            <p className="text-glass-secondary text-sm">⏱️ {booking.total_duration} دقیقه</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-glass mb-2">وضعیت</h3>
                                            {getStatusBadge(booking.status)}
                                            <div className="mt-2">
                                                <p className="text-xs text-glass-secondary">
                                                    🛠️ {booking.services.join('، ')}
                                                </p>
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
