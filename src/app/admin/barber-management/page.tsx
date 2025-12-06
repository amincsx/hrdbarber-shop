'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Barber {
    _id?: string;
    username: string;
    name: string;
    password?: string;
    role: string;
    created_at?: string;
}

export default function BarberManagement() {
    const router = useRouter();
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminSession, setAdminSession] = useState<any>(null);

    useEffect(() => {
        // Check admin session
        const session = localStorage.getItem('adminSession');
        if (!session) {
            router.push('/admin');
            return;
        }

        const parsedSession = JSON.parse(session);
        if (parsedSession.user.type !== 'owner') {
            router.push('/admin');
            return;
        }

        setAdminSession(parsedSession);
        loadBarbers();
    }, [router]);

    const loadBarbers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin?action=barbers');
            if (response.ok) {
                const data = await response.json();
                setBarbers(data.barbers || []);
            } else {
                console.error('Failed to load barbers');
            }
        } catch (error) {
            console.error('Error loading barbers:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteBarber = async (barberId: string, barberName: string) => {
        if (!confirm(`آیا از حذف آرایشگر \"${barberName}\" مطمئن هستید؟`)) {
            return;
        }

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
                    loadBarbers();
                } else {
                    alert(result.message || 'خطا در حذف آرایشگر');
                }
            } else {
                alert('خطا در حذف آرایشگر');
            }
        } catch (error) {
            console.error('Error deleting barber:', error);
            alert('خطا در حذف آرایشگر');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            dir="rtl"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="glass-card p-8 max-w-4xl w-full rounded-3xl shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            ✂️ مدیریت آرایشگران
                        </h1>
                        <p className="text-white/60 text-sm mt-2">افزودن و مدیریت آرایشگران</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/admin/owner')}
                            className="px-6 py-3 bg-blue-500/20 border border-blue-400/30 text-white rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                            🏠 بازگشت
                        </button>
                    </div>
                </div>



                {/* Barbers List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">لیست آرایشگران ({barbers.length})</h2>

                    {barbers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-white/60 text-lg">هیچ آرایشگری یافت نشد</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {barbers.map((barber) => (
                                <div
                                    key={barber._id}
                                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">{barber.name}</h3>
                                            <p className="text-white/60 text-sm">@{barber.username}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                            آرایشگر
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
            </div>
        </div>
    );
}