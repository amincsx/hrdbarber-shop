import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Read bookings from file
async function readBookings() {
    try {
        const data = await fs.readFile(BOOKINGS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Read users from file
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// GET - Get bookings for specific barber
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await params;
        const bookings = await readBookings();
        const users = await readUsers();

        // Filter bookings for this barber
        const barberBookings = bookings.filter((booking: any) =>
            booking.barber === barberId ||
            booking.barber === decodeURIComponent(barberId)
        );

        // Enhance bookings with user information
        const enhancedBookings = barberBookings.map((booking: any) => {
            const user = users.find((u: any) => u.id === booking.user_id);
            return {
                ...booking,
                user_name: user ? `${user.first_name} ${user.last_name}` : 'نامشخص',
                user_phone: user ? user.phone : 'نامشخص'
            };
        });

        // Sort bookings by date and time
        enhancedBookings.sort((a: any, b: any) => {
            if (a.date_key !== b.date_key) {
                return new Date(a.date_key).getTime() - new Date(b.date_key).getTime();
            }
            return a.start_time.localeCompare(b.start_time);
        });

        return NextResponse.json({
            barber: barberId,
            bookings: enhancedBookings,
            total_bookings: enhancedBookings.length
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
