'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BarberPWAInstall from '@/components/BarberPWAInstall';
import { persianToEnglish } from '../../../lib/numberUtils';

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
    const [barberSession, setBarberSession] = useState<any>(null);
    const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
    const [lastBookingCount, setLastBookingCount] = useState<number>(0);
    const [showNewBookingAlert, setShowNewBookingAlert] = useState(false);

    // Register service worker and set up push notifications
    useEffect(() => {
        const registerServiceWorker = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    console.log('🔧 Registering barber service worker...');
                    const registration = await navigator.serviceWorker.register('/barber-sw.js');
                    console.log('✅ Barber Service Worker registered:', registration);
                    
                    // Request notification permission
                    if (Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        console.log('🔔 Notification permission:', permission);
                    }
                    
                    // Subscribe to push notifications if granted
                    if (Notification.permission === 'granted') {
                        try {
                            // For now, we'll use a simple subscription without VAPID keys
                            // In production, you should generate and use VAPID keys
                            const subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: null // Would use VAPID key in production
                            }).catch(() => {
                                console.log('⚠️ Push subscription not available (needs VAPID keys)');
                                return null;
                            });
                            
                            if (subscription) {
                                // Send subscription to server
                                const response = await fetch('/api/barber/subscribe', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        barberId: decodeURIComponent(barberId),
                                        subscription
                                    })
                                });
                                
                                if (response.ok) {
                                    console.log('✅ Push notification subscription registered');
                                } else {
                                    console.log('⚠️ Failed to register push subscription on server');
                                }
                            }
                        } catch (subError) {
                            console.log('⚠️ Push subscription error:', subError);
                        }
                    }
                    
                    // Listen for messages from service worker
                    navigator.serviceWorker.addEventListener('message', (event) => {
                        console.log('💬 Message from service worker:', event.data);
                        if (event.data.type === 'REFRESH_BOOKINGS_REQUEST') {
                            fetchBarberBookings();
                        }
                    });
                    
                } catch (error) {
                    console.error('❌ Service Worker registration failed:', error);
                }
            } else {
                console.log('⚠️ Service Worker or Push Manager not supported');
            }
        };
        
        registerServiceWorker();
    }, [barberId]);

    useEffect(() => {
        // Check if this is a PWA launch (has pwa=1 parameter)
        const urlParams = new URLSearchParams(window.location.search);
        const isPWA = urlParams.get('pwa') === '1';
        const isAuto = urlParams.get('auto') === '1';
        
        if (isPWA) {
            console.log('🔧 PWA launch detected for barber:', barberId);
            console.log('📱 This is a PWA app opening for specific barber dashboard');
        }
        
        if (isAuto) {
            console.log('🔧 Auto-login PWA detected for barber:', barberId);
        }

        // Check if user is authenticated barber
        const session = localStorage.getItem('barberSession');
        if (!session) {
            if (isPWA || isAuto) {
                // For PWA launch, create auto-session for this barber
                console.log('🔧 Creating auto-session for PWA barber:', barberId);
                const autoSession = {
                    user: {
                        name: decodeURIComponent(barberId),
                        type: 'barber'
                    },
                    loginTime: new Date().toISOString(),
                    pwa: true,
                    auto: isPWA || isAuto
                };
                localStorage.setItem('barberSession', JSON.stringify(autoSession));
                setBarberSession(autoSession);
                console.log('✅ Auto-session created, continuing to dashboard');
                // Continue to dashboard without redirect
            } else {
                // For regular web access, require login
                router.push('/barber-login');
                return;
            }
        } else {
            // Parse existing session
            const parsedSession = JSON.parse(session);
            const decodedBarberId = decodeURIComponent(barberId);
            
            // For PWA or auto-login mode, always allow access to this barber's dashboard
            if (isPWA || isAuto || parsedSession.pwa || parsedSession.auto) {
                // Check if barberId matches either username or name
                const matchesUsername = parsedSession.user.username === decodedBarberId;
                const matchesName = parsedSession.user.name === decodedBarberId;
                
                if (!matchesUsername && !matchesName) {
                    console.log('🔧 PWA: Updating session to match dashboard barber:', decodedBarberId);
                    const updatedSession = {
                        user: {
                            name: decodedBarberId,
                            username: decodedBarberId,
                            type: 'barber'
                        },
                        loginTime: new Date().toISOString(),
                        pwa: true,
                        auto: true
                    };
                    localStorage.setItem('barberSession', JSON.stringify(updatedSession));
                    setBarberSession(updatedSession);
                } else {
                    setBarberSession(parsedSession);
                }
            } else {
                // For regular web access, enforce strict authentication
                setBarberSession(parsedSession);
                
                if (parsedSession.user.type !== 'barber') {
                    router.push('/barber-login');
                    return;
                }

                // Check if barber is accessing their own dashboard (match by username OR name)
                const matchesUsername = parsedSession.user.username === decodedBarberId;
                const matchesName = parsedSession.user.name === decodedBarberId;
                
                if (!matchesUsername && !matchesName) {
                    // Redirect using username if available, otherwise name
                    const redirectId = parsedSession.user.username || parsedSession.user.name;
                    router.push(`/barber-dashboard/${redirectId}`);
                    return;
                }
            }
        }
        if (barberId) {
            fetchBarberBookings();
            
            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
            
            // Poll for new bookings every 30 seconds
            const pollInterval = setInterval(() => {
                fetchBarberBookings();
            }, 30000);
            
            return () => clearInterval(pollInterval);
        }
    }, [barberId, router]);

    const fetchBarberBookings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/barber/${encodeURIComponent(barberId)}`);
            const data = await response.json();

            if (response.ok) {
                // Check if there are new bookings
                const newBookingCount = data.total_bookings || 0;
                if (lastBookingCount > 0 && newBookingCount > lastBookingCount) {
                    // New booking detected!
                    const newBookings = (data.bookings || []).slice(0, newBookingCount - lastBookingCount);
                    
                    // Show browser notification with sound
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const latestBooking = newBookings[0];
                        const notification = new Notification('🎉 رزرو جدید!', {
                            body: `مشتری: ${latestBooking.user_name}\nخدمات: ${latestBooking.services.join(', ')}\nساعت: ${latestBooking.start_time}`,
                            icon: '/icon-192x192.png',
                            badge: '/icon-192x192.png',
                            tag: 'new-booking',
                            requireInteraction: true,
                            silent: false // Ensure sound plays
                        });
                        
                        // Play notification sound
                        try {
                            // Create a more noticeable notification sound
                            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                            
                            // Play a sequence of beeps for better attention
                            const playBeep = (frequency: number, duration: number, delay: number) => {
                                setTimeout(() => {
                                    const oscillator = audioContext.createOscillator();
                                    const gainNode = audioContext.createGain();
                                    
                                    oscillator.connect(gainNode);
                                    gainNode.connect(audioContext.destination);
                                    
                                    oscillator.frequency.value = frequency;
                                    oscillator.type = 'sine';
                                    
                                    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                                    
                                    oscillator.start(audioContext.currentTime);
                                    oscillator.stop(audioContext.currentTime + duration);
                                }, delay);
                            };
                            
                            // Play 3 beeps: high, low, high
                            playBeep(1000, 0.2, 0);    // High beep
                            playBeep(600, 0.2, 300);   // Low beep  
                            playBeep(1000, 0.2, 600);  // High beep
                            
                            // Show visual alert on page
                            setShowNewBookingAlert(true);
                            setTimeout(() => setShowNewBookingAlert(false), 5000);
                            
                        } catch (err) {
                            console.log('Could not play notification sound:', err);
                        }
                    } else {
                        // If notifications not allowed, still try to play sound
                        try {
                            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const oscillator = audioContext.createOscillator();
                            const gainNode = audioContext.createGain();
                            
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContext.destination);
                            
                            oscillator.frequency.value = 1000;
                            oscillator.type = 'sine';
                            
                            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                            
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.3);
                        } catch (err) {
                            console.log('Could not play notification sound:', err);
                        }
                    }
                }
                
                setLastBookingCount(newBookingCount);
                setBarberData(data);
                console.log('✅ Fetched barber data from file database:', data);
                setError('');
            } else {
                setError(data.error || 'خطا در دریافت اطلاعات');
            }
        } catch (err) {
            console.error('❌ API error:', err);
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

    const toggleBookingExpansion = (bookingId: string) => {
        setExpandedBookings(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookingId)) {
                newSet.delete(bookingId);
            } else {
                newSet.add(bookingId);
            }
            return newSet;
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('barberSession');
        router.push('/barber-login');
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="px-3 py-1 text-xs bg-green-400/20 text-green-700 rounded-full border border-green-400/30 backdrop-blur-sm">✅ تأیید شده</span>;
            case 'cancelled':
                return <span className="px-3 py-1 text-xs bg-red-400/20 text-red-700 rounded-full border border-red-400/30 backdrop-blur-sm">❌ لغو شده</span>;
            case 'completed':
                return <span className="px-3 py-1 text-xs bg-white/20 text-white rounded-full border border-white/30 backdrop-blur-sm">🎉 تکمیل شده</span>;
            default:
                return <span className="px-3 py-1 text-xs bg-yellow-400/20 text-yellow-700 rounded-full border border-yellow-400/30 backdrop-blur-sm">⏳ در انتظار</span>;
        }
    };

    const formatDate = (dateKey: string) => {
        const date = new Date(dateKey);
        // Convert Persian numerals to English numerals
        return persianToEnglish(date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }));
    };

    const formatTime = (time: string) => {
        return time.replace(':', ':');
    };

    const filteredBookings = barberData?.bookings.filter(booking => {
        const matchesDate = !selectedDate || booking.date_key === selectedDate;
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesDate && matchesStatus;
    }).sort((a, b) => {
        // Sort by creation time (newest first), then by booking date (newest first), then by start time (latest first)
        const aCreated = new Date(a.created_at).getTime();
        const bCreated = new Date(b.created_at).getTime();
        if (bCreated !== aCreated) return bCreated - aCreated;
        
        if (b.date_key !== a.date_key) return b.date_key.localeCompare(a.date_key);
        
        return b.start_time.localeCompare(a.start_time);
    }) || [];

    const getUniquesDates = () => {
        if (!barberData) return [];
        const dates = [...new Set(barberData.bookings.map(b => b.date_key))];
        return dates.sort();
    };

    if (!barberSession) {
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
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-300/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 px-4">
                {/* New Booking Alert */}
                {showNewBookingAlert && (
                    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-pulse">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🎉</span>
                            <div>
                                <p className="font-bold">رزرو جدید!</p>
                                <p className="text-sm">لطفاً صفحه را تازه‌سازی کنید</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="glass-card p-4 sm:p-6 mb-6 floating">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-glass mb-2 flex items-center">
                                ✂️ داشبورد آرایشگر: {barberSession?.user?.name || decodeURIComponent(barberId)}
                            </h1>
                            <p className="text-glass-secondary text-sm sm:text-base">
                                تعداد کل رزروها: {barberData?.total_bookings || 0}
                            </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-center">
                            <BarberPWAInstall 
                                barberName={barberSession?.user?.name || decodeURIComponent(barberId)} 
                                barberId={barberSession?.user?.username || decodeURIComponent(barberId)} 
                            />
                            <button
                                onClick={handleLogout}
                                className="glass-button glass-danger px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base flex-1 sm:flex-initial"
                            >
                                🚪 خروج
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
                    <div className="glass-card p-3 sm:p-4 text-center border-2 border-white/30">
                        <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-sm font-medium text-white/90 mb-1">کل رزروها</h3>
                        <p className="text-3xl font-bold text-white">{barberData?.total_bookings || 0}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-4 text-center border-2 border-green-400/40">
                        <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">📅</span>
                        </div>
                        <h3 className="text-sm font-medium text-white/90 mb-1">امروز</h3>
                        <p className="text-3xl font-bold text-green-400">
                            {filteredBookings.filter(b =>
                                b.date_key === new Date().toISOString().split('T')[0] && b.status !== 'cancelled'
                            ).length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 sm:p-6 mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-glass mb-4 flex items-center">
                        🔍 فیلترها
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                فیلتر بر اساس تاریخ
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                style={{ color: 'white' }}
                            >
                                <option value="" style={{ color: 'black' }}>همه تاریخ‌ها</option>
                                {getUniquesDates().map(date => (
                                    <option key={date} value={date} style={{ color: 'black' }}>
                                        {formatDate(date)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                فیلتر بر اساس وضعیت
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                style={{ color: 'white' }}
                            >
                                <option value="all" style={{ color: 'black' }}>همه وضعیت‌ها</option>
                                <option value="confirmed" style={{ color: 'black' }}>تأیید شده</option>
                                <option value="cancelled" style={{ color: 'black' }}>لغو شده</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="glass-card">
                    <div className="p-4 sm:p-6 border-b border-white/10">
                        <h2 className="text-lg sm:text-xl font-bold text-glass flex items-center">
                            📋 رزروهای من ({filteredBookings.length})
                        </h2>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl sm:text-2xl">📝</span>
                            </div>
                            <p className="text-glass-secondary text-sm sm:text-base">هیچ رزروی یافت نشد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredBookings.map((booking, index) => {
                                // Create unique ID for each booking
                                const bookingUniqueId = booking.id || `${booking.user_phone}-${booking.date_key}-${booking.start_time}-${index}`;
                                const isExpanded = expandedBookings.has(bookingUniqueId);
                                return (
                                    <div key={bookingUniqueId} className="p-3 sm:p-4 hover:bg-white/5 transition-colors">
                                        {/* Summary View (Always Visible) */}
                                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                                    <div>
                                                        <p className="text-glass font-medium">👤 {booking.user_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-glass">📅 {formatDate(booking.date_key)}</p>
                                                        <p className="text-glass text-sm">🕐 {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-glass">🛠️ {booking.services.join(', ')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="ml-4 flex items-center space-x-3 space-x-reverse">
                                                {getStatusBadge(booking.status)}
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleBookingExpansion(bookingUniqueId);
                                                    }}
                                                    className="px-3 py-1 glass-button text-sm"
                                                >
                                                    {isExpanded ? '📄 خلاصه' : '📋 جزئیات'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded View (Conditional) */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
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
                                                    <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
                                                        <h4 className="font-semibold text-glass flex items-center mb-2">
                                                            📝 یادداشت:
                                                        </h4>
                                                        <p className="text-glass-secondary text-sm">{booking.notes}</p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="mt-4 flex space-x-2 space-x-reverse">
                                                    {(!booking.status || booking.status === 'pending') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateBookingStatus(booking.id, 'confirmed');
                                                            }}
                                                            className="px-4 py-2 glass-button glass-success text-sm"
                                                        >
                                                            ✅ تأیید
                                                        </button>
                                                    )}

                                                    {booking.status === 'confirmed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateBookingStatus(booking.id, 'completed');
                                                            }}
                                                            className="px-4 py-2 glass-button text-sm"
                                                        >
                                                            🎉 تکمیل
                                                        </button>
                                                    )}

                                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
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
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
