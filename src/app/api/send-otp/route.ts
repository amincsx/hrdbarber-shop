import { NextRequest, NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

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

        // For barber forgot password, validate that phone belongs to a barber
        if (!message) { // OTP request (not custom SMS)
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

            // Attempt to send OTP using Melipayamak API with proper parameters
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

                clearTimeout(timeoutId); // Clear timeout if request completes
                const result = await response.json();
                console.log('✅ Melipayamak SMS API Response:', result);

                if (result.status === 'ارسال موفق بود' || result.code) {
                    // If Melipayamak returns a code, use that as it's what was actually sent via SMS
                    const actualOtpSent = result.code || otp;
                    console.log('📤 SMS sent successfully! Actual OTP sent via SMS:', actualOtpSent);
                    console.log('🔍 Original generated OTP was:', otp);
                    return NextResponse.json({
                        success: true,
                        message: 'کد تایید به شماره شما ارسال شد',
                        otp: actualOtpSent
                    }, { status: 200 });
                } else {
                    console.log('⚠️ Melipayamak API returned unexpected response, using local OTP:', otp);
                }
            } catch (smsError) {
                if (smsError.name === 'AbortError') {
                    console.log('⏱️ Melipayamak API timeout (8s), using local OTP:', otp);
                } else {
                    console.warn('❌ Melipayamak SMS Error:', smsError.message);
                }
            }

            // Return OTP for frontend verification (with fallback message)
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
