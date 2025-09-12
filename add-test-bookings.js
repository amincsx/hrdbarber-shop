// Add test bookings with correct barber names
import { SimpleFileDB } from './src/lib/fileDatabase.js';

console.log('🧪 Adding test bookings with correct barber names...');

const testBookings = [
    {
        user_id: '09111111111',
        user_name: 'علی محمدی',
        user_phone: '09111111111',
        date_key: '2025-09-13',
        start_time: '09:00',
        end_time: '10:00',
        barber: 'حمید',
        services: ['اصلاح مو'],
        total_duration: 60,
        persian_date: '1404/06/22'
    },
    {
        user_id: '09222222222',
        user_name: 'حسن احمدی',
        user_phone: '09222222222',
        date_key: '2025-09-13',
        start_time: '14:00',
        end_time: '15:30',
        barber: 'بنیامین',
        services: ['اصلاح مو', 'اصلاح ریش'],
        total_duration: 90,
        persian_date: '1404/06/22'
    },
    {
        user_id: '09333333333',
        user_name: 'رضا کریمی',
        user_phone: '09333333333',
        date_key: '2025-09-14',
        start_time: '11:00',
        end_time: '12:00',
        barber: 'محمد',
        services: ['کوتاهی مو'],
        total_duration: 60,
        persian_date: '1404/06/23'
    },
    {
        user_id: '09444444444',
        user_name: 'امیر صادقی',
        user_phone: '09444444444',
        date_key: '2025-09-12',
        start_time: '16:00',
        end_time: '17:00',
        barber: 'حمید',
        services: ['اصلاح ریش'],
        total_duration: 60,
        persian_date: '1404/06/21'
    }
];

for (const booking of testBookings) {
    const result = SimpleFileDB.addBooking(booking);
    if (result) {
        console.log(`✅ Added booking for ${booking.user_name} with ${booking.barber} on ${booking.date_key}`);
    } else {
        console.log(`❌ Failed to add booking for ${booking.user_name}`);
    }
}

console.log('🎉 Test bookings added successfully!');

// Show all bookings
const allBookings = SimpleFileDB.getAllBookings();
console.log(`📊 Total bookings in database: ${allBookings.length}`);
