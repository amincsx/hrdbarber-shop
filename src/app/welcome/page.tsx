'use client';

export default function WelcomePage() {
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
                <h1 className="text-3xl font-bold text-white mb-4">خوش آمدید!</h1>
                <p className="text-white/90 mb-6">به سایت آرایشگاه خوش آمدید</p>
                <div className="space-y-4">
                    <a
                        href="/login"
                        className="block w-full px-6 py-3 backdrop-blur-xl bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/20"
                    >
                        ورود
                    </a>
                    <a
                        href="/signup"
                        className="block w-full px-6 py-3 backdrop-blur-xl bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/20"
                    >
                        ثبت نام
                    </a>
                </div>
            </div>
        </div>
    );
}