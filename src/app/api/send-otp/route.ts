import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone, message } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'شماره تلفن الزامی است' }, { status: 400 });
        }

        // Validate Iranian phone number format
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json({ error: 'شماره تلفن معتبر نیست' }, { status: 400 });
        }

        // If message is provided, send custom SMS, otherwise send OTP
        if (message) {
            // Send custom SMS using Melipayamak Simple Send API
            console.log('📱 Attempting to send SMS to:', phone);
            console.log('📝 Message:', message);

            const response = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: '50002710054227',
                    to: phone,
                    text: message
                })
            });

            const result = await response.json();
            console.log('SMS API Response:', result);

            if (response.ok && result.recId) {
                console.log('✅ SMS sent successfully, recId:', result.recId);
                return NextResponse.json({
                    success: true,
                    message: 'پیامک ارسال شد',
                    data: result
                }, { status: 200 });
            } else {
                console.error('SMS Error Response:', result);
                return NextResponse.json({
                    success: false,
                    error: 'خطا در ارسال پیامک',
                    details: result
                }, { status: 500 });
            }
        } else {
            // Send OTP using Melipayamak API
            const otpData = JSON.stringify({
                'to': phone
            });

            const response = await fetch('https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: otpData
            });

            const result = await response.text();
            console.log('OTP API Response:', result);

            if (response.ok) {
                return NextResponse.json({
                    success: true,
                    message: 'کد تایید ارسال شد',
                    data: result
                }, { status: 200 });
            } else {
                return NextResponse.json({
                    error: 'خطا در ارسال کد تایید'
                }, { status: 500 });
            }
        }

    } catch (error) {
        console.error('SMS/OTP Error:', error);
        return NextResponse.json({
            error: 'خطا در ارسال پیامک'
        }, { status: 500 });
    }
}
