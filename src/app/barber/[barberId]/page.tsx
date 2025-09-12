'use client';

export default function BarberDashboard() {
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
                <h1 className="text-2xl font-bold text-white mb-4">داشبورد آرایشگر</h1>
                <p className="text-white/90">این صفحه در حال توسعه است</p>
            </div>
        </div>
    );
}