'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BarberPWAInstall from '@/components/BarberPWAInstall';
import ActivityFeed from '@/components/ActivityFeed';
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
    const isAndroid = /Android/i.test(navigator.userAgent);
    console.log('🔔 Showing Android-safe notification for booking:', booking, 'Android:', isAndroid);

    if (!booking) return false;

    try {
        // Check if notifications are supported and permission is granted
        if ('Notification' in window) {
            console.log('🔔 Notification permission status:', Notification.permission);

            // Android-specific permission handling
            if (isAndroid && Notification.permission === 'default') {
                console.log('🔔 Android detected, requesting permission with user context');
            }

            // Request permission if not granted
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('🔔 Permission requested, result:', permission);
            }

            // Show notification if permission is granted
            if (Notification.permission === 'granted') {
                const notificationOptions = {
                    body: `مشتری: ${booking.user_name}\nخدمات: ${booking.services?.join(', ') || 'نامشخص'}\nساعت: ${booking.start_time}`,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    tag: isAndroid ? `booking-${Date.now()}` : 'new-booking', // Unique tag for Android
                    requireInteraction: true,
                    silent: false,
                    renotify: isAndroid, // Enable renotify for Android
                    timestamp: Date.now()
                };

                const notification = new Notification('🎉 رزرو جدید!', notificationOptions);

                // Android-specific event handlers
                notification.onclick = () => {
                    console.log('🔔 Android notification clicked');
                    window.focus();
                    notification.close();
                };

                notification.onerror = (error) => {
                    console.error('❌ Android notification error:', error);
                };

                // Auto-close notification with longer timeout for Android
                setTimeout(() => {
                    notification.close();
                }, isAndroid ? 15000 : 10000);

                console.log('✅ Browser notification created successfully');

                // Play sound notification
                try {
                    // Try to play system sound first
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWJ0fPNeSsFJHfH8N2QQAoUXrTp66hVFA==');
                    audio.volume = 0.3;
                    await audio.play();
                    console.log('✅ Audio notification played');
                } catch (audioError) {
                    console.warn('⚠️ Audio notification failed, trying Web Audio API:', audioError);

                    // Fallback to Web Audio API
                    try {
                        if ('AudioContext' in window || 'webkitAudioContext' in window) {
                            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                            const audioContext = new AudioContext();

                            // Resume context if suspended (required on mobile)
                            if (audioContext.state === 'suspended') {
                                await audioContext.resume();
                            }

                            // Create a beep sound
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

                            console.log('✅ Web Audio API notification played');
                        }
                    } catch (webAudioError) {
                        console.warn('⚠️ Web Audio API also failed:', webAudioError);
                    }
                }

                return true;
            } else {
                console.warn('⚠️ Notification permission denied or not available');
                return false;
            }
        } else {
            console.warn('⚠️ Notifications not supported in this browser');
            return false;
        }
    } catch (notificationError) {
        console.error('❌ Notification failed:', notificationError);
        return false;
    }
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
    const [selectedDate, setSelectedDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [barberSession, setBarberSession] = useState<any>(null);
    const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
    const [lastBookingCount, setLastBookingCount] = useState<number>(0);
    const [showNewBookingAlert, setShowNewBookingAlert] = useState(false);
    const [showFutureBookings, setShowFutureBookings] = useState(false); // Hidden by default
    const [showThisMonth, setShowThisMonth] = useState(false); // Hidden by default
    const [showAllBookings, setShowAllBookings] = useState(false); // Hidden by default
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [availability, setAvailability] = useState({
        workingHours: { start: 10, end: 21 },
        lunchBreak: { start: 14, end: 15 },
        offDays: [], // Full day off
        offHours: [], // Specific time slots off: [{ start: '13:00', end: '14:00', date: '2025-12-06' }]
        isAvailable: true
    });
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [headerCollapsed, setHeaderCollapsed] = useState(false);

    // Register service worker and set up push notifications
    useEffect(() => {
        const registerServiceWorker = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    // Detect if we're on Android for enhanced service worker
                    const isAndroid = /Android/i.test(navigator.userAgent);
                    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    const swPath = isAndroid ? '/barber-sw-android.js' : '/barber-sw.js';

                    // Get the correct URL for production
                    const baseUrl = window.location.origin;
                    const fullSwPath = `${baseUrl}${swPath}`;

                    console.log(`🔧 Registering service worker: ${swPath} (Android: ${isAndroid}, Mobile: ${isMobile})`);
                    console.log('🔧 Base URL:', baseUrl);
                    console.log('🔧 Full SW Path:', fullSwPath);
                    console.log('🔧 User agent:', navigator.userAgent);
                    console.log('🔧 Notification support:', 'Notification' in window);
                    console.log('🔧 PushManager support:', 'PushManager' in window);
                    console.log('🔧 Is HTTPS:', window.location.protocol === 'https:');

                    // Register service worker with scope for production
                    const registration = await navigator.serviceWorker.register(swPath, {
                        scope: '/'
                    });
                    console.log('✅ Service Worker registered:', registration);
                    console.log('✅ SW scope:', registration.scope);
                    console.log('✅ SW active:', !!registration.active);

                    // Android-specific notification permission handling
                    if (isAndroid) {
                        console.log('🔧 Android detected - using enhanced permission flow');
                    }

                    // Request notification permission with mobile-specific handling
                    if (Notification.permission === 'default') {
                        // For mobile devices, show user prompt first
                        if (isMobile) {
                            console.log('📱 Mobile device detected - requesting notification permission');
                        }

                        const permission = await Notification.requestPermission();
                        console.log('🔔 Notification permission:', permission);

                        if (isMobile) {
                            console.log('📱 Mobile permission result:', permission);
                            // Additional logging for mobile debugging
                            console.log('📱 Window location:', window.location.href);
                            console.log('📱 Is PWA:', window.matchMedia('(display-mode: standalone)').matches);
                        }
                    }

                    // Subscribe to push notifications if granted
                    if (Notification.permission === 'granted') {
                        try {
                            // Use VAPID public key if provided
                            // Fetch VAPID public key from server (works in PWA too)
                            let vapidPublicKey: string | null = null;
                            try {
                                const keyRes = await fetch('/api/push/public-key', {
                                    cache: 'no-store',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                    }
                                });

                                if (!keyRes.ok) {
                                    throw new Error(`VAPID key fetch failed: ${keyRes.status}`);
                                }

                                const keyJson = await keyRes.json();
                                vapidPublicKey = keyJson.publicKey || null;
                                console.log('🔑 VAPID public key fetched:', vapidPublicKey ? 'Yes' : 'No');
                            } catch (keyError) {
                                console.error('❌ VAPID key fetch error:', keyError);
                            }

                            if (!vapidPublicKey) {
                                console.warn('⚠️ No VAPID public key available - push notifications may not work in production');
                            }

                            const applicationServerKey = vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : null;

                            const subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey
                            }).catch((subscribeError) => {
                                console.error('❌ Push subscription failed:', subscribeError);
                                if (isMobile) {
                                    console.error('📱 Mobile subscription error details:', {
                                        name: subscribeError.name,
                                        message: subscribeError.message,
                                        hasVapid: !!applicationServerKey
                                    });
                                }
                                return null;
                            });

                            if (subscription) {
                                console.log('✅ Push subscription created:', {
                                    endpoint: subscription.endpoint,
                                    hasKeys: !!(subscription.keys && subscription.keys.p256dh)
                                });

                                // Send subscription to server with retry logic
                                try {
                                    const response = await fetch('/api/barber/subscribe', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            barberId: decodeURIComponent(barberId),
                                            subscription,
                                            userAgent: navigator.userAgent,
                                            isMobile,
                                            timestamp: new Date().toISOString()
                                        })
                                    });

                                    if (response.ok) {
                                        const result = await response.json();
                                        console.log('✅ Push notification subscription registered:', result);
                                    } else {
                                        const errorText = await response.text().catch(() => 'Unknown error');
                                        console.error('❌ Failed to register push subscription:', {
                                            status: response.status,
                                            error: errorText,
                                            url: response.url
                                        });
                                    }
                                } catch (networkError) {
                                    console.error('❌ Network error registering subscription:', networkError);
                                }
                            } else {
                                console.error('❌ Failed to create push subscription');
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

        // Check if user is authenticated barber OR owner
        const barberSession = localStorage.getItem('barberSession');
        const ownerSession = localStorage.getItem('ownerSession');

        if (!barberSession && !ownerSession) {
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
            // Check if owner is logged in - if so, allow full access to this barber dashboard
            if (ownerSession) {
                const parsedOwnerSession = JSON.parse(ownerSession);
                console.log('👑 Owner detected with full access to barber dashboard:', barberId);

                // Create a special session for owner viewing barber dashboard
                const ownerViewSession = {
                    user: {
                        name: decodeURIComponent(barberId),
                        username: decodeURIComponent(barberId),
                        type: 'barber',
                        viewingAsOwner: true,
                        ownerName: parsedOwnerSession.user.name
                    },
                    loginTime: new Date().toISOString(),
                    ownerAccess: true
                };
                setBarberSession(ownerViewSession);
                console.log('✅ Owner access granted to barber dashboard');
                return;
            }

            // Parse existing barber session
            const parsedSession = JSON.parse(barberSession);
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
            fetchAvailability(); // Fetch availability settings
            fetchProfileData(); // Fetch profile data for editing

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
                    console.log('🔔 New bookings to notify:', newBookings);

                    // Use Android-safe notification function
                    if (newBookings && newBookings.length > 0) {
                        try {
                            const notificationResult = await showNotificationSafe(newBookings[0]);
                            if (notificationResult) {
                                console.log('✅ Notification sent successfully');
                            } else {
                                console.warn('⚠️ Notification failed to send');
                            }
                        } catch (notifError) {
                            console.warn('⚠️ Notification failed (Android safe):', notifError);
                        }
                    }

                    // Always show visual alert regardless of notification success
                    setShowNewBookingAlert(true);
                    setTimeout(() => setShowNewBookingAlert(false), 10000); // Show for 10 seconds
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

    // Fetch barber profile data
    const fetchProfileData = async () => {
        try {
            setProfileLoading(true);
            const response = await fetch(`/api/barber/profile?barberId=${encodeURIComponent(barberId)}`);
            const result = await response.json();

            if (result.success && result.barber) {
                setProfileData({
                    name: result.barber.name || '',
                    phone: result.barber.phone || '',
                    username: result.barber.username || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            console.error('❌ Error fetching profile data:', error);
        } finally {
            setProfileLoading(false);
        }
    };

    // Update barber profile
    const updateProfile = async () => {
        try {
            // Validation
            if (!profileData.name.trim()) {
                alert('نام آرایشگر الزامی است');
                return;
            }

            if (!profileData.phone.trim()) {
                alert('شماره تلفن الزامی است');
                return;
            }

            if (!profileData.username.trim()) {
                alert('نام کاربری الزامی است');
                return;
            }

            // Password validation if changing
            if (profileData.newPassword) {
                if (!profileData.currentPassword) {
                    alert('برای تغییر رمز عبور، رمز فعلی را وارد کنید');
                    return;
                }
                if (profileData.newPassword.length < 6) {
                    alert('رمز عبور جدید باید حداقل 6 کاراکتر باشد');
                    return;
                }
                if (profileData.newPassword !== profileData.confirmPassword) {
                    alert('رمز عبور جدید و تأیید آن یکسان نیستند');
                    return;
                }
            }

            setProfileLoading(true);
            const response = await fetch('/api/barber/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    barberId: barberId,
                    name: profileData.name.trim(),
                    phone: profileData.phone.trim(),
                    username: profileData.username.trim(),
                    currentPassword: profileData.currentPassword || null,
                    newPassword: profileData.newPassword || null
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('اطلاعات پروفایل با موفقیت به‌روزرسانی شد');
                setShowProfileModal(false);

                // Update session if name changed
                if (barberSession && profileData.name !== barberSession.user.name) {
                    const updatedSession = {
                        ...barberSession,
                        user: {
                            ...barberSession.user,
                            name: profileData.name
                        }
                    };
                    localStorage.setItem('barberSession', JSON.stringify(updatedSession));
                    setBarberSession(updatedSession);
                }

                // Clear password fields
                setProfileData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));

                // Refresh barber data
                fetchBarberBookings();
            } else {
                alert(result.message || 'خطا در به‌روزرسانی اطلاعات');
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            alert('خطا در به‌روزرسانی اطلاعات');
        } finally {
            setProfileLoading(false);
        }
    };

    // Fetch barber availability
    const fetchAvailability = async () => {
        try {
            setAvailabilityLoading(true);
            console.log('🔍 Fetching availability for barberId:', barberId);

            // Add timestamp to bypass cache
            const timestamp = Date.now();
            const response = await fetch(`/api/barber/availability?barberId=${encodeURIComponent(barberId)}&t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const result = await response.json();
            console.log('📥 Received availability response:', result);

            if (result.success && result.availability) {
                console.log('📋 Setting availability state:', result.availability);
                setAvailability({
                    workingHours: result.availability.workingHours || { start: 10, end: 21 },
                    lunchBreak: result.availability.lunchBreak || { start: 14, end: 15 },
                    offDays: result.availability.offDays || [],
                    offHours: result.availability.offHours || [],
                    isAvailable: result.availability.isAvailable !== false
                });
                console.log('✅ Loaded availability successfully');
            } else {
                console.log('⚠️ No availability data or request failed:', result);
            }
        } catch (error) {
            console.error('❌ Error fetching availability:', error);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    // Update barber availability
    const updateAvailability = async (availabilityData) => {
        try {
            setAvailabilityLoading(true);
            console.log('💾 Saving availability:', availabilityData);

            const response = await fetch('/api/barber/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    barberId: barberId,
                    availability: availabilityData
                })
            });

            const result = await response.json();

            if (result.success) {
                setShowAvailabilityModal(false);
                alert('تنظیمات با موفقیت ذخیره شد');
                console.log('✅ Availability updated successfully');
                // Reload availability to confirm changes were saved
                await fetchAvailability();
            } else {
                alert(result.message || 'خطا در ذخیره تنظیمات');
            }
        } catch (error) {
            console.error('❌ Error updating availability:', error);
            alert('خطا در ذخیره تنظیمات');
        } finally {
            setAvailabilityLoading(false);
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
            case 'pending':
                return <span className="px-3 py-1 text-xs bg-orange-400/20 text-orange-700 rounded-full border border-orange-400/30 backdrop-blur-sm animate-pulse">⏳ در انتظار تایید</span>;
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

    // Helper function to get current Persian month's start and end dates
    const getCurrentMonthRange = () => {
        // Get today's date to determine which Persian month we're in
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Persian calendar year 1404 month mappings (simplified for current period):

        // مهر (Mehr) - September 23 to October 22, 2025
        if (todayStr >= '2025-09-23' && todayStr <= '2025-10-22') {
            return { start: '2025-09-23', end: '2025-10-22' };
        }
        // آبان (Aban) - October 23 to November 21, 2025
        else if (todayStr >= '2025-10-23' && todayStr <= '2025-11-21') {
            return { start: '2025-10-23', end: '2025-11-21' };
        }
        // آذر (Azar) - November 22 to December 21, 2025
        else if (todayStr >= '2025-11-22' && todayStr <= '2025-12-21') {
            return { start: '2025-11-22', end: '2025-12-21' };
        }
        // دی (Dey) - December 22, 2025 to January 20, 2026
        else if (todayStr >= '2025-12-22' || todayStr <= '2026-01-20') {
            return { start: '2025-12-22', end: '2026-01-20' };
        }
        // بهمن (Bahman) - January 21 to February 19, 2026
        else if (todayStr >= '2026-01-21' && todayStr <= '2026-02-19') {
            return { start: '2026-01-21', end: '2026-02-19' };
        }
        // اسفند (Esfand) - February 20 to March 20, 2026
        else if (todayStr >= '2026-02-20' && todayStr <= '2026-03-20') {
            return { start: '2026-02-20', end: '2026-03-20' };
        }
        // فروردین (Farvardin) - March 21 to April 20, 2026
        else if (todayStr >= '2026-03-21' && todayStr <= '2026-04-20') {
            return { start: '2026-03-21', end: '2026-04-20' };
        }
        // اردیبهشت (Ordibehesht) - April 21 to May 21, 2026
        else if (todayStr >= '2026-04-21' && todayStr <= '2026-05-21') {
            return { start: '2026-04-21', end: '2026-05-21' };
        }
        // خرداد (Khordad) - May 22 to June 21, 2026
        else if (todayStr >= '2026-05-22' && todayStr <= '2026-06-21') {
            return { start: '2026-05-22', end: '2026-06-21' };
        }
        // تیر (Tir) - June 22 to July 22, 2026
        else if (todayStr >= '2026-06-22' && todayStr <= '2026-07-22') {
            return { start: '2026-06-22', end: '2026-07-22' };
        }
        // مرداد (Mordad) - July 23 to August 22, 2026
        else if (todayStr >= '2026-07-23' && todayStr <= '2026-08-22') {
            return { start: '2026-07-23', end: '2026-08-22' };
        }
        // شهریور (Shahrivar) - August 23 to September 22, 2026
        else if (todayStr >= '2026-08-23' && todayStr <= '2026-09-22') {
            return { start: '2026-08-23', end: '2026-09-22' };
        }

        // Fallback to Gregorian month for dates outside our mapping
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
        return { start: startOfMonth, end: endOfMonth };
    };

    // Helper function to get current Persian month name
    const getCurrentPersianMonthName = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (todayStr >= '2025-09-23' && todayStr <= '2025-10-22') {
            return 'مهر'; // Mehr
        } else if (todayStr >= '2025-10-23' && todayStr <= '2025-11-21') {
            return 'آبان'; // Aban
        } else if (todayStr >= '2025-11-22' && todayStr <= '2025-12-21') {
            return 'آذر'; // Azar
        } else if (todayStr >= '2025-12-22' || todayStr <= '2026-01-20') {
            return 'دی'; // Dey
        } else if (todayStr >= '2026-01-21' && todayStr <= '2026-02-19') {
            return 'بهمن'; // Bahman
        } else if (todayStr >= '2026-02-20' && todayStr <= '2026-03-20') {
            return 'اسفند'; // Esfand
        } else if (todayStr >= '2026-03-21' && todayStr <= '2026-04-20') {
            return 'فروردین'; // Farvardin
        } else if (todayStr >= '2026-04-21' && todayStr <= '2026-05-21') {
            return 'اردیبهشت'; // Ordibehesht
        } else if (todayStr >= '2026-05-22' && todayStr <= '2026-06-21') {
            return 'خرداد'; // Khordad
        } else if (todayStr >= '2026-06-22' && todayStr <= '2026-07-22') {
            return 'تیر'; // Tir
        } else if (todayStr >= '2026-07-23' && todayStr <= '2026-08-22') {
            return 'مرداد'; // Mordad
        } else if (todayStr >= '2026-08-23' && todayStr <= '2026-09-22') {
            return 'شهریور'; // Shahrivar
        }

        return 'این ماه'; // Fallback
    };

    // Helper function to filter future bookings (tomorrow and beyond)
    const filterFutureBookings = () => {
        const today = getTodayDate();
        const filtered = barberData?.bookings?.filter(booking =>
            booking.date_key > today &&
            (statusFilter === 'all' || booking.status === statusFilter)
        ) || [];
        return filtered;
    };

    // Helper function to filter past bookings (yesterday and before)
    const filterPastBookings = () => {
        const today = getTodayDate();
        const filtered = barberData?.bookings?.filter(booking =>
            booking.date_key < today &&
            (statusFilter === 'all' || booking.status === statusFilter)
        ) || [];
        return filtered;
    };

    // Get today's bookings
    const todaysBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        const today = getTodayDate();

        return rawBookings
            .filter(booking => booking.date_key === today && booking.status !== 'cancelled')
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    })();

    // Get pending bookings (waiting for barber confirmation) - Most Important!
    const pendingBookings = (() => {
        const rawBookings = barberData?.bookings || [];

        return rawBookings
            .filter(booking => booking.status === 'pending')
            .sort((a, b) => {
                // Sort by date (earliest first), then by creation time (oldest first)
                if (a.date_key !== b.date_key) return a.date_key.localeCompare(b.date_key);
                const aCreated = new Date(a.created_at).getTime();
                const bCreated = new Date(b.created_at).getTime();
                return aCreated - bCreated;
            });
    })();

    // Get future bookings (all bookings after today, including this month)
    const futureBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        const today = getTodayDate();

        return rawBookings
            .filter(booking => {
                // Must be after today (any future date) and not cancelled
                const isFuture = booking.date_key > today;
                const isNotCancelled = booking.status !== 'cancelled';

                if (!isFuture || !isNotCancelled) return false;

                // Apply status filter
                return statusFilter === 'all' || booking.status === statusFilter;
            })
            .sort((a, b) => {
                if (a.date_key !== b.date_key) return a.date_key.localeCompare(b.date_key);
                return a.start_time.localeCompare(b.start_time);
            });
    })();

    // Get this month's bookings (excluding today and future dates - only past dates in this month)
    const thisMonthBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        const today = getTodayDate();
        const { start, end } = getCurrentMonthRange();

        return rawBookings
            .filter(booking => {
                // Must be in this month, not today, and BEFORE today (past dates only)
                const isThisMonth = booking.date_key >= start &&
                    booking.date_key <= end &&
                    booking.date_key !== today &&
                    booking.date_key < today; // Only past dates in this month

                if (!isThisMonth) return false;

                // Apply additional date filter if selected
                if (selectedDate) {
                    if (selectedDate === 'future') {
                        // For future filter, don't show any (all futures are in Future section now)
                        return false;
                    } else if (selectedDate === 'past') {
                        // For past filter, show all past dates in this month
                        return true;
                    } else if (selectedDate === getTodayDate()) {
                        // For today filter, don't show any this month bookings (they should be in today section)
                        return false;
                    } else if (selectedDate !== '') {
                        // For specific date filter
                        return booking.date_key === selectedDate;
                    }
                }

                // Apply status filter
                return statusFilter === 'all' || booking.status === statusFilter;
            })
            .sort((a, b) => {
                if (a.date_key !== b.date_key) return a.date_key.localeCompare(b.date_key);
                return a.start_time.localeCompare(b.start_time);
            });
    })();

    // Get all bookings for the comprehensive view (with filters)
    const allBookings = (() => {
        const rawBookings = barberData?.bookings || [];
        const today = getTodayDate();

        const filtered = rawBookings.filter(booking => {
            let matchesDate = true;

            if (selectedDate) {
                if (selectedDate === 'future') {
                    // Future: Only bookings AFTER today (tomorrow and beyond)
                    matchesDate = booking.date_key > today;
                } else if (selectedDate === 'past') {
                    // Past: Only bookings BEFORE today
                    matchesDate = booking.date_key < today;
                } else if (selectedDate === getTodayDate()) {
                    // Today: Only today's bookings
                    matchesDate = booking.date_key === today;
                } else {
                    // Specific date
                    matchesDate = booking.date_key === selectedDate;
                }
            }

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
        <div className="min-h-screen p-2 sm:p-4 relative overflow-hidden"
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

            <div className="max-w-6xl mx-auto relative z-10 px-2 sm:px-4">{/* New Booking Alert */}
                {showNewBookingAlert && (
                    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 bg-green-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl shadow-2xl animate-pulse max-w-xs sm:max-w-none">
                        <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-2xl">🎉</span>
                            <div>
                                <p className="font-bold text-sm sm:text-base">رزرو جدید!</p>
                                <p className="text-xs sm:text-sm">لطفاً صفحه را تازه‌سازی کنید</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="glass-card p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 floating">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-glass mb-1 sm:mb-2 flex flex-col sm:flex-row sm:items-center gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg sm:text-xl">✂️</span>
                                    <span className="text-sm sm:text-base lg:text-xl">داشبورد آرایشگر</span>
                                </div>
                                <span className="text-sm sm:text-base lg:text-xl font-medium text-white/90 truncate">{barberSession?.user?.name || decodeURIComponent(barberId)}</span>
                            </h1>
                            {!headerCollapsed && (
                                <p className="text-glass-secondary text-xs sm:text-sm mt-1">
                                    تعداد کل رزروها: {barberData?.total_bookings || 0}
                                </p>
                            )}
                        </div>

                        {/* Mobile toggle button */}
                        <button
                            onClick={() => setHeaderCollapsed(!headerCollapsed)}
                            className="glass-button p-2 sm:hidden"
                        >
                            {headerCollapsed ? '📋' : '📝'}
                        </button>
                    </div>

                    {/* Desktop buttons (always visible) and Mobile buttons (collapsible) */}
                    <div className={`${headerCollapsed ? 'hidden' : 'block'} sm:block`}>
                        <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    fetchBarberBookings();
                                    setHeaderCollapsed(true); // Auto-collapse on mobile after action
                                }}
                                className="glass-button px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm lg:text-base flex items-center justify-center gap-1 sm:gap-2"
                            >
                                <span className="text-sm sm:text-base">🔄</span>
                                <span className="text-xs sm:text-sm">تازه‌سازی</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowProfileModal(true);
                                    fetchProfileData();
                                    setHeaderCollapsed(true);
                                }}
                                className="glass-button px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm lg:text-base bg-blue-500/20 border-blue-400/30 flex items-center justify-center gap-1 sm:gap-2"
                            >
                                <span className="text-sm sm:text-base">⚙️</span>
                                <span className="text-xs sm:text-sm">پروفایل</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAvailabilityModal(true);
                                    fetchAvailability();
                                    setHeaderCollapsed(true);
                                }}
                                className="glass-button px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm lg:text-base bg-purple-500/20 border-purple-400/30 flex items-center justify-center gap-1 sm:gap-2"
                            >
                                <span className="text-sm sm:text-base">⏰</span>
                                <span className="text-xs sm:text-sm">ساعات کاری</span>
                            </button>
                            <div className="hidden sm:block">
                                <BarberPWAInstall
                                    barberName={barberSession?.user?.name || decodeURIComponent(barberId)}
                                    barberId={barberSession?.user?.username || decodeURIComponent(barberId)}
                                />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="glass-button glass-danger px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm lg:text-base col-span-2 sm:col-span-1 flex items-center justify-center gap-1 sm:gap-2"
                            >
                                <span className="text-sm sm:text-base">🚪</span>
                                <span className="text-xs sm:text-sm">خروج</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Feed Section - Latest Updates First */}
                <div className="mb-4 sm:mb-6">
                    <ActivityFeed
                        barberId={(() => {
                            // Try to get barberId from session first
                            const sessionBarberId = barberSession?.user?._id || barberSession?.user?.username;
                            // Fallback to URL parameter
                            const urlBarberId = decodeURIComponent(barberId);
                            // For PWA mode, prefer the URL parameter which is more reliable
                            const isPWA = typeof window !== 'undefined' && window.location.search.includes('pwa=1');
                            const finalBarberId = isPWA ? urlBarberId : (sessionBarberId || urlBarberId);

                            console.log('📊 ActivityFeed barberId resolution:', {
                                sessionBarberId,
                                urlBarberId,
                                isPWA,
                                finalBarberId,
                                sessionUser: barberSession?.user
                            });

                            return finalBarberId;
                        })()}
                        className="backdrop-blur-xl"
                    />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                    <div className="glass-card p-3 sm:p-3 lg:p-4 text-center border-2 border-orange-400/40 animate-pulse min-h-[90px] sm:min-h-[100px] flex flex-col justify-center">
                        <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl sm:text-xl lg:text-2xl">⏳</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 leading-tight">در انتظار</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-400">{pendingBookings.length}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-3 lg:p-4 text-center border-2 border-blue-400/40 min-h-[90px] sm:min-h-[100px] flex flex-col justify-center">
                        <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl sm:text-xl lg:text-2xl">📅</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 leading-tight">امروز</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400">{todaysBookings.length}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-3 lg:p-4 text-center border-2 border-purple-400/40 col-span-2 sm:col-span-1 min-h-[90px] sm:min-h-[100px] flex flex-col justify-center">
                        <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl sm:text-xl lg:text-2xl">🔮</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 leading-tight">آینده</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-400">{futureBookings.length}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-3 lg:p-4 text-center border-2 border-green-400/40 col-span-2 sm:block min-h-[90px] sm:min-h-[100px] flex flex-col justify-center">
                        <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl sm:text-xl lg:text-2xl">📆</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 leading-tight">این ماه</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400">{thisMonthBookings.length + todaysBookings.length}</p>
                    </div>
                    <div className="glass-card p-3 sm:p-3 lg:p-4 text-center border-2 border-white/30 hidden lg:flex lg:flex-col lg:justify-center min-h-[90px] sm:min-h-[100px]">
                        <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl sm:text-xl lg:text-2xl">📊</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 leading-tight">کل رزروها</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{barberData?.total_bookings || 0}</p>
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
                                <option value="pending" style={{ color: 'black' }}>⏳ در انتظار تایید</option>
                                <option value="confirmed" style={{ color: 'black' }}>✅ تأیید شده</option>
                                <option value="cancelled" style={{ color: 'black' }}>❌ لغو شده</option>
                                <option value="completed" style={{ color: 'black' }}>🎉 تکمیل شده</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick Filter Buttons */}
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="text-sm font-medium text-white mb-3">🔗 فیلترهای سریع</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedDate(getTodayDate())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === getTodayDate()
                                    ? 'bg-blue-500/30 text-white border-2 border-blue-400'
                                    : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                    }`}
                            >
                                📅 امروز
                            </button>
                            <button
                                onClick={() => setSelectedDate('future')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === 'future'
                                    ? 'bg-green-500/30 text-white border-2 border-green-400'
                                    : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                    }`}
                            >
                                🔮 آینده
                            </button>
                            <button
                                onClick={() => setSelectedDate('past')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === 'past'
                                    ? 'bg-orange-500/30 text-white border-2 border-orange-400'
                                    : 'bg-white/10 text-white/80 border border-white/30 hover:bg-white/20'
                                    }`}
                            >
                                📜 گذشته
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pending Bookings - Highest Priority! Needs Barber Action */}
                {pendingBookings.length > 0 && (
                    <div className="glass-card mb-6 border-2 border-orange-400/50 animate-pulse">
                        <div className="p-4 sm:p-6 border-b border-orange-400/30 bg-orange-500/10">
                            <h2 className="text-lg sm:text-xl font-bold text-orange-400 flex items-center">
                                ⏳ رزروهای در انتظار تایید ({pendingBookings.length})
                            </h2>
                            <p className="text-sm text-white/70 mt-1">
                                این رزروها نیاز به تایید یا رد شما دارند
                            </p>
                        </div>

                        <div className="divide-y divide-orange-400/10">
                            {pendingBookings.map((booking, index) => {
                                const bookingUniqueId = booking.id || `pending-${booking.user_phone}-${booking.start_time}-${index}`;
                                const isExpanded = expandedBookings.has(bookingUniqueId);
                                return (
                                    <div key={bookingUniqueId} className="p-3 sm:p-4 hover:bg-orange-500/10 transition-colors border-l-4 border-orange-400">
                                        {/* Summary View with Action Buttons */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                                        <div>
                                                            <p className="text-white font-medium">👤 {booking.user_name}</p>
                                                            <p className="text-white/70 text-sm">📞 {booking.user_phone}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-white/70">📅 تاریخ:</span>
                                                                <p className="text-white">{formatDate(booking.date_key)}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-white/70">🕐 ساعت:</span>
                                                                <p className="text-white">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-white/70">✂️ خدمات:</span>
                                                            <p className="text-white">{booking.services.join(', ')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 justify-center">
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
                                                        {isExpanded ? '🔼 کمتر' : '🔽 جزئیات'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Action Buttons - Always Visible */}
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-400/20">
                                                <button
                                                    onClick={() => updateBookingStatus(bookingUniqueId, 'confirmed')}
                                                    className="glass-button bg-green-500/30 border-green-400/50 text-green-300 px-6 py-3 text-sm font-bold hover:bg-green-500/50 flex-1 sm:flex-initial"
                                                >
                                                    ✅ تایید رزرو
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('دلیل رد رزرو را وارد کنید (اختیاری):');
                                                        updateBookingStatus(bookingUniqueId, 'cancelled', reason || 'رد شده توسط آرایشگر');
                                                    }}
                                                    className="glass-button bg-red-500/30 border-red-400/50 text-red-300 px-6 py-3 text-sm font-bold hover:bg-red-500/50 flex-1 sm:flex-initial"
                                                >
                                                    ❌ رد رزرو
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-orange-400/20 bg-orange-500/5 rounded-lg p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <span className="text-white/70 text-sm">🕒 مدت زمان:</span>
                                                        <p className="text-white">{booking.total_duration} دقیقه</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/70 text-sm">📅 تاریخ رزرو:</span>
                                                        <p className="text-white">{new Date(booking.created_at).toLocaleString('fa-IR')}</p>
                                                    </div>
                                                </div>
                                                {booking.notes && (
                                                    <div className="mb-4">
                                                        <span className="text-white/70 text-sm">📝 یادداشت:</span>
                                                        <p className="text-white bg-white/10 p-2 rounded mt-1">{booking.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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

                {/* Future Bookings - Next Month and Beyond */}
                <div className="glass-card mb-6">
                    <div
                        className="p-4 sm:p-6 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setShowFutureBookings(!showFutureBookings)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center">
                                    🔮 رزروهای آینده ({futureBookings.length})
                                </h2>
                                <p className="text-sm text-white/70 mt-1">
                                    همه رزروهای آینده (از فردا به بعد)
                                </p>
                            </div>
                            <div className="flex items-center">
                                <span className="text-purple-400 text-2xl transition-transform duration-200" style={{ transform: showFutureBookings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    ▼
                                </span>
                            </div>
                        </div>
                    </div>

                    {showFutureBookings && (
                        <div>
                            {futureBookings.length === 0 && (
                                <div className="p-6 sm:p-8 text-center">
                                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl sm:text-2xl">🔮</span>
                                    </div>
                                    <p className="text-purple-300 text-sm sm:text-base">رزرو آینده‌ای ندارید</p>
                                </div>
                            )}

                            {futureBookings.length > 0 && (
                                <div className="divide-y divide-white/10">
                                    {futureBookings.map((booking, index) => {
                                        const bookingUniqueId = booking.id || `future-${booking.user_phone}-${booking.date_key}-${booking.start_time}-${index}`;
                                        const isExpanded = expandedBookings.has(bookingUniqueId);
                                        return (
                                            <div key={bookingUniqueId} className="p-3 sm:p-4 hover:bg-purple-500/5 transition-colors">
                                                <div className="flex flex-col sm:flex-row justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-white font-medium">👤 {booking.user_name}</p>
                                                                <span className="text-purple-300 text-sm">📅 {formatDate(booking.date_key)}</span>
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
                    )}
                </div>

                {/* This Month's Bookings */}
                <div className="glass-card mb-6">
                    <div
                        className="p-4 sm:p-6 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setShowThisMonth(!showThisMonth)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-green-400 flex items-center">
                                    📆 رزروهای گذشته {getCurrentPersianMonthName()} ({thisMonthBookings.length})
                                </h2>
                                <p className="text-sm text-white/70 mt-1">
                                    {selectedDate === 'past' ? `گذشته در ${getCurrentPersianMonthName()}` :
                                        selectedDate === getTodayDate() ? 'امروز (در بخش بالا)' :
                                            selectedDate ? `${formatDate(selectedDate)} در ${getCurrentPersianMonthName()}` :
                                                'روزهای گذشته این ماه'}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <span className="text-green-400 text-2xl transition-transform duration-200" style={{ transform: showThisMonth ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    ▼
                                </span>
                            </div>
                        </div>
                    </div>

                    {showThisMonth && (
                        <div>
                            {thisMonthBookings.length === 0 && (
                                <div className="p-6 sm:p-8 text-center">
                                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl sm:text-2xl">�</span>
                                    </div>
                                    <p className="text-green-300 text-sm sm:text-base">
                                        {selectedDate === 'past' ? `${getCurrentPersianMonthName()} رزرو گذشته‌ای ندارید` :
                                            selectedDate === getTodayDate() ? 'رزروهای امروز در بخش بالا نمایش داده می‌شود' :
                                                selectedDate ? `در ${getCurrentPersianMonthName()} رزروی ندارید` :
                                                    `${getCurrentPersianMonthName()} رزرو گذشته‌ای ندارید`}
                                    </p>
                                </div>
                            )}

                            {thisMonthBookings.length > 0 && (
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
                    )}
                </div>

                {/* All Bookings - Comprehensive View with Filters */}
                <div className="glass-card">
                    <div
                        className="p-4 sm:p-6 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setShowAllBookings(!showAllBookings)}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center">
                                    📋 همه رزروها ({allBookings.length})
                                </h2>
                                <span className="text-purple-400 text-2xl transition-transform duration-200" style={{ transform: showAllBookings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    ▼
                                </span>
                            </div>
                            <div className="text-sm text-white/70">
                                {selectedDate ? (
                                    selectedDate === getTodayDate() ? (
                                        <span className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                                            📅 امروز - {formatDate(selectedDate)}
                                        </span>
                                    ) : selectedDate === 'future' ? (
                                        <span className="bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                                            🔮 آینده
                                        </span>
                                    ) : selectedDate === 'past' ? (
                                        <span className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-400/30">
                                            📜 گذشته
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

                    {showAllBookings && (
                        <div>
                            {allBookings.length === 0 && (
                                <div className="p-6 sm:p-8 text-center">
                                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl sm:text-2xl">📝</span>
                                    </div>
                                    <p className="text-white/70 text-sm sm:text-base">هیچ رزروی یافت نشد</p>
                                </div>
                            )}

                            {allBookings.length > 0 && (
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
                    )}
                </div>
            </div>

            {/* Availability Settings Modal */}
            {showAvailabilityModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-8 max-w-md w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">⏰ ساعات کاری</h2>
                                <p className="text-white/60 text-sm mt-1">تنظیم دسترسی و وقت‌های تعطیل</p>
                            </div>
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="text-white/60 hover:text-white text-2xl transition-colors duration-200 hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Working Hours */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <label className="block text-white font-semibold mb-3 flex items-center gap-2">🕐 ساعات کاری</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-white/70 text-xs mb-2 font-medium">شروع کار</label>
                                        <select
                                            value={availability.workingHours.start}
                                            onChange={(e) => setAvailability({
                                                ...availability,
                                                workingHours: { ...availability.workingHours, start: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i} className="bg-gray-800">{i.toString().padStart(2, '0')}:00</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-1">پایان</label>
                                        <select
                                            value={availability.workingHours.end}
                                            onChange={(e) => setAvailability({
                                                ...availability,
                                                workingHours: { ...availability.workingHours, end: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i} className="bg-gray-800">{i.toString().padStart(2, '0')}:00</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Lunch Break */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <label className="block text-white font-semibold mb-3 flex items-center gap-2">🍽️ زمان استراحت</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-white/70 text-sm mb-1">شروع</label>
                                        <select
                                            value={availability.lunchBreak.start}
                                            onChange={(e) => setAvailability({
                                                ...availability,
                                                lunchBreak: { ...availability.lunchBreak, start: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i} className="bg-gray-800">{i.toString().padStart(2, '0')}:00</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-1">پایان</label>
                                        <select
                                            value={availability.lunchBreak.end}
                                            onChange={(e) => setAvailability({
                                                ...availability,
                                                lunchBreak: { ...availability.lunchBreak, end: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i} className="bg-gray-800">{i.toString().padStart(2, '0')}:00</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Off Days */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <label className="block text-white font-semibold mb-3 flex items-center gap-2">📅 روزهای تعطیل</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map((day) => (
                                        <label key={day} className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={availability.offDays.includes(day)}
                                                onChange={(e) => {
                                                    const offDays = e.target.checked
                                                        ? [...availability.offDays, day]
                                                        : availability.offDays.filter(d => d !== day);
                                                    setAvailability({ ...availability, offDays });
                                                }}
                                                className="rounded text-yellow-500 cursor-pointer"
                                            />
                                            <span className="text-white/90 text-sm font-medium">{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Availability Toggle */}
                            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-400/30">
                                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={availability.isAvailable}
                                        onChange={(e) => setAvailability({
                                            ...availability,
                                            isAvailable: e.target.checked
                                        })}
                                        className="rounded text-green-500 cursor-pointer"
                                    />
                                    <span className="text-white font-medium flex items-center gap-1">✅ در دسترس برای رزرو</span>
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/20 transition-colors duration-200"
                            >
                                ❌ لغو
                            </button>
                            <button
                                onClick={() => updateAvailability(availability)}
                                disabled={availabilityLoading}
                                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500/30 to-emerald-500/30 backdrop-blur-sm border border-green-400/50 text-white font-medium hover:from-green-500/40 hover:to-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {availabilityLoading ? '⏳ در حال ذخیره...' : '💾 ذخیره'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Settings Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-8 max-w-md w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">⚙️ پروفایل</h2>
                                <p className="text-white/60 text-sm mt-1">تغییر اطلاعات و رمز عبور</p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-white/60 hover:text-white text-2xl transition-colors duration-200 hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {profileLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin text-5xl mb-4">⏳</div>
                                <p className="text-white/70 text-sm">در حال بارگذاری...</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Name */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <label className="block text-white font-semibold mb-2 flex items-center gap-2">👤 نام آرایشگر</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                        placeholder="نام آرایشگر"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <label className="block text-white font-semibold mb-2 flex items-center gap-2">📱 شماره تلفن</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                        placeholder="09xxxxxxxxx"
                                        maxLength={11}
                                    />
                                </div>

                                {/* Username */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <label className="block text-white font-semibold mb-2 flex items-center gap-2">🔑 نام کاربری</label>
                                    <input
                                        type="text"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value.toLowerCase() })}
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                        placeholder="username"
                                    />
                                    <p className="text-xs text-white/60 mt-2">فقط حروف انگلیسی کوچک و اعداد</p>
                                </div>

                                {/* Password Section */}
                                <div className="bg-gradient-to-r from-orange-500/10 via-white/5 to-red-500/10 rounded-xl p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">🔒 تغییر رمز عبور</h3>

                                    <div className="space-y-3">
                                        {/* Current Password */}
                                        <div>
                                            <label className="block text-white/70 mb-1.5 text-xs font-medium">رمز عبور فعلی</label>
                                            <input
                                                type="password"
                                                value={profileData.currentPassword}
                                                onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                                placeholder="رمز فعلی"
                                            />
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label className="block text-white/70 mb-1.5 text-xs font-medium">رمز عبور جدید</label>
                                            <input
                                                type="password"
                                                value={profileData.newPassword}
                                                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                                placeholder="حداقل 6 کاراکتر"
                                                minLength={6}
                                            />
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label className="block text-white/70 mb-1.5 text-xs font-medium">تأیید رمز عبور جدید</label>
                                            <input
                                                type="password"
                                                value={profileData.confirmPassword}
                                                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 transition-colors outline-none"
                                                placeholder="تکرار رمز جدید"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                                    <button
                                        onClick={() => setShowProfileModal(false)}
                                        className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/20 transition-colors duration-200"
                                    >
                                        ❌ لغو
                                    </button>
                                    <button
                                        onClick={updateProfile}
                                        disabled={profileLoading}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 text-white font-medium hover:from-blue-500/40 hover:to-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {profileLoading ? '⏳ در حال ذخیره...' : '💾 ذخیره'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
