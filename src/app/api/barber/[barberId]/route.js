// JavaScript version of barber route with file-based database
import { NextResponse } from 'next/server';
import { SimpleFileDB } from '../../../../lib/fileDatabase.js';

// GET - Get bookings for specific barber
async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const status = searchParams.get('status');

        let bookings;

        if (date) {
            // Get bookings for specific date
            const allBookings = SimpleFileDB.getBookingsByDate(date);
            bookings = allBookings.filter(booking => booking.barber === barberId);
        } else {
            // Get all bookings for this barber
            bookings = SimpleFileDB.getBookingsByBarber(barberId);
        }

        // Filter by status if provided
        if (status) {
            bookings = bookings.filter(booking => booking.status === status);
        }

        console.log(`📊 Retrieved ${bookings.length} bookings for barber ${barberId}`);

        return NextResponse.json({
            barber: barberId,
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
        const booking = SimpleFileDB.getBookingById(bookingId);

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
        const updatedBooking = SimpleFileDB.updateBooking(bookingId, {
            status: status,
            notes: notes || booking.notes
        });

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
