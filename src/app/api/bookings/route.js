// JavaScript version of bookings route with MongoDB database
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

// POST - Create new booking
async function POST(request) {
    try {
        console.log('🔍 POST /api/bookings called at', new Date().toISOString());

        const bookingData = await request.json();
        const { user_id, date_key, start_time, end_time, barber, services, total_duration, user_name, user_phone } = bookingData;

        console.log('📝 Received booking data:', JSON.stringify(bookingData, null, 2));

        if (!user_id || !date_key || !start_time || !end_time || !barber || !services) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        // Check for booking conflicts by getting existing bookings for the same date and barber
        const existingBookings = await MongoDatabase.getBookingsByDate(date_key);
        const hasConflict = existingBookings.some(booking => {
            // Ignore different barbers
            if (booking.barber !== barber) return false;
            // Ignore cancelled bookings so their time is freed
            if (booking.status === 'cancelled') return false;

            const requestStart = start_time;
            const requestEnd = end_time;
            const existingStart = booking.start_time;
            const existingEnd = booking.end_time;

            return (requestStart < existingEnd && requestEnd > existingStart);
        });

        if (hasConflict) {
            return NextResponse.json(
                { error: 'این زمان قبلاً رزرو شده است' },
                { status: 409 }
            );
        }

        // Create new booking with pending status (waiting for barber confirmation)
        console.log('💾 Attempting to save booking to MongoDB...');
        const bookingToSave = {
            user_id,
            date_key,
            start_time,
            end_time,
            barber,
            services: Array.isArray(services) ? services : [services],
            total_duration: total_duration || 60,
            status: 'pending', // Booking starts as pending, waiting for barber acceptance
            user_name: user_name || 'کاربر',
            user_phone: user_phone || user_id,
            persian_date: bookingData.persian_date
        };
        console.log('📦 Booking object to save:', JSON.stringify(bookingToSave, null, 2));

        const newBooking = await MongoDatabase.addBooking(bookingToSave);

        if (newBooking) {
            console.log('✅ Booking saved successfully to MongoDB');
            console.log('🆔 Booking ID:', newBooking._id?.toString());

            // Send push notification to the barber about new pending booking
            try {
                // Get barber username for URL
                const barberUser = await MongoDatabase.getUserByUsername(barber) ||
                    (await MongoDatabase.getUsersByRole('barber')).find(u => u.name === barber);
                const barberUsername = barberUser?.username || barber;

                const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/barber/notify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        barberId: barber,
                        title: '⏳ درخواست رزرو جدید!',
                        body: `مشتری: ${user_name || 'کاربر'}\nخدمات: ${services.join(', ')}\nزمان: ${start_time}\n\nلطفاً تایید یا رد کنید`,
                        data: {
                            bookingId: newBooking.id || newBooking._id,
                            barberId: barberUsername,
                            date: date_key,
                            time: start_time,
                            status: 'pending',
                            url: `/barber-dashboard/${encodeURIComponent(barberUsername)}?notification=1`
                        }
                    })
                });

                if (notificationResponse.ok) {
                    console.log('✅ Notification sent to barber:', barber);
                } else {
                    console.log('⚠️ Failed to send notification to barber');
                }
            } catch (notifError) {
                console.error('⚠️ Notification error (non-critical):', notifError);
                // Don't fail the booking if notification fails
            }

            return NextResponse.json({
                message: 'رزرو با موفقیت ثبت شد',
                booking: newBooking,
                source: 'mongodb'
            });
        } else {
            throw new Error('Failed to save booking');
        }

    } catch (error) {
        console.error('❌ Booking creation error:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        return NextResponse.json(
            { error: 'خطا در ثبت رزرو', details: error.message },
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
            bookings = await MongoDatabase.getBookingsByDate(date);
            if (barber) {
                bookings = bookings.filter(booking => booking.barber === barber);
            }
        } else if (barber) {
            bookings = await MongoDatabase.getBookingsByBarber(barber);
        } else if (user_id) {
            const allBookings = await MongoDatabase.getAllBookings();
            bookings = allBookings.filter(booking => booking.user_id === user_id);
        } else {
            bookings = await MongoDatabase.getAllBookings();
        }

        console.log(`📊 Retrieved ${bookings.length} bookings from MongoDB`);

        return NextResponse.json({
            bookings,
            source: 'mongodb',
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
        const { booking_id, user_phone } = await request.json();

        if (!booking_id) {
            return NextResponse.json(
                { error: 'شناسه رزرو الزامی است' },
                { status: 400 }
            );
        }

        console.log('🗑️ Cancelling booking:', booking_id, 'for user:', user_phone);

        // Find booking in MongoDB
        const allBookings = await MongoDatabase.getAllBookings();
        const booking = allBookings.find(b => b._id === booking_id || b.id === booking_id);

        if (!booking) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        // Verify user ownership if user_phone provided
        if (user_phone && booking.user_phone !== user_phone && booking.user_id !== user_phone) {
            return NextResponse.json(
                { error: 'شما مجاز به لغو این رزرو نیستید' },
                { status: 403 }
            );
        }

        // Check if booking can still be cancelled (more than 1 hour before start)
        const now = new Date();
        const bookingDateTime = new Date(booking.date_key + 'T' + booking.start_time);
        const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDifference < 1) {
            return NextResponse.json(
                { error: 'زمان لغو به پایان رسیده است (کمتر از یک ساعت مانده)' },
                { status: 400 }
            );
        }

        // Delete the booking from database
        await MongoDatabase.deleteBooking(bookingId);

        // Send notification to barber about the cancellation
        try {
            // Get barber username for URL
            const barberUser = await MongoDatabase.getUserByUsername(booking.barber) ||
                (await MongoDatabase.getUsersByRole('barber')).find(u => u.name === booking.barber);
            const barberUsername = barberUser?.username || booking.barber;

            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/barber/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    barberId: booking.barber,
                    title: '❌ لغو رزرو',
                    body: `مشتری ${booking.user_name || 'کاربر'} رزرو خود را لغو کرد.\n\nتاریخ: ${booking.date}\nساعت: ${booking.start_time}\nخدمات: ${booking.services?.join(', ') || 'نامشخص'}`,
                    data: {
                        bookingId: bookingId,
                        barberId: barberUsername,
                        date: booking.date,
                        time: booking.start_time,
                        status: 'cancelled',
                        url: `/barber-dashboard/${encodeURIComponent(barberUsername)}?notification=1`
                    }
                })
            });
            console.log('✅ Cancellation notification sent to barber');
        } catch (notifError) {
            console.error('⚠️ Failed to send cancellation notification:', notifError);
            // Don't fail the cancellation if notification fails
        }

        return NextResponse.json({
            success: true,
            message: 'رزرو با موفقیت لغو شد'
        });

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
        const allBookings = await MongoDatabase.getAllBookings();
        const existingBooking = allBookings.find(b => b._id === id || b.id === id);

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

            // Check for conflicts with other bookings
            const existingBookings = await MongoDatabase.getBookingsByDate(checkDate);
            const hasConflict = existingBookings.some(booking => {
                if (booking.id === id) return false; // Skip current booking
                if (booking.barber !== checkBarber) return false;
                if (booking.status === 'cancelled') return false; // Ignore cancelled

                const requestStart = checkStart;
                const requestEnd = checkEnd;
                const existingStart = booking.start_time;
                const existingEnd = booking.end_time;

                return (requestStart < existingEnd && requestEnd > existingStart);
            });

            if (hasConflict) {
                return NextResponse.json(
                    { error: 'این زمان قبلاً رزرو شده است' },
                    { status: 409 }
                );
            }
        }

        // Update booking
        const updatedBooking = await MongoDatabase.updateBooking(id, bookingUpdates);

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
