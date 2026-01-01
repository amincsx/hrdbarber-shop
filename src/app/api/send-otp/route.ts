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

        // If message is provided, try to send custom SMS
        if (message) {
            console.log('📱 Attempting to send custom SMS to:', phone);
            console.log('📝 Message:', message);

            try {
                // First try the Simple API
                console.log('🔄 Trying Simple API...');
                const simpleResponse = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
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

                const simpleResult = await simpleResponse.json();
                console.log('📱 Simple API Response:', simpleResult);

                // Check if Simple API worked
                if (simpleResponse.ok && simpleResult.recId) {
                    console.log('✅ SMS sent successfully via Simple API, recId:', simpleResult.recId);
                    return NextResponse.json({
                        success: true,
                        message: 'پیامک ارسال شد',
                        data: simpleResult
                    }, { status: 200 });
                } else {
                    console.warn('⚠️ Simple API failed, trying fallback method...');

                    // For now, return success to prevent booking failures
                    // The SMS functionality needs Melipayamak account configuration for custom messages
                    console.log('📝 SMS service temporarily unavailable for custom messages');
                    console.log('📋 Booking will proceed successfully, SMS notification disabled');

                    return NextResponse.json({
                        success: false, // Set to false so calling code knows SMS failed
                        message: 'پیامک موقتاً غیرفعال است',
                        details: 'Melipayamak Simple API requires account configuration for custom messages'
                    }, { status: 200 }); // Return 200 so booking doesn't fail
                }
            } catch (smsError) {
                console.error('❌ Custom SMS sending failed:', smsError.message);

                // Final fallback: Return success but log the issue
                console.log('📝 SMS service temporarily unavailable, logging for manual follow-up');
                return NextResponse.json({
                    success: false,
                    message: 'خدمات پیامک موقتاً غیرفعال است',
                    details: 'Custom SMS requires manual setup - booking status updated successfully'
                }, { status: 200 }); // Return 200 so booking update doesn't fail
            }
        } else {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            console.log(`📱 Generated OTP for ${phone}:`, otp);

            // For barber signup, don't use local fallback - only send real SMS
            if (context === 'barber-register') {
                try {
                    console.log('📱 Sending barber register SMS via Melipayamak');

                    const response = await fetch('https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: phone,
                            bodyId: 194445,
                            args: [otp]
                        })
                    });

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
                console.log('📱 Attempting SMS via Melipayamak with fallback');

                const response = await fetch('https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: phone,
                        bodyId: 194445,
                        args: [otp]
                    })
                });

                const result = await response.json();
                console.log('✅ Melipayamak SMS API Response:', result);

                if (response.ok && (result.status === 'ارسال موفق بود' || result.code)) {
                    const actualOtpSent = result.code || otp;
                    console.log('📤 SMS sent successfully! OTP:', actualOtpSent);
                    return NextResponse.json({
                        success: true,
                        message: 'کد تایید به شماره شما ارسال شد',
                        otp: actualOtpSent
                    }, { status: 200 });
                } else {
                    throw new Error('Melipayamak API rejected request');
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
