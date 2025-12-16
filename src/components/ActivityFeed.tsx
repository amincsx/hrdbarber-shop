'use client';

import { useState, useEffect } from 'react';

interface Activity {
    _id: string;
    customer_name: string;
    customer_phone: string;
    action: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'booking_confirmed' | 'booking_completed';
    details: string;
    status: 'unread' | 'read';
    created_at: string;
    createdAt: string;
}

interface ActivityFeedProps {
    barberId: string;
    className?: string;
}

const getActionIcon = (action: string) => {
    switch (action) {
        case 'booking_created':
            return '📅';
        case 'booking_updated':
            return '✏️';
        case 'booking_cancelled':
            return '❌';
        case 'booking_confirmed':
            return '✅';
        case 'booking_completed':
            return '🎉';
        default:
            return '📋';
    }
};

const getActionMessage = (action: string, customerName: string) => {
    switch (action) {
        case 'booking_created':
            return `${customerName} رزرو جدیدی ایجاد کرد`;
        case 'booking_updated':
            return `${customerName} رزرو خود را تغییر داد`;
        case 'booking_cancelled':
            return `${customerName} رزرو خود را لغو کرد`;
        case 'booking_confirmed':
            return `رزرو ${customerName} را تایید کردید`;
        case 'booking_completed':
            return `رزرو ${customerName} تکمیل شد`;
        default:
            return `${customerName} یک عمل انجام داد`;
    }
};

const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays === 1) return 'دیروز';
    if (diffDays < 30) return `${diffDays} روز پیش`;
    return then.toLocaleDateString('fa-IR');
};

export default function ActivityFeed({ barberId, className = '' }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/barber-activities/${barberId}`);

            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (activityIds?: string[]) => {
        try {
            const response = await fetch(`/api/barber-activities/${barberId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activityIds }),
            });

            if (response.ok) {
                // Update local state
                setActivities(prev =>
                    prev.map(activity => ({
                        ...activity,
                        status: activityIds?.includes(activity._id) || !activityIds ? 'read' : activity.status
                    }))
                );

                if (!activityIds) {
                    setUnreadCount(0);
                } else {
                    setUnreadCount(prev => Math.max(0, prev - activityIds.length));
                }
            }
        } catch (error) {
            console.error('Failed to mark activities as read:', error);
        }
    };

    useEffect(() => {
        fetchActivities();

        // Refresh every 30 seconds
        const interval = setInterval(fetchActivities, 30000);
        return () => clearInterval(interval);
    }, [barberId]);

    const displayedActivities = showAll ? activities : activities.slice(0, 2);

    if (loading) {
        return (
            <div className={`glass-card p-4 sm:p-6 ${className}`}>
                <h3 className="text-lg sm:text-xl font-bold text-glass mb-4 flex items-center">
                    📊 آخرین فعالیت‌ها
                </h3>
                <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-3 space-x-reverse">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`glass-card p-4 sm:p-6 ${className}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-glass flex items-center">
                    📊 آخرین فعالیت‌ها
                    {unreadCount > 0 && (
                        <span className="mr-2 bg-red-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-red-400/50">
                            {unreadCount}
                        </span>
                    )}
                </h3>

                <div className="flex gap-2 w-full sm:w-auto">
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAsRead()}
                            className="glass-button text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-initial"
                        >
                            همه را خوانده علامت بزن
                        </button>
                    )}
                    <button
                        onClick={fetchActivities}
                        className="glass-button text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-initial"
                    >
                        🔄 به‌روزرسانی
                    </button>
                </div>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                    <div className="text-3xl sm:text-4xl mb-2 opacity-60">📭</div>
                    <p className="text-white/70 text-sm sm:text-base">هنوز هیچ فعالیتی نداشته‌اید</p>
                </div>
            ) : (
                <>
                    {/* Always visible - Last 2 activities */}
                    <div className="space-y-3">
                        {displayedActivities.slice(0, 2).map((activity) => (
                            <div
                                key={activity._id}
                                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg backdrop-blur-sm transition-all duration-200 ${activity.status === 'unread'
                                    ? 'bg-blue-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-base sm:text-lg flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 mt-1">
                                    {getActionIcon(activity.action)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm sm:text-base break-words ${activity.status === 'unread'
                                                ? 'text-blue-100'
                                                : 'text-white/90'
                                                }`}>
                                                {getActionMessage(activity.action, activity.customer_name)}
                                            </p>
                                            {activity.details && (
                                                <p className="text-xs sm:text-sm text-white/70 mt-1 break-words">
                                                    {activity.details}
                                                </p>
                                            )}

                                            {activity.status === 'unread' && (
                                                <button
                                                    onClick={() => markAsRead([activity._id])}
                                                    className="text-xs text-blue-300 hover:text-blue-100 mt-2 transition-colors"
                                                >
                                                    خوانده علامت بزن
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div></div>
                                            <span className="text-xs text-white/60 whitespace-nowrap">
                                                {formatTimeAgo(activity.created_at || activity.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show/Hide toggle for older activities */}
                    {activities.length > 2 && (
                        <div className="mt-4 border-t border-white/10 pt-4">
                            {!showAll ? (
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="w-full text-center glass-button py-3 text-sm flex items-center justify-center gap-2"
                                >
                                    <span>نمایش فعالیت‌های قدیمی‌تر</span>
                                    <span className="text-xs opacity-70">({activities.length - 2} مورد)</span>
                                    <span className="text-lg">⬇️</span>
                                </button>
                            ) : (
                                <>
                                    {/* Scrollable container for older activities */}
                                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent space-y-3 pr-2">
                                        {activities.slice(2).map((activity) => (
                                            <div
                                                key={activity._id}
                                                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg backdrop-blur-sm transition-all duration-200 ${activity.status === 'unread'
                                                    ? 'bg-blue-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="text-base sm:text-lg flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 mt-1">
                                                    {getActionIcon(activity.action)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium text-sm sm:text-base break-words ${activity.status === 'unread'
                                                                ? 'text-blue-100'
                                                                : 'text-white/90'
                                                                }`}>
                                                                {getActionMessage(activity.action, activity.customer_name)}
                                                            </p>
                                                            {activity.details && (
                                                                <p className="text-xs sm:text-sm text-white/70 mt-1 break-words">
                                                                    {activity.details}
                                                                </p>
                                                            )}

                                                            {activity.status === 'unread' && (
                                                                <button
                                                                    onClick={() => markAsRead([activity._id])}
                                                                    className="text-xs text-blue-300 hover:text-blue-100 mt-2 transition-colors"
                                                                >
                                                                    خوانده علامت بزن
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div></div>
                                                            <span className="text-xs text-white/60 whitespace-nowrap">
                                                                {formatTimeAgo(activity.created_at || activity.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setShowAll(false)}
                                        className="w-full text-center glass-button py-3 text-sm mt-3 flex items-center justify-center gap-2"
                                    >
                                        <span>مخفی کردن فعالیت‌های قدیمی</span>
                                        <span className="text-lg">⬆️</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}