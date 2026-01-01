import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        console.log('🧪 Testing SMS to:', phone);

        // Test SMS functionality
        const testResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phone,
                message: '🧪 Test SMS from HRD Barber Shop - SMS working correctly!'
            })
        });

        const result = await testResponse.json();

        return NextResponse.json({
            success: testResponse.ok,
            status: testResponse.status,
            result: result
        });

    } catch (error) {
        console.error('❌ Test SMS error:', error);
        return NextResponse.json({
            error: 'Test failed',
            details: error.message
        }, { status: 500 });
    }
}