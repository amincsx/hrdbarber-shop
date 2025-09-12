// Test barber API endpoint
import { SimpleFileDB } from './src/lib/fileDatabase.js';

console.log('🧪 Testing Barber API...');

// Check what bookings exist for each barber
const barbers = ['حمید', 'بنیامین', 'محمد'];

for (const barber of barbers) {
    console.log(`\n🔍 Checking bookings for ${barber}:`);
    const bookings = SimpleFileDB.getBookingsByBarber(barber);
    console.log(`📊 Found ${bookings.length} bookings:`, bookings);
}

// Also check all bookings
console.log('\n📋 All bookings in database:');
const allBookings = SimpleFileDB.getAllBookings();
console.log('Total bookings:', allBookings.length);
allBookings.forEach((booking, index) => {
    console.log(`${index + 1}. Barber: ${booking.barber}, Date: ${booking.date_key}, User: ${booking.user_name || booking.user_id}`);
});
