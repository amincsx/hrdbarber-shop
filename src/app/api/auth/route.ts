import { NextRequest, NextResponse } from 'next/server';
import Database from '../../../lib/database';

// Force this file to be treated as an ES module
export {};

// Type exports to ensure this file is recognized as a module
export type UserRegistration = {
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    otpCode?: string;
};

export type UserLogin = {
    phone: string;
    password: string;
};

// Initialize database connection on first request
let isInitialized = false;

async function initializeDatabase() {
    if (!isInitialized) {
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// POST - Register new user
export async function POST(request: NextRequest) {
    try {
        await initializeDatabase();

        const userData = await request.json();
        const { first_name, last_name, phone, password, otpCode } = userData;

        if (!first_name || !last_name || !phone || !password) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await Database.findUserByPhone(phone);

        if (existingUser) {
            return NextResponse.json(
                { error: 'کاربری با این شماره تلفن قبلاً ثبت نام کرده است' },
                { status: 409 }
            );
        }

        // Verify OTP if provided
        if (otpCode) {
            // In a real app, you'd verify the OTP here
            // For now, we'll just check if it's not empty
            if (!otpCode || otpCode.length < 4) {
                return NextResponse.json(
                    { error: 'کد تأیید نامعتبر است' },
                    { status: 400 }
                );
            }
        }

        // Create new user
        const newUser = await Database.createUser({
            phone,
            name: `${first_name} ${last_name}`,
            role: 'user',
            isVerified: !!otpCode // Verified if OTP was provided
        });

        return NextResponse.json({
            message: 'ثبت نام با موفقیت انجام شد',
            user: {
                id: newUser._id,
                name: newUser.name,
                phone: newUser.phone,
                role: newUser.role,
                isVerified: newUser.isVerified
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت نام' },
            { status: 500 }
        );
    }
}

// PUT - Login user  
export async function PUT(request: NextRequest) {
    try {
        await initializeDatabase();

        const { phone, password } = await request.json();

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        // Find user by phone
        const user = await Database.findUserByPhone(phone);

        if (!user) {
            return NextResponse.json(
                { error: 'کاربری با این شماره تلفن یافت نشد' },
                { status: 404 }
            );
        }

        // In a real app, you'd verify the password hash here
        // For now, we'll just check if password is not empty
        if (!password || password.length < 4) {
            return NextResponse.json(
                { error: 'رمز عبور نامعتبر است' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: 'ورود موفقیت‌آمیز بود',
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'خطا در ورود' },
            { status: 500 }
        );
    }
}

// GET - Login user (alternative method)
export async function GET(request: NextRequest) {
    try {
        await initializeDatabase();

        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const password = searchParams.get('password');

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        // Find user by phone
        const user = await Database.findUserByPhone(phone);

        if (!user) {
            return NextResponse.json(
                { error: 'شماره تلفن یا رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        // In a real app, you'd verify the password hash here
        // For now, we'll just check if password is not empty
        if (!password || password.length < 4) {
            return NextResponse.json(
                { error: 'شماره تلفن یا رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: 'ورود موفقیت‌آمیز',
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'خطا در ورود' },
            { status: 500 }
        );
    }
}
