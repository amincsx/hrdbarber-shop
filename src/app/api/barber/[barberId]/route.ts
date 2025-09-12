// This file has been replaced by route.js - please delete this file
// Using the JavaScript version with SimpleFileDB instead

// Type exports to ensure this file is recognized as a module
export type BarberParams = {
    barberId: string;
};

export type BarberBookingQuery = {
    date?: string;
    status?: string;
};

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

// PUT - Update booking status (for barber)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ barberId: string }> }
) {
    try {
        await initializeDatabase();

        const { barberId } = await params;
        const { bookingId, status, notes } = await request.json();

        if (!bookingId || !status) {
            return NextResponse.json(
                { error: 'شناسه نوبت و وضعیت الزامی است' },
                { status: 400 }
            );
        }

        // Verify booking belongs to this barber
        const booking = await Database.findBookingById(bookingId);

        if (!booking || booking.barberId !== decodeURIComponent(barberId)) {
            return NextResponse.json(
                { error: 'نوبت یافت نشد یا متعلق به این آرایشگر نیست' },
                { status: 403 }
            );
        }

        // Update booking status
        const updatedBooking = await Database.updateBookingStatus(bookingId, status, notes);

        if (!updatedBooking) {
            return NextResponse.json(
                { error: 'خطا در به‌روزرسانی وضعیت نوبت' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'وضعیت نوبت به‌روزرسانی شد',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی وضعیت نوبت' },
            { status: 500 }
        );
    }
}
