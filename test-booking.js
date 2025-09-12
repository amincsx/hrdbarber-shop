// Test the booking submission functionality
console.log('🧪 Testing Booking Submission...\n');

async function testBookingSubmission() {
    try {
        console.log('1️⃣ Testing booking API endpoint...');
        
        const testBooking = {
            user_id: "test_user_123",
            date_key: "2025-09-15",
            start_time: "14:00",
            end_time: "15:00",
            barber: "حمید",
            services: ["کوتاهی مو"],
            total_duration: 60,
            user_name: "کاربر تست",
            user_phone: "09123456789",
            persian_date: "1404/06/25"
        };
        
        console.log('📤 Sending test booking:', testBooking);
        
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testBooking)
        });
        
        console.log('📡 Response status:', response.status);
        
        const responseData = await response.json();
        console.log('📋 Response data:', responseData);
        
        if (response.ok) {
            console.log('✅ Booking API is working correctly!');
            console.log('🎉 Test booking created successfully');
        } else {
            console.log('❌ Booking API failed');
            console.log('Error:', responseData.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Wait for server to be ready
setTimeout(testBookingSubmission, 2000);
