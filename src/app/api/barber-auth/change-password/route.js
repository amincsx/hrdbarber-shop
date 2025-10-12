// Change password for logged-in barbers
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

export async function POST(request) {
    try {
        const { username, currentPassword, newPassword } = await request.json();

        console.log('🔐 Password change attempt for:', username);

        if (!username || !currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'رمز عبور جدید باید حداقل 6 کاراکتر باشد' },
                { status: 400 }
            );
        }

        // Find user
        const user = await MongoDatabase.getUserByUsername(username);
        if (!user) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        if (user.role !== 'barber') {
            return NextResponse.json(
                { error: 'این سرویس فقط برای آرایشگران است' },
                { status: 403 }
            );
        }

        // Verify current password
        if (user.password !== currentPassword) {
            return NextResponse.json(
                { error: 'رمز عبور فعلی اشتباه است' },
                { status: 401 }
            );
        }

        // Update password
        await MongoDatabase.updateUser(user._id, { password: newPassword });

        console.log('✅ Password changed successfully for:', username);

        return NextResponse.json({
            success: true,
            message: 'رمز عبور با موفقیت تغییر کرد'
        });

    } catch (error) {
        console.error('❌ Password change error:', error);
        return NextResponse.json(
            { error: 'خطا در تغییر رمز عبور', details: error.message },
            { status: 500 }
        );
    }
}

