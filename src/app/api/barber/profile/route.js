import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

// GET - Fetch barber profile data
export async function GET(request) {
    try {
        const url = new URL(request.url);
        const barberId = url.searchParams.get('barberId');

        if (!barberId) {
            return NextResponse.json(
                { success: false, message: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        console.log('🔍 Fetching profile for barberId:', barberId);

        // First try to find a User with this username/barberId
        let user = await MongoDatabase.getUserByUsername(barberId);
        if (!user) {
            // Try to find barber by name if username fails
            const barber = await MongoDatabase.getBarberByName(decodeURIComponent(barberId));
            if (barber && barber.user_id) {
                user = await MongoDatabase.getUserById(barber.user_id);
            }
        }

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'کاربر آرایشگر یافت نشد' },
                { status: 404 }
            );
        }

        // Try to find associated barber record
        let barber = null;
        if (user.barber_id) {
            barber = await MongoDatabase.getBarberById(user.barber_id);
        } else {
            // Try to find barber by name or phone
            barber = await MongoDatabase.getBarberByName(user.name || barberId);
        }

        return NextResponse.json({
            success: true,
            barber: {
                name: barber?.name || user.name || barberId,
                phone: barber?.phone || user.username || '',
                username: user.username,
                id: user._id
            }
        });

    } catch (error) {
        console.error('❌ Error fetching barber profile:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت اطلاعات پروفایل' },
            { status: 500 }
        );
    }
}

// PUT - Update barber profile
export async function PUT(request) {
    try {
        const { barberId, name, phone, username, currentPassword, newPassword } = await request.json();

        if (!barberId || !name || !phone || !username) {
            return NextResponse.json(
                { success: false, message: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        console.log('🔄 Updating profile for barberId:', barberId);

        // First try to find the User by username/barberId
        let user = await MongoDatabase.getUserByUsername(barberId);
        if (!user) {
            // Try to find barber by name, then get user
            const barber = await MongoDatabase.getBarberByName(decodeURIComponent(barberId));
            if (barber && barber.user_id) {
                user = await MongoDatabase.getUserById(barber.user_id);
            }
        }

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'کاربر آرایشگر یافت نشد' },
                { status: 404 }
            );
        }

        // Try to find associated barber record
        let barber = null;
        if (user.barber_id) {
            barber = await MongoDatabase.getBarberById(user.barber_id);
        } else {
            // Try to find barber by name
            barber = await MongoDatabase.getBarberByName(user.name || barberId);
        }

        // Check if phone number is already used by another barber (if barber record exists)
        if (barber && phone !== barber.phone) {
            const existingBarber = await MongoDatabase.getBarberByPhone(phone);
            if (existingBarber && existingBarber._id.toString() !== barber._id.toString()) {
                return NextResponse.json(
                    { success: false, message: 'این شماره تلفن توسط آرایشگر دیگری استفاده می‌شود' },
                    { status: 409 }
                );
            }
        }

        // Update or create barber record
        if (barber) {
            // Update existing barber
            const updatedBarberData = {
                name: name.trim(),
                phone: phone.trim()
            };
            await MongoDatabase.updateBarber(barber._id, updatedBarberData);
            console.log('✅ Barber data updated');
        } else {
            // Create new barber record
            const newBarberData = {
                name: name.trim(),
                phone: phone.trim(),
                user_id: user._id
            };
            const newBarber = await MongoDatabase.addBarber(newBarberData);

            // Update user with barber_id reference
            await MongoDatabase.updateUser(user._id, { barber_id: newBarber._id });
            console.log('✅ New barber record created and linked');
        }

        // Check if username is already taken by another user
        if (username !== user.username) {
            const existingUser = await MongoDatabase.getUserByUsername(username);
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return NextResponse.json(
                    { success: false, message: 'این نام کاربری توسط کاربر دیگری استفاده می‌شود' },
                    { status: 409 }
                );
            }
        }

        // Prepare user update data
        const userUpdateData = {
            username: username.toLowerCase().trim(),
            name: name.trim() // Also update name in user record
        };

        // Handle password change if requested
        if (newPassword && currentPassword) {
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return NextResponse.json(
                    { success: false, message: 'رمز عبور فعلی اشتباه است' },
                    { status: 401 }
                );
            }

            // Hash new password
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            userUpdateData.password = hashedNewPassword;
            console.log('✅ Password updated');
        }

        // Update user data
        await MongoDatabase.updateUser(user._id, userUpdateData);
        console.log('✅ User data updated');

        return NextResponse.json({
            success: true,
            message: 'اطلاعات پروفایل با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('❌ Error updating barber profile:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی اطلاعات' },
            { status: 500 }
        );
    }
}