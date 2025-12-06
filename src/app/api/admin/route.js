// JavaScript version of admin route to bypass TypeScript module detection
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

// POST - Admin login (owner and barber) and barber management
async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const body = await request.json();

        // Handle barber creation
        if (action === 'create-barber') {
            const { username, name, password, role } = body;

            console.log('🆕 Creating new barber:', { username, name, role });

            if (!username || !name || !password || !role) {
                return NextResponse.json({
                    success: false,
                    message: 'همه فیلدها الزامی است'
                }, { status: 400 });
            }

            // Check if username already exists
            const existingUser = await MongoDatabase.getUserByUsername(username);
            if (existingUser) {
                return NextResponse.json({
                    success: false,
                    message: 'نام کاربری قبلاً استفاده شده است'
                }, { status: 400 });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new barber user
            const newBarber = {
                username,
                name,
                password: hashedPassword,
                role: 'barber',
                created_at: new Date().toISOString(),
                availability: {
                    workingHours: { start: 10, end: 21 },
                    lunchBreak: { start: 14, end: 15 },
                    offDays: [],
                    offHours: [],
                    isAvailable: true
                }
            };

            const result = await MongoDatabase.createUser(newBarber);
            if (result.success) {
                console.log('✅ Barber created successfully:', username);
                return NextResponse.json({
                    success: true,
                    message: 'آرایشگر با موفقیت اضافه شد',
                    barber: result.user
                });
            } else {
                return NextResponse.json({
                    success: false,
                    message: 'خطا در ایجاد آرایشگر'
                }, { status: 500 });
            }
        }

        // Handle barber deletion
        if (action === 'delete-barber') {
            const { barberId } = body;

            console.log('🗑️ Deleting barber:', barberId);

            if (!barberId) {
                return NextResponse.json({
                    success: false,
                    message: 'شناسه آرایشگر الزامی است'
                }, { status: 400 });
            }

            const result = await MongoDatabase.deleteUser(barberId);
            if (result.success) {
                console.log('✅ Barber deleted successfully:', barberId);
                return NextResponse.json({
                    success: true,
                    message: 'آرایشگر با موفقیت حذف شد'
                });
            } else {
                return NextResponse.json({
                    success: false,
                    message: 'خطا در حذف آرایشگر'
                }, { status: 500 });
            }
        }

        // Original login logic
        const { username, password, type } = body;

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
        // await MongoDatabase.initializeBarberAuth(); // Disabled - using manual initialization instead

        // Owner login - Database only (no hardcoded credentials)
        if (type === 'owner') {
            console.log('🔍 Processing owner login from MongoDB...');

            // Try to find admin user by username (try both 'ceo' and username provided)
            let adminUser = await MongoDatabase.getUserByUsername(username);

            // If not found and username is 'owner', try 'ceo' as well
            if (!adminUser && username === 'owner') {
                adminUser = await MongoDatabase.getUserByUsername('ceo');
            }

            console.log('  - Admin user found:', !!adminUser);

            if (!adminUser || adminUser.role !== 'admin') {
                console.log('❌ Admin user not found or wrong role');
                return NextResponse.json(
                    { success: false, error: 'کاربر مدیر یافت نشد. لطفاً ابتدا حساب کاربری ایجاد کنید.' },
                    { status: 404 }
                );
            }

            console.log('  - Password check:', password === adminUser.password);
            if (adminUser.password !== password) {
                console.log('❌ Wrong password for admin');
                return NextResponse.json(
                    { success: false, error: 'رمز عبور اشتباه است' },
                    { status: 401 }
                );
            }

            console.log('✅ Owner login successful');
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

        // Barber login - Use MongoDB
        if (type === 'barber') {
            console.log('🔍 Processing barber login from MongoDB...');
            console.log('  - Looking for username:', username);

            const user = await MongoDatabase.getUserByUsername(username);
            console.log('  - User found in database:', !!user);

            if (user) {
                console.log('  - User details:', {
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    hasPassword: !!user.password
                });
            } else {
                // Try to find all barber users for debugging
                console.log('  - Searching for all barber users...');
                const allBarbers = await MongoDatabase.getUsersByRole('barber');
                console.log('  - Found barber users:', allBarbers.map(b => ({
                    username: b.username,
                    name: b.name,
                    role: b.role
                })));
            }

            if (!user || user.role !== 'barber') {
                console.log('❌ Barber not found for username:', username);
                return NextResponse.json(
                    { success: false, error: 'آرایشگری با این نام یافت نشد' },
                    { status: 404 }
                );
            }

            console.log('  - Password check with bcrypt...');
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('  - Password match (bcrypt):', passwordMatch);

            // Fallback: also check plain text password for backward compatibility
            let finalMatch = passwordMatch || (password === user.password);
            if (!passwordMatch && password === user.password) {
                console.log('  - Password match (plain text fallback):', true);
            }

            if (!finalMatch) {
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
