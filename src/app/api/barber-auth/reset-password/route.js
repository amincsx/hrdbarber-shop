// Reset password for barbers
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

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

        // Find user by phone
        let user = await MongoDatabase.findUserByPhone(phone);
        
        // If username provided and user not found by phone, try username
        if (!user && username) {
            user = await MongoDatabase.getUserByUsername(username);
            // Verify phone matches
            if (user && user.phone !== phone) {
                return NextResponse.json(
                    { error: 'شماره تلفن و نام کاربری مطابقت ندارند' },
                    { status: 401 }
                );
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: 'کاربری با این مشخصات یافت نشد' },
                { status: 404 }
            );
        }

        if (user.role !== 'barber') {
            return NextResponse.json(
                { error: 'این سرویس فقط برای آرایشگران است' },
                { status: 403 }
            );
        }

        // Update password
        await MongoDatabase.updateUser(user._id, { password: newPassword });

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

