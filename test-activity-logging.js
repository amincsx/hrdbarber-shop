// Test script to debug activity logging
import MongoDatabase from './src/lib/mongoDatabase.js';
import mongoose from 'mongoose';
import { BarberActivity } from './src/lib/models.js';

async function testActivityLogging() {
    try {
        console.log('🔍 Starting activity logging test...');

        console.log('\n📝 Testing activity creation...');

        // First get the correct barber user
        const barberUser = await MongoDatabase.getUserByUsername('amin');
        console.log('👤 Found barber user:', barberUser ? `${barberUser.name} (${barberUser._id})` : 'not found');

        if (!barberUser) {
            console.log('❌ Cannot test without barber user');
            return;
        }

        const testActivityData = {
            barber_id: barberUser._id,
            customer_name: 'تست مقدم',
            customer_phone: '09111111111',
            action: 'booking_created',
            booking_id: 'test-booking-id-123',
            details: 'تست رزرو جدید'
        };

        console.log('🧪 Testing activity data:', testActivityData);

        const testActivity = await MongoDatabase.logBarberActivity(testActivityData);

        if (testActivity) {
            console.log('✅ Test activity created successfully:', testActivity._id);
        } else {
            console.log('❌ Failed to create test activity');
        }

        // Test 2: Get activities for the barber
        console.log('\n📋 Testing activity retrieval...');
        const activities = await MongoDatabase.getBarberActivities('amin'); // Use username, not name
        console.log('📊 Retrieved activities:', activities.length);

        if (activities.length > 0) {
            console.log('✅ Sample activity:', activities[0]);
        } else {
            console.log('❌ No activities found');
        }

        // Test 3: Check total count
        const totalActivities = await BarberActivity.countDocuments();
        console.log('📊 Total activities in database:', totalActivities);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔌 Database connection closed');
        }
    }
}

testActivityLogging();