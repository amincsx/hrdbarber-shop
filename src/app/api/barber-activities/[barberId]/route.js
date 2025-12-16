import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

// GET - Get activities for a specific barber
async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;

        console.log('🔍 Getting activities for barber:', barberId);

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        const decodedBarberId = decodeURIComponent(barberId);

        // Find barber user to get the actual barber ID
        let barberUser = null;

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(decodedBarberId);

        if (isObjectId) {
            // Direct user lookup by ID
            barberUser = await MongoDatabase.getUserById(decodedBarberId);
        } else {
            // Lookup by username
            barberUser = await MongoDatabase.getUserByUsername(decodedBarberId);
        }

        if (!barberUser) {
            return NextResponse.json(
                { error: 'آرایشگر یافت نشد', activities: [], unreadCount: 0 },
                { status: 404 }
            );
        }

        console.log('✅ Found barber user:', barberUser.username, barberUser._id);

        // Get activities and unread count
        const [activities, unreadCount] = await Promise.all([
            MongoDatabase.getBarberActivities(barberUser._id, 50),
            MongoDatabase.getUnreadActivitiesCount(barberUser._id)
        ]);

        return NextResponse.json({
            activities,
            unreadCount,
            totalCount: activities.length
        });

    } catch (error) {
        console.error('❌ Error fetching barber activities:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت فعالیت‌ها', activities: [], unreadCount: 0 },
            { status: 500 }
        );
    }
}

export { GET };