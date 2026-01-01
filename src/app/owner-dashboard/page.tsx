'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
    _id?: string;
    id?: string;
    // API returns these fields
    user_name: string;
    user_phone: string;
    barber: string;
    barber_id?: string;
    date_key: string;
    start_time: string;
    end_time: string;
    services: string[];
    total_duration?: number;
    status: 'pending' | 'accepted' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    created_at?: string;
    persian_date?: string;
    // Legacy fields for compatibility
    customerName?: string;
    customerPhone?: string;
    barberName?: string;
    barberId?: string;
    date?: string;
    time?: string;
    service?: string;
    price?: string;
}

interface Barber {
    _id?: string;
    username: string;
    name: string;
    role: string;
    isAvailable?: boolean;
    created_at?: string;
}

export default function OwnerDashboard() {
    const router = useRouter();
    const [ownerSession, setOwnerSession] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'cancelled' | 'completed'>('all');
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        acceptedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        totalBarbers: 0,
        activeBarbers: 0,
        todayBookings: 0,
        thisWeekRevenue: 0
    });

    useEffect(() => {
        // Check owner session
        const session = localStorage.getItem('ownerSession');
        if (!session) {
            router.push('/owner-login');
            return;
        }

        const parsedSession = JSON.parse(session);
        setOwnerSession(parsedSession);
        loadDashboardData();
    }, [router]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading owner dashboard data...');

            // Load bookings
            const bookingsResponse = await fetch('/api/bookings');
            console.log('📊 Bookings response status:', bookingsResponse.status);

            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                console.log('📊 Bookings data received:', bookingsData);
                console.log('📊 Number of bookings:', bookingsData.bookings?.length || 0);
                console.log('📊 First booking sample:', bookingsData.bookings?.[0]);

                setBookings(bookingsData.bookings || []);
                calculateStats(bookingsData.bookings || []);
            } else {
                console.error('❌ Failed to load bookings:', bookingsResponse.statusText);
            }

            // Load barbers
            const barbersResponse = await fetch('/api/admin?action=barbers');
            console.log('✂️ Barbers response status:', barbersResponse.status);

            if (barbersResponse.ok) {
                const barbersData = await barbersResponse.json();
                console.log('✂️ Barbers data received:', barbersData);
                console.log('✂️ Number of barbers:', barbersData.barbers?.length || 0);

                setBarbers(barbersData.barbers || []);
            } else {
                console.error('❌ Failed to load barbers:', barbersResponse.statusText);
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            console.log('✅ Dashboard data loading complete');
        }
    };

    const calculateStats = (bookingsData: Booking[]) => {
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const todayBookings = bookingsData.filter(b => b.date_key === today || b.date === today).length;
        const thisWeekBookings = bookingsData.filter(b => {
            const bookingDate = new Date(b.date_key || b.date || '');
            return bookingDate >= startOfWeek;
        });

        const thisWeekRevenue = thisWeekBookings.reduce((sum, booking) => {
            const price = parseInt(booking.price?.replace(/[^\d]/g, '') || '0');
            return sum + price;
        }, 0);

        setStats({
            totalBookings: bookingsData.length,
            pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
            acceptedBookings: bookingsData.filter(b => b.status === 'accepted' || b.status === 'confirmed').length,
            cancelledBookings: bookingsData.filter(b => b.status === 'cancelled').length,
            completedBookings: bookingsData.filter(b => b.status === 'completed').length,
            totalBarbers: barbers.length,
            activeBarbers: barbers.filter(b => b.isAvailable).length,
            todayBookings: todayBookings,
            thisWeekRevenue: thisWeekRevenue
        });
    };

    const updateBookingStatus = async (bookingId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingId: bookingId,
                    status: newStatus
                })
            });

            if (response.ok) {
                loadDashboardData();
            }
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    const deleteBooking = async (bookingId: string) => {
        if (!confirm('آیا از حذف این رزرو مطمئن هستید؟')) return;

        try {
            const response = await fetch('/api/bookings', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookingId })
            });

            if (response.ok) {
                loadDashboardData();
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
        }
    };

    const deleteBarber = async (barberId: string, barberName: string) => {
        if (!confirm(`آیا از حذف آرایشگر "${barberName}" مطمئن هستید؟`)) return;

        try {
            const response = await fetch('/api/admin?action=delete-barber', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ barberId })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    alert('آرایشگر با موفقیت حذف شد');
                    loadDashboardData();
                }
            }
        } catch (error) {
            console.error('Error deleting barber:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('ownerSession');
        router.push('/owner-login');
    };

    const formatPrice = (price: string) => {
        return price?.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' تومان';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
            case 'accepted':
            case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-400/30';
            case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30';
            case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'در انتظار';
            case 'accepted':
            case 'confirmed': return 'تایید شده';
            case 'cancelled': return 'لغو شده';
            case 'completed': return 'تکمیل شده';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">در حال بارگذاری داشبورد...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen p-4"
            dir="rtl"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="glass-card p-6 rounded-2xl mb-6 border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-400/30">
                                <span className="text-2xl">👑</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">داشبورد مدیر کل</h1>
                                <p className="text-white/60">خوش آمدید، {ownerSession?.user?.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500/20 border border-red-400/30 text-white rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            🚪 خروج
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="glass-card p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">کل رزروها</p>
                                <p className="text-white text-2xl font-bold">{stats.totalBookings}</p>
                            </div>
                            <span className="text-3xl">📅</span>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-green-500/10 to-green-600/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">رزروهای امروز</p>
                                <p className="text-white text-2xl font-bold">{stats.todayBookings}</p>
                            </div>
                            <span className="text-3xl">🗓️</span>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">کل آرایشگران</p>
                                <p className="text-white text-2xl font-bold">{stats.totalBarbers}</p>
                            </div>
                            <span className="text-3xl">✂️</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="glass-card p-2 rounded-2xl mb-6 border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { id: 'overview', label: '📊 نمای کلی', icon: '📊' },
                            { id: 'bookings', label: '📅 رزروها', icon: '📅' },
                            { id: 'barbers', label: '✂️ آرایشگران', icon: '✂️' },
                            { id: 'analytics', label: '📈 آمار و گزارش', icon: '📈' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white/20 text-white border border-white/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="glass-card p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">نمای کلی سیستم</h2>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-3">وضعیت رزروها</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-yellow-300">در انتظار:</span>
                                            <span className="text-white">{stats.pendingBookings}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-300">تایید شده:</span>
                                            <span className="text-white">{stats.acceptedBookings}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-300">تکمیل شده:</span>
                                            <span className="text-white">{stats.completedBookings}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-red-300">لغو شده:</span>
                                            <span className="text-white">{stats.cancelledBookings}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-3">آرایشگران فعال</h3>
                                    <div className="text-center">
                                        <div className="text-3xl text-green-400 font-bold">{stats.activeBarbers}</div>
                                        <div className="text-white/60 text-sm">از {stats.totalBarbers} آرایشگر</div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-3">عملکرد امروز</h3>
                                    <div className="text-center">
                                        <div className="text-3xl text-blue-400 font-bold">{stats.todayBookings}</div>
                                        <div className="text-white/60 text-sm">رزرو امروز</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button
                                    onClick={() => setActiveTab('bookings')}
                                    className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl hover:bg-blue-500/30 transition-colors"
                                >
                                    <div className="text-center">
                                        <span className="text-2xl block mb-2">📅</span>
                                        <span className="text-white text-sm">مدیریت رزروها</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('barbers')}
                                    className="p-4 bg-purple-500/20 border border-purple-400/30 rounded-xl hover:bg-purple-500/30 transition-colors"
                                >
                                    <div className="text-center">
                                        <span className="text-2xl block mb-2">✂️</span>
                                        <span className="text-white text-sm">مدیریت آرایشگران</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className="p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-xl hover:bg-yellow-500/30 transition-colors"
                                >
                                    <div className="text-center">
                                        <span className="text-2xl block mb-2">📈</span>
                                        <span className="text-white text-sm">گزارش و آمار</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-white">مدیریت رزروها</h2>
                                <button
                                    onClick={loadDashboardData}
                                    className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-white rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    🔄 بروزرسانی
                                </button>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`p-4 rounded-xl border transition-all ${statusFilter === 'all'
                                            ? 'bg-white/20 border-white/40 shadow-lg'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">📊</div>
                                        <div className="text-white font-semibold text-sm">همه</div>
                                        <div className="text-white text-xl font-bold">{stats.totalBookings}</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={`p-4 rounded-xl border transition-all ${statusFilter === 'pending'
                                            ? 'bg-yellow-500/20 border-yellow-400/40 shadow-lg'
                                            : 'bg-yellow-500/5 border-yellow-400/20 hover:bg-yellow-500/10'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">⏳</div>
                                        <div className="text-yellow-300 font-semibold text-sm">در انتظار</div>
                                        <div className="text-white text-xl font-bold">{stats.pendingBookings}</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('accepted')}
                                    className={`p-4 rounded-xl border transition-all ${statusFilter === 'accepted'
                                            ? 'bg-green-500/20 border-green-400/40 shadow-lg'
                                            : 'bg-green-500/5 border-green-400/20 hover:bg-green-500/10'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">✅</div>
                                        <div className="text-green-300 font-semibold text-sm">تایید شده</div>
                                        <div className="text-white text-xl font-bold">{stats.acceptedBookings}</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('completed')}
                                    className={`p-4 rounded-xl border transition-all ${statusFilter === 'completed'
                                            ? 'bg-blue-500/20 border-blue-400/40 shadow-lg'
                                            : 'bg-blue-500/5 border-blue-400/20 hover:bg-blue-500/10'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">🎉</div>
                                        <div className="text-blue-300 font-semibold text-sm">تکمیل شده</div>
                                        <div className="text-white text-xl font-bold">{stats.completedBookings}</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('cancelled')}
                                    className={`p-4 rounded-xl border transition-all ${statusFilter === 'cancelled'
                                            ? 'bg-red-500/20 border-red-400/40 shadow-lg'
                                            : 'bg-red-500/5 border-red-400/20 hover:bg-red-500/10'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">❌</div>
                                        <div className="text-red-300 font-semibold text-sm">لغو شده</div>
                                        <div className="text-white text-xl font-bold">{stats.cancelledBookings}</div>
                                    </div>
                                </button>
                            </div>

                            {bookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-6xl mb-4 block">📅</span>
                                    <p className="text-white/60 text-lg">هیچ رزروی یافت نشد</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings
                                        .filter(booking => statusFilter === 'all' || booking.status === statusFilter)
                                        .map((booking) => (
                                            <div key={booking._id || booking.id} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                                                {/* Header with Status */}
                                                <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                                                            <span className="text-lg">👤</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-bold text-lg">{booking.user_name || booking.customerName || 'نام نامشخص'}</h3>
                                                            <p className="text-white/60 text-sm">📞 {booking.user_phone || booking.customerPhone || 'شماره نامشخص'}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                                                        {getStatusText(booking.status)}
                                                    </span>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    {/* Barber Info */}
                                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-purple-400">✂️</span>
                                                            <p className="text-white/60 text-xs">آرایشگر</p>
                                                        </div>
                                                        <p className="text-white font-semibold">{booking.barber || booking.barberName || 'نامشخص'}</p>
                                                        <p className="text-white/50 text-xs">ID: {booking.barber_id || booking.barberId || 'N/A'}</p>
                                                    </div>

                                                    {/* Date & Time */}
                                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-blue-400">📅</span>
                                                            <p className="text-white/60 text-xs">تاریخ و زمان</p>
                                                        </div>
                                                        <p className="text-white font-semibold">{booking.persian_date || booking.date_key || booking.date || 'نامشخص'}</p>
                                                        <p className="text-blue-300 text-sm">⏰ {booking.start_time || booking.time || 'نامشخص'}</p>
                                                        {booking.end_time && (
                                                            <p className="text-blue-200 text-xs">تا {booking.end_time}</p>
                                                        )}
                                                        {booking.total_duration && (
                                                            <p className="text-white/50 text-xs mt-1">مدت: {booking.total_duration} دقیقه</p>
                                                        )}
                                                    </div>

                                                    {/* Service */}
                                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-green-400">💈</span>
                                                            <p className="text-white/60 text-xs">خدمات</p>
                                                        </div>
                                                        <p className="text-white font-semibold">
                                                            {booking.services ?
                                                                (Array.isArray(booking.services) ? booking.services.join('، ') : booking.services)
                                                                : (booking.service || 'نامشخص')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Notes Section */}
                                                {booking.notes && (
                                                    <div className="mb-4 bg-yellow-500/5 rounded-lg p-3 border border-yellow-400/20">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-yellow-400">📝</span>
                                                            <p className="text-white/60 text-xs">یادداشت</p>
                                                        </div>
                                                        <p className="text-white text-sm">{booking.notes}</p>
                                                    </div>
                                                )}

                                                {/* Created Date */}
                                                {booking.created_at && (
                                                    <div className="mb-4 text-white/50 text-xs">
                                                        <span>📌 ثبت شده در: {new Date(booking.created_at).toLocaleString('fa-IR')}</span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateBookingStatus(booking._id || booking.id!, 'accepted')}
                                                                className="flex-1 min-w-[120px] px-4 py-2 bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-semibold rounded-lg hover:bg-green-500/30 transition-all"
                                                            >
                                                                ✅ تایید رزرو
                                                            </button>
                                                            <button
                                                                onClick={() => updateBookingStatus(booking._id || booking.id!, 'cancelled')}
                                                                className="flex-1 min-w-[120px] px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-semibold rounded-lg hover:bg-red-500/30 transition-all"
                                                            >
                                                                ❌ لغو رزرو
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'accepted' && (
                                                        <button
                                                            onClick={() => updateBookingStatus(booking._id || booking.id!, 'completed')}
                                                            className="flex-1 min-w-[120px] px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-semibold rounded-lg hover:bg-blue-500/30 transition-all"
                                                        >
                                                            🎉 تکمیل رزرو
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteBooking(booking._id || booking.id!)}
                                                        className="px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-semibold rounded-lg hover:bg-red-500/30 transition-all"
                                                    >
                                                        🗑️ حذف
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                    {/* Show count of filtered results */}
                                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                                        <p className="text-white/80">
                                            نمایش {bookings.filter(b => statusFilter === 'all' || b.status === statusFilter).length} رزرو
                                            {statusFilter !== 'all' && ` (${getStatusText(statusFilter)})`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'barbers' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">مدیریت آرایشگران</h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={loadDashboardData}
                                        className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-white rounded-lg hover:bg-blue-500/30 transition-colors"
                                    >
                                        🔄 بروزرسانی
                                    </button>
                                </div>
                            </div>

                            {barbers.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-6xl mb-4 block">✂️</span>
                                    <p className="text-white/60 text-lg">هیچ آرایشگری یافت نشد</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {barbers.map((barber) => (
                                        <div key={barber._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-white font-semibold text-lg">{barber.name}</h3>
                                                    <p className="text-white/60 text-sm">@{barber.username}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${barber.isAvailable ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                    {barber.isAvailable ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => router.push(`/barber-dashboard/${barber.username}`)}
                                                    className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-400/30 text-white text-sm rounded-lg hover:bg-blue-500/30 transition-colors"
                                                >
                                                    📊 داشبورد
                                                </button>
                                                <button
                                                    onClick={() => deleteBarber(barber._id!, barber.name)}
                                                    className="px-3 py-2 bg-red-500/20 border border-red-400/30 text-white text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">آمار و گزارش</h2>

                            {/* Booking Status Distribution */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10 max-w-2xl mx-auto">
                                <h3 className="text-white font-semibold mb-6 text-center text-lg">توزیع وضعیت رزروها</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">⏳</span>
                                            <span className="text-white/80">در انتظار</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 bg-white/10 rounded-full h-3">
                                                <div
                                                    className="bg-yellow-400 h-3 rounded-full transition-all"
                                                    style={{ width: `${stats.totalBookings ? (stats.pendingBookings / stats.totalBookings) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white text-lg font-bold min-w-[3rem] text-right">{stats.pendingBookings}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">✅</span>
                                            <span className="text-white/80">تایید شده</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 bg-white/10 rounded-full h-3">
                                                <div
                                                    className="bg-green-400 h-3 rounded-full transition-all"
                                                    style={{ width: `${stats.totalBookings ? (stats.acceptedBookings / stats.totalBookings) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white text-lg font-bold min-w-[3rem] text-right">{stats.acceptedBookings}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🎉</span>
                                            <span className="text-white/80">تکمیل شده</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 bg-white/10 rounded-full h-3">
                                                <div
                                                    className="bg-blue-400 h-3 rounded-full transition-all"
                                                    style={{ width: `${stats.totalBookings ? (stats.completedBookings / stats.totalBookings) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white text-lg font-bold min-w-[3rem] text-right">{stats.completedBookings}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">❌</span>
                                            <span className="text-white/80">لغو شده</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 bg-white/10 rounded-full h-3">
                                                <div
                                                    className="bg-red-400 h-3 rounded-full transition-all"
                                                    style={{ width: `${stats.totalBookings ? (stats.cancelledBookings / stats.totalBookings) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white text-lg font-bold min-w-[3rem] text-right">{stats.cancelledBookings}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Summary */}
                                <div className="mt-6 pt-6 border-t border-white/20 text-center">
                                    <p className="text-white/60 text-sm mb-2">مجموع کل رزروها</p>
                                    <p className="text-white text-3xl font-bold">{stats.totalBookings}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}