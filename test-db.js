// Test script to verify file database functionality
import { SimpleFileDB } from './src/lib/fileDatabase.js';

console.log('🧪 Testing file database...');

// Test adding a booking
const testBooking = {
    user_id: 'test123',
    date_key: '2025-09-15',
    start_time: '10:00',
    end_time: '11:00',
    barber: 'آقای احمدی',
    services: ['اصلاح مو'],
    total_duration: 60,
    user_name: 'تست کاربر',
    user_phone: '09123456789',
    persian_date: '1404/06/24'
};

console.log('📝 Adding test booking...');
const result = SimpleFileDB.addBooking(testBooking);

if (result) {
    console.log('✅ Booking added successfully:', result);

    // Test reading bookings
    console.log('📖 Reading all bookings...');
    const bookings = SimpleFileDB.getAllBookings();
    console.log('📊 Total bookings:', bookings.length);
    console.log('📋 Bookings:', bookings);
} else {
    console.log('❌ Failed to add booking');
}
