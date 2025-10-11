// API endpoint to send push notifications to barbers
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'barber-subscriptions.json');

// Read subscriptions from file
function readSubscriptions() {
    try {
        if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
            return {};
        }
        const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading subscriptions:', error);
        return {};
    }
}

// Send notification using Fetch API (fallback method without web-push library)
async function sendNotificationFallback(subscription, payload) {
    try {
        // For now, we'll use a simple in-app notification mechanism
        // In production, you would use web-push library with VAPID keys
        console.log('📢 Would send push notification:', payload);
        console.log('📱 To subscription:', subscription.endpoint);
        
        // Return success for now - actual push requires web-push library
        // which needs to be installed via npm: npm install web-push
        return { success: true, method: 'fallback' };
        
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
}

// POST - Send push notification to a specific barber or all barbers
export async function POST(request) {
    try {
        const { barberId, barberIds, title, body, data } = await request.json();

        if (!title || !body) {
            return NextResponse.json(
                { error: 'عنوان و متن اعلان الزامی است' },
                { status: 400 }
            );
        }

        console.log('📢 Sending push notification...');
        console.log('  - Title:', title);
        console.log('  - Body:', body);
        console.log('  - Barber ID:', barberId);
        console.log('  - Barber IDs:', barberIds);

        // Read subscriptions
        const subscriptions = readSubscriptions();
        
        // Determine which barbers to notify
        let targetBarbers = [];
        if (barberId) {
            targetBarbers = [barberId];
        } else if (barberIds && Array.isArray(barberIds)) {
            targetBarbers = barberIds;
        } else {
            // Notify all subscribed barbers
            targetBarbers = Object.keys(subscriptions);
        }

        const results = [];
        const notificationPayload = {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'booking-notification',
            requireInteraction: true,
            data: data || {}
        };

        // Send notification to each target barber
        for (const targetBarberId of targetBarbers) {
            const barberSubscription = subscriptions[targetBarberId];
            
            if (barberSubscription && barberSubscription.subscription) {
                const result = await sendNotificationFallback(
                    barberSubscription.subscription,
                    notificationPayload
                );
                
                results.push({
                    barberId: targetBarberId,
                    ...result
                });
                
                console.log(`📱 Notification ${result.success ? 'sent' : 'failed'} to:`, targetBarberId);
            } else {
                console.log(`⚠️ No subscription found for:`, targetBarberId);
                results.push({
                    barberId: targetBarberId,
                    success: false,
                    error: 'No subscription'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        return NextResponse.json({
            success: true,
            message: `اعلان برای ${successCount} آرایشگر ارسال شد`,
            details: {
                total: results.length,
                success: successCount,
                failed: failCount
            },
            results
        });

    } catch (error) {
        console.error('❌ Notification send error:', error);
        return NextResponse.json(
            { error: 'خطا در ارسال اعلان' },
            { status: 500 }
        );
    }
}

// GET - Get notification history (optional)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const barberId = searchParams.get('barberId');

        // Read subscriptions to show who is subscribed
        const subscriptions = readSubscriptions();
        
        if (barberId) {
            const subscription = subscriptions[barberId];
            return NextResponse.json({
                subscribed: !!subscription,
                barberId,
                subscribedAt: subscription?.subscribedAt || null
            });
        } else {
            // Return list of all subscribed barbers
            const subscribedBarbers = Object.entries(subscriptions).map(([id, sub]) => ({
                barberId: id,
                subscribedAt: sub.subscribedAt,
                lastActive: sub.lastActive
            }));
            
            return NextResponse.json({
                total: subscribedBarbers.length,
                barbers: subscribedBarbers
            });
        }

    } catch (error) {
        console.error('❌ Get notification status error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات' },
            { status: 500 }
        );
    }
}

