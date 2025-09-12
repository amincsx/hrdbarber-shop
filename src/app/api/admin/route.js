// JavaScript version of admin route to bypass TypeScript module detection
import { NextResponse } from 'next/server';

let isInitialized = false;
let Database;

async function initializeDatabase() {
    if (!isInitialized) {
        const { default: DatabaseClass } = await import('../../../lib/database');
        Database = DatabaseClass;
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// POST - Admin login (owner and barber)
async function POST(request) {
    try {
        const { username, password, type } = await request.json();

        if (!username || !password || !type) {
            return NextResponse.json(
                { error: 'نام کاربری، رمز عبور و نوع کاربر الزامی است' },
                { status: 400 }
            );
        }

        // Owner login
        if (type === 'owner') {
            // Test owner credentials
            if (username === 'owner' && password === 'owner123') {
                return NextResponse.json({
                    success: true,
                    message: 'ورود مدیر موفقیت‌آمیز',
                    user: {
                        id: 'owner-1',
                        name: 'مدیر سیستم',
                        type: 'owner',
                        username: 'owner'
                    }
                });
            } else {
                return NextResponse.json(
                    { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }
        }

        // Barber login - Test barbers
        if (type === 'barber') {
            const testBarbers = [
                { username: 'hamid', name: 'حمید', password: 'barber123' },
                { username: 'benyamin', name: 'بنیامین', password: 'barber123' },
                { username: 'mohammad', name: 'محمد', password: 'barber123' }
            ];

            const barber = testBarbers.find(b => b.username === username);

            if (!barber) {
                return NextResponse.json(
                    { success: false, error: 'آرایشگری با این نام یافت نشد' },
                    { status: 404 }
                );
            }

            if (password !== barber.password) {
                return NextResponse.json(
                    { success: false, error: 'رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'ورود آرایشگر موفقیت‌آمیز',
                user: {
                    id: `barber-${barber.username}`,
                    name: barber.name,
                    type: 'barber',
                    username: barber.username
                }
            });
        }

        return NextResponse.json(
            { success: false, error: 'نوع کاربر نامعتبر است' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در ورود' },
            { status: 500 }
        );
    }
}

// GET - Get all barbers and bookings for admin panel
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        // Mock data for local development
        const testBarbers = [
            {
                _id: 'barber-hamid',
                name: 'حمید',
                username: 'hamid',
                specialties: ['کوتاهی مو', 'اصلاح', 'رنگ مو'],
                workingHours: {
                    saturday: { start: '09:00', end: '21:00', isAvailable: true },
                    sunday: { start: '09:00', end: '21:00', isAvailable: true },
                    monday: { start: '09:00', end: '21:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '21:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '21:00', isAvailable: true },
                    thursday: { start: '09:00', end: '21:00', isAvailable: true },
                    friday: { start: '14:00', end: '21:00', isAvailable: true }
                }
            },
            {
                _id: 'barber-benyamin',
                name: 'بنیامین',
                username: 'benyamin',
                specialties: ['کوتاهی مو', 'اصلاح', 'فشن مو'],
                workingHours: {
                    saturday: { start: '09:00', end: '21:00', isAvailable: true },
                    sunday: { start: '09:00', end: '21:00', isAvailable: true },
                    monday: { start: '09:00', end: '21:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '21:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '21:00', isAvailable: true },
                    thursday: { start: '09:00', end: '21:00', isAvailable: true },
                    friday: { start: '14:00', end: '21:00', isAvailable: true }
                }
            },
            {
                _id: 'barber-mohammad',
                name: 'محمد',
                username: 'mohammad',
                specialties: ['کوتاهی مو', 'اصلاح', 'اتو مو'],
                workingHours: {
                    saturday: { start: '09:00', end: '21:00', isAvailable: true },
                    sunday: { start: '09:00', end: '21:00', isAvailable: true },
                    monday: { start: '09:00', end: '21:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '21:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '21:00', isAvailable: true },
                    thursday: { start: '09:00', end: '21:00', isAvailable: true },
                    friday: { start: '14:00', end: '21:00', isAvailable: true }
                }
            }
        ];

        // Get bookings from localStorage fallback
        const mockBookings = [];

        if (action === 'barbers') {
            return NextResponse.json({ barbers: testBarbers });
        }

        if (action === 'bookings') {
            return NextResponse.json({ bookings: mockBookings });
        }

        // Default: return both
        return NextResponse.json({
            barbers: testBarbers,
            bookings: mockBookings
        });

    } catch (error) {
        console.error('Admin data fetch error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات' },
            { status: 500 }
        );
    }
}

// PUT - Add new barber
async function PUT(request) {
    try {
        const { name, specialties, workingHours } = await request.json();

        if (!name || !specialties || !workingHours) {
            return NextResponse.json(
                { error: 'نام، تخصص‌ها و ساعات کاری الزامی است' },
                { status: 400 }
            );
        }

        // For local development, just return success
        const newBarber = {
            _id: `barber-${Date.now()}`,
            name,
            specialties: specialties || ['کوتاهی مو', 'اصلاح'],
            workingHours: workingHours || {
                saturday: { start: '09:00', end: '21:00', isAvailable: true },
                sunday: { start: '09:00', end: '21:00', isAvailable: true },
                monday: { start: '09:00', end: '21:00', isAvailable: true },
                tuesday: { start: '09:00', end: '21:00', isAvailable: true },
                wednesday: { start: '09:00', end: '21:00', isAvailable: true },
                thursday: { start: '09:00', end: '21:00', isAvailable: true },
                friday: { start: '14:00', end: '21:00', isAvailable: true }
            }
        };

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

export { POST, GET, PUT };
