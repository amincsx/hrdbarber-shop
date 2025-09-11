import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';

// Initialize database connection on first request
let isInitialized = false;

async function initializeDatabase() {
    if (!isInitialized) {
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// GET - Get bookings for specific barber
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ barberId: string }> }
) {
    try {
        await initializeDatabase();
        
        const { barberId } = await params;
        const decodedBarberId = decodeURIComponent(barberId);
        
        // Get bookings for this barber using MongoDB
        const bookings = await Database.getBookingsByBarber(decodedBarberId);

        // Sort bookings by date and time
        const sortedBookings = bookings.sort((a, b) => {
            const dateA = new Date(a.dateKey + 'T' + a.startTime);
            const dateB = new Date(b.dateKey + 'T' + b.startTime);
            return dateA.getTime() - dateB.getTime();
        });

        return NextResponse.json({
            barber: decodedBarberId,
            bookings: sortedBookings,
            total_bookings: sortedBookings.length
        });

    } catch (error) {
        console.error('Error fetching barber bookings:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت رزروها' },
            { status: 500 }
        );
    }
}

// PUT - Update booking status (confirm, cancel, etc.)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await params;
        const { booking_id, status, notes } = await request.json();

        if (!booking_id || !status) {
            return NextResponse.json(
                { error: 'شناسه رزرو و وضعیت الزامی است' },
                { status: 400 }
            );
        }

        const bookings = await readBookings();
        const bookingIndex = bookings.findIndex((b: any) =>
            b.id === booking_id && (b.barber === barberId || b.barber === decodeURIComponent(barberId))
        );

        if (bookingIndex === -1) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        // Update booking
        bookings[bookingIndex] = {
            ...bookings[bookingIndex],
            status,
            notes: notes || bookings[bookingIndex].notes,
            updated_at: new Date().toISOString()
        };

        // Write updated bookings
        await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

        return NextResponse.json({
            message: 'رزرو با موفقیت به‌روزرسانی شد',
            booking: bookings[bookingIndex]
        });

    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی رزرو' },
            { status: 500 }
        );
    }
}
