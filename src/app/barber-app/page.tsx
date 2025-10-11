'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Barber PWA Entry Point
 * This page serves as the dedicated entry point for the barber PWA
 * It redirects barbers to login or their dashboard based on authentication status
 */
export default function BarberAppEntry() {
    const router = useRouter();

    useEffect(() => {
        // Check if barber is already logged in
        const barberSession = localStorage.getItem('barberSession');
        
        if (barberSession) {
            try {
                const session = JSON.parse(barberSession);
                if (session.user && session.user.name) {
                    // Redirect to their dashboard
                    router.push(`/barber-dashboard/${encodeURIComponent(session.user.name)}?pwa=1`);
                    return;
                }
            } catch (e) {
                console.error('Error parsing barber session:', e);
            }
        }
        
        // If not logged in, redirect to login
        router.push('/barber-login?pwa=1');
    }, [router]);

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
                <p className="mt-4 text-white/90">در حال بارگذاری اپلیکیشن آرایشگر...</p>
            </div>
        </div>
    );
}

