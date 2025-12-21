// Debug script to test activity creation and ordering
import MongoDatabase from './src/lib/mongoDatabase.js';

async function testActivityOrdering() {
    try {
        console.log('🧪 Testing activity creation and ordering...');

        // Get a barber user first
        const barbers = await MongoDatabase.getUsersByRole('barber');
        if (!barbers.length) {
            console.error('❌ No barbers found');
            return;
        }

        const testBarber = barbers[0];
        console.log('👨‍💼 Using test barber:', testBarber.name, testBarber._id);

        // Create 3 test activities with slight delays
        console.log('\n📝 Creating test activities...');

        const activity1 = await MongoDatabase.logBarberActivity({
            barber_id: testBarber._id,
            customer_name: 'تست ۱',
            customer_phone: '09111111111',
            action: 'booking_created',
            details: 'اولین رزرو تستی'
        });
        console.log('✅ Activity 1 created:', activity1._id);

        // Wait 100ms
        await new Promise(resolve => setTimeout(resolve, 100));

        const activity2 = await MongoDatabase.logBarberActivity({
            barber_id: testBarber._id,
            customer_name: 'تست ۲',
            customer_phone: '09122222222',
            action: 'booking_created',
            details: 'دومین رزرو تستی'
        });
        console.log('✅ Activity 2 created:', activity2._id);

        // Wait 100ms
        await new Promise(resolve => setTimeout(resolve, 100));

        const activity3 = await MongoDatabase.logBarberActivity({
            barber_id: testBarber._id,
            customer_name: 'تست ۳',
            customer_phone: '09133333333',
            action: 'booking_created',
            details: 'سومین رزرو تستی'
        });
        console.log('✅ Activity 3 created:', activity3._id);

        // Now fetch activities and check ordering
        console.log('\n📋 Fetching activities...');
        const activities = await MongoDatabase.getBarberActivities(testBarber._id, 10);

        console.log('\n🔍 Activity ordering check:');
        activities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.customer_name} - ${activity.details}`);
            console.log(`   _id: ${activity._id}`);
            console.log(`   createdAt: ${activity.createdAt}`);
            console.log(`   created_at: ${activity.created_at}`);
            console.log(`   ObjectId timestamp: ${activity._id.getTimestamp()}`);
            console.log('');
        });

        // Check if newest is first
        const newestActivity = activities[0];
        const isCorrectOrder = newestActivity.customer_name === 'تست ۳';

        console.log('✅ Order check:', isCorrectOrder ? 'CORRECT' : 'INCORRECT');
        if (!isCorrectOrder) {
            console.log('❌ Expected "تست ۳" first, but got:', newestActivity.customer_name);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testActivityOrdering();