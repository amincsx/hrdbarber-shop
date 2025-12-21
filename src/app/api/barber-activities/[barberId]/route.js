import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

// GET - Get activities for a specific barber
async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;

        console.log('🔍 Getting activities for barber:', barberId);
        console.log('🔍 Request URL:', request.url);
        console.log('🔍 Headers:', Object.fromEntries(request.headers.entries()));

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        const decodedBarberId = decodeURIComponent(barberId);
        console.log('🔍 Decoded barber ID:', decodedBarberId);

        // Find barber user using multiple strategies
        let barberUser = null;
        let searchStrategy = 'unknown';

        // Strategy 1: Check if it's a MongoDB ObjectId
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(decodedBarberId);

        if (isObjectId) {
            console.log('🔍 Strategy 1: Looking up by ObjectId');
            barberUser = await MongoDatabase.getUserById(decodedBarberId);
            searchStrategy = 'objectId';
        }

        if (!barberUser) {
            console.log('🔍 Strategy 2: Looking up by username');
            barberUser = await MongoDatabase.getUserByUsername(decodedBarberId);
            searchStrategy = 'username';
        }

        if (!barberUser) {
            console.log('🔍 Strategy 3: Looking up by name (Farsi name)');
            // Get all barbers and find by name
            const allBarbers = await MongoDatabase.getUsersByRole('barber');
            barberUser = allBarbers.find(user => user.name === decodedBarberId);
            searchStrategy = 'farsiName';
        }

        if (!barberUser) {
            console.log('❌ Barber not found with any strategy:', decodedBarberId);
            return NextResponse.json(
                {
                    error: 'آرایشگر یافت نشد',
                    activities: [],
                    unreadCount: 0,
                    debug: {
                        searchedFor: decodedBarberId,
                        isObjectId,
                        strategy: searchStrategy
                    }
                },
                { status: 404 }
            );
        }

        console.log('✅ Found barber user:', {
            username: barberUser.username,
            name: barberUser.name,
            id: barberUser._id,
            strategy: searchStrategy
        });

        // Get activities and unread count using the barber's _id
        const [activities, unreadCount] = await Promise.all([
            MongoDatabase.getBarberActivities(barberUser._id, 50),
            MongoDatabase.getUnreadActivitiesCount(barberUser._id)
        ]);

        console.log('📊 Activities retrieved:', {
            count: activities.length,
            unread: unreadCount,
            barberId: barberUser._id
        });

        return NextResponse.json({
            activities,
            unreadCount,
            totalCount: activities.length,
            debug: {
                barberFound: {
                    id: barberUser._id,
                    username: barberUser.username,
                    name: barberUser.name
                },
                searchStrategy,
                searchedFor: decodedBarberId,
                timestamp: new Date().toISOString()
            }
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('❌ Error fetching barber activities:', error);
        return NextResponse.json(
            {
                error: 'خطا در دریافت فعالیت‌ها',
                activities: [],
                unreadCount: 0,
                debug: {
                    error: error.message
                }
            },
            { status: 500 }
        );
    }
}

export { GET };