// JavaScript version of auth route to bypass TypeScript module detection
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

// POST - Register new user
async function POST(request) {
    try {
        const userData = await request.json();
        const { first_name, last_name, phone, password, otpCode } = userData;

        if (!first_name || !last_name || !phone || !password) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await MongoDatabase.findUserByPhone(phone);

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
        const newUser = await MongoDatabase.addUser({
            username: phone, // Use phone as username for regular users
            phone,
            password,
            name: `${first_name} ${last_name}`,
            role: 'user',
            isVerified: !!otpCode
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
async function PUT(request) {
    try {
        const { phone, password } = await request.json();

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        // Find user by phone
        const user = await MongoDatabase.findUserByPhone(phone);

        if (!user) {
            return NextResponse.json(
                { error: 'کاربری با این شماره تلفن یافت نشد' },
                { status: 404 }
            );
        }

        // Verify the password matches the user's stored password
        if (!password || password !== user.password) {
            return NextResponse.json(
                { error: 'رمز عبور اشتباه است' },
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
async function GET(request) {
    try {
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
        const user = await MongoDatabase.findUserByPhone(phone);

        if (!user) {
            return NextResponse.json(
                { error: 'شماره تلفن یا رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        // Verify the password matches the user's stored password
        if (!password || password !== user.password) {
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

export { POST, PUT, GET };
