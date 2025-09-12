'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BarberRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to admin login
        router.push('/admin');
    }, [router]);

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
                <p className="mt-4 text-white/90">در حال انتقال به صفحه ورود...</p>
            </div>
        </div>
    );
}
