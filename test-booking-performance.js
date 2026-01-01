#!/usr/bin/env node

/**
 * Booking Performance Test
 * Tests the booking API endpoint performance to measure improvements
 */

const testBookingPerformance = async () => {
    console.log('🧪 Testing Booking Performance...\n');

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const testBooking = {
        user_id: 'test-user-09123456789',
        date_key: '2024-12-20',
        start_time: '10:00',
        end_time: '11:00',
        barber: 'amin',
        services: ['اصلاح مو'],
        total_duration: 60,
        user_name: 'تست کاربر',
        user_phone: '09123456789',
        persian_date: '۲۹ آذر ۱۴۰۳'
    };

    let totalTime = 0;
    const numTests = 5;

    for (let i = 1; i <= numTests; i++) {
        const startTime = performance.now();

        try {
            // Add unique timestamp to avoid duplicate bookings
            const uniqueBooking = {
                ...testBooking,
                user_id: `test-${Date.now()}-${i}`,
                user_name: `تست کاربر ${i}`,
                start_time: `1${i}:00`,
                end_time: `1${i}:30`
            };

            const response = await fetch(`${baseUrl}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uniqueBooking)
            });

            const result = await response.json();
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            totalTime += responseTime;

            if (response.ok) {
                console.log(`✅ Test ${i}: ${responseTime}ms - Booking created successfully`);
            } else {
                console.log(`❌ Test ${i}: ${responseTime}ms - Error: ${result.error}`);
            }

        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            totalTime += responseTime;
            console.log(`❌ Test ${i}: ${responseTime}ms - Network error: ${error.message}`);
        }

        // Wait 500ms between tests to avoid overwhelming the server
        if (i < numTests) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    const averageTime = Math.round(totalTime / numTests);
    console.log(`\n📊 Performance Summary:`);
    console.log(`Total tests: ${numTests}`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Average time: ${averageTime}ms`);

    if (averageTime < 500) {
        console.log(`🚀 Excellent! Booking is very fast (< 0.5s)`);
    } else if (averageTime < 1000) {
        console.log(`✅ Good! Booking is reasonably fast (< 1s)`);
    } else if (averageTime < 2000) {
        console.log(`⚠️ Acceptable booking speed (< 2s)`);
    } else {
        console.log(`❌ Slow booking performance (> 2s) - needs optimization`);
    }

    console.log('\n🔧 Optimization recommendations:');
    console.log('- Background processing for notifications ✅ (implemented)');
    console.log('- Non-blocking activity logging ✅ (implemented)');
    console.log('- Immediate response return ✅ (implemented)');
    console.log('- Local state updates ✅ (implemented in frontend)');
};

// Run the test
testBookingPerformance().catch(console.error);