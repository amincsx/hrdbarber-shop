import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../../lib/mongoDatabase.js';

// POST - Mark activities as read
async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;
        const { activityIds } = await request.json();

        console.log('✅ Marking activities as read for barber:', barberId, 'Activities:', activityIds);

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        const decodedBarberId = decodeURIComponent(barberId);

        // Find barber user
        let barberUser = null;

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(decodedBarberId);

        if (isObjectId) {
            barberUser = await MongoDatabase.getUserById(decodedBarberId);
        } else {
            barberUser = await MongoDatabase.getUserByUsername(decodedBarberId);
        }

        if (!barberUser) {
            return NextResponse.json(
                { error: 'آرایشگر یافت نشد' },
                { status: 404 }
            );
        }

        // Mark activities as read
        const result = await MongoDatabase.markActivitiesAsRead(barberUser._id, activityIds);

        return NextResponse.json({
            success: true,
            message: 'فعالیت‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('❌ Error marking activities as read:', error);
        return NextResponse.json(
            { error: 'خطا در علامت‌گذاری فعالیت‌ها' },
            { status: 500 }
        );
    }
}

export { POST };