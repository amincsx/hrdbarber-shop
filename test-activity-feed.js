// Test script to verify activity feed functionality
const baseUrl = 'http://localhost:3001';

// Test booking data
const testBooking = {
    user_id: '09123456789',
    user_name: 'امین عزیزی',
    user_phone: '09123456789',
    date_key: '2024-12-17',
    start_time: '14:00',
    end_time: '15:00',
    barber: 'علی کریمی',
    services: ['اصلاح مو', 'اصلاح ریش'],
    total_duration: 60,
    persian_date: 'دوشنبه ۲۷ آذر ۱۴۰۳'
};

// Test function to create a booking
async function createTestBooking() {
    try {
        console.log('🧪 Creating test booking...');

        const response = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBooking)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Test booking created successfully:', result);
            return result;
        } else {
            console.error('❌ Failed to create booking:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error creating test booking:', error);
        return null;
    }
}

// Test function to fetch barber activities
async function fetchBarberActivities(barberId) {
    try {
        console.log('🔍 Fetching activities for barber:', barberId);

        const response = await fetch(`${baseUrl}/api/barber-activities/${encodeURIComponent(barberId)}`);
        const result = await response.json();

        if (response.ok) {
            console.log('✅ Activities fetched:', result);
            return result;
        } else {
            console.error('❌ Failed to fetch activities:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching activities:', error);
        return null;
    }
}

// Test function to update booking status
async function updateBookingStatus(bookingId, status, barberId) {
    try {
        console.log(`🔄 Updating booking ${bookingId} to status: ${status}`);

        const response = await fetch(`${baseUrl}/api/barber/${encodeURIComponent(barberId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingId: bookingId,
                status: status,
                notes: 'تست تایید رزرو'
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Booking status updated:', result);
            return result;
        } else {
            console.error('❌ Failed to update booking status:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error updating booking status:', error);
        return null;
    }
}

// Run test sequence
async function runTest() {
    console.log('🧪 Starting activity feed test sequence...');

    // Step 1: Create a test booking
    const booking = await createTestBooking();
    if (!booking) return;

    // Wait a moment for activity to be logged
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Check activities for the barber
    const barberId = 'علی کریمی'; // Use the barber name from test booking
    const activities = await fetchBarberActivities(barberId);

    if (activities && activities.activities.length > 0) {
        console.log('✅ Activity logged successfully!');
        console.log('   - Latest activity:', activities.activities[0]);
        console.log('   - Unread count:', activities.unreadCount);

        // Step 3: Test barber confirming the booking
        if (booking.booking && booking.booking._id) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await updateBookingStatus(booking.booking._id, 'confirmed', barberId);

            // Check activities again
            await new Promise(resolve => setTimeout(resolve, 1000));
            const updatedActivities = await fetchBarberActivities(barberId);
            console.log('✅ Activities after confirmation:', updatedActivities?.activities?.slice(0, 2));
        }
    } else {
        console.log('⚠️ No activities found - check activity logging');
    }

    console.log('🧪 Test completed!');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTest, createTestBooking, fetchBarberActivities };
}

// Run test if called directly in browser console
if (typeof window !== 'undefined') {
    window.activityTest = { runTest, createTestBooking, fetchBarberActivities };
    console.log('🔧 Activity test functions available as window.activityTest');
}

// Run test if called directly in Node.js
if (typeof module !== 'undefined' && require.main === module) {
    runTest();
}