import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: 'شماره تلفن و کد تأیید الزامی است' }, { status: 400 });
        }

        console.log('🔐 Verifying OTP for:', phone);

        // Verify OTP using Melipayamak API
        const verifyData = JSON.stringify({
            'to': phone,
            'token': otp
        });

        const response = await fetch('https://console.melipayamak.com/api/verify/otp/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: verifyData
        });

        const result = await response.json();
        console.log('🔍 Melipayamak Verify Response:', result);

        // Melipayamak returns success: true if OTP is correct
        if (result.success || result.statusCode === 1) {
            return NextResponse.json({
                success: true,
                message: 'کد تأیید صحیح است',
                verified: true
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: false,
                error: 'کد تأیید اشتباه است یا منقضی شده است',
                verified: false
            }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ OTP Verification Error:', error);
        return NextResponse.json({
            error: 'خطا در تایید کد'
        }, { status: 500 });
    }
}
