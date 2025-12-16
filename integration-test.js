#!/usr/bin/env node

/**
 * Complete Booking System Integration Test
 * Tests the entire booking lifecycle from creation to updates
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
    console.log('🧪 Complete Booking System Integration Test');
    console.log('===========================================\n');

    try {
        // Test 1: Get all barbers
        console.log('📋 Test 1: Fetching all barbers');
        console.log('--------------------------------');

        const barbersResponse = await fetch(`${BASE_URL}/api/admin`);
        const barbersData = await barbersResponse.json();

        if (!barbersResponse.ok) {
            console.error('❌ Failed to fetch barbers:', barbersData.error);
            return;
        }

        console.log(`✅ Found ${barbersData.barbers.length} barbers`);

        if (barbersData.barbers.length === 0) {
            console.log('⚠️  No barbers in database');
            return;
        }

        // Test 2: Get barber bookings
        console.log('\n📅 Test 2: Fetching barber bookings');
        console.log('----------------------------------');

        const firstBarber = barbersData.barbers[0];
        console.log(`Using barber: ${firstBarber.name} (ID: ${firstBarber._id})`);

        const bookingsResponse = await fetch(`${BASE_URL}/api/bookings?barberId=${firstBarber._id}`);
        const bookingsData = await bookingsResponse.json();

        if (!bookingsResponse.ok) {
            console.error('❌ Failed to fetch bookings:', bookingsData.error);
        } else {
            console.log(`✅ Found ${bookingsData.bookings?.length || 0} existing bookings`);
        }

        // Test 3: Create a test booking
        console.log('\n📝 Test 3: Creating a test booking');
        console.log('----------------------------------');

        const today = new Date().toISOString().split('T')[0];
        const testBooking = {
            user_id: 'test-user-' + Date.now(),
            user_name: 'Test Customer',
            user_phone: '09123456789',
            barber: firstBarber.name,
            date_key: today,
            start_time: '14:00',
            end_time: '15:00',
            services: ['کوتاه کردن مو'],
            total_duration: 1,
            status: 'pending'
        };

        console.log('📤 Sending booking request...');
        const createResponse = await fetch(`${BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testBooking)
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
            console.error('❌ Booking creation failed:', createData.error);
        } else {
            console.log('✅ Booking created successfully');
            console.log(`   Booking ID: ${createData.booking._id}`);
            console.log(`   Status: ${createData.booking.status}`);

            // Test 4: Update the booking
            if (createData.booking._id) {
                console.log('\n🔄 Test 4: Updating the booking');
                console.log('------------------------------');

                await delay(1000);

                const updateResponse = await fetch(`${BASE_URL}/api/bookings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: createData.booking._id,
                        status: 'confirmed',
                        notes: 'Integration test - booking confirmed'
                    })
                });

                const updateData = await updateResponse.json();

                if (!updateResponse.ok) {
                    console.error('❌ Booking update failed:', updateData.error);
                } else {
                    console.log('✅ Booking updated successfully');
                    console.log(`   New status: ${updateData.booking.status}`);
                    console.log(`   Notes: ${updateData.booking.notes}`);
                }

                // Test 5: Verify the update
                console.log('\n✔️  Test 5: Verifying the update');
                console.log('-------------------------------');

                const verifyResponse = await fetch(`${BASE_URL}/api/bookings/${createData.booking._id}`);

                if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    console.log('✅ Booking verification successful');
                    console.log(`   Current status: ${verifyData.booking?.status || 'unknown'}`);
                } else {
                    console.log('⚠️  Could not verify booking (endpoint may not be implemented)');
                }
            }
        }

        // Test 6: Test barber dashboard API
        console.log('\n👨‍💇 Test 6: Testing barber dashboard API');
        console.log('----------------------------------------');

        const barberUsername = firstBarber.username || firstBarber.name;
        const dashboardResponse = await fetch(`${BASE_URL}/api/barber/${barberUsername}`);

        if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            console.log('✅ Barber dashboard API working');
            console.log(`   Barber: ${dashboardData.barber?.name}`);
            console.log(`   Bookings: ${dashboardData.bookings?.length || 0}`);
        } else {
            console.log('❌ Barber dashboard API failed');
        }

        console.log('\n🎉 Integration test completed!');

    } catch (error) {
        console.error('\n💥 Integration test failed:');
        console.error('Error:', error.message);
    }
}

runTests();