import { NextRequest, NextResponse } from 'next/server';
// Use dynamic import to avoid module resolution issues
// import Database from '../../../lib/database';

// Force this file to be treated as an ES module
export { };

// Type exports to ensure this file is recognized as a module
export type AdminLoginRequest = {
    username: string;
    password: string;
    type: 'owner' | 'barber';
};

export type AdminLoginResponse = {
    message: string;
    admin?: any;
    error?: string;
};

// Initialize database connection on first request
let isInitialized = false;
let Database: any;

async function initializeDatabase() {
    if (!isInitialized) {
        // Dynamic import to avoid module resolution issues
        const { default: DatabaseClass } = await import('../../../lib/database');
        Database = DatabaseClass;
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// POST - Barber/Owner login
export async function POST(request: NextRequest) {
    try {
        await initializeDatabase();

        const { username, password, type } = await request.json();

        if (!username || !password || !type) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        if (type === 'owner') {
            // Owner login (you can change these credentials)
            if (username === 'owner' && password === 'owner123') {
                return NextResponse.json({
                    message: 'ورود مدیر موفقیت‌آمیز',
                    user: {
                        username: 'owner',
                        type: 'owner',
                        role: 'admin'
                    }
                });
            } else {
                return NextResponse.json(
                    { error: 'نام کاربری یا رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }
        }

        if (type === 'barber') {
            // Find barber by name (username)
            const barber = await Database.findBarberByName(username);

            if (!barber) {
                return NextResponse.json(
                    { error: 'آرایشگری با این نام یافت نشد' },
                    { status: 404 }
                );
            }

            // In a real app, you'd verify the password hash here
            // For now, we'll just check if password matches phone or is a default
            if (password === barber.phone || password === 'barber123') {
                return NextResponse.json({
                    message: 'ورود آرایشگر موفقیت‌آمیز',
                    user: {
                        id: barber._id,
                        name: barber.name,
                        phone: barber.phone,
                        type: 'barber',
                        role: 'barber',
                        specialties: barber.specialties
                    }
                });
            } else {
                return NextResponse.json(
                    { error: 'رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }
        }

        return NextResponse.json(
            { error: 'نوع کاربر نامعتبر است' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'خطا در ورود' },
            { status: 500 }
        );
    }
}

// GET - Get all barbers (for admin panel)
export async function GET(request: NextRequest) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'barbers') {
            const barbers = await Database.getAllBarbers();
            return NextResponse.json({
                barbers: barbers
            });
        }

        if (action === 'bookings') {
            const bookings = await Database.getAllBookings();
            return NextResponse.json({
                bookings: bookings
            });
        }

        return NextResponse.json(
            { error: 'عملیات نامعتبر است' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Admin GET error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات' },
            { status: 500 }
        );
    }
}

// PUT - Add new barber
export async function PUT(request: NextRequest) {
    try {
        await initializeDatabase();

        const barberData = await request.json();
        const { name, phone, specialties, schedule } = barberData;

        if (!name || !phone) {
            return NextResponse.json(
                { error: 'نام و شماره تلفن الزامی است' },
                { status: 400 }
            );
        }

        // Check if barber already exists
        const existingBarber = await Database.findBarberByName(name);
        if (existingBarber) {
            return NextResponse.json(
                { error: 'آرایشگری با این نام قبلاً ثبت شده است' },
                { status: 409 }
            );
        }

        // Create new barber
        const newBarber = await Database.createBarber({
            name,
            phone,
            specialties: specialties || ['اصلاح مو', 'اصلاح ریش'],
            isActive: true,
            schedule: schedule || {
                saturday: { start: '09:00', end: '21:00', isAvailable: true },
                sunday: { start: '09:00', end: '21:00', isAvailable: true },
                monday: { start: '09:00', end: '21:00', isAvailable: true },
                tuesday: { start: '09:00', end: '21:00', isAvailable: true },
                wednesday: { start: '09:00', end: '21:00', isAvailable: true },
                thursday: { start: '09:00', end: '21:00', isAvailable: true },
                friday: { start: '14:00', end: '21:00', isAvailable: true }
            }
        });

        return NextResponse.json({
            message: 'آرایشگر با موفقیت اضافه شد',
            barber: newBarber
        });

    } catch (error) {
        console.error('Add barber error:', error);
        return NextResponse.json(
            { error: 'خطا در اضافه کردن آرایشگر' },
            { status: 500 }
        );
    }
}
