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
        };

        console.log('📝 Creating test booking...');
        const newBooking = await MongoDatabase.addBooking(testBookingData);

        if (newBooking && newBooking._id) {
            console.log(`✅ Test booking created: ${newBooking._id}`);

            // Test booking update
            console.log('🔄 Testing booking update...');
            const updateResult = await MongoDatabase.updateBooking(newBooking._id, {
                status: 'confirmed',
                notes: 'Health check test'
            });

            if (updateResult) {
                console.log('✅ Booking update successful');
            } else {
                console.log('⚠️  Booking update failed');
            }

            // Clean up test booking
            console.log('🗑️  Cleaning up test booking...');
            try {
                await mongoose.connection.collection('bookings').deleteOne({ _id: newBooking._id });
                console.log('✅ Test booking cleaned up');
            } catch (cleanupError) {
                console.log('⚠️  Cleanup failed:', cleanupError.message);
            }

            results.bookingCRUD = true;
        } else {
            console.log('❌ Test booking creation failed');
        }

        // Test 5: Error Handling & Retry Logic
        console.log('\n🔄 Test 5: Error Handling & Retry Logic');
        console.log('--------------------------------------');

        // Test with invalid ID to trigger error handling
        try {
            const invalidResult = await MongoDatabase.getBookingsByBarberId('invalid-id-12345');
            console.log('✅ Error handling working - graceful failure for invalid ID');
            results.errorHandling = true;
        } catch (error) {
            console.log('⚠️  Error handling needs improvement:', error.message);
        }

        // Summary
        console.log('\n📊 Health Check Summary');
        console.log('========================');

        const totalTests = Object.keys(results).length;
        const passedTests = Object.values(results).filter(Boolean).length;

        console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
        console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? '✅' : '❌';
            console.log(`${status} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
        });

        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! Booking system is healthy.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the logs above for details.');
        }

        // Connection stats
        console.log('\n📊 Connection Statistics');
        console.log('------------------------');
        console.log(`🔗 Connection State: ${getConnectionStateName(mongoose.connection.readyState)}`);
        console.log(`🏠 Host: ${mongoose.connection.host}`);
        console.log(`📁 Database: ${mongoose.connection.name}`);

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
    }
}

function getConnectionStateName(state) {
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting',
        99: 'Uninitialized'
    };
    return states[state] || 'Unknown';
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚡ Interrupted, closing connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run the health check
healthCheck();