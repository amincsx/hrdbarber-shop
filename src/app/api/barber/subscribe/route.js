// API endpoint for push notification subscriptions
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'barber-subscriptions.json');

// Ensure data directory and file exist
function ensureSubscriptionsFile() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
        fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify({}));
    }
}

// Read subscriptions from file
function readSubscriptions() {
    ensureSubscriptionsFile();
    try {
        const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading subscriptions:', error);
        return {};
    }
}

// Write subscriptions to file
function writeSubscriptions(subscriptions) {
    ensureSubscriptionsFile();
    try {
        fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing subscriptions:', error);
        return false;
    }
}

// POST - Subscribe a barber to push notifications
export async function POST(request) {
    try {
        const { barberId, subscription } = await request.json();

        if (!barberId || !subscription) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر و اطلاعات اشتراک الزامی است' },
                { status: 400 }
            );
        }

        console.log('📱 Subscribing barber to push notifications:', barberId);

        // Read existing subscriptions
        const subscriptions = readSubscriptions();

        // Store or update subscription for this barber
        subscriptions[barberId] = {
            subscription,
            subscribedAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };

        // Save subscriptions
        if (writeSubscriptions(subscriptions)) {
            console.log('✅ Subscription saved for:', barberId);
            return NextResponse.json({
                success: true,
                message: 'اشتراک با موفقیت ثبت شد'
            });
        } else {
            throw new Error('Failed to save subscription');
        }

    } catch (error) {
        console.error('❌ Subscription error:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت اشتراک' },
            { status: 500 }
        );
    }
}

// DELETE - Unsubscribe a barber from push notifications
export async function DELETE(request) {
    try {
        const { barberId } = await request.json();

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        console.log('🔕 Unsubscribing barber from push notifications:', barberId);

        // Read existing subscriptions
        const subscriptions = readSubscriptions();

        // Remove subscription for this barber
        if (subscriptions[barberId]) {
            delete subscriptions[barberId];
            
            // Save subscriptions
            if (writeSubscriptions(subscriptions)) {
                console.log('✅ Subscription removed for:', barberId);
                return NextResponse.json({
                    success: true,
                    message: 'اشتراک با موفقیت لغو شد'
                });
            }
        } else {
            return NextResponse.json({
                success: true,
                message: 'اشتراکی یافت نشد'
            });
        }

    } catch (error) {
        console.error('❌ Unsubscribe error:', error);
        return NextResponse.json(
            { error: 'خطا در لغو اشتراک' },
            { status: 500 }
        );
    }
}

// GET - Get subscription status for a barber
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const barberId = searchParams.get('barberId');

        if (!barberId) {
            return NextResponse.json(
                { error: 'شناسه آرایشگر الزامی است' },
                { status: 400 }
            );
        }

        // Read existing subscriptions
        const subscriptions = readSubscriptions();

        const subscription = subscriptions[barberId];

        if (subscription) {
            // Update last active timestamp
            subscription.lastActive = new Date().toISOString();
            writeSubscriptions(subscriptions);

            return NextResponse.json({
                subscribed: true,
                subscribedAt: subscription.subscribedAt,
                lastActive: subscription.lastActive
            });
        } else {
            return NextResponse.json({
                subscribed: false
            });
        }

    } catch (error) {
        console.error('❌ Get subscription error:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات اشتراک' },
            { status: 500 }
        );
    }
}

