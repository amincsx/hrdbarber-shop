// Check the latest bookings to see what barber name is being saved
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function GET(request) {
    try {
        const allBookings = await MongoDatabase.getAllBookings();
        
        // Sort by created_at to get latest bookings
        const sortedBookings = allBookings.sort((a, b) => {
            const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
            const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
            return bTime - aTime;
        });

        const latest5 = sortedBookings.slice(0, 5);

        return NextResponse.json({
            total_bookings: allBookings.length,
            latest_bookings: latest5.map(b => ({
                id: b.id || b._id?.toString(),
                user_name: b.user_name,
                barber: b.barber,
                barber_type: typeof b.barber,
                date_key: b.date_key,
                start_time: b.start_time,
                end_time: b.end_time,
                services: b.services,
                status: b.status,
                created_at: b.created_at || b.createdAt,
                created_timestamp: new Date(b.created_at || b.createdAt || 0).toISOString()
            })),
            barber_names_in_db: [...new Set(allBookings.map(b => b.barber))],
            tip: "Create a new booking, then refresh this page to see what barber name was saved"
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch bookings',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

