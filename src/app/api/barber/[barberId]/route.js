// JavaScript version of barber route with MongoDB database
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

// GET - Get bookings for specific barber
async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;

        console.log('🔍 Barber API called with:');
        console.log('  - Raw barberId:', barberId);
        console.log('  - Decoded barberId:', decodeURIComponent(barberId));
        console.log('  - Request URL:', request.url);

        if (!barberId) {
            console.log('❌ No barberId provided');
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const status = searchParams.get('status');

        // Decode the barberId for database lookup
        const decodedBarberId = decodeURIComponent(barberId);
        console.log('🔍 Looking up bookings for:', decodedBarberId);

        let bookings;

        if (date) {
            // Get bookings for specific date
            const allBookings = await MongoDatabase.getBookingsByDate(date);
            bookings = allBookings.filter(booking => booking.barber === decodedBarberId);
            console.log(`📅 Found ${bookings.length} bookings for ${decodedBarberId} on ${date}`);
        } else {
            // Get all bookings for this barber
            bookings = await MongoDatabase.getBookingsByBarber(decodedBarberId);
            console.log(`📊 Found ${bookings.length} total bookings for ${decodedBarberId}`);
        }

        // Filter by status if provided
        if (status) {
            const beforeFilter = bookings.length;
            bookings = bookings.filter(booking => booking.status === status);
            console.log(`🔍 Filtered by status '${status}': ${beforeFilter} → ${bookings.length} bookings`);
        }

        console.log(`✅ Returning ${bookings.length} bookings for barber ${decodedBarberId}`);

        return NextResponse.json({
            barber: decodedBarberId,
            bookings: bookings,
            total_bookings: bookings.length
        });

    } catch (error) {
        console.error('❌ Barber bookings fetch error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت رزروهای آرایشگر' },
            { status: 500 }
        );
    }
}

// POST - Update booking status for barber
async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        const { bookingId, status, notes } = await request.json();

        if (!bookingId || !status) {
            return NextResponse.json(
                { error: 'شناسه رزرو و وضعیت الزامی است' },
                { status: 400 }
            );
        }

        // Find the booking
        const allBookings = await MongoDatabase.getAllBookings();
        const booking = allBookings.find(b => b._id === bookingId || b.id === bookingId);

        if (!booking) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        // Verify this booking belongs to the barber
        if (booking.barber !== barberId) {
            return NextResponse.json(
                { error: 'این رزرو متعلق به این آرایشگر نیست' },
                { status: 403 }
            );
        }

        // Update booking status
        const updatedBooking = await MongoDatabase.updateBookingStatus(bookingId, status, notes || booking.notes);

        if (updatedBooking) {
            return NextResponse.json({
                message: 'وضعیت رزرو با موفقیت به‌روزرسانی شد',
                booking: updatedBooking
            });
        } else {
            throw new Error('Failed to update booking');
        }

    } catch (error) {
        console.error('❌ Booking status update error:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی وضعیت رزرو' },
            { status: 500 }
        );
    }
}

export { GET, POST };
