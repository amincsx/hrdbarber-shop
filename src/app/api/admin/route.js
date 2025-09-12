// JavaScript version of admin route to bypass TypeScript module detection
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

// POST - Admin login (owner and barber)
async function POST(request) {
    try {
        const { username, password, type } = await request.json();

        console.log('🔐 Admin login attempt:');
        console.log('  - Username:', username);
        console.log('  - Type:', type);
        console.log('  - Password provided:', !!password);

        if (!username || !password || !type) {
            console.log('❌ Missing required fields');
            return NextResponse.json(
                { error: 'نام کاربری، رمز عبور و نوع کاربر الزامی است' },
                { status: 400 }
            );
        }

        // Initialize barber authentication accounts if needed
        await MongoDatabase.initializeBarberAuth();

        // Owner login
        if (type === 'owner') {
            // Check for admin/CEO user in the database
            const adminUser = await MongoDatabase.getUserByUsername('ceo');

            if (adminUser && adminUser.password === password) {
                return NextResponse.json({
                    success: true,
                    message: 'ورود مدیر موفقیت‌آمیز',
                    user: {
                        id: adminUser._id,
                        name: adminUser.name || 'مدیر سیستم',
                        type: 'owner',
                        username: adminUser.username
                    }
                });
            }

            // Also support hardcoded credentials as fallback
            else if ((username === 'owner' && password === 'owner123') ||
                (username === 'ceo' && password === 'instad')) {
                return NextResponse.json({
                    success: true,
                    message: 'ورود مدیر موفقیت‌آمیز',
                    user: {
                        id: 'owner-1',
                        name: 'مدیر سیستم',
                        type: 'owner',
                        username: username
                    }
                });
            } else {
                return NextResponse.json(
                    { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }
        }

        // Barber login - Use MongoDB
        if (type === 'barber') {
            console.log('🔍 Processing barber login from MongoDB...');

            const user = await MongoDatabase.getUserByUsername(username);
            console.log('  - User found in database:', !!user);

            if (!user || user.role !== 'barber') {
                console.log('❌ Barber not found for username:', username);
                return NextResponse.json(
                    { success: false, error: 'آرایشگری با این نام یافت نشد' },
                    { status: 404 }
                );
            }

            console.log('  - Password check:', password === user.password);
            if (password !== user.password) {
                console.log('❌ Wrong password for barber:', username);
                return NextResponse.json(
                    { success: false, error: 'رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }

            console.log('✅ Barber login successful:', user.name);
            return NextResponse.json({
                success: true,
                message: 'ورود آرایشگر موفقیت‌آمیز',
                user: {
                    id: `barber-${user.username}`,
                    name: user.name,
                    type: 'barber',
                    username: user.username,
                    barber_id: user.barber_id
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

        if (action === 'barbers') {
            const barbers = await MongoDatabase.getAllBarbers();
            return NextResponse.json({ barbers: barbers });
        }

        if (action === 'bookings') {
            const bookings = await MongoDatabase.getAllBookings();
            return NextResponse.json({ bookings: bookings });
        }

        // Default: return both
        const [barbers, bookings] = await Promise.all([
            MongoDatabase.getAllBarbers(),
            MongoDatabase.getAllBookings()
        ]);

        return NextResponse.json({
            barbers: barbers,
            bookings: bookings
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
