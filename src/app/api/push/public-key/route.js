import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';
    const subject = process.env.VAPID_SUBJECT || '';

    console.log('🔑 VAPID Keys Check:', {
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
      hasSubject: !!subject,
      environment: process.env.NODE_ENV,
      publicKeyLength: publicKey.length
    });

    if (!publicKey) {
      console.error('❌ VAPID public key not configured');
      return NextResponse.json({
        publicKey: null,
        error: 'VAPID public key not configured',
        environment: process.env.NODE_ENV
      }, { status: 500 });
    }

    if (!privateKey) {
      console.warn('⚠️ VAPID private key not configured - notifications may not work');
    }

    return NextResponse.json({
      publicKey: publicKey,
      configured: true,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('❌ VAPID key endpoint error:', error);
    return NextResponse.json({
      publicKey: null,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}



