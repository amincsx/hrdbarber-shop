// JavaScript version of admin route to bypass TypeScript module detection
const { NextResponse } = require('next/server');

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
        await initializeDatabase();

        const { username, password, type } = await request.json();

        if (!username || !password || !type) {
            return NextResponse.json(
                { error: 'نام کاربری، رمز عبور و نوع کاربر الزامی است' },
                { status: 400 }
            );
        }

        // Owner login
        if (type === 'owner') {
            // Default owner credentials (in production, use proper authentication)
            if (username === 'admin' && password === 'admin123') {
                return NextResponse.json({
                    message: 'ورود مدیر موفقیت‌آمیز',
                    admin: {
                        id: 'owner-1',
                        name: 'مدیر سیستم',
                        type: 'owner'
                    }
                });
            } else {
                return NextResponse.json(
                    { error: 'نام کاربری یا رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }
        }

        // Barber login
        if (type === 'barber') {
            const barber = await Database.findBarberByName(username);

            if (!barber) {
                return NextResponse.json(
                    { error: 'آرایشگری با این نام یافت نشد' },
                    { status: 404 }
                );
            }

            // Simple password check (in production, use proper password hashing)
            if (password !== 'barber123') {
                return NextResponse.json(
                    { error: 'رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }

            return NextResponse.json({
                message: 'ورود آرایشگر موفقیت‌آمیز',
                admin: {
                    id: barber._id,
                    name: barber.name,
                    type: 'barber',
                    specialties: barber.specialties,
                    workingHours: barber.workingHours
                }
            });
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

// GET - Get all barbers and bookings for admin panel
async function GET(request) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'barbers') {
            const barbers = await Database.getAllBarbers();
            return NextResponse.json({ barbers });
        }

        if (action === 'bookings') {
            const bookings = await Database.getAllBookings();
            return NextResponse.json({ bookings });
        }

        // Default: return both
        const barbers = await Database.getAllBarbers();
        const bookings = await Database.getAllBookings();

        return NextResponse.json({
            barbers,
            bookings
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
        await initializeDatabase();

        const { name, specialties, workingHours } = await request.json();

        if (!name || !specialties || !workingHours) {
            return NextResponse.json(
                { error: 'نام، تخصص‌ها و ساعات کاری الزامی است' },
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

        // Create new barber with default working hours
        const newBarber = await Database.createBarber({
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

module.exports = { POST, GET, PUT };
