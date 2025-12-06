// Barber self-registration endpoint
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

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

        // Check if username already exists (in Users collection)
        const existingUser = await MongoDatabase.getUserByUsername(username);
        if (existingUser) {
            return NextResponse.json(
                { error: 'این نام کاربری قبلاً استفاده شده است' },
                { status: 409 }
            );
        }

        // Check if phone already exists as a BARBER (allow same phone for user and barber)
        const existingBarberPhone = await MongoDatabase.getBarberByPhone(phone);
        if (existingBarberPhone) {
            return NextResponse.json(
                { error: 'این شماره تلفن قبلاً به عنوان آرایشگر ثبت شده است' },
                { status: 409 }
            );
        }

        // Check if barber with same name already exists
        const existingBarber = await MongoDatabase.getBarberByName(name);
        if (existingBarber) {
            return NextResponse.json(
                { error: 'این نام آرایشگر قبلاً ثبت شده است' },
                { status: 409 }
            );
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Step 1: Create barber in Barber collection
        const barberData = {
            name: name,
            phone: phone,
            username: username,
            password: hashedPassword,
            isActive: true
        };

        const newBarber = await MongoDatabase.addBarber(barberData);
        console.log('✅ Barber created in Barbers collection:', newBarber._id);

        // Step 2: Create user account linked to barber
        const userData = {
            username: username,
            name: name,
            phone: phone,
            password: hashedPassword,
            role: 'barber',
            barber_id: newBarber._id,
            isVerified: true // Since they verified phone with OTP
        };

        const newUser = await MongoDatabase.addUser(userData);
        console.log('✅ User account created linked to barber:', newUser._id);

        return NextResponse.json({
            success: true,
            message: 'ثبت نام با موفقیت انجام شد',
            user: {
                username: newUser.username,
                name: newUser.name,
                role: newUser.role,
                barber_id: newBarber._id
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

