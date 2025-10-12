// Barber self-registration endpoint
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

export async function POST(request) {
    try {
        const { name, phone, username, password } = await request.json();

        console.log('🔧 Barber registration attempt:', { name, phone, username });

        // Validation
        if (!name || !phone || !username || !password) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'رمز عبور باید حداقل 6 کاراکتر باشد' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await MongoDatabase.getUserByUsername(username);
        if (existingUser) {
            return NextResponse.json(
                { error: 'این نام کاربری قبلاً استفاده شده است' },
                { status: 409 }
            );
        }

        // Check if phone already exists
        const existingPhone = await MongoDatabase.findUserByPhone(phone);
        if (existingPhone) {
            return NextResponse.json(
                { error: 'این شماره تلفن قبلاً ثبت شده است' },
                { status: 409 }
            );
        }

        // Find barber by name (if exists in Barber collection)
        const barber = await MongoDatabase.getBarberByName(name);

        // Create user account
        const userData = {
            username: username,
            name: name,
            phone: phone,
            password: password,
            role: 'barber',
            barber_id: barber ? barber._id : null,
            isVerified: true // Since they verified phone with OTP
        };

        const newUser = await MongoDatabase.addUser(userData);

        console.log('✅ Barber registered successfully:', username);

        return NextResponse.json({
            success: true,
            message: 'ثبت نام با موفقیت انجام شد',
            user: {
                username: newUser.username,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت نام', details: error.message },
            { status: 500 }
        );
    }
}

