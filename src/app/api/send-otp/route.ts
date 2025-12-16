import { NextRequest, NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function POST(request: NextRequest) {
    try {
        const { phone, message, context } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'شماره تلفن الزامی است' }, { status: 400 });
        }

        // Validate Iranian phone number format
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json({ error: 'شماره تلفن معتبر نیست' }, { status: 400 });
        }

        // ONLY for barber password reset, validate that phone belongs to a barber
        if (!message && context === 'barber-forgot-password') {
            console.log('🔍 Checking if phone belongs to a barber:', phone);
            const barber = await MongoDatabase.findBarberByPhone(phone);

            if (!barber) {
                console.log('❌ Phone number not found in barber records:', phone);
                return NextResponse.json({
                    error: 'این شماره تلفن به آرایشگری تعلق ندارد'
                }, { status: 404 });
            }

            console.log('✅ Found barber for phone:', phone, '→', barber.name);
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
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            console.log(`📱 Generated OTP for ${phone}:`, otp);

            // For barber signup, don't use local fallback - only send real SMS
            if (context === 'barber-register') {
                try {
                    // Create AbortController for custom timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

                    const response = await fetch('https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: phone,
                            bodyId: 194445,
                            args: [otp]
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        console.error('❌ Melipayamak API Error:', response.status, response.statusText);
                        return NextResponse.json({
                            success: false,
                            error: 'خطا در ارسال پیامک (خطای سرور)'
                        }, { status: 500 });
                    }

                    const result = await response.json();
                    console.log('✅ Melipayamak SMS API Response:', result);

                    if (result.status === 'ارسال موفق بود' || result.code) {
                        const actualOtpSent = result.code || otp;
                        console.log('📤 SMS sent successfully! OTP:', actualOtpSent);
                        return NextResponse.json({
                            success: true,
                            message: 'کد تایید به شماره شما ارسال شد',
                            otp: actualOtpSent
                        }, { status: 200 });
                    } else {
                        console.error('❌ Melipayamak rejected OTP request:', result);
                        return NextResponse.json({
                            success: false,
                            error: 'خطا در ارسال پیامک (پاسخ نامعتبر)'
                        }, { status: 500 });
                    }
                } catch (smsError) {
                    console.error('❌ Melipayamak fetch failed:', smsError.message);
                    return NextResponse.json({
                        success: false,
                        error: `خطا در ارسال پیامک: ${smsError.message}`
                    }, { status: 500 });
                }
            }

            // For other contexts (user signup, password reset), allow local OTP fallback
            try {
                // Create AbortController for custom timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

                const response = await fetch('https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: phone,
                        bodyId: 194445,
                        args: [otp]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const result = await response.json();
                console.log('✅ Melipayamak SMS API Response:', result);

                if (result.status === 'ارسال موفق بود' || result.code) {
                    const actualOtpSent = result.code || otp;
                    console.log('📤 SMS sent successfully! OTP:', actualOtpSent);
                    return NextResponse.json({
                        success: true,
                        message: 'کد تایید به شماره شما ارسال شد',
                        otp: actualOtpSent
                    }, { status: 200 });
                }
            } catch (smsError) {
                console.warn('⚠️ Melipayamak SMS failed, using local OTP:', smsError.message);
            }

            // Fallback to local OTP only for user signup and password reset
            return NextResponse.json({
                success: true,
                message: 'کد تایید تولید شد (بررسی پیام کوتاه)',
                otp: otp
            }, { status: 200 });
        }

    } catch (error) {
        console.error('SMS/OTP Error:', error);
        return NextResponse.json({
            error: 'خطا در ارسال پیامک'
        }, { status: 500 });
    }
}
