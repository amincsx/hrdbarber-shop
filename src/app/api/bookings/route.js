// JavaScript version of bookings route to bypass TypeScript module detection
import { NextResponse } from 'next/server';

let isInitialized = false;
let Database;

async function initializeDatabase() {
    if (!isInitialized) {
        // Dynamic import to avoid module resolution issues
        const { default: DatabaseClass } = await import('../../../lib/database');
        Database = DatabaseClass;
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// POST - Create new booking
async function POST(request) {
    try {
        await initializeDatabase();

        const bookingData = await request.json();
        const { user_id, date_key, start_time, end_time, barber, services, total_duration } = bookingData;

        if (!user_id || !date_key || !start_time || !end_time || !barber || !services) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        // Check for booking conflicts
        const existingBookings = await Database.getBookingsByDate(date_key);
        const hasConflict = existingBookings.some(booking => {
            if (booking.barber !== barber) return false;
            
            const existingStart = booking.start_time;
            const existingEnd = booking.end_time;
            
            return (
                (start_time >= existingStart && start_time < existingEnd) ||
                (end_time > existingStart && end_time <= existingEnd) ||
                (start_time <= existingStart && end_time >= existingEnd)
            );
        });

        if (hasConflict) {
            return NextResponse.json(
                { error: 'این زمان قبلاً رزرو شده است' },
                { status: 409 }
            );
        }

        // Create new booking
        const newBooking = await Database.createBooking({
            user_id,
            date_key,
            start_time,
            end_time,
            barber,
            services: Array.isArray(services) ? services : [services],
            total_duration: total_duration || 60,
            status: 'confirmed',
            created_at: new Date().toISOString()
        });

        return NextResponse.json({
            message: 'رزرو با موفقیت ثبت شد',
            booking: newBooking
        });

    } catch (error) {
        console.error('Booking creation error:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت رزرو' },
            { status: 500 }
        );
    }
}

// GET - Get bookings by date or user
async function GET(request) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const user_id = searchParams.get('user_id');
        const barber = searchParams.get('barber');

        if (date) {
            const bookings = await Database.getBookingsByDate(date);
            let filteredBookings = bookings;

            if (barber) {
                filteredBookings = bookings.filter(booking => booking.barber === barber);
            }

            return NextResponse.json({ bookings: filteredBookings });
        }

        if (user_id) {
            const bookings = await Database.getBookingsByUser(user_id);
            return NextResponse.json({ bookings });
        }

        // Get all bookings if no filter specified
        const allBookings = await Database.getAllBookings();
        return NextResponse.json({ bookings: allBookings });

    } catch (error) {
        console.error('Booking fetch error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت رزروها' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel booking
async function DELETE(request) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get('id');

        if (!bookingId) {
            return NextResponse.json(
                { error: 'شناسه رزرو الزامی است' },
                { status: 400 }
            );
        }

        // Find and delete booking
        const booking = await Database.getBookingById(bookingId);

        if (!booking) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        await Database.deleteBooking(bookingId);

        return NextResponse.json({
            message: 'رزرو با موفقیت لغو شد'
        });

    } catch (error) {
        console.error('Booking deletion error:', error);
        return NextResponse.json(
            { error: 'خطا در لغو رزرو' },
            { status: 500 }
        );
    }
}

// PUT - Update booking
async function PUT(request) {
    try {
        await initializeDatabase();

        const updateData = await request.json();
        const { id, ...bookingUpdates } = updateData;

        if (!id) {
            return NextResponse.json(
                { error: 'شناسه رزرو الزامی است' },
                { status: 400 }
            );
        }

        // Find existing booking
        const existingBooking = await Database.getBookingById(id);

        if (!existingBooking) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        // Check for conflicts if time or date is being changed
        if (bookingUpdates.date_key || bookingUpdates.start_time || bookingUpdates.end_time || bookingUpdates.barber) {
            const checkDate = bookingUpdates.date_key || existingBooking.date_key;
            const checkStart = bookingUpdates.start_time || existingBooking.start_time;
            const checkEnd = bookingUpdates.end_time || existingBooking.end_time;
            const checkBarber = bookingUpdates.barber || existingBooking.barber;

            const existingBookings = await Database.getBookingsByDate(checkDate);
            const hasConflict = existingBookings.some(booking => {
                if (booking._id.toString() === id) return false; // Skip current booking
                if (booking.barber !== checkBarber) return false;
                
                const existingStart = booking.start_time;
                const existingEnd = booking.end_time;
                
                return (
                    (checkStart >= existingStart && checkStart < existingEnd) ||
                    (checkEnd > existingStart && checkEnd <= existingEnd) ||
                    (checkStart <= existingStart && checkEnd >= existingEnd)
                );
            });

            if (hasConflict) {
                return NextResponse.json(
                    { error: 'این زمان قبلاً رزرو شده است' },
                    { status: 409 }
                );
            }
        }

        // Update booking
        const updatedBooking = await Database.updateBooking(id, {
            ...bookingUpdates,
            updated_at: new Date().toISOString()
        });

        return NextResponse.json({
            message: 'رزرو با موفقیت به‌روزرسانی شد',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Booking update error:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی رزرو' },
            { status: 500 }
        );
    }
}

export { POST, GET, DELETE, PUT };
