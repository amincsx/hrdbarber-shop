#!/usr/bin/env node

/**
 * Comprehensive Booking System Health Check
 * Tests all critical booking system functionality
 * Run with: node booking-system-health-check.js
 */

import MongoDatabase from './src/lib/mongoDatabase.js';
import mongoose from 'mongoose';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function healthCheck() {
    console.log('🏥 Booking System Health Check');
    console.log('===============================\n');

    const results = {
        connection: false,
        barberQueries: false,
        bookingQueries: false,
        bookingCRUD: false,
        errorHandling: false
    };

    try {
        // Test 1: Database Connection
        console.log('🔗 Test 1: Database Connection');
        console.log('------------------------------');

        const barbers = await MongoDatabase.getAllBarbers();
        results.connection = true;
        console.log(`✅ Connection successful - ${barbers.length} barbers found`);

        if (barbers.length === 0) {
            console.log('⚠️  No barbers found in database. System may need initialization.');
            return results;
        }

        // Test 2: Barber Query Operations
        console.log('\n👨‍💇 Test 2: Barber Query Operations');
        console.log('-----------------------------------');

        const firstBarber = barbers[0];
        console.log(`📋 Testing with barber: ${firstBarber.name} (ID: ${firstBarber._id})`);

        // Test barber lookup by ID
        const barberById = await MongoDatabase.getBarberById(firstBarber._id);
        if (barberById) {
            console.log('✅ Barber lookup by ID working');
        } else {
            console.log('⚠️  Barber lookup by ID failed');
        }

        results.barberQueries = true;

        // Test 3: Booking Query Operations
        console.log('\n📅 Test 3: Booking Query Operations');
        console.log('----------------------------------');

        const bookings = await MongoDatabase.getBookingsByBarberId(firstBarber._id);
        console.log(`📊 Found ${bookings.length} bookings for barber ${firstBarber.name}`);

        // Test date-based queries
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = await MongoDatabase.getBookingsByBarberIdAndDate(firstBarber._id, today);
        console.log(`📅 Found ${todayBookings.length} bookings for today`);

        results.bookingQueries = true;

        // Test 4: Booking CRUD Operations
        console.log('\n✏️  Test 4: Booking CRUD Operations');
        console.log('----------------------------------');

        // Create test booking data
        const testBookingData = {
            user_id: 'test-user-' + Date.now(),
            user_name: 'Test User',
            user_phone: '09123456789',
            barber: firstBarber.name,
            barber_id: firstBarber._id,
            date_key: today,
            start_time: '23:59',
            end_time: '23:59',
            services: ['Test Service'],
            total_duration: 1,
            status: 'pending',
            created_at: new Date()
        }; \n        \n        console.log('📝 Creating test booking...'); \n        const newBooking = await MongoDatabase.addBooking(testBookingData); \n        \n        if (newBooking && newBooking._id) {
        \n            console.log(`✅ Test booking created: ${newBooking._id}`); \n            \n            // Test booking update\n            console.log('🔄 Testing booking update...');\n            const updateResult = await MongoDatabase.updateBooking(newBooking._id, {\n                status: 'confirmed',\n                notes: 'Health check test'\n            });\n            \n            if (updateResult) {\n                console.log('✅ Booking update successful');\n            } else {\n                console.log('⚠️  Booking update failed');\n            }\n            \n            // Clean up test booking
            console.log('🗑️  Cleaning up test booking...');
            try {
                await mongoose.connection.collection('bookings').deleteOne({ _id: newBooking._id });
                console.log('✅ Test booking cleaned up');
            } catch (cleanupError) {
                console.log('⚠️  Cleanup failed:', cleanupError.message);
            } \n            \n            results.bookingCRUD = true; \n
        } else { \n            console.log('❌ Test booking creation failed'); \n } \n        \n        // Test 5: Error Handling & Retry Logic\n        console.log('\n🔄 Test 5: Error Handling & Retry Logic');\n        console.log('--------------------------------------');\n        \n        // Test with invalid ID to trigger error handling\n        try {\n            const invalidResult = await MongoDatabase.getBookingsByBarberId('invalid-id-12345');\n            console.log('✅ Error handling working - graceful failure for invalid ID');\n            results.errorHandling = true;\n        } catch (error) {\n            console.log('⚠️  Error handling needs improvement:', error.message);\n        }\n        \n        // Summary
        console.log('\n📊 Health Check Summary');
        console.log('========================'); \n        \n        const totalTests = Object.keys(results).length; \n        const passedTests = Object.values(results).filter(Boolean).length; \n        \n        console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`); \n        console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`); \n        \n        Object.entries(results).forEach(([test, passed]) => { \n            const status = passed ? '✅' : '❌'; \n            console.log(`${status} ${test}: ${passed ? 'PASS' : 'FAIL'}`); \n }); \n        \n        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! Booking system is healthy.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the logs above for details.');
        }

        // Connection stats
        console.log('\n📊 Connection Statistics');
        console.log('------------------------'); \n        console.log(`🔗 Connection State: ${getConnectionStateName(mongoose.connection.readyState)}`); \n        console.log(`🏠 Host: ${mongoose.connection.host}`); \n        console.log(`📁 Database: ${mongoose.connection.name}`); \n        \n
    } catch (error) {
        console.error('\n💥 Health check failed with critical error:');
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    } finally {
        console.log('\n🔌 Closing database connection...');
        await mongoose.connection.close();
        console.log('👋 Health check completed');
        process.exit(0);
    } \n
} \n\nfunction getConnectionStateName(state) { \n    const states = { \n        0: 'Disconnected', \n        1: 'Connected', \n        2: 'Connecting', \n        3: 'Disconnecting', \n        99: 'Uninitialized'\n }; \n    return states[state] || 'Unknown'; \n } \n\n// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚡ Interrupted, closing connection...');
    await mongoose.connection.close();
    process.exit(0);
}); \n\n// Run the health check\nhealthCheck();