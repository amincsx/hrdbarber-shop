// API endpoint to send push notifications to barbers
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';
import fs from 'fs';
import path from 'path';

// Optional web-push support (fallback to console if not configured)
let webPush = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    webPush = require('web-push');
} catch (e) {
    // web-push not installed; will use fallback
}

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

// Send notification using web-push if available, else fallback to logging
async function sendNotification(subscription, payload) {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (webPush && vapidPublicKey && vapidPrivateKey) {
        try {
            webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
            await webPush.sendNotification(subscription, JSON.stringify(payload));
            return { success: true, method: 'web-push' };
        } catch (error) {
            console.error('❌ web-push send error:', error);
            return { success: false, error: error.message };
        }
    }

    // Fallback: log only
    try {
        console.log('📢 (fallback) Would send push notification:', payload);
        console.log('📱 To subscription:', subscription?.endpoint);
        return { success: true, method: 'fallback' };
    } catch (error) {
        console.error('Error sending notification (fallback):', error);
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
        
        // Determine which barbers to notify, mapping between English username and Farsi name
        let targetBarbers = [];
        if (barberId) {
            const decoded = decodeURIComponent(barberId);
            const candidates = new Set([barberId, decoded]);

            // Try to find a user by username (English) and also match by Farsi name
            try {
                const byUsername = await MongoDatabase.getUserByUsername(decoded);
                if (byUsername) {
                    if (byUsername.username) candidates.add(byUsername.username);
                    if (byUsername.name) candidates.add(byUsername.name);
                }
                // As a fallback, scan all barbers and match by name
                const allBarberUsers = await MongoDatabase.getUsersByRole('barber');
                const byName = allBarberUsers.find(u => u.name === decoded);
                if (byName) {
                    candidates.add(byName.username);
                    candidates.add(byName.name);
                }
            } catch {}

            // Keep only candidates that have a subscription entry
            targetBarbers = Array.from(candidates).filter(id => subscriptions[id]);

            // If nothing matched, still try original id
            if (targetBarbers.length === 0) {
                targetBarbers = [barberId];
            }
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
            // Use unique tag so notifications don't get merged/replaced
            tag: (data && data.tag) ? data.tag : `booking-${Date.now()}`,
            requireInteraction: true,
            renotify: true,
            data: data || {}
        };

        // Send notification to each target barber
        for (const targetBarberId of targetBarbers) {
            const barberSubscription = subscriptions[targetBarberId];
            
            if (barberSubscription && barberSubscription.subscription) {
                const result = await sendNotification(
                    barberSubscription.subscription,
                    notificationPayload
                );
                
                results.push({
                    barberId: targetBarberId,
                    ...result
                });
                
                console.log(`📱 Notification ${result.success ? 'sent' : 'failed'} to:`, targetBarberId);
                // If the subscription is gone or invalid, clean it up (410/404 commonly)
                if (!result.success && (result.error?.includes('410') || result.error?.includes('404'))) {
                    delete subscriptions[targetBarberId];
                    try {
                        fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
                        console.log('🧹 Removed stale subscription for:', targetBarberId);
                    } catch {}
                }
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

