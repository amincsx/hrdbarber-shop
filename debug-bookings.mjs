import MongoDatabase from './src/lib/mongoDatabase.js';

(async () => {
  try {
    console.log('🔍 Checking barber and booking data...\n');

    // Get all barbers
    const barbers = await MongoDatabase.getAllBarbers();
    console.log('📊 All barbers:');
    barbers.forEach(b => {
      console.log(`  - Name: ${b.name}, Username: ${b.username}, Phone: ${b.phone}`);
    });

    // Get all bookings
    const bookings = await MongoDatabase.getAllBookings();
    console.log(`\n📊 All bookings (total: ${bookings.length}):`);
    bookings.forEach(b => {
      console.log(`  - Barber: "${b.barber}", User: ${b.user_name}, Status: ${b.status}, Date: ${b.date_key}`);
    });

    // Try to find bookings by barber name
    console.log(`\n🔍 Searching for bookings by name "امین":`);
    const byName = await MongoDatabase.getBookingsByBarber('امین');
    console.log(`  Found: ${byName.length} bookings`);

    console.log(`\n🔍 Searching for bookings by username "amin":`);
    const byUsername = await MongoDatabase.getBookingsByBarber('amin');
    console.log(`  Found: ${byUsername.length} bookings`);

  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
})();
