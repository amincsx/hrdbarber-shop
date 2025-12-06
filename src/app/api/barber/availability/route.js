import { NextRequest, NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';

// GET - Fetch barber's availability/schedule
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const barberId = searchParams.get('barberId');

        if (!barberId) {
            return NextResponse.json({
                success: false,
                message: 'نام آرایشگر الزامی است'
            }, { status: 400 });
        }

        console.log('🔍 Looking for barber availability:', barberId);

        // Get barber's current availability settings
        // Try multiple ways to find the barber
        let barber = await MongoDatabase.getUserByUsername(barberId);

        if (!barber) {
            console.log('⚠️ User not found by username, trying by name...');
            const allBarbers = await MongoDatabase.getUsersByRole('barber');
            barber = allBarbers.find(u => u.name === barberId);
        }

        if (!barber) {
            console.log('⚠️ Still not found, trying Persian name search...');
            const allBarbers = await MongoDatabase.getUsersByRole('barber');
            // Try to find by Persian name (in case barberId is already Persian)
            barber = allBarbers.find(u => u.name === decodeURIComponent(barberId));
        }

        if (!barber) {
            console.log('❌ Barber not found:', barberId);
            return NextResponse.json({
                success: false,
                message: 'آرایشگر یافت نشد'
            }, { status: 404 });
        }

        console.log('✅ Found barber:', barber.name, 'Username:', barber.username);
        console.log('📊 Current stored availability:', JSON.stringify(barber.availability, null, 2));

        // Return current schedule or default
        const availability = barber.availability || {
            workingHours: { start: 10, end: 21 },
            lunchBreak: { start: 14, end: 15 },
            offDays: [],
            offHours: [],
            isAvailable: true
        };

        return NextResponse.json({
            success: true,
            availability
        });

    } catch (error) {
        console.error('❌ Error fetching availability:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در دریافت اطلاعات'
        }, { status: 500 });
    }
}

// POST - Update barber's availability/schedule
export async function POST(request) {
    try {
        const { barberId, availability } = await request.json();

        console.log('📥 Received availability update request:');
        console.log('   Barber ID:', barberId);
        console.log('   Availability:', JSON.stringify(availability, null, 2));

        if (!barberId || !availability) {
            return NextResponse.json({
                success: false,
                message: 'اطلاعات ناقص ارسال شده'
            }, { status: 400 });
        }

        // Validate availability data
        const { workingHours, lunchBreak, offDays, offHours, isAvailable } = availability;

        if (!workingHours || workingHours.start >= workingHours.end) {
            return NextResponse.json({
                success: false,
                message: 'ساعات کاری معتبر نیست'
            }, { status: 400 });
        }

        if (lunchBreak && (lunchBreak.start >= lunchBreak.end ||
            lunchBreak.start < workingHours.start || lunchBreak.end > workingHours.end)) {
            return NextResponse.json({
                success: false,
                message: 'زمان استراحت معتبر نیست'
            }, { status: 400 });
        }

        // Ensure all fields are included in the availability object
        const completeAvailability = {
            workingHours: workingHours || { start: 10, end: 21 },
            lunchBreak: lunchBreak || { start: 14, end: 15 },
            offDays: offDays || [],
            offHours: offHours || [],
            isAvailable: isAvailable !== undefined ? isAvailable : true
        };

        console.log('📤 Sending complete availability to database:', JSON.stringify(completeAvailability, null, 2));

        // Update barber's availability
        const result = await MongoDatabase.updateBarberAvailability(barberId, completeAvailability);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'تنظیمات با موفقیت ذخیره شد'
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'خطا در ذخیره تنظیمات'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('❌ Error updating availability:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در ذخیره تنظیمات'
        }, { status: 500 });
    }
}