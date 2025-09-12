// JavaScript version of bookings route with file-based database
import { NextResponse } from 'next/server';
import { SimpleFileDB } from '../../../lib/fileDatabase.js';

// POST - Create new booking
async function POST(request) {
    try {
        const bookingData = await request.json();
        const { user_id, date_key, start_time, end_time, barber, services, total_duration, user_name, user_phone } = bookingData;

        console.log('📝 Received booking data:', bookingData);

        if (!user_id || !date_key || !start_time || !end_time || !barber || !services) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        // Check for booking conflicts
        const hasConflict = SimpleFileDB.hasConflict(date_key, start_time, end_time, barber);

        if (hasConflict) {
            return NextResponse.json(
                { error: 'این زمان قبلاً رزرو شده است' },
                { status: 409 }
            );
        }

        // Create new booking
        const newBooking = SimpleFileDB.addBooking({
            user_id,
            date_key,
            start_time,
            end_time,
            barber,
            services: Array.isArray(services) ? services : [services],
            total_duration: total_duration || 60,
            status: 'confirmed',
            user_name: user_name || 'کاربر',
            user_phone: user_phone || user_id,
            persian_date: bookingData.persian_date
        });

        if (newBooking) {
            console.log('✅ Booking saved successfully to file database');
            return NextResponse.json({
                message: 'رزرو با موفقیت ثبت شد',
                booking: newBooking,
                source: 'file-database'
            });
        } else {
            throw new Error('Failed to save booking');
        }

    } catch (error) {
        console.error('❌ Booking creation error:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت رزرو' },
            { status: 500 }
        );
    }
}

// GET - Get bookings by date or user
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const user_id = searchParams.get('user_id');
        const barber = searchParams.get('barber');

        let bookings = [];

        if (date) {
            bookings = SimpleFileDB.getBookingsByDate(date);
            if (barber) {
                bookings = bookings.filter(booking => booking.barber === barber);
            }
        } else if (user_id) {
            bookings = SimpleFileDB.getBookingsByUser(user_id);
        } else {
            bookings = SimpleFileDB.getAllBookings();
        }

        console.log(`📊 Retrieved ${bookings.length} bookings from file database`);

        return NextResponse.json({
            bookings,
            source: 'file-database',
            total: bookings.length
        });

    } catch (error) {
        console.error('❌ Booking fetch error:', error);
        return NextResponse.json(
            {
                bookings: [],
                error: 'خطا در دریافت رزروها',
                source: 'error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Cancel booking
async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get('id');

        if (!bookingId) {
            return NextResponse.json(
                { error: 'شناسه رزرو الزامی است' },
                { status: 400 }
            );
        }

        // Find booking
        const booking = SimpleFileDB.getBookingById(bookingId);

        if (!booking) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        // Delete booking
        const success = SimpleFileDB.deleteBooking(bookingId);

        if (success) {
            return NextResponse.json({
                message: 'رزرو با موفقیت لغو شد'
            });
        } else {
            throw new Error('Failed to delete booking');
        }

    } catch (error) {
        console.error('❌ Booking deletion error:', error);
        return NextResponse.json(
            { error: 'خطا در لغو رزرو' },
            { status: 500 }
        );
    }
}

// PUT - Update booking
async function PUT(request) {
    try {
        const updateData = await request.json();
        const { id, ...bookingUpdates } = updateData;

        if (!id) {
            return NextResponse.json(
                { error: 'شناسه رزرو الزامی است' },
                { status: 400 }
            );
        }

        // Find existing booking
        const existingBooking = SimpleFileDB.getBookingById(id);

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

            const hasConflict = SimpleFileDB.hasConflict(checkDate, checkStart, checkEnd, checkBarber, id);

            if (hasConflict) {
                return NextResponse.json(
                    { error: 'این زمان قبلاً رزرو شده است' },
                    { status: 409 }
                );
            }
        }

        // Update booking
        const updatedBooking = SimpleFileDB.updateBooking(id, bookingUpdates);

        if (updatedBooking) {
            return NextResponse.json({
                message: 'رزرو با موفقیت به‌روزرسانی شد',
                booking: updatedBooking
            });
        } else {
            throw new Error('Failed to update booking');
        }

    } catch (error) {
        console.error('❌ Booking update error:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی رزرو' },
            { status: 500 }
        );
    }
}

export { POST, GET, DELETE, PUT };
