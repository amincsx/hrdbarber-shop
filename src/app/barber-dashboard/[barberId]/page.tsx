'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BarberPWAInstall from '@/components/BarberPWAInstall';
import { persianToEnglish } from '../../../lib/numberUtils';

// Helper function to convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Android-safe notification helper function
async function showNotificationSafe(booking: any) {
    console.log('🔔 Showing Android-safe notification for booking:', booking);
    
    if (!booking) return false;

    try {
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('🎉 رزرو جدید!', {
                body: `مشتری: ${booking.user_name}\nخدمات: ${booking.services.join(', ')}\nساعت: ${booking.start_time}`,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'new-booking',
                requireInteraction: true,
                silent: false
            });

            // Android-safe audio notification
            try {
                if ('AudioContext' in window || 'webkitAudioContext' in window) {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    const audioContext = new AudioContext();
                    
                    // Resume context if suspended (required on mobile)
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }

                    // Simple reliable beep for Android
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                    
                    console.log('🔊 Audio notification played (Android safe)');
                }
            } catch (audioError) {
                console.warn('⚠️ Audio notification failed (Android safe):', audioError);
            }

            return true;
        }
    } catch (notificationError) {
        console.error('❌ Notification failed:', notificationError);
        throw notificationError;
    }
    
    return false;
}

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
    const [selectedDate, setSelectedDate] = useState(() => {
        // Default to today's date in YYYY-MM-DD format
        return new Date().toISOString().split('T')[0];
    });
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
                    // Detect if we're on Android for enhanced service worker
                    const isAndroid = /Android/i.test(navigator.userAgent);
                    const swPath = isAndroid ? '/barber-sw-android.js' : '/barber-sw.js';
                    
                    console.log(`� Registering service worker: ${swPath} (Android: ${isAndroid})`);
                    
                    // Register service worker
                    const registration = await navigator.serviceWorker.register(swPath);
                    console.log('✅ Service Worker registered:', registration);

                    // Request notification permission
                    if (Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        console.log('🔔 Notification permission:', permission);
                    }

                    // Subscribe to push notifications if granted
                    if (Notification.permission === 'granted') {
                        try {
                            // Use VAPID public key if provided
                            // Fetch VAPID public key from server (works in PWA too)
                            let vapidPublicKey: string | null = null;
                            try {
                                const keyRes = await fetch('/api/push/public-key', { cache: 'no-store' });
                                const keyJson = await keyRes.json();
                                vapidPublicKey = keyJson.publicKey || null;
                            } catch { }
                            const applicationServerKey = vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : null;

                            const subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey
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
                                    const txt = await response.text().catch(() => '');
                                    console.log('⚠️ Failed to register push subscription on server', response.status, txt);
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
            console.log('🔄 Fetching bookings for barberId:', barberId);

            // Add timestamp to bypass cache
            const timestamp = Date.now();
            const url = `/api/barber/${encodeURIComponent(barberId)}?t=${timestamp}`;
            console.log('🔄 Request URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            const data = await response.json();
            console.log('📦 Response data:', data);
            console.log('📦 Total bookings:', data.total_bookings);
            console.log('📦 Bookings array length:', data.bookings?.length);

            if (response.ok) {
                // Check if there are new bookings
                const newBookingCount = data.total_bookings || 0;
                console.log('📊 Previous count:', lastBookingCount, '→ New count:', newBookingCount);

                if (lastBookingCount > 0 && newBookingCount > lastBookingCount) {
                    console.log('🔔 New booking detected! Count:', lastBookingCount, '→', newBookingCount);
                    // New booking detected!
                    const newBookings = (data.bookings || []).slice(0, newBookingCount - lastBookingCount);

                    // Use Android-safe notification function
                    try {
                        await showNotificationSafe(newBookings[0]);
                        console.log('✅ Notification sent successfully');
                    } catch (notifError) {
                        console.warn('⚠️ Notification failed (Android safe):', notifError);
                    }

                    // Always show visual alert regardless of notification success
                    setShowNewBookingAlert(true);
                    setTimeout(() => setShowNewBookingAlert(false), 5000);
                }

                setLastBookingCount(newBookingCount);
                setBarberData(data);
                console.log('✅ Barber data set successfully');
                console.log('✅ Bookings in state:', data.bookings?.length);

                // Log booking statuses
                if (data.bookings && data.bookings.length > 0) {
                    console.log('📊 Booking statuses:', data.bookings.map(b => ({
                        id: b.id,
                        user: b.user_name,
                        status: b.status
                    })));
                }

                setError('');
            } else {
                console.error('❌ API returned error:', data.error);
                setError(data.error || 'خطا در دریافت اطلاعات');
            }
        } catch (err) {
            console.error('❌ API error:', err);
            console.error('❌ Error details:', err.message);
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
            console.log('✅ Loading complete');
        }
    };

    const updateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
        try {
            console.log('🔄 Updating booking:', { bookingId, status, notes });

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

            console.log('📡 Update response status:', response.status);
            const result = await response.json();
            console.log('📡 Update response data:', result);

            if (response.ok) {
                console.log('✅ Status updated successfully, refreshing bookings...');

                // Force a delay to ensure database is updated
                await new Promise(resolve => setTimeout(resolve, 500));

                await fetchBarberBookings();

                console.log('✅ Bookings refreshed after status update');
                alert('وضعیت رزرو با موفقیت به‌روزرسانی شد');
            } else {
                console.error('❌ Update failed:', result.error);
                alert(result.error || 'خطا در به‌روزرسانی');
            }
        } catch (err) {
            console.error('❌ Update error:', err);
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

    const filteredBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        console.log('🔍 Filtering bookings:', {
            total: rawBookings.length,
            selectedDate: selectedDate,
            statusFilter: statusFilter
        });

        const filtered = rawBookings.filter(booking => {
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
        });

        console.log('🔍 After filtering:', filtered.length, 'bookings');
        if (filtered.length > 0) {
            console.log('🔍 Sample filtered booking:', {
                user: filtered[0].user_name,
                date: filtered[0].date_key,
                time: filtered[0].start_time,
                status: filtered[0].status
            });
            console.log('🔍 Full booking object:', filtered[0]);
        }

        return filtered;
    })();

    const getUniquesDates = () => {
        if (!barberData || !barberData.bookings) return [];
        const dates = [...new Set(barberData.bookings.map(b => b.date_key))];
        return dates.sort();
    };

    // Helper function to get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Helper function to get tomorrow's date in YYYY-MM-DD format
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Helper function to get yesterday's date in YYYY-MM-DD format
    const getYesterdayDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };

    // Helper function to get current month's start and end dates
    const getCurrentMonthRange = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        return { start: startOfMonth, end: endOfMonth };
    };

    // Get today's bookings
    const todaysBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        const today = getTodayDate();
        
        return rawBookings
            .filter(booking => booking.date_key === today && booking.status !== 'cancelled')
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    })();

    // Get this month's bookings (excluding today)
    const thisMonthBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        const today = getTodayDate();
        const { start, end } = getCurrentMonthRange();
        
        return rawBookings
            .filter(booking => 
                booking.date_key >= start && 
                booking.date_key <= end && 
                booking.date_key !== today &&
                booking.status !== 'cancelled'
            )
            .sort((a, b) => {
                if (a.date_key !== b.date_key) return b.date_key.localeCompare(a.date_key);
                return a.start_time.localeCompare(b.start_time);
            });
    })();

    // Get all bookings for the comprehensive view (with filters)
    const allBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        
        const filtered = rawBookings.filter(booking => {
            const matchesDate = !selectedDate || booking.date_key === selectedDate;
            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
            return matchesDate && matchesStatus;
        }).sort((a, b) => {
            const aCreated = new Date(a.created_at).getTime();
            const bCreated = new Date(b.created_at).getTime();
            if (bCreated !== aCreated) return bCreated - aCreated;

            if (b.date_key !== a.date_key) return b.date_key.localeCompare(a.date_key);
            return b.start_time.localeCompare(a.start_time);
        });

        return filtered;
    })();

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
                        <div className="flex gap-2 w-full sm:w-auto items-center flex-wrap">
                            <button
                                onClick={() => {
                                    fetchBarberBookings();
                                    alert('داده‌ها تازه‌سازی شد');
                                }}
                                className="glass-button px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base flex-1 sm:flex-initial"
                            >
                                🔄 تازه‌سازی
                            </button>
                            <button
                                onClick={() => alert('تغییر رمز عبور در نسخه بعدی فعال خواهد شد')}
                                className="glass-button px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base flex-1 sm:flex-initial opacity-50 cursor-not-allowed"
                            >
                                🔒 تغییر رمز
                            </button>
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
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
                    <div className="glass-card p-3 sm:p-4 text-center border-2 border-blue-400/40">
                        <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">�</span>
                        </div>
                        <h3 className="text-sm font-medium text-white/90 mb-1">امروز</h3>
                        <p className="text-3xl font-bold text-blue-400">{todaysBookings.length}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-4 text-center border-2 border-green-400/40">
                        <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">�</span>
                        </div>
                        <h3 className="text-sm font-medium text-white/90 mb-1">این ماه</h3>
                        <p className="text-3xl font-bold text-green-400">{thisMonthBookings.length + todaysBookings.length}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-4 text-center border-2 border-white/30">
                        <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-sm font-medium text-white/90 mb-1">کل رزروها</h3>
                        <p className="text-3xl font-bold text-white">{barberData?.total_bookings || 0}</p>
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
                                <option value={getTodayDate()} style={{ color: 'black' }}>
                                    📅 امروز - {formatDate(getTodayDate())}
                                </option>
                                {getUniquesDates()
                                    .filter(date => date !== getTodayDate())
                                    .map(date => (
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
                    
                    {/* Quick Filter Buttons */}
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="text-sm font-medium text-white mb-3">🔗 فیلترهای سریع</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedDate(getTodayDate())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedDate === getTodayDate()
                                        ? 'bg-blue-500/30 text-white border-2 border-blue-400'
                                        : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                }`}
                            >
                                📅 امروز
                            </button>
                            <button
                                onClick={() => setSelectedDate(getTomorrowDate())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedDate === getTomorrowDate()
                                        ? 'bg-green-500/30 text-white border-2 border-green-400'
                                        : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                }`}
                            >
                                ➡️ فردا
                            </button>
                            <button
                                onClick={() => setSelectedDate('')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedDate === ''
                                        ? 'bg-purple-500/30 text-white border-2 border-purple-400'
                                        : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                }`}
                            >
                                📊 همه روزها
                            </button>
                            <button
                                onClick={() => setSelectedDate(getYesterdayDate())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedDate === getYesterdayDate()
                                        ? 'bg-orange-500/30 text-white border-2 border-orange-400'
                                        : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                }`}
                            >
                                ⬅️ دیروز
                            </button>
                        </div>
                    </div>
                </div>

                {/* Today's Bookings - Main Priority */}
                <div className="glass-card mb-6">
                    <div className="p-4 sm:p-6 border-b border-white/10">
                        <h2 className="text-lg sm:text-xl font-bold text-blue-400 flex items-center">
                            📅 رزروهای امروز ({todaysBookings.length})
                        </h2>
                        <p className="text-sm text-white/70 mt-1">
                            {formatDate(getTodayDate())}
                        </p>
                    </div>

                    {todaysBookings.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl sm:text-2xl">📅</span>
                            </div>
                            <p className="text-blue-300 text-sm sm:text-base">امروز هیچ رزروی ندارید</p>
                            <p className="text-white/60 text-xs mt-1">می‌توانید استراحت کنید! 😊</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {todaysBookings.map((booking, index) => {
                                const bookingUniqueId = booking.id || `today-${booking.user_phone}-${booking.start_time}-${index}`;
                                const isExpanded = expandedBookings.has(bookingUniqueId);
                                return (
                                    <div key={bookingUniqueId} className="p-3 sm:p-4 hover:bg-blue-500/5 transition-colors border-l-4 border-blue-400/50">
                                        {/* Summary View */}
                                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                                    <div>
                                                        <p className="text-white font-medium">👤 {booking.user_name}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-white/70">📞 تلفن:</span>
                                                            <p className="text-white font-mono">{booking.user_phone}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">⏰ ساعت:</span>
                                                            <p className="text-blue-300 font-bold">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/70">✂️ خدمات:</span>
                                                        <p className="text-white">{booking.services.join('، ')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                                {getStatusBadge(booking.status)}
                                                <button
                                                    onClick={() => {
                                                        const newSet = new Set(expandedBookings);
                                                        if (isExpanded) {
                                                            newSet.delete(bookingUniqueId);
                                                        } else {
                                                            newSet.add(bookingUniqueId);
                                                        }
                                                        setExpandedBookings(newSet);
                                                    }}
                                                    className="glass-button px-3 py-2 text-xs"
                                                >
                                                    {isExpanded ? '🔼 کمتر' : '🔽 بیشتر'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 rounded-lg p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <span className="text-white/70 text-sm">🕒 مدت زمان:</span>
                                                        <p className="text-white">{booking.total_duration} دقیقه</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/70 text-sm">📅 تاریخ رزرو:</span>
                                                        <p className="text-white">{formatDate(booking.date_key)}</p>
                                                    </div>
                                                </div>
                                                {booking.notes && (
                                                    <div className="mb-4">
                                                        <span className="text-white/70 text-sm">📝 یادداشت:</span>
                                                        <p className="text-white bg-white/10 p-2 rounded mt-1">{booking.notes}</p>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => updateBookingStatus(bookingUniqueId, 'confirmed')}
                                                        className="glass-button bg-green-500/20 border-green-400/30 text-green-300 px-4 py-2 text-sm"
                                                    >
                                                        ✅ تأیید
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(bookingUniqueId, 'cancelled')}
                                                        className="glass-button bg-red-500/20 border-red-400/30 text-red-300 px-4 py-2 text-sm"
                                                    >
                                                        ❌ لغو
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(bookingUniqueId, 'completed')}
                                                        className="glass-button bg-blue-500/20 border-blue-400/30 text-blue-300 px-4 py-2 text-sm"
                                                    >
                                                        🎉 تکمیل
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* This Month's Bookings */}
                <div className="glass-card mb-6">
                    <div className="p-4 sm:p-6 border-b border-white/10">
                        <h2 className="text-lg sm:text-xl font-bold text-green-400 flex items-center">
                            📆 رزروهای این ماه ({thisMonthBookings.length})
                        </h2>
                        <p className="text-sm text-white/70 mt-1">
                            به غیر از امروز
                        </p>
                    </div>

                    {thisMonthBookings.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl sm:text-2xl">�</span>
                            </div>
                            <p className="text-green-300 text-sm sm:text-base">این ماه رزرو دیگری ندارید</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {thisMonthBookings.map((booking, index) => {
                                const bookingUniqueId = booking.id || `month-${booking.user_phone}-${booking.date_key}-${booking.start_time}-${index}`;
                                const isExpanded = expandedBookings.has(bookingUniqueId);
                                return (
                                    <div key={bookingUniqueId} className="p-3 sm:p-4 hover:bg-green-500/5 transition-colors">
                                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-white font-medium">👤 {booking.user_name}</p>
                                                        <span className="text-green-300 text-sm">📅 {formatDate(booking.date_key)}</span>
                                                    </div>
                                                    <div className="text-sm text-white/80">
                                                        ⏰ {formatTime(booking.start_time)} | ✂️ {booking.services.join('، ')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                                {getStatusBadge(booking.status)}
                                                <button
                                                    onClick={() => {
                                                        const newSet = new Set(expandedBookings);
                                                        if (isExpanded) {
                                                            newSet.delete(bookingUniqueId);
                                                        } else {
                                                            newSet.add(bookingUniqueId);
                                                        }
                                                        setExpandedBookings(newSet);
                                                    }}
                                                    className="glass-button px-3 py-2 text-xs"
                                                >
                                                    {isExpanded ? '🔼' : '🔽'}
                                                </button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 rounded-lg p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <span className="text-white/70 text-sm">📞 تلفن:</span>
                                                        <p className="text-white font-mono">{booking.user_phone}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/70 text-sm">🕒 مدت:</span>
                                                        <p className="text-white">{booking.total_duration} دقیقه</p>
                                                    </div>
                                                </div>
                                                {booking.notes && (
                                                    <div className="mb-4">
                                                        <span className="text-white/70 text-sm">📝 یادداشت:</span>
                                                        <p className="text-white bg-white/10 p-2 rounded mt-1">{booking.notes}</p>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => updateBookingStatus(bookingUniqueId, 'confirmed')}
                                                        className="glass-button bg-green-500/20 border-green-400/30 text-green-300 px-4 py-2 text-sm"
                                                    >
                                                        ✅ تأیید
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(bookingUniqueId, 'cancelled')}
                                                        className="glass-button bg-red-500/20 border-red-400/30 text-red-300 px-4 py-2 text-sm"
                                                    >
                                                        ❌ لغو
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(bookingUniqueId, 'completed')}
                                                        className="glass-button bg-blue-500/20 border-blue-400/30 text-blue-300 px-4 py-2 text-sm"
                                                    >
                                                        🎉 تکمیل
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* All Bookings - Comprehensive View with Filters */}
                <div className="glass-card">
                    <div className="p-4 sm:p-6 border-b border-white/10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center">
                                📋 همه رزروها ({allBookings.length})
                            </h2>
                            <div className="text-sm text-white/70">
                                {selectedDate ? (
                                    selectedDate === getTodayDate() ? (
                                        <span className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                                            📅 امروز - {formatDate(selectedDate)}
                                        </span>
                                    ) : (
                                        <span className="bg-white/10 px-3 py-1 rounded-full border border-white/30">
                                            📆 {formatDate(selectedDate)}
                                        </span>
                                    )
                                ) : (
                                    <span className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                                        📊 همه روزها
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {allBookings.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl sm:text-2xl">📝</span>
                            </div>
                            <p className="text-white/70 text-sm sm:text-base">هیچ رزروی یافت نشد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {allBookings.map((booking, index) => {
                                const bookingUniqueId = booking.id || `all-${booking.user_phone}-${booking.date_key}-${booking.start_time}-${index}`;
                                const isExpanded = expandedBookings.has(bookingUniqueId);
                                return (
                                    <div key={bookingUniqueId} className="p-3 sm:p-4 hover:bg-white/5 transition-colors">{/* Summary View (Always Visible) */}
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
