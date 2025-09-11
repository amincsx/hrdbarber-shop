import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

// Read bookings from file
async function readBookings() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(BOOKINGS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write bookings to file
async function writeBookings(bookings: any[]) {
    await ensureDataDir();
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

// POST - Create new booking
export async function POST(request: NextRequest) {
    try {
        const bookingData = await request.json();
        const { user_id, date_key, start_time, end_time, barber, services, total_duration } = bookingData;

        if (!user_id || !date_key || !start_time || !end_time || !barber || !services) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        const bookings = await readBookings();

        // Check for time conflicts
        const conflictingBooking = bookings.find((b: any) =>
            b.date_key === date_key &&
            b.barber === barber &&
            (
                (start_time >= b.start_time && start_time < b.end_time) ||
                (end_time > b.start_time && end_time <= b.end_time) ||
                (start_time <= b.start_time && end_time >= b.end_time)
            )
        );

        if (conflictingBooking) {
            return NextResponse.json(
                { error: 'این زمان قبلاً رزرو شده است' },
                { status: 409 }
            );
        }

        // Create new booking
        const newBooking = {
            id: Date.now().toString(),
            user_id,
            date_key,
            start_time,
            end_time,
            barber,
            services: Array.isArray(services) ? services : [services],
            total_duration: total_duration || 30,
            created_at: new Date().toISOString()
        };

        bookings.push(newBooking);
        await writeBookings(bookings);

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
        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');
        const date_key = searchParams.get('date_key');

        const bookings = await readBookings();

        let filteredBookings = bookings;

        if (user_id) {
            filteredBookings = bookings.filter((b: any) => b.user_id === user_id);
            // Sort by date and time (most recent first)
            filteredBookings.sort((a: any, b: any) => {
                const dateA = new Date(a.date_key + 'T' + a.start_time);
                const dateB = new Date(b.date_key + 'T' + b.start_time);
                return dateB.getTime() - dateA.getTime();
            });
        } else if (date_key) {
            filteredBookings = bookings.filter((b: any) => b.date_key === date_key);
            // Sort by start time
            filteredBookings.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
        }

        return NextResponse.json({
            bookings: filteredBookings
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
        const { searchParams } = new URL(request.url);
        const booking_id = searchParams.get('booking_id');
        const user_id = searchParams.get('user_id');

        if (!booking_id || !user_id) {
            return NextResponse.json(
                { error: 'شناسه نوبت و کاربر الزامی است' },
                { status: 400 }
            );
        }

        const bookings = await readBookings();
        const bookingIndex = bookings.findIndex((b: any) => b.id === booking_id && b.user_id === user_id);

        if (bookingIndex === -1) {
            return NextResponse.json(
                { error: 'نوبت یافت نشد' },
                { status: 404 }
            );
        }

        bookings.splice(bookingIndex, 1);
        await writeBookings(bookings);

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
