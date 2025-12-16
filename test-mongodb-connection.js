#!/usr/bin/env node

/**
 * Test script to verify MongoDB connection stability and retry logic
 * Run with: node test-mongodb-connection.js
 */

import mongoose from 'mongoose';
import MongoDatabase from './src/lib/mongoDatabase.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testConnection() {
    console.log('🔬 Testing MongoDB Connection & Retry Logic...\n');

    try {
        // Test 1: Basic connection
        console.log('Test 1: Basic Connection Test');
        console.log('--------------------------------');

        const barbers = await MongoDatabase.getAllBarbers();
        console.log(`✅ Successfully loaded ${barbers.length} barbers`);

        if (barbers.length > 0) {
            console.log(`📋 First barber: ${barbers[0].name} (ID: ${barbers[0]._id})`);

            // Test 2: Booking queries
            console.log('\nTest 2: Booking Query Test');
            console.log('---------------------------');

            const bookings = await MongoDatabase.getBookingsByBarberId(barbers[0]._id);
            console.log(`✅ Successfully loaded ${bookings.length} bookings for first barber`);
        }

        // Test 3: Connection resilience (simulate multiple rapid requests)
        console.log('\nTest 3: Connection Resilience Test');
        console.log('----------------------------------');

        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                MongoDatabase.getAllBarbers().then(result => {
                    console.log(`✅ Concurrent request ${i + 1}: ${result.length} barbers`);
                    return result;
                }).catch(error => {
                    console.error(`❌ Concurrent request ${i + 1} failed:`, error.message);
                    throw error;
                })
            );
        }

        await Promise.all(promises);
        console.log('✅ All concurrent requests completed successfully');

        // Test 4: Connection state monitoring
        console.log('\nTest 4: Connection State');
        console.log('------------------------');
        console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
        console.log(`🏠 Database host: ${mongoose.connection.host}`);
        console.log(`📁 Database name: ${mongoose.connection.name}`);

        console.log('\n🎉 All tests passed! MongoDB connection is stable.');

    } catch (error) {
        console.error('\n💥 Test failed with error:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }

        // Display connection debugging info
        console.log('\n🔍 Connection Debug Info:');
        console.log('Connection state:', mongoose.connection.readyState);
        console.log('Connection host:', mongoose.connection.host || 'Unknown');
        console.log('Connection name:', mongoose.connection.name || 'Unknown');

    } finally {
        // Close the connection
        console.log('\n🔌 Closing database connection...');
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚡ Received SIGINT, closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚡ Received SIGTERM, closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run the test
testConnection();