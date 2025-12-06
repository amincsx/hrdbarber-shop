import mongoose from 'mongoose';

(async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Import models
    const { Booking } = await import('./src/lib/models.js');
    
    // Connect directly
    const uri = 'mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@table-mountain.liara.cloud:34674/my-app?authSource=admin';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connected to MongoDB');
    
    console.log('🗑️  Clearing all bookings...');
    const result = await Booking.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} bookings`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
})();
