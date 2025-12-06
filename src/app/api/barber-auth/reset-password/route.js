// Reset password for barbers
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { phone, username, newPassword } = await request.json();

        console.log('🔐 Password reset attempt:', { phone, username });

        if (!phone || !newPassword) {
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور جدید الزامی است' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'رمز عبور باید حداقل 6 کاراکتر باشد' },
                { status: 400 }
            );
        }

        // Find barber by phone number specifically
        let user = await MongoDatabase.findBarberByPhone(phone);

        // If username provided and user not found by phone, try username for barber
        if (!user && username) {
            const userByUsername = await MongoDatabase.getUserByUsername(username);
            // Verify it's a barber and phone matches
            if (userByUsername && userByUsername.role === 'barber' && userByUsername.phone === phone) {
                user = userByUsername;
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: 'آرایشگری با این مشخصات یافت نشد' },
                { status: 404 }
            );
        }

        if (user.role !== 'barber') {
            return NextResponse.json(
                { error: 'این سرویس فقط برای آرایشگران است' },
                { status: 403 }
            );
        }

        // Hash password before updating
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await MongoDatabase.updateUser(user._id, { password: hashedPassword });

        console.log('✅ Password reset successful for:', user.username);

        return NextResponse.json({
            success: true,
            message: 'رمز عبور با موفقیت تغییر کرد',
            username: user.username
        });

    } catch (error) {
        console.error('❌ Password reset error:', error);
        return NextResponse.json(
            { error: 'خطا در تغییر رمز عبور', details: error.message },
            { status: 500 }
        );
    }
}

