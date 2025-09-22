// JavaScript version of auth route to bypass TypeScript module detection
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';
import jwt from 'jsonwebtoken';

// POST - Register new user
async function POST(request) {
    try {
        console.log('🔐 POST /api/auth - User registration attempt');
        const userData = await request.json();
        const { first_name, last_name, phone, password, otpCode } = userData;

        console.log('📝 Registration data:', { first_name, last_name, phone: phone ? '***' : 'missing', password: password ? '***' : 'missing' });

        if (!first_name || !last_name || !phone || !password) {
            console.log('❌ Missing required fields');
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        // Check if user already exists
        console.log('🔍 Checking if user exists...');
        const existingUser = await MongoDatabase.findUserByPhone(phone);

        if (existingUser) {
            console.log('❌ User already exists');
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
                console.log('❌ Invalid OTP code');
                return NextResponse.json(
                    { error: 'کد تأیید نامعتبر است' },
                    { status: 400 }
                );
            }
        }

        // Create new user
        console.log('👤 Creating new user...');
        const newUser = await MongoDatabase.addUser({
            username: phone, // Use phone as username for regular users
            phone,
            password,
            name: `${first_name} ${last_name}`,
            role: 'user',
            isVerified: !!otpCode
        });

        console.log('✅ User created successfully:', newUser._id);
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
        console.error('❌ Registration error:', error.message);
        console.error('Stack trace:', error.stack);
        return NextResponse.json(
            { error: 'خطا در ثبت نام: ' + error.message },
            { status: 500 }
        );
    }
}

// PUT - Login user  
async function PUT(request) {
    try {
        console.log('🔐 PUT /api/auth - User login attempt');
        const { phone, password } = await request.json();

        console.log('📝 Login data:', { phone: phone ? '***' : 'missing', password: password ? '***' : 'missing' });

        if (!phone || !password) {
            console.log('❌ Missing phone or password');
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        // Find user by phone
        console.log('🔍 Looking up user by phone...');
        const user = await MongoDatabase.findUserByPhone(phone);

        if (!user) {
            console.log('❌ User not found for phone:', phone);
            return NextResponse.json(
                { error: 'کاربری با این شماره تلفن یافت نشد' },
                { status: 404 }
            );
        }

        console.log('✅ User found:', { id: user._id, name: user.name, role: user.role });

        // Verify the password matches the user's stored password
        if (!password || password !== user.password) {
            console.log('❌ Password mismatch');
            return NextResponse.json(
                { error: 'رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        console.log('✅ Login successful for user:', user.name);
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
        console.error('❌ Login error:', error.message);
        console.error('Stack trace:', error.stack);
        return NextResponse.json(
            { error: 'خطا در ورود: ' + error.message },
            { status: 500 }
        );
    }
    
}

// GET - Login user (alternative method)
async function GET(request) {
    try {
        console.log('🔐 GET /api/auth - User login attempt (GET method)');
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const password = searchParams.get('password');

        console.log('📝 Login data (GET):', { phone: phone ? '***' : 'missing', password: password ? '***' : 'missing' });

        if (!phone || !password) {
            console.log('❌ Missing phone or password in GET request');
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        // Find user by phone
        console.log('🔍 Looking up user by phone (GET)...');
        const user = await MongoDatabase.findUserByPhone(phone);

        if (!user) {
            console.log('❌ User not found for phone (GET):', phone);
            return NextResponse.json(
                { error: 'شماره تلفن یا رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        console.log('✅ User found (GET):', { id: user._id, name: user.name, role: user.role });

        // Verify the password matches the user's stored password
        if (!password || password !== user.password) {
            console.log('❌ Password mismatch (GET)');
            return NextResponse.json(
                { error: 'شماره تلفن یا رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        console.log('✅ Login successful (GET) for user:', user.name);
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
        console.error('❌ Login error (GET):', error.message);
        console.error('Stack trace:', error.stack);
        return NextResponse.json(
            { error: 'خطا در ورود: ' + error.message },
            { status: 500 }
        );
    }
}

export { POST, PUT, GET };
