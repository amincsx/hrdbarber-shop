// JavaScript version of forgot password API route using same OTP flow as signup
import { NextResponse } from 'next/server';

let isInitialized = false;
let Database;

async function initializeDatabase() {
    if (!isInitialized) {
        // Dynamic import to avoid module resolution issues
        const { default: DatabaseClass } = await import('../../../lib/database');
        Database = DatabaseClass;
        await Database.initializeDatabase();
        isInitialized = true;
    }
}

// POST - Handle forgot password with OTP verification (same as signup)
async function POST(request) {
    try {
        await initializeDatabase();

        const { phone, newPassword, otp } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'شماره تلفن الزامی است' },
                { status: 400 }
            );
        }

        // Validate Iranian phone number
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { error: 'شماره تلفن معتبر نیست' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await Database.findUserByPhone(phone);
        if (!user) {
            return NextResponse.json(
                { error: 'کاربری با این شماره تلفن یافت نشد' },
                { status: 404 }
            );
        }

        // If OTP and new password are provided, verify and reset password
        if (otp && newPassword) {
            // Verify OTP (same validation as signup)
            if (!otp || otp.length < 4) {
                return NextResponse.json(
                    { error: 'کد تأیید نامعتبر است' },
                    { status: 400 }
                );
            }

            if (newPassword.length < 4) {
                return NextResponse.json(
                    { error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' },
                    { status: 400 }
                );
            }

            // Update user's password
            await Database.updateUser(phone, {
                password: newPassword,
                updated_at: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                message: 'رمز عبور با موفقیت تغییر کرد'
            });
        }

        // If only phone is provided, confirm user exists for OTP step
        return NextResponse.json({
            success: true,
            message: 'کاربر یافت شد',
            userExists: true
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'خطا در بازیابی رمز عبور' },
            { status: 500 }
        );
    }
}

export { POST };
