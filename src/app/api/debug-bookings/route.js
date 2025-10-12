// Debug endpoint to check bookings in the database
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const barber = searchParams.get('barber');

        // Get all bookings
        const allBookings = await MongoDatabase.getAllBookings();
        
        // Get all barber users
        const barberUsers = await MongoDatabase.getUsersByRole('barber');

        // Get all barbers
        const barbers = await MongoDatabase.getAllBarbers();

        // Filter bookings if barber parameter provided
        let filteredBookings = allBookings;
        if (barber) {
            const decodedBarber = decodeURIComponent(barber);
            
            // Try to find barber user
            const barberUser = await MongoDatabase.getUserByUsername(decodedBarber);
            const barberName = barberUser ? barberUser.name : decodedBarber;
            
            filteredBookings = allBookings.filter(b => 
                b.barber === decodedBarber || b.barber === barberName
            );
            
            return NextResponse.json({
                total_bookings: allBookings.length,
                filtered_bookings: filteredBookings.length,
                search_params: {
                    requested_barber: decodedBarber,
                    barber_user_found: barberUser ? 'yes' : 'no',
                    barber_farsi_name: barberName
                },
                barber_users: barberUsers.map(u => ({
                    username: u.username,
                    name: u.name
                })),
                bookings: filteredBookings.map(b => ({
                    id: b.id || b._id?.toString(),
                    user_name: b.user_name,
                    barber: b.barber,
                    date_key: b.date_key,
                    start_time: b.start_time,
                    end_time: b.end_time,
                    services: b.services,
                    status: b.status,
                    created_at: b.created_at
                }))
            });
        }

        // Return summary if no specific barber requested
        const barberBookingCounts = {};
        allBookings.forEach(booking => {
            const barberName = booking.barber || 'unknown';
            barberBookingCounts[barberName] = (barberBookingCounts[barberName] || 0) + 1;
        });

        return NextResponse.json({
            total_bookings: allBookings.length,
            total_barbers: barbers.length,
            total_barber_users: barberUsers.length,
            barber_booking_counts: barberBookingCounts,
            barber_users: barberUsers.map(u => ({
                username: u.username,
                name: u.name,
                role: u.role
            })),
            barbers: barbers.map(b => ({
                name: b.name,
                username: b.username,
                isActive: b.isActive
            })),
            sample_bookings: allBookings.slice(0, 5).map(b => ({
                id: b.id || b._id?.toString(),
                user_name: b.user_name,
                barber: b.barber,
                date_key: b.date_key,
                start_time: b.start_time,
                services: b.services
            }))
        });

    } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch debug information',
                details: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}

