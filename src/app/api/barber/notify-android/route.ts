import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Enhanced VAPID configuration for Android
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BGhECE76AktsUUL4OjcT4lifhurEmWkMfFh_AaAhw_MSahdTwi6Fzh2PrGPQ8969n5lj6GINXYK5hlg0rAYWuuM',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE'
};

webpush.setVapidDetails(
  'mailto:support@hrdbarber.shop',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory subscription storage (replace with database in production)
let subscriptions = new Map();

export async function POST(request: NextRequest) {
  console.log('🚀 Android Push Notify API called');
  
  try {
    const body = await request.json();
    const { barberId, message, subscription, action = 'notify' } = body;
    
    console.log('📧 Request body:', { barberId, action, hasMessage: !!message, hasSubscription: !!subscription });
    
    // Handle subscription registration
    if (action === 'subscribe' || subscription) {
      if (!barberId || !subscription) {
        return NextResponse.json(
          { error: 'barberId and subscription are required for subscription' },
          { status: 400 }
        );
      }
      
      subscriptions.set(barberId, subscription);
      console.log(`✅ Subscription registered for barber: ${barberId}`);
      console.log(`📱 Endpoint: ${subscription.endpoint?.substring(0, 100)}...`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription registered successfully',
        barberId,
        hasSubscription: true
      });
    }
    
    // Handle notification sending
    if (!barberId) {
      return NextResponse.json(
        { error: 'barberId is required' },
        { status: 400 }
      );
    }
    
    // Get subscription for barber
    const barberSubscription = subscriptions.get(barberId);
    if (!barberSubscription) {
      console.log(`⚠️ No subscription found for barber: ${barberId}`);
      return NextResponse.json(
        { error: 'No subscription found for this barber. Please subscribe first.' },
        { status: 404 }
      );
    }
    
    // Prepare Android-optimized notification payload
    const notificationPayload = {
      title: message?.title || '🎉 رزرو جدید!',
      body: message?.body || 'یک رزرو جدید در سیستم ثبت شده است',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: `notification-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      // Android-specific optimizations
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      actions: [
        {
          action: 'view',
          title: '👁️ مشاهده',
          icon: '/icon-192x192.svg'
        },
        {
          action: 'close',
          title: '❌ بستن',
          icon: '/icon-192x192.svg'
        }
      ],
      data: {
        url: `/barber-dashboard/${barberId}`,
        barberId: barberId,
        timestamp: Date.now(),
        ...message?.data
      },
      // RTL and Persian language support
      dir: 'rtl',
      lang: 'fa'
    };
    
    console.log('🔔 Sending notification with payload:', JSON.stringify(notificationPayload, null, 2));
    
    // Send push notification with enhanced options for Android
    const pushOptions = {
      TTL: 2419200, // 4 weeks
      urgency: 'high',
      headers: {
        'Content-Encoding': 'gzip'
      }
    };
    
    const result = await webpush.sendNotification(
      barberSubscription,
      JSON.stringify(notificationPayload),
      pushOptions
    );
    
    console.log('✅ Push notification sent successfully');
    console.log('📊 Web-push result:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Push notification sent successfully',
      barberId,
      payload: notificationPayload,
      result: {
        statusCode: result.statusCode,
        headers: result.headers
      }
    });
    
  } catch (error) {
    console.error('❌ Push notification error:', error);
    
    // Handle specific web-push errors
    if (error.statusCode) {
      console.error('Web-push error details:', {
        statusCode: error.statusCode,
        headers: error.headers,
        body: error.body
      });
      
      // Handle common push errors
      if (error.statusCode === 410) {
        return NextResponse.json(
          { error: 'Push subscription has expired', needsResubscription: true },
          { status: 410 }
        );
      }
      
      if (error.statusCode === 413) {
        return NextResponse.json(
          { error: 'Payload too large' },
          { status: 413 }
        );
      }
      
      if (error.statusCode === 400) {
        return NextResponse.json(
          { error: 'Invalid push subscription or payload' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to send push notification', 
        details: error.message,
        needsResubscription: error.statusCode === 410
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('📊 Android Push Notify status check');
  
  try {
    const url = new URL(request.url);
    const barberId = url.searchParams.get('barberId');
    
    if (barberId) {
      const hasSubscription = subscriptions.has(barberId);
      const subscription = subscriptions.get(barberId);
      
      return NextResponse.json({
        barberId,
        hasSubscription,
        subscriptionEndpoint: subscription?.endpoint?.substring(0, 100) + '...' || null,
        totalSubscriptions: subscriptions.size,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      totalSubscriptions: subscriptions.size,
      barberIds: Array.from(subscriptions.keys()),
      vapidPublicKey: vapidKeys.publicKey,
      status: 'Android Push Notify API is running',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    );
  }
}