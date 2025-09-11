'use client';

export default function WelcomePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">خوش آمدید!</h1>
                <p className="text-gray-600 mb-6">به سایت آرایشگاه خوش آمدید</p>
                <div className="space-y-4">
                    <a
                        href="/login"
                        className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ورود
                    </a>
                    <a
                        href="/signup"
                        className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        ثبت نام
                    </a>
                </div>
            </div>
        </div>
    );
}