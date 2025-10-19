import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../../lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

// GET - Get barber profile
export async function GET(request, { params }) {
    try {
        const { barberId } = params;

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        console.log('📋 Getting barber profile:', barberId);

        // Try to find by username first, then by name
        let barber = await MongoDatabase.getUserByUsername(decodeURIComponent(barberId));

        if (!barber) {
            // Try to find by name
            const allBarbers = await MongoDatabase.getUsersByRole('barber');
            barber = allBarbers.find(b => b.name === decodeURIComponent(barberId));
        }

        if (!barber || barber.role !== 'barber') {
            return NextResponse.json(
                { error: 'آرایشگر یافت نشد' },
                { status: 404 }
            );
        }

        // Return profile without password
        const profile = {
            id: barber._id,
            username: barber.username,
            name: barber.name,
            phone: barber.phone,
            role: barber.role,
            isVerified: barber.isVerified,
            createdAt: barber.createdAt,
            updatedAt: barber.updatedAt
        };

        return NextResponse.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('❌ Error getting barber profile:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات پروفایل' },
            { status: 500 }
        );
    }
}

// PUT - Update barber profile (password, username, name)
export async function PUT(request, { params }) {
    try {
        const { barberId } = params;
        const { currentPassword, newPassword, newUsername, newName, phone } = await request.json();

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        console.log('🔧 Updating barber profile:', barberId);

        // Find the barber
        let barber = await MongoDatabase.getUserByUsername(decodeURIComponent(barberId));

        if (!barber) {
            // Try to find by name
            const allBarbers = await MongoDatabase.getUsersByRole('barber');
            barber = allBarbers.find(b => b.name === decodeURIComponent(barberId));
        }

        if (!barber || barber.role !== 'barber') {
            return NextResponse.json(
                { error: 'آرایشگر یافت نشد' },
                { status: 404 }
            );
        }

        // Verify current password if changing password or username
        if ((newPassword || newUsername) && currentPassword) {
            const passwordMatch = await bcrypt.compare(currentPassword, barber.password);
            if (!passwordMatch) {
                return NextResponse.json(
                    { error: 'رمز عبور فعلی اشتباه است' },
                    { status: 401 }
                );
            }
        }

        // Prepare update data
        const updateData = {};

        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
            console.log('🔒 Password will be updated');
        }

        if (newUsername && newUsername !== barber.username) {
            // Check if new username is available
            const existingUser = await MongoDatabase.getUserByUsername(newUsername);
            if (existingUser && existingUser._id.toString() !== barber._id.toString()) {
                return NextResponse.json(
                    { error: 'این نام کاربری قبلاً استفاده شده است' },
                    { status: 409 }
                );
            }
            updateData.username = newUsername;
            console.log('👤 Username will be updated to:', newUsername);
        }

        if (newName && newName !== barber.name) {
            updateData.name = newName;
            console.log('📝 Name will be updated to:', newName);
        }

        if (phone && phone !== barber.phone) {
            updateData.phone = phone;
            console.log('📞 Phone will be updated to:', phone);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'هیچ تغییری برای بروزرسانی یافت نشد' },
                { status: 400 }
            );
        }

        // Update the barber
        const updatedBarber = await MongoDatabase.updateUser(barber._id, updateData);

        if (!updatedBarber) {
            throw new Error('Failed to update barber');
        }

        console.log('✅ Barber profile updated successfully');

        return NextResponse.json({
            success: true,
            message: 'پروفایل با موفقیت بروزرسانی شد',
            profile: {
                id: updatedBarber._id,
                username: updatedBarber.username,
                name: updatedBarber.name,
                phone: updatedBarber.phone,
                role: updatedBarber.role,
                isVerified: updatedBarber.isVerified
            }
        });

    } catch (error) {
        console.error('❌ Error updating barber profile:', error);
        return NextResponse.json(
            { error: 'خطا در بروزرسانی پروفایل' },
            { status: 500 }
        );
    }
}