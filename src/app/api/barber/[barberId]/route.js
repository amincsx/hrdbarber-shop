// JavaScript version of barber route to bypass TypeScript module detection
import { NextResponse } from 'next/server';

let isInitialized = false;
let Database;

async function initializeDatabase() {
    if (!isInitialized) {
        // Dynamic import to avoid module resolution issues
        const { default: DatabaseClass } = await import('../../../../lib/database');
        Database = DatabaseClass;
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// GET - Get bookings for specific barber
async function GET(request, { params }) {
    try {
        await initializeDatabase();

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
            const allBookings = await Database.getBookingsByDate(date);
            bookings = allBookings.filter(booking => booking.barber === barberId);
        } else {
            // Get all bookings for this barber
            bookings = await Database.getBookingsByBarber(barberId);
        }

        // Filter by status if provided
        if (status) {
            bookings = bookings.filter(booking => booking.status === status);
        }

        return NextResponse.json({
            barber: barberId,
            bookings: bookings
        });

    } catch (error) {
        console.error('Barber bookings fetch error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت رزروهای آرایشگر' },
            { status: 500 }
        );
    }
}

// POST - Update booking status for barber
async function POST(request, { params }) {
    try {
        await initializeDatabase();

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
        const booking = await Database.getBookingById(bookingId);

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
        const updatedBooking = await Database.updateBooking(bookingId, {
            status: status,
            notes: notes || booking.notes,
            updated_at: new Date().toISOString()
        });

        return NextResponse.json({
            message: 'وضعیت رزرو با موفقیت به‌روزرسانی شد',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Booking status update error:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی وضعیت رزرو' },
            { status: 500 }
        );
    }
}

export { GET, POST };
