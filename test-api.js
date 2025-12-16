#!/usr/bin/env node

/**
 * Simple API Test Script
 * Tests if the development server is working and can access the database
 */

import fetch from 'node-fetch';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAPI() {
    console.log('🧪 Testing API Endpoints...');
    console.log('===========================\n');

    const baseUrl = 'http://localhost:3000';

    // Give the server time to start
    console.log('⏳ Waiting 3 seconds for server to be ready...');
    await delay(3000);

    try {
        // Test 1: Environment check
        console.log('🔍 Test 1: Environment Check');
        console.log('----------------------------');

        const envResponse = await fetch(`${baseUrl}/api/check-env`);
        const envData = await envResponse.json();

        console.log('✅ Environment API working');
        console.log('📊 Environment:', envData.environment?.NODE_ENV);
        console.log('🔗 Using URI:', envData.usingUri);
        console.log('📦 Production mode:', envData.isProduction);

        // Test 2: Database connection via API
        console.log('\n🗄️  Test 2: Database Connection');
        console.log('-------------------------------');

        const dbResponse = await fetch(`${baseUrl}/api/test-db`);
        const dbData = await dbResponse.json();

        if (dbResponse.ok) {
            console.log('✅ Database API working');
            console.log('📋 Barbers found:', dbData.barbers?.length || 0);
            console.log('📅 Sample data:', dbData.message);
        } else {
            console.log('❌ Database API failed:', dbData.error);
        }

        // Test 3: Barber listing
        console.log('\n👨‍💇 Test 3: Barber Listing API');
        console.log('--------------------------------');

        const barbersResponse = await fetch(`${baseUrl}/api/admin`);
        const barbersData = await barbersResponse.json();

        if (barbersResponse.ok && barbersData.barbers) {
            console.log('✅ Barbers API working');
            console.log('📊 Barbers loaded:', barbersData.barbers.length);
            barbersData.barbers.forEach((barber, i) => {
                console.log(`  ${i + 1}. ${barber.name} (ID: ${barber._id})`);
            });
        } else {
            console.log('❌ Barbers API failed:', barbersData.error || 'Unknown error');
        }

        console.log('\n🎉 API test completed!');

    } catch (error) {
        console.error('\n💥 API test failed:');
        console.error('Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Suggestions:');
            console.log('- Make sure the development server is running: npm run dev');
            console.log('- Check if port 3001 is available');
            console.log('- Verify the server started without errors');
        }
    }
}

testAPI();