import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'شماره تلفن الزامی است' }, { status: 400 });
    }

    // Validate Iranian phone number format
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'شماره تلفن معتبر نیست' }, { status: 400 });
    }

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

  } catch (error) {
    console.error('OTP Error:', error);
    return NextResponse.json({ 
      error: 'خطا در ارسال کد تایید' 
    }, { status: 500 });
  }
}
