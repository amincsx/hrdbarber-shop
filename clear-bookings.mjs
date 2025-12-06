import MongoDatabase from './src/lib/mongoDatabase.js';

(async () => {
  try {
    console.log('🗑️  Clearing all booking data from MongoDB...');
    
    const Booking = (await import('./src/lib/models.js')).Booking;
    const result = await Booking.deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} bookings from MongoDB`);
    console.log('\n📊 Database cleanup complete');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
})();
