'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function BarberDashboard() {
    const params = useParams();
    const router = useRouter();
    const barberId = params.barberId as string;

    useEffect(() => {
        // Check if user is already logged in as this barber
        const session = localStorage.getItem('adminSession');
        if (session) {
            try {
                const parsedSession = JSON.parse(session);
                const decodedBarberId = decodeURIComponent(barberId);
                
                // If user is already logged in as this barber, go to dashboard
                if (parsedSession.user && parsedSession.user.name === decodedBarberId) {
                    router.push(`/admin/barber/${encodeURIComponent(barberId)}`);
                    return;
                }
            } catch (err) {
                // Invalid session, continue to login
            }
        }

        // Redirect to admin login with barber pre-selected
        router.push(`/admin?barber=${encodeURIComponent(barberId)}`);
    }, [barberId, router]);

    return (
        <div className="min-h-screen relative flex items-center justify-center"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            <div className="relative text-center max-w-md mx-4 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto"></div>
                <h1 className="text-2xl font-bold text-white mb-4 mt-4">داشبورد آرایشگر</h1>
                <p className="text-white/90">در حال انتقال به صفحه ورود...</p>
            </div>
        </div>
    );
}