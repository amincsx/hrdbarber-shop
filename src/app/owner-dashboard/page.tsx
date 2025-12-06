'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
    _id?: string;
    id?: string;
    customerName: string;
    customerPhone: string;
    barberName: string;
    barberId: string;
    date: string;
    time: string;
    service: string;
    price: string;
    status: 'pending' | 'accepted' | 'cancelled' | 'completed';
    notes?: string;
    created_at?: string;
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

            // Load bookings
            const bookingsResponse = await fetch('/api/bookings');
            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                setBookings(bookingsData.bookings || []);
                calculateStats(bookingsData.bookings || []);
            }

            // Load barbers
            const barbersResponse = await fetch('/api/admin?action=barbers');
            if (barbersResponse.ok) {
                const barbersData = await barbersResponse.json();
                setBarbers(barbersData.barbers || []);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (bookingsData: Booking[]) => {
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const todayBookings = bookingsData.filter(b => b.date === today).length;
        const thisWeekBookings = bookingsData.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= startOfWeek;
        });

        const thisWeekRevenue = thisWeekBookings.reduce((sum, booking) => {
            const price = parseInt(booking.price?.replace(/[^\d]/g, '') || '0');
            return sum + price;
        }, 0);

        setStats({
            totalBookings: bookingsData.length,
            pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
            acceptedBookings: bookingsData.filter(b => b.status === 'accepted').length,
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
            case 'accepted': return 'bg-green-500/20 text-green-300 border-green-400/30';
            case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30';
            case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'در انتظار';
            case 'accepted': return 'تایید شده';
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                    <div className="glass-card p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">درآمد این هفته</p>
                                <p className="text-white text-xl font-bold">{formatPrice(stats.thisWeekRevenue.toString())}</p>
                            </div>
                            <span className="text-3xl">💰</span>
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
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">مدیریت رزروها</h2>
                                <button
                                    onClick={loadDashboardData}
                                    className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-white rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    🔄 بروزرسانی
                                </button>
                            </div>

                            {bookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-6xl mb-4 block">📅</span>
                                    <p className="text-white/60 text-lg">هیچ رزروی یافت نشد</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map((booking) => (
                                        <div key={booking._id || booking.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                                                <div>
                                                    <p className="text-white font-semibold">{booking.customerName}</p>
                                                    <p className="text-white/60 text-sm">{booking.customerPhone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-white">{booking.barberName}</p>
                                                    <p className="text-white/60 text-sm">آرایشگر</p>
                                                </div>
                                                <div>
                                                    <p className="text-white">{booking.date}</p>
                                                    <p className="text-white/60 text-sm">{booking.time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-white">{booking.service}</p>
                                                    <p className="text-green-400 text-sm">{formatPrice(booking.price)}</p>
                                                </div>
                                                <div>
                                                    <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(booking.status)}`}>
                                                        {getStatusText(booking.status)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateBookingStatus(booking._id || booking.id!, 'accepted')}
                                                                className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-white text-xs rounded hover:bg-green-500/30"
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                onClick={() => updateBookingStatus(booking._id || booking.id!, 'cancelled')}
                                                                className="px-3 py-1 bg-red-500/20 border border-red-400/30 text-white text-xs rounded hover:bg-red-500/30"
                                                            >
                                                                ❌
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'accepted' && (
                                                        <button
                                                            onClick={() => updateBookingStatus(booking._id || booking.id!, 'completed')}
                                                            className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-white text-xs rounded hover:bg-blue-500/30"
                                                        >
                                                            ✅ تکمیل
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteBooking(booking._id || booking.id!)}
                                                        className="px-3 py-1 bg-red-500/20 border border-red-400/30 text-white text-xs rounded hover:bg-red-500/30"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Revenue Chart Placeholder */}
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h3 className="text-white font-semibold mb-4">درآمد هفتگی</h3>
                                    <div className="text-center py-8">
                                        <span className="text-4xl block mb-4">📊</span>
                                        <p className="text-white text-2xl font-bold">{formatPrice(stats.thisWeekRevenue.toString())}</p>
                                        <p className="text-white/60 text-sm">درآمد این هفته</p>
                                    </div>
                                </div>

                                {/* Booking Status Distribution */}
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h3 className="text-white font-semibold mb-4">توزیع وضعیت رزروها</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/60">در انتظار</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-yellow-400 h-2 rounded-full"
                                                        style={{ width: `${stats.totalBookings ? (stats.pendingBookings / stats.totalBookings) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-white text-sm">{stats.pendingBookings}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/60">تایید شده</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-green-400 h-2 rounded-full"
                                                        style={{ width: `${stats.totalBookings ? (stats.acceptedBookings / stats.totalBookings) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-white text-sm">{stats.acceptedBookings}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/60">تکمیل شده</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-400 h-2 rounded-full"
                                                        style={{ width: `${stats.totalBookings ? (stats.completedBookings / stats.totalBookings) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-white text-sm">{stats.completedBookings}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/60">لغو شده</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-red-400 h-2 rounded-full"
                                                        style={{ width: `${stats.totalBookings ? (stats.cancelledBookings / stats.totalBookings) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-white text-sm">{stats.cancelledBookings}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}