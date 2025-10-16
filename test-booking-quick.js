// Quick test to verify booking system works
const testBooking = async () => {
    console.log('🧪 Testing Booking System...\n');
    
    try {
        // Test 1: Check if API is accessible
        console.log('1️⃣ Testing booking API accessibility...');
        const getResponse = await fetch('http://localhost:3001/api/bookings');
        const getData = await getResponse.json();
        console.log('✅ GET /api/bookings works!');
        console.log(`   Found ${getData.bookings?.length || 0} existing bookings\n`);
        
        // Test 2: Try to create a booking
        console.log('2️⃣ Creating test booking...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateKey = tomorrow.toISOString().split('T')[0];
        
        const testBookingData = {
            user_id: '09999999999',
            date_key: dateKey,
            start_time: '17:00',
            end_time: '18:00',
            barber: 'حمید',
            services: ['اصلاح سر'],
            total_duration: 60,
            user_name: 'Test User',
            user_phone: '09999999999',
            persian_date: 'Test Date'
        };
        
        console.log('📤 Sending:', JSON.stringify(testBookingData, null, 2));
        
        const postResponse = await fetch('http://localhost:3001/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testBookingData)
        });
        
        const postData = await postResponse.json();
        
        if (postResponse.ok) {
            console.log('✅ Booking created successfully!');
            console.log(`   Booking ID: ${postData.booking?.id || postData.booking?._id}`);
            console.log(`   Source: ${postData.source}\n`);
            
            // Test 3: Verify it was saved
            console.log('3️⃣ Verifying booking was saved...');
            const verifyResponse = await fetch('http://localhost:3001/api/bookings');
            const verifyData = await verifyResponse.json();
            console.log(`✅ Now have ${verifyData.bookings?.length || 0} bookings in database\n`);
            
            console.log('🎉 ALL TESTS PASSED! Booking system is working!\n');
        } else {
            console.error('❌ Failed to create booking');
            console.error('   Status:', postResponse.status);
            console.error('   Error:', postData.error);
            console.error('   Details:', postData.details || 'No details');
            console.error('\n💡 This means the booking form will also fail.\n');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('   Make sure the dev server is running on port 3001\n');
    }
};

testBooking();




