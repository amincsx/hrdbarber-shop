// Quick test endpoint to verify barber mapping
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username') || 'mohammad';

        console.log('🧪 Testing barber mapping for:', username);

        // 1. Check if User exists
        const user = await MongoDatabase.getUserByUsername(username);
        console.log('  - User found:', user ? 'YES' : 'NO');
        if (user) {
            console.log('  - User name:', user.name);
            console.log('  - User role:', user.role);
        }

        // 2. Get all bookings
        const allBookings = await MongoDatabase.getAllBookings();
        console.log('  - Total bookings:', allBookings.length);

        // 3. Check bookings with username (English)
        const bookingsByUsername = allBookings.filter(b => b.barber === username);
        console.log('  - Bookings with username:', bookingsByUsername.length);

        // 4. Check bookings with Farsi name
        const farsiName = user ? user.name : username;
        const bookingsByName = allBookings.filter(b => b.barber === farsiName);
        console.log('  - Bookings with Farsi name:', bookingsByName.length);

        // 5. Show what barber names exist in bookings
        const uniqueBarberNames = [...new Set(allBookings.map(b => b.barber))];
        console.log('  - Unique barber names in DB:', uniqueBarberNames);

        return NextResponse.json({
            test_username: username,
            user_exists: !!user,
            user_farsi_name: user ? user.name : null,
            user_role: user ? user.role : null,
            total_bookings: allBookings.length,
            bookings_by_username: bookingsByUsername.length,
            bookings_by_farsi_name: bookingsByName.length,
            unique_barber_names: uniqueBarberNames,
            sample_bookings: allBookings.slice(0, 3).map(b => ({
                id: b.id,
                barber: b.barber,
                user_name: b.user_name,
                date: b.date_key,
                time: b.start_time
            })),
            solution: user ? 
                (bookingsByName.length > 0 ? 
                    '✅ Everything looks good! Bookings should appear.' :
                    '⚠️ User exists but no bookings found. Check if bookings are saved with the Farsi name: ' + user.name
                ) :
                '❌ User does not exist! Run: curl http://localhost:3000/api/init-barbers'
        });

    } catch (error) {
        console.error('❌ Test error:', error);
        return NextResponse.json(
            { 
                error: 'Test failed',
                details: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}

