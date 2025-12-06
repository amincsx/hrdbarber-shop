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

        // Get barber's current availability settings
        const barber = await MongoDatabase.getUserByUsername(barberId) || 
                     (await MongoDatabase.getUsersByRole('barber')).find(u => u.name === barberId);

        if (!barber) {
            return NextResponse.json({ 
                success: false, 
                message: 'آرایشگر یافت نشد' 
            }, { status: 404 });
        }

        // Return current schedule or default
        const availability = barber.availability || {
            workingHours: { start: 10, end: 21 },
            lunchBreak: { start: 14, end: 15 },
            offDays: [],
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
        
        if (!barberId || !availability) {
            return NextResponse.json({ 
                success: false, 
                message: 'اطلاعات ناقص ارسال شده' 
            }, { status: 400 });
        }

        // Validate availability data
        const { workingHours, lunchBreak, offDays, isAvailable } = availability;
        
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

        // Update barber's availability
        const result = await MongoDatabase.updateBarberAvailability(barberId, availability);
        
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