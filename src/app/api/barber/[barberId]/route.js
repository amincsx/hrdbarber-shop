// JavaScript version of barber route with MongoDB database
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';
import { convertToJalaliDateString } from '../../../../lib/numberUtils.ts';

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

        // Decode the barberId - it should be either a MongoDB ObjectId or username for backward compatibility
        const decodedBarberId = decodeURIComponent(barberId);
        console.log('🔍 Looking up barber for:', decodedBarberId);

        // Try to get barber by ID first (if it looks like MongoDB ObjectId)
        let barberRecord = null;
        let barberUser = null;

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(decodedBarberId);

        if (isObjectId) {
            // Direct barber ID lookup
            console.log('  - Using barber ID lookup');
            barberRecord = await MongoDatabase.getBarberById(decodedBarberId);
            if (barberRecord && barberRecord.user_id) {
                barberUser = await MongoDatabase.getUserById(barberRecord.user_id);
            }
        } else {
            // Backward compatibility: lookup by username
            console.log('  - Using username lookup for backward compatibility');
            barberUser = await MongoDatabase.getUserByUsername(decodedBarberId);
            if (barberUser && barberUser.barber_id) {
                barberRecord = await MongoDatabase.getBarberById(barberUser.barber_id);
            }
        }

        if (!barberRecord) {
            console.log('❌ Barber record not found');
            return NextResponse.json(
                { error: 'آرایشگر یافت نشد', total_bookings: 0, bookings: [] },
                { status: 404 }
            );
        }

        console.log('  - Barber ID:', barberRecord._id);
        console.log('  - Barber name:', barberRecord.name);
        console.log('  - User found:', barberUser ? 'yes' : 'no');

        let bookings;

        if (date) {
            // Get bookings for specific date using barber_id
            console.log('📅 Getting bookings for date:', date);
            bookings = await MongoDatabase.getBookingsByBarberIdAndDate(barberRecord._id, date);
        } else if (status) {
            // Get bookings by status using barber_id
            console.log('📊 Getting bookings by status:', status);
            bookings = await MongoDatabase.getBookingsByBarberIdAndStatus(barberRecord._id, status);
        } else {
            // Get all bookings for this barber using barber_id
            console.log('📊 Getting all bookings for barber ID:', barberRecord._id);
            bookings = await MongoDatabase.getBookingsByBarberId(barberRecord._id);

            // Fallback: Also search by name for old bookings that might not have barber_id yet
            const oldBookings = await MongoDatabase.getBookingsByBarber(barberRecord.name);

            // Merge and deduplicate
            const allBookings = [...bookings, ...oldBookings];
            const uniqueBookings = Array.from(
                new Map(allBookings.map(b => [b._id?.toString() || b.id, b])).values()
            );
            bookings = uniqueBookings;

            console.log(`📊 Found ${bookings.length} total bookings (${bookings.length - oldBookings.length} with barber_id, ${oldBookings.length} legacy)`);
        }

        console.log(`✅ Returning ${bookings.length} bookings for barber ${decodedBarberId}`);
        if (bookings.length > 0) {
            console.log('  - Sample booking:', {
                user: bookings[0].user_name,
                date: bookings[0].date_key,
                time: bookings[0].start_time,
                barber: bookings[0].barber
            });
        }

        return NextResponse.json({
            barber: decodedBarberId,
            bookings: bookings,
            total_bookings: bookings.length
        });

    } catch (error) {
        console.error('❌ Barber bookings fetch error:', error);
        console.error('❌ Error stack:', error.stack);
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

// PUT - Update booking status for barber (alternative method)
async function PUT(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;
        const decodedBarberId = decodeURIComponent(barberId);

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        // Accept both booking_id and bookingId for compatibility
        const requestData = await request.json();
        const bookingId = requestData.booking_id || requestData.bookingId;
        const { status, notes } = requestData;

        console.log('🔍 PUT request to update booking:', { bookingId, status, notes, barberId: decodedBarberId });

        if (!bookingId || !status) {
            return NextResponse.json(
                { error: 'شناسه رزرو و وضعیت الزامی است' },
                { status: 400 }
            );
        }

        // Find the booking
        const allBookings = await MongoDatabase.getAllBookings();
        const booking = allBookings.find(b =>
            b._id?.toString() === bookingId ||
            b.id === bookingId
        );

        console.log('🔍 Found booking:', booking ? 'yes' : 'no');

        if (!booking) {
            return NextResponse.json(
                { error: 'رزرو یافت نشد' },
                { status: 404 }
            );
        }

        // Get barber's Farsi name to compare
        const barberUser = await MongoDatabase.getUserByUsername(decodedBarberId);
        const barberName = barberUser ? barberUser.name : decodedBarberId;

        console.log('🔍 Barber verification:', {
            bookingBarber: booking.barber,
            urlBarberId: decodedBarberId,
            barberName: barberName
        });

        // Verify this booking belongs to the barber (check both username and name)
        if (booking.barber !== decodedBarberId && booking.barber !== barberName) {
            return NextResponse.json(
                { error: 'این رزرو متعلق به این آرایشگر نیست' },
                { status: 403 }
            );
        }

        // Update booking status using the _id or id
        const bookingIdToUpdate = booking._id?.toString() || booking.id;
        const updatedBooking = await MongoDatabase.updateBookingStatus(
            bookingIdToUpdate,
            status,
            notes !== undefined ? notes : booking.notes
        );

        console.log('✅ Booking updated:', updatedBooking ? 'yes' : 'no');

        if (updatedBooking) {
            // Send notification to user when barber confirms the booking
            if (status === 'confirmed') {
                try {
                    console.log('📱 Sending confirmation notification to user:', booking.user_phone || booking.user_id);

                    // TODO: Implement user notification API
                    // For now, log it for future implementation
                    const userNotificationData = {
                        userId: booking.user_id,
                        userPhone: booking.user_phone,
                        title: '✅ رزرو شما تایید شد!',
                        body: `آرایشگر: ${booking.barber}\nتاریخ: ${booking.date_key}\nساعت: ${booking.start_time}\nخدمات: ${booking.services.join(', ')}`,
                        data: {
                            bookingId: bookingIdToUpdate,
                            barberId: booking.barber,
                            date: booking.date_key,
                            time: booking.start_time,
                            status: 'confirmed'
                        }
                    };

                    console.log('✅ User notification data prepared:', userNotificationData);

                    // Send SMS notification if phone number exists
                    if (booking.user_phone && booking.user_phone.length >= 10) {
                        try {
                            const jalaliDate = convertToJalaliDateString(booking.date_key);
                            const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-otp`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    phone: booking.user_phone,
                                    message: `✅ رزرو شما تایید شد!\n\n👤 آرایشگر: ${booking.barber}\n📅 تاریخ: ${jalaliDate}\n🕐 ساعت: ${booking.start_time}\n✂️ خدمات: ${booking.services.join(', ')}\n\nبا تشکر از انتخاب شما`
                                })
                            });

                            if (smsResponse.ok) {
                                console.log('✅ SMS confirmation sent to user');
                            }
                        } catch (smsError) {
                            console.warn('⚠️ SMS notification failed (non-critical):', smsError.message);
                        }
                    }

                } catch (notifError) {
                    console.error('⚠️ User notification error (non-critical):', notifError);
                    // Don't fail the booking update if notification fails
                }
            }

            // Send notification to user when barber cancels/rejects the booking
            if (status === 'cancelled') {
                try {
                    console.log('📱 Sending cancellation notification to user:', booking.user_phone || booking.user_id);

                    // Send SMS notification if phone number exists
                    if (booking.user_phone && booking.user_phone.length >= 10) {
                        try {
                            const jalaliDate = convertToJalaliDateString(booking.date_key);
                            const cancellationReason = notes ? `\n\n📝 دلیل: ${notes}` : '';
                            const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-otp`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    phone: booking.user_phone,
                                    message: `❌ متاسفانه رزرو شما رد شد\n\n👤 آرایشگر: ${booking.barber}\n📅 تاریخ: ${jalaliDate}\n🕐 ساعت: ${booking.start_time}\n✂️ خدمات: ${booking.services.join(', ')}${cancellationReason}\n\nلطفا زمان دیگری انتخاب کنید`
                                })
                            });

                            if (smsResponse.ok) {
                                console.log('✅ SMS cancellation sent to user');
                            }
                        } catch (smsError) {
                            console.warn('⚠️ SMS notification failed (non-critical):', smsError.message);
                        }
                    }

                } catch (notifError) {
                    console.error('⚠️ User notification error (non-critical):', notifError);
                }
            }

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

export { GET, POST, PUT };
