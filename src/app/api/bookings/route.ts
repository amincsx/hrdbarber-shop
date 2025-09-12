import { NextRequest, NextResponse } from 'next/server';
import Database from '../../../lib/database';

// Force this file to be treated as an ES module
export { };

// Type exports to ensure this file is recognized as a module
export type BookingRequest = {
    user_id: string;
    date_key: string;
    start_time: string;
    end_time: string;
    barber: string;
    services: string | string[];
    total_duration?: number;
};

// Initialize database connection on first request
let isInitialized = false;

async function initializeDatabase() {
    if (!isInitialized) {
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
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

        // Check for time conflicts using MongoDB
        const conflictingBookings = await Database.findBookingsByDateAndBarber(date_key, barber);

        const hasConflict = conflictingBookings.some((b: any) =>
            (start_time >= b.startTime && start_time < b.endTime) ||
            (end_time > b.startTime && end_time <= b.endTime) ||
            (start_time <= b.startTime && end_time >= b.endTime)
        );

        if (hasConflict) {
            return NextResponse.json(
                { error: 'این زمان قبلاً رزرو شده است' },
                { status: 409 }
            );
        }

        // Create new booking
        const newBooking = await Database.createBooking({
            userId: user_id,
            userName: '', // We'll need to get this from user lookup
            userPhone: '', // We'll need to get this from user lookup  
            barberId: barber,
            dateKey: date_key,
            startTime: start_time,
            endTime: end_time,
            services: Array.isArray(services) ? services : [services],
            totalDuration: total_duration || 30,
            status: 'confirmed'
        });

        return NextResponse.json({
            message: 'نوبت با موفقیت رزرو شد',
            booking: newBooking
        });

    } catch (error) {
        console.error('Booking creation error:', error);
        return NextResponse.json(
            { error: 'خطا در رزرو نوبت' },
            { status: 500 }
        );
    }
}

// GET - Get bookings (by user_id or date_key)
export async function GET(request: NextRequest) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');
        const date_key = searchParams.get('date_key');

        let bookings;

        if (user_id) {
            bookings = await Database.findBookingsByUserId(user_id);
        } else if (date_key) {
            bookings = await Database.findBookingsByDate(date_key);
        } else {
            // Get all bookings
            bookings = await Database.getAllBookings();
        }

        return NextResponse.json({
            bookings: bookings
        });

    } catch (error) {
        console.error('Get bookings error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت نوبت‌ها' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel booking
export async function DELETE(request: NextRequest) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const booking_id = searchParams.get('booking_id');
        const user_id = searchParams.get('user_id');

        if (!booking_id || !user_id) {
            return NextResponse.json(
                { error: 'شناسه نوبت و کاربر الزامی است' },
                { status: 400 }
            );
        }

        const booking = await Database.findBookingById(booking_id);

        if (!booking || booking.userId !== user_id) {
            return NextResponse.json(
                { error: 'نوبت یافت نشد' },
                { status: 404 }
            );
        }

        await Database.deleteBooking(booking_id);

        return NextResponse.json({
            message: 'نوبت با موفقیت لغو شد'
        });

    } catch (error) {
        console.error('Delete booking error:', error);
        return NextResponse.json(
            { error: 'خطا در لغو نوبت' },
            { status: 500 }
        );
    }
}

// PUT - Update booking status
export async function PUT(request: NextRequest) {
    try {
        await initializeDatabase();

        const { booking_id, status } = await request.json();

        if (!booking_id || !status) {
            return NextResponse.json(
                { error: 'شناسه نوبت و وضعیت الزامی است' },
                { status: 400 }
            );
        }

        const updatedBooking = await Database.updateBookingStatus(booking_id, status);

        if (!updatedBooking) {
            return NextResponse.json(
                { error: 'نوبت یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'وضعیت نوبت به‌روزرسانی شد',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Update booking error:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی نوبت' },
            { status: 500 }
        );
    }
}
